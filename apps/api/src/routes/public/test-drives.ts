import { z } from "zod";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { createEvent } from "ics";
import { render } from "@react-email/render";
import { prisma, TestDriveStatus } from "@dealership/db";
import { testDriveBookingSchema } from "@dealership/types";
import {
  KL_TZ,
  SLOT_MINUTES_OF_DAY,
  formatSlotLabel,
  isClosedDay,
  minutesInKL,
  slotToUtc,
  ymdInKL,
} from "../../lib/slots.js";
import { TestDriveConfirmationEmail } from "../../emails/test-drive-confirmation.js";

const SHOWROOM_ADDRESS =
  "Lot 12, Jalan Sultan Ismail, 50250 Petaling Jaya, Selangor";
const SHOWROOM_PHONE = "+60 3 7801 2345";
const WHATSAPP_URL = "https://wa.me/60378012345";

const AvailabilityQuery = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
});

const IdParams = z.object({ id: z.string().min(1) });

function referenceFromId(id: string): string {
  return `TD-${id.slice(-6).toUpperCase()}`;
}

async function fetchVehicleLabel(input: {
  modelId?: string | null;
  stockUnitId?: string | null;
}): Promise<{ label: string; modelName: string; trimName?: string }> {
  if (input.stockUnitId) {
    const unit = await prisma.stockUnit.findUnique({
      where: { id: input.stockUnitId },
      include: { trim: { include: { model: true } } },
    });
    if (unit) {
      return {
        label: `${unit.trim.model.name} ${unit.trim.name}`,
        modelName: unit.trim.model.name,
        trimName: unit.trim.name,
      };
    }
  }
  if (input.modelId) {
    const model = await prisma.model.findUnique({
      where: { id: input.modelId },
    });
    if (model) {
      return { label: model.name, modelName: model.name };
    }
  }
  return { label: "Vehicle to be confirmed", modelName: "Vehicle" };
}

