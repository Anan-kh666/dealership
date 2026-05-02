import { z } from "zod";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import {
  prisma,
  TradeInStatus,
  type Prisma,
} from "@dealership/db";
import { tradeInFullSubmissionSchema } from "@dealership/types";
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

      // Stub email — Resend wiring deferred. Logged so the dev/staff
      // operator can see what would be sent.
      request.log.info(
        {
          to: "staff@dealership.local",
          reference,
          vehicle: `${body.year} ${body.make} ${body.model}`,
          contact: body.contactEmail,
          photoCount: body.photos.length,
          photosSkipped: body.photosSkipped,
        },
        "trade-in submitted (email stub — Resend not wired)",
      );

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
