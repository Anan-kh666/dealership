import { z } from "zod";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import {
  prisma,
  TradeInStatus,
  type Prisma,
} from "@dealership/db";
import { SITE, tradeInFullSubmissionSchema } from "@dealership/types";
import { adminNotificationRecipient, escapeHtml, sendMail } from "../../lib/mailer.js";
import { createRateLimiter } from "../../lib/rate-limit.js";
import {
  tradeInIdSuffixFromReference,
  tradeInReferenceFromId,
} from "../../lib/reference.js";

const submitLimiter = createRateLimiter({
  max: 5,
  windowMs: 24 * 60 * 60 * 1000,
});

const lookupLimiter = createRateLimiter({
  max: 30,
  windowMs: 60 * 60 * 1000,
});

const ReferenceParams = z.object({ reference: z.string().min(4).max(20) });

export const tradeInsPublicRoutes: FastifyPluginAsyncZod = async (server) => {
  server.post(
    "/trade-ins",
    {
      schema: {
        body: tradeInFullSubmissionSchema,
      },
    },
    async (request, reply) => {
      const limit = submitLimiter.check(request.ip);
      if (!limit.ok) {
        return reply
          .code(429)
          .header("retry-after", String(limit.retryAfter))
          .send({ error: "rate_limited" });
      }

      const body = request.body;

      // Persist the fields that the schema column-bound. Everything else is
      // stuffed into `notes` as JSON until the schema gains dedicated
      // columns (see BUILD_NOTES "Trade-in flow").
      const extras = {
        trim: body.trim ?? null,
        serviceHistory: body.serviceHistory,
        serviceLocation: body.serviceLocation ?? null,
        accidentHistory: body.accidentHistory,
        accidentNote: body.accidentNote ?? null,
        modifications: body.modifications,
        modificationsNote: body.modificationsNote ?? null,
        preferredContactMethod: body.preferredContactMethod,
        bestTimeToCall: body.bestTimeToCall,
        configurationId: body.configurationId ?? null,
        photosSkipped: body.photosSkipped,
      };

      const data: Prisma.TradeInCreateInput = {
        vin: body.vin,
        make: body.make,
        model: body.model,
        year: body.year,
        mileage: body.mileage,
        condition: body.condition,
        photos: body.photos,
        contactName: body.contactName,
        contactEmail: body.contactEmail,
        contactPhone: body.contactPhone,
        status: TradeInStatus.SUBMITTED,
        notes: JSON.stringify(extras),
      };

      const created = await prisma.tradeIn.create({ data });
      const reference = tradeInReferenceFromId(created.id);

      request.log.info(
        {
          reference,
          vehicle: `${body.year} ${body.make} ${body.model}`,
          photoCount: body.photos.length,
          photosSkipped: body.photosSkipped,
        },
        "trade-in submitted",
      );

      // Notifications never fail the submission; the mailer logs instead of
      // sending when SMTP isn't configured.
      const vehicle = `${body.year} ${body.make} ${body.model}`;
      try {
        await sendMail(request.log, {
          to: body.contactEmail,
          subject: `We received your trade-in — ${reference}`,
          html: `<p>Hi ${escapeHtml(body.contactName)},</p>
<p>Thanks for submitting your ${escapeHtml(vehicle)} for valuation. Our team will review the details and send you a quote within one business day.</p>
<p>Your reference is <strong>${reference}</strong>. You can check its status any time on our website, or reply to this email with questions.</p>
<p>— The ${escapeHtml(SITE.name)} team<br/>${escapeHtml(SITE.phone.display)}</p>`,
        });
        const staffTo = adminNotificationRecipient();
        if (staffTo) {
          await sendMail(request.log, {
            to: staffTo,
            subject: `New trade-in — ${vehicle} (${reference})`,
            html: `<p>${escapeHtml(body.contactName)} submitted a ${escapeHtml(vehicle)}, ${body.mileage.toLocaleString("en-MY")} km, condition ${escapeHtml(body.condition)}.</p>
<p>Phone: ${escapeHtml(body.contactPhone)} (prefers ${body.preferredContactMethod.toLowerCase()}, ${body.bestTimeToCall.toLowerCase()})<br/>
Email: ${escapeHtml(body.contactEmail)}<br/>Photos: ${body.photosSkipped ? "skipped — chase directly" : String(body.photos.length)}</p>`,
            replyTo: body.contactEmail,
          });
        }
      } catch (err) {
        request.log.warn({ err, reference }, "trade-in email failed (non-fatal)");
      }

      return { id: created.id, reference };
    },
  );

  server.get(
    "/trade-ins/:reference",
    {
      schema: {
        params: ReferenceParams,
      },
    },
    async (request, reply) => {
      const limit = lookupLimiter.check(request.ip);
      if (!limit.ok) {
        return reply
          .code(429)
          .header("retry-after", String(limit.retryAfter))
          .send({ error: "rate_limited" });
      }

      const suffix = tradeInIdSuffixFromReference(request.params.reference);
      if (!suffix) {
        return reply.code(404).send({ error: "not_found" });
      }
      const row = await prisma.tradeIn.findFirst({
        where: { id: { endsWith: suffix } },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          createdAt: true,
          estimatedValue: true,
        },
      });
      if (!row) {
        return reply.code(404).send({ error: "not_found" });
      }
      return {
        reference: tradeInReferenceFromId(row.id),
        status: row.status,
        submittedAt: row.createdAt.toISOString(),
        estimatedValue:
          row.status === TradeInStatus.QUOTED && row.estimatedValue
            ? row.estimatedValue.toString()
            : null,
      };
    },
  );
};
