import "server-only";
import { prisma, type Prisma } from "@dealership/db";
import {
  financingReferenceFromId,
  testDriveReferenceFromId,
  tradeInReferenceFromId,
} from "@dealership/types";
import type { SessionUser } from "./session";

/**
 * Customer-facing reads for /account.
 *
 * Most leads are created by guests through the public API, so they carry the
 * customer's email rather than a userId. We match on either. Only
 * non-sensitive fields are selected (no IC numbers, income or documents).
 *
 * Before launch, gate email-matching on a verified email address — until
 * then, anyone registering with an address could see that address's
 * booking summaries. See BUILD_NOTES "Accounts".
 */

function ownerWhere(user: SessionUser, emailField: "guestEmail" | "email" | "contactEmail") {
  const email = (user.email ?? "").toLowerCase();
  return {
    OR: [{ userId: user.id }, ...(email ? [{ [emailField]: email }] : [])],
  };
}

export interface AccountTestDrive {
  id: string;
  reference: string;
  vehicleLabel: string;
  vehicleHref: string | null;
  scheduledAt: Date;
  status: Prisma.TestDriveGetPayload<object>["status"];
  canCancel: boolean;
}

export async function getTestDrives(user: SessionUser): Promise<AccountTestDrive[]> {
  const rows = await prisma.testDrive.findMany({
    where: ownerWhere(user, "guestEmail") as Prisma.TestDriveWhereInput,
    orderBy: { scheduledAt: "desc" },
    include: {
      model: { select: { name: true, slug: true } },
      stockUnit: {
        select: { slug: true, trim: { select: { name: true, model: { select: { name: true } } } } },
      },
    },
  });
  const now = Date.now();
  return rows.map((r) => {
    const label = r.stockUnit
      ? `${r.stockUnit.trim.model.name} ${r.stockUnit.trim.name}`
      : (r.model?.name ?? "Vehicle to be confirmed");
    const href = r.stockUnit
      ? `/stock/${r.stockUnit.slug}`
      : r.model
        ? `/models/${r.model.slug}`
        : null;
    return {
      id: r.id,
      reference: testDriveReferenceFromId(r.id),
      vehicleLabel: label,
      vehicleHref: href,
      scheduledAt: r.scheduledAt,
      status: r.status,
      canCancel:
        (r.status === "REQUESTED" || r.status === "CONFIRMED") && r.scheduledAt.getTime() > now,
    };
  });
}

export interface AccountApplication {
  id: string;
  reference: string;
  vehicleLabel: string;
  vehiclePrice: number;
  estimatedMonthly: number;
  tenureYears: number;
  status: Prisma.FinanceApplicationGetPayload<object>["status"];
  createdAt: Date;
}

export async function getApplications(user: SessionUser): Promise<AccountApplication[]> {
  const rows = await prisma.financeApplication.findMany({
    where: ownerWhere(user, "email") as Prisma.FinanceApplicationWhereInput,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      referenceNumber: true,
      vehicleLabel: true,
      vehiclePrice: true,
      estimatedMonthly: true,
      tenureYears: true,
      status: true,
      createdAt: true,
    },
  });
  return rows.map((r) => ({
    id: r.id,
    reference: r.referenceNumber.startsWith("FA-")
      ? r.referenceNumber
      : financingReferenceFromId(r.id),
    vehicleLabel: r.vehicleLabel ?? "Vehicle to be confirmed",
    vehiclePrice: Number(r.vehiclePrice),
    estimatedMonthly: Number(r.estimatedMonthly),
    tenureYears: r.tenureYears,
    status: r.status,
    createdAt: r.createdAt,
  }));
}

export interface AccountTradeIn {
  id: string;
  reference: string;
  vehicleLabel: string;
  mileage: number;
  status: Prisma.TradeInGetPayload<object>["status"];
  estimatedValue: number | null;
  createdAt: Date;
}

export async function getTradeIns(user: SessionUser): Promise<AccountTradeIn[]> {
  const rows = await prisma.tradeIn.findMany({
    where: ownerWhere(user, "contactEmail") as Prisma.TradeInWhereInput,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      year: true,
      make: true,
      model: true,
      mileage: true,
      status: true,
      estimatedValue: true,
      createdAt: true,
    },
  });
  return rows.map((r) => ({
    id: r.id,
    reference: tradeInReferenceFromId(r.id),
    vehicleLabel: `${r.year} ${r.make} ${r.model}`,
    mileage: r.mileage,
    status: r.status,
    // Only surface a value once staff have actually issued the quote.
    estimatedValue:
      (r.status === "QUOTED" || r.status === "ACCEPTED") && r.estimatedValue
        ? Number(r.estimatedValue)
        : null,
    createdAt: r.createdAt,
  }));
}

export async function getProfile(user: SessionUser) {
  return prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, email: true, phone: true, createdAt: true },
  });
}