export const testDrivesPublicRoutes: FastifyPluginAsyncZod = async (server) => {
  /* ------------------------------------------------------------------ */
  /* Availability                                                        */
  /* ------------------------------------------------------------------ */
  server.get(
    "/test-drives/availability",
    { schema: { querystring: AvailabilityQuery } },
    async (request) => {
      const { date } = request.query;

      if (isClosedDay(date)) {
        return { date, slots: [] };
      }

      // Range covering the whole KL day in UTC.
      const dayStartUtc = slotToUtc(date, 0);
      const dayEndUtc = slotToUtc(date, 24 * 60);

      const booked = await prisma.testDrive.findMany({
        where: {
          scheduledAt: { gte: dayStartUtc, lt: dayEndUtc },
          status: { in: [TestDriveStatus.REQUESTED, TestDriveStatus.CONFIRMED] },
        },
        select: { scheduledAt: true },
      });
      const bookedKey = new Set(
        booked.map((b) => minutesInKL(b.scheduledAt)),
      );

      const now = new Date();
      const todayYmd = ymdInKL(now);
      const isToday = todayYmd === date;
      const nowMinutes = isToday ? minutesInKL(now) : -1;

      const slots = SLOT_MINUTES_OF_DAY.map((minutes) => {
        const utc = slotToUtc(date, minutes);
        const past = isToday && minutes <= nowMinutes;
        const taken = bookedKey.has(minutes);
        return {
          minutes,
          label: formatSlotLabel(minutes),
          isoTime: utc.toISOString(),
          available: !past && !taken,
        };
      });

      return { date, slots };
    },
  );

  /* ------------------------------------------------------------------ */
  /* Create booking                                                      */
  /* ------------------------------------------------------------------ */
  server.post(
    "/test-drives",
    { schema: { body: testDriveBookingSchema } },
    async (request, reply) => {
      const body = request.body;

      // Snap to a 30-min boundary in KL and reject closed days / past times.
      const ymd = ymdInKL(body.scheduledAt);
      const minutes = minutesInKL(body.scheduledAt);
      if (isClosedDay(ymd)) {
        return reply.code(400).send({
          error: "closed_day",
          message: "We're closed that day — please pick another date.",
        });
      }
      if (!SLOT_MINUTES_OF_DAY.includes(minutes)) {
        return reply.code(400).send({
          error: "invalid_slot",
          message: "That time isn't a bookable slot.",
        });
      }
      if (body.scheduledAt.getTime() <= Date.now()) {
        return reply.code(400).send({
          error: "past_slot",
          message: "Please pick a future time.",
        });
      }

      try {
        const created = await prisma.$transaction(
          async (tx) => {
            const clash = await tx.testDrive.findFirst({
              where: {
                scheduledAt: body.scheduledAt,
                status: {
                  in: [TestDriveStatus.REQUESTED, TestDriveStatus.CONFIRMED],
                },
              },
              select: { id: true },
            });
            if (clash) {
              throw new SlotTakenError();
            }
            return tx.testDrive.create({
              data: {
                modelId: body.modelId ?? null,
                stockUnitId: body.stockUnitId ?? null,
                guestName: body.guestName,
                guestEmail: body.guestEmail,
                guestPhone: body.guestPhone,
                drivingLicense: body.drivingLicense,
                scheduledAt: body.scheduledAt,
                notes: body.notes ?? null,
                status: TestDriveStatus.REQUESTED,
              },
            });
          },
          { isolationLevel: "Serializable" },
        );

        // Stub email send — render and log payload.
        try {
          const { label } = await fetchVehicleLabel({
            modelId: created.modelId,
            stockUnitId: created.stockUnitId,
          });
          const klDate = toZonedTime(created.scheduledAt, KL_TZ);
          const formattedDate = format(klDate, "EEEE, d LLLL yyyy");
          const formattedTime = formatSlotLabel(minutesInKL(created.scheduledAt));
          const html = await render(
            TestDriveConfirmationEmail({
              guestName: created.guestName ?? "there",
              vehicleLabel: label,
              formattedDate,
              formattedTime,
              reference: referenceFromId(created.id),
              dealershipAddress: SHOWROOM_ADDRESS,
              dealershipPhone: SHOWROOM_PHONE,
              whatsappUrl: WHATSAPP_URL,
            }),
          );
          server.log.info(
            {
              email: {
                to: created.guestEmail,
                subject: `Test drive confirmed — ${label} on ${formattedDate}`,
                html,
              },
            },
            "[email-stub] test-drive confirmation rendered (not sent)",
          );
        } catch (renderErr) {
          server.log.warn({ err: renderErr }, "email render failed (non-fatal)");
        }

        return reply.code(201).send({
          id: created.id,
          reference: referenceFromId(created.id),
          scheduledAt: created.scheduledAt.toISOString(),
          status: created.status,
        });
      } catch (err) {
        if (err instanceof SlotTakenError) {
          return reply.code(409).send({
            error: "slot_taken",
            message: "That slot was just taken — please pick another time.",
          });
        }
        // Postgres serialization failure surfaces as P2034 from Prisma.
        if (
          typeof err === "object" &&
          err !== null &&
          "code" in err &&
          (err as { code?: string }).code === "P2034"
        ) {
          return reply.code(409).send({
            error: "slot_taken",
            message: "That slot was just taken — please pick another time.",
          });
        }
        throw err;
      }
    },
  );

  /* ------------------------------------------------------------------ */
  /* ICS download                                                        */
  /* ------------------------------------------------------------------ */
  server.get(
    "/test-drives/:id/ics",
    {
      schema: { params: IdParams },
      config: {
        rateLimit: { max: 10, timeWindow: "1 minute" },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const td = await prisma.testDrive.findUnique({ where: { id } });
      if (!td) {
        return reply.code(404).send({ error: "not_found" });
      }

      const { label } = await fetchVehicleLabel({
        modelId: td.modelId,
        stockUnitId: td.stockUnitId,
      });

      const start = td.scheduledAt;
      const reference = referenceFromId(td.id);

      const { error, value } = createEvent({
        start: [
          start.getUTCFullYear(),
          start.getUTCMonth() + 1,
          start.getUTCDate(),
          start.getUTCHours(),
          start.getUTCMinutes(),
        ],
        startInputType: "utc",
        duration: { hours: 1 },
        title: `Test drive — ${label}`,
        description: `Booking reference: ${reference}\n\nWe'll have the vehicle ready when you arrive. Bring your NRIC or passport, your driving license, and comfortable footwear.\n\nNeed to reschedule? ${WHATSAPP_URL}`,
        location: SHOWROOM_ADDRESS,
        organizer: { name: "Dealership", email: "hello@dealership.my" },
        alarms: [
          {
            action: "display",
            description: "Test drive in 1 hour",
            trigger: { hours: 1, before: true },
          },
        ],
      });

      if (error || !value) {
        request.log.error({ err: error }, "ics build failed");
        return reply.code(500).send({ error: "ics_failed" });
      }

      reply
        .header("Content-Type", "text/calendar; charset=utf-8")
        .header(
          "Content-Disposition",
          `attachment; filename="${reference}.ics"`,
        );
      return reply.send(value);
    },
  );
};

class SlotTakenError extends Error {
  constructor() {
    super("slot_taken");
    this.name = "SlotTakenError";
  }
}
