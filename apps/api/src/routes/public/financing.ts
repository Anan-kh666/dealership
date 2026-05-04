import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { render } from "@react-email/render";
import { Prisma, prisma, AppStatus } from "@dealership/db";
import { financingApplicationSubmissionSchema } from "@dealership/types";
import { createRateLimiter } from "../../lib/rate-limit.js";
import { financingReferenceFromId } from "../../lib/reference.js";
import {
  adminNotificationRecipient,
  sendMail,
} from "../../lib/mailer.js";
import { FinancingApplicantEmail } from "../../emails/financing-applicant.js";
import { FinancingAdminEmail } from "../../emails/financing-admin.js";

const submitLimiter = createRateLimiter({
  max: 5,
  windowMs: 24 * 60 * 60 * 1000,
});

const SHOWROOM_PHONE = "+60 3 7801 2345";
const WHATSAPP_URL = "https://wa.me/60378012345";

const myrFormatter = new Intl.NumberFormat("en-MY", {
  style: "currency",
  currency: "MYR",
  maximumFractionDigits: 0,
});

function fmtMyr(n: number): string {
  if (!Number.isFinite(n)) return "RM 0";
  return myrFormatter.format(n).replace("MYR", "RM").trim();
}

export const financingPublicRoutes: FastifyPluginAsyncZod = async (server) => {
  server.post(
    "/financing/applications",
    {
      schema: {
        body: financingApplicationSubmissionSchema,
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

      // Compute loan figures the same way the front-end calculator does, so
      // the persisted numbers match what the customer saw at submit time.
      const downPaymentAmount =
        body.vehiclePrice * (body.downPaymentPercent / 100);
      const principal = body.vehiclePrice - downPaymentAmount;
      const totalInterest =
        principal * (body.interestRatePercent / 100) * body.tenureYears;
      const totalPayable = principal + totalInterest;
      const monthlyPayment = totalPayable / (body.tenureYears * 12);

      const documentsAttached =
        Boolean(body.icFrontUrl) ||
        Boolean(body.icBackUrl) ||
        body.payslipUrls.length > 0 ||
        body.bankStatementUrls.length > 0;

      // Two-pass create: insert with placeholder reference, then update with
      // the canonical reference derived from the cuid. Done in a transaction
      // so the row never observably exists without its reference.
      const created = await prisma.$transaction(async (tx) => {
        const placeholder = `PENDING-${Date.now()}-${Math.floor(
          Math.random() * 1_000_000,
        )}`;
        const row = await tx.financeApplication.create({
          data: {
            referenceNumber: placeholder,
            stockUnitId: body.stockUnitId ?? null,
            configurationId: body.configurationId ?? null,
            vehicleLabel: body.vehicleLabel ?? null,
            vehiclePrice: new Prisma.Decimal(body.vehiclePrice.toFixed(2)),
            loanAmount: new Prisma.Decimal(principal.toFixed(2)),
            downPayment: new Prisma.Decimal(downPaymentAmount.toFixed(2)),
            downPaymentPercent: new Prisma.Decimal(
              body.downPaymentPercent.toFixed(2),
            ),
            tenureYears: body.tenureYears,
            termMonths: body.tenureYears * 12,
            interestRatePct: new Prisma.Decimal(
              body.interestRatePercent.toFixed(2),
            ),
            estimatedMonthly: new Prisma.Decimal(monthlyPayment.toFixed(2)),
            applicantName: body.fullName,
            email: body.email,
            phone: body.mobile,
            icNumber: body.icNumber,
            dateOfBirth: new Date(`${body.dateOfBirth}T00:00:00Z`),
            nationality: body.nationality,
            maritalStatus: body.maritalStatus,
            addressStreet: body.addressStreet,
            addressCity: body.addressCity,
            addressState: body.addressState,
            addressPostcode: body.addressPostcode,
            employmentType: body.employmentType,
            employerName: body.employerName,
            position: body.position,
            monthlyIncome: new Prisma.Decimal(
              body.monthlyGrossIncome.toFixed(2),
            ),
            monthlyCommitments:
              body.monthlyCommitments != null
                ? new Prisma.Decimal(body.monthlyCommitments.toFixed(2))
                : null,
            yearsEmployed: new Prisma.Decimal(body.yearsEmployed.toFixed(2)),
            icFrontUrl: body.icFrontUrl ?? null,
            icBackUrl: body.icBackUrl ?? null,
            payslipUrls: body.payslipUrls,
            bankStatementUrls: body.bankStatementUrls,
            documentsSkipped: body.documentsSkipped,
            status: AppStatus.SUBMITTED,
          },
        });
        const reference = financingReferenceFromId(row.id);
        return tx.financeApplication.update({
          where: { id: row.id },
          data: { referenceNumber: reference },
        });
      });

      const reference = created.referenceNumber;

      // Fire-and-await emails. If SMTP isn't configured the mailer logs
      // payloads and returns sent=false — never throws — so the customer
      // request still succeeds.
      try {
        const applicantHtml = await render(
          FinancingApplicantEmail({
            applicantName: body.fullName,
            reference,
            vehicleLabel: body.vehicleLabel ?? "Your selected vehicle",
            vehiclePrice: fmtMyr(body.vehiclePrice),
            estimatedMonthly: fmtMyr(monthlyPayment),
            tenureYears: body.tenureYears,
            interestRatePct: body.interestRatePercent.toFixed(1),
            downPayment: fmtMyr(downPaymentAmount),
            dealershipPhone: SHOWROOM_PHONE,
            whatsappUrl: WHATSAPP_URL,
          }),
        );
        await sendMail(server.log, {
          to: body.email,
          subject: `We received your financing application — ${reference}`,
          html: applicantHtml,
        });

        const adminTo = adminNotificationRecipient();
        if (adminTo) {
          const adminHtml = await render(
            FinancingAdminEmail({
              reference,
              applicantName: body.fullName,
              applicantEmail: body.email,
              applicantPhone: body.mobile,
              vehicleLabel: body.vehicleLabel ?? "—",
              vehiclePrice: fmtMyr(body.vehiclePrice),
              tenureYears: body.tenureYears,
              interestRatePct: body.interestRatePercent.toFixed(1),
              downPayment: fmtMyr(downPaymentAmount),
              estimatedMonthly: fmtMyr(monthlyPayment),
              employmentType: body.employmentType,
              employerName: body.employerName,
              monthlyIncome: fmtMyr(body.monthlyGrossIncome),
              documentsAttached,
            }),
          );
          await sendMail(server.log, {
            to: adminTo,
            subject: `New financing application — ${reference}`,
            html: adminHtml,
            replyTo: body.email,
          });
        } else {
          server.log.info(
            { reference },
            "ADMIN_NOTIFY_EMAIL not set — admin notification skipped",
          );
        }
      } catch (err) {
        server.log.warn(
          { err, reference },
          "financing email render/send failed (non-fatal)",
        );
      }

      return reply.code(201).send({ id: created.id, reference });
    },
  );
};
