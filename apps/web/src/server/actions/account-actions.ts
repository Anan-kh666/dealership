"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@dealership/db";
import {
  buildSaveSchema,
  changePasswordSchema,
  deleteAccountSchema,
  profileUpdateSchema,
  emailChangeSchema,
} from "@dealership/types";
import { auth } from "@/server/auth";
import { hashPassword, verifyPassword } from "@/server/password";
import {
  clearSessionCookie,
  readSessionTokenFromCookie,
} from "@/server/sessions";
import { claimAllForUser } from "@/server/claim";
import { createToken } from "@/server/auth-tokens";
import { sendEmail, appBaseUrl } from "@/server/mailer";
import { VerifyEmail } from "@/emails/verify-email";
import { PasswordChangedEmail } from "@/emails/password-changed";
import { AccountDeletedEmail } from "@/emails/account-deleted";

export type Result<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthenticated");
  return session.user.id;
}

function s(fd: FormData, k: string): string {
  const v = fd.get(k);
  return typeof v === "string" ? v : "";
}

// ───── Claim historical bookings ─────
export async function claimBookingsAction(): Promise<Result> {
  const userId = await requireUserId();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!user) return { ok: false, error: "Not signed in" };
  await claimAllForUser(userId, user.email);
  revalidatePath("/account", "layout");
  return { ok: true };
}

export async function dismissClaimAction(): Promise<Result> {
  const userId = await requireUserId();
  await prisma.user.update({
    where: { id: userId },
    data: { claimedAt: new Date() },
  });
  revalidatePath("/account", "layout");
  return { ok: true };
}

// ───── Builds ─────
export async function saveBuildAction(
  _prev: Result | null,
  formData: FormData,
): Promise<Result> {
  const userId = await requireUserId();
  const parsed = buildSaveSchema.safeParse({
    name: s(formData, "name"),
    modelSlug: s(formData, "modelSlug"),
    trim: s(formData, "trim"),
    exterior: s(formData, "exterior") || undefined,
    interior: s(formData, "interior") || undefined,
    options: JSON.parse(s(formData, "options") || "[]"),
    totalAtSave: Number(s(formData, "totalAtSave") || "0"),
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Invalid input" };
  }
  await prisma.build.create({
    data: {
      userId,
      modelSlug: parsed.data.modelSlug,
      name: parsed.data.name,
      trim: parsed.data.trim,
      exterior: parsed.data.exterior,
      interior: parsed.data.interior,
      options: parsed.data.options,
      totalAtSave: parsed.data.totalAtSave.toFixed(2),
    },
  });
  revalidatePath("/account/builds");
  return { ok: true };
}

export async function deleteBuildAction(buildId: string): Promise<Result> {
  const userId = await requireUserId();
  const build = await prisma.build.findUnique({ where: { id: buildId } });
  if (!build || build.userId !== userId) {
    return { ok: false, error: "Build not found" };
  }
  await prisma.build.delete({ where: { id: buildId } });
  revalidatePath("/account/builds");
  return { ok: true };
}

// ───── Test drives ─────
export async function cancelTestDriveAction(id: string): Promise<Result> {
  const userId = await requireUserId();
  const td = await prisma.testDrive.findUnique({ where: { id } });
  if (!td || td.userId !== userId) {
    return { ok: false, error: "Test drive not found" };
  }
  await prisma.testDrive.update({
    where: { id },
    data: { status: "CANCELED" },
  });
  revalidatePath("/account/test-drives");
  return { ok: true };
}

// ───── Profile ─────
export async function updateProfileAction(
  _prev: Result | null,
  formData: FormData,
): Promise<Result> {
  const userId = await requireUserId();
  const parsed = profileUpdateSchema.safeParse({
    name: s(formData, "name"),
    phone: s(formData, "phone"),
    icNumber: s(formData, "icNumber"),
    image: s(formData, "image"),
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Invalid input" };
  }
  await prisma.user.update({
    where: { id: userId },
    data: {
      name: parsed.data.name || null,
      phone: parsed.data.phone || null,
      icNumber: parsed.data.icNumber || null,
      image: parsed.data.image || null,
    },
  });
  revalidatePath("/account/profile");
  return { ok: true };
}

export async function changePasswordAction(
  _prev: Result | null,
  formData: FormData,
): Promise<Result> {
  const userId = await requireUserId();
  const parsed = changePasswordSchema.safeParse({
    currentPassword: s(formData, "currentPassword"),
    password: s(formData, "password"),
    confirm: s(formData, "confirm"),
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Invalid input" };
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.passwordHash) {
    return { ok: false, error: "Set a password first by signing out and using forgot-password" };
  }
  const ok = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!ok) return { ok: false, error: "Current password is wrong" };
  const passwordHash = await hashPassword(parsed.data.password);
  const currentSession = await readSessionTokenFromCookie();
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    }),
    prisma.session.deleteMany({
      where: {
        userId,
        ...(currentSession ? { NOT: { sessionToken: currentSession } } : {}),
      },
    }),
  ]);
  await sendEmail({
    to: user.email,
    subject: "Your password was changed",
    react: PasswordChangedEmail({
      changedAt: new Date().toLocaleString("en-MY"),
      contactUrl: `${appBaseUrl()}/contact`,
    }),
  });
  return { ok: true };
}

