import { prisma } from "@dealership/db";

/**
 * "Claim" support: the dealership lets users book test drives, submit
 * financing apps, and request trade-in quotes anonymously (email-keyed).
 * When a customer signs up later with the same email, we offer to link
 * those existing rows to their account.
 *
 * Email matching is case-insensitive — emails are stored lowercase by
 * convention but legacy rows might not be.
 */

export interface ClaimableCounts {
  testDrives: number;
  financeApplications: number;
  tradeIns: number;
  total: number;
}

export async function countClaimable(email: string): Promise<ClaimableCounts> {
  const e = email.toLowerCase();
  const [td, fa, ti] = await Promise.all([
    prisma.testDrive.count({
      where: { userId: null, guestEmail: { equals: e, mode: "insensitive" } },
    }),
    prisma.financeApplication.count({
      where: { userId: null, email: { equals: e, mode: "insensitive" } },
    }),
    prisma.tradeIn.count({
      where: { userId: null, contactEmail: { equals: e, mode: "insensitive" } },
    }),
  ]);
  return { testDrives: td, financeApplications: fa, tradeIns: ti, total: td + fa + ti };
}

export async function claimAllForUser(
  userId: string,
  email: string,
): Promise<ClaimableCounts> {
  const e = email.toLowerCase();
  const [td, fa, ti] = await prisma.$transaction([
    prisma.testDrive.updateMany({
      where: { userId: null, guestEmail: { equals: e, mode: "insensitive" } },
      data: { userId },
    }),
    prisma.financeApplication.updateMany({
      where: { userId: null, email: { equals: e, mode: "insensitive" } },
      data: { userId },
    }),
    prisma.tradeIn.updateMany({
      where: { userId: null, contactEmail: { equals: e, mode: "insensitive" } },
      data: { userId },
    }),
  ]);
  await prisma.user.update({
    where: { id: userId },
    data: { claimedAt: new Date() },
  });
  return {
    testDrives: td.count,
    financeApplications: fa.count,
    tradeIns: ti.count,
    total: td.count + fa.count + ti.count,
  };
}