export async function requestEmailChangeAction(
  _prev: Result | null,
  formData: FormData,
): Promise<Result> {
  const userId = await requireUserId();
  const parsed = emailChangeSchema.safeParse({ email: s(formData, "email") });
  if (!parsed.success) return { ok: false, error: "Enter a valid email" };
  const newEmail = parsed.data.email;
  const existing = await prisma.user.findUnique({ where: { email: newEmail } });
  if (existing && existing.id !== userId) {
    return { ok: false, error: "That email is already in use" };
  }
  // Send a verification link to the NEW address. The token's identifier
  // is the new email; we update User.email + emailVerified together when
  // it's consumed via /verify-email — but we also need a way to know
  // which user this belongs to. Simplest: encode it as
  // `${userId}::${newEmail}` in the identifier.
  const token = await createToken(`${userId}::${newEmail}`, "EMAIL_VERIFICATION");
  const url = `${appBaseUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  // eslint-disable-next-line no-console
  console.info(`[email] email-change verification for user=${userId} new=${newEmail}: ${url}`);
  await sendEmail({
    to: newEmail,
    subject: "Confirm your new email",
    react: VerifyEmail({ verifyUrl: url }),
  });
  return { ok: true };
}

// ───── Sessions ─────
export async function revokeSessionAction(sessionId: string): Promise<Result> {
  const userId = await requireUserId();
  const row = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!row || row.userId !== userId) {
    return { ok: false, error: "Session not found" };
  }
  await prisma.session.delete({ where: { id: sessionId } });
  revalidatePath("/account/sessions");
  return { ok: true };
}

export async function revokeAllOtherSessionsAction(): Promise<Result> {
  const userId = await requireUserId();
  const current = await readSessionTokenFromCookie();
  await prisma.session.deleteMany({
    where: {
      userId,
      ...(current ? { NOT: { sessionToken: current } } : {}),
    },
  });
  revalidatePath("/account/sessions");
  return { ok: true };
}

// ───── Account deletion ─────
export async function deleteAccountAction(
  _prev: Result | null,
  formData: FormData,
): Promise<Result> {
  const userId = await requireUserId();
  const parsed = deleteAccountSchema.safeParse({
    confirmation: s(formData, "confirmation"),
  });
  if (!parsed.success) {
    return { ok: false, error: 'Type "DELETE" to confirm' };
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  // Anonymise (not delete) the historical records — PDPA-friendly.
  // Cascade-delete the user, which removes Builds/Sessions/Accounts.
  await prisma.$transaction([
    prisma.testDrive.updateMany({ where: { userId }, data: { userId: null } }),
    prisma.financeApplication.updateMany({ where: { userId }, data: { userId: null } }),
    prisma.tradeIn.updateMany({ where: { userId }, data: { userId: null } }),
    prisma.configuration.updateMany({ where: { userId }, data: { userId: null } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);
  await clearSessionCookie();
  if (user) {
    await sendEmail({
      to: user.email,
      subject: "Your account has been deleted",
      react: AccountDeletedEmail(),
    });
  }
  redirect("/");
}
