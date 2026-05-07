"use server";

import { redirect } from "next/navigation";
import { prisma } from "@dealership/db";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  resendVerificationSchema,
} from "@dealership/types";
import { hashPassword, verifyPassword } from "@/server/password";
import {
  clearSessionCookie,
  createSessionForUser,
  readSessionTokenFromCookie,
  setSessionCookie,
} from "@/server/sessions";
import {
  consumeToken,
  createToken,
} from "@/server/auth-tokens";
import { sendEmail, appBaseUrl } from "@/server/mailer";
import { VerifyEmail } from "@/emails/verify-email";
import { ResetPasswordEmail } from "@/emails/reset-password";
import { PasswordChangedEmail } from "@/emails/password-changed";

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string; code?: string };

function getFormString(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v : "";
}

async function sendVerificationFor(
  email: string,
): Promise<void> {
  const token = await createToken(email, "EMAIL_VERIFICATION");
  const url = `${appBaseUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  // eslint-disable-next-line no-console
  console.info(`[email] verification link for ${email}: ${url}`);
  await sendEmail({
    to: email,
    subject: "Verify your email",
    react: VerifyEmail({ verifyUrl: url }),
  });
}

export async function signUpAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse({
    email: getFormString(formData, "email"),
    password: getFormString(formData, "password"),
    name: getFormString(formData, "name") || undefined,
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Invalid input" };
  }
  const { email, password, name } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.passwordHash) {
      return { ok: false, error: "An account with this email already exists" };
    }
    // Pre-existing OAuth user setting a password — allowed.
    const passwordHash = await hashPassword(password);
    await prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash, name: name ?? existing.name },
    });
    if (!existing.emailVerified) {
      await sendVerificationFor(email);
    }
    return { ok: true };
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.create({
    data: { email, passwordHash, name },
  });
  await sendVerificationFor(email);
  return { ok: true };
}

export async function signInAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = signInSchema.safeParse({
    email: getFormString(formData, "email"),
    password: getFormString(formData, "password"),
    callbackUrl: getFormString(formData, "callbackUrl") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: "Enter a valid email and password" };
  }
  const { email, password, callbackUrl } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    return { ok: false, error: "Wrong email or password" };
  }

  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    const at = user.lockedUntil
      .toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" });
    return {
      ok: false,
      code: "locked",
      error: `Too many attempts. Try again at ${at}.`,
    };
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    const next = user.failedAttempts + 1;
    const update: { failedAttempts: number; lockedUntil?: Date } = {
      failedAttempts: next,
    };
    if (next >= LOCKOUT_THRESHOLD) {
      update.lockedUntil = new Date(Date.now() + LOCKOUT_MS);
    }
    await prisma.user.update({ where: { id: user.id }, data: update });
    if (next >= LOCKOUT_THRESHOLD) {
      const at = update.lockedUntil!
        .toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" });
      return {
        ok: false,
        code: "locked",
        error: `Too many attempts. Try again at ${at}.`,
      };
    }
    return { ok: false, error: "Wrong email or password" };
  }

  if (!user.emailVerified) {
    return {
      ok: false,
      code: "unverified",
      error: "Please verify your email before signing in.",
    };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedAttempts: 0, lockedUntil: null },
  });
  const { sessionToken, expires } = await createSessionForUser(user.id);
  await setSessionCookie(sessionToken, expires);

  redirect(safeCallbackUrl(callbackUrl));
}

export async function signOutAction(): Promise<void> {
  const token = await readSessionTokenFromCookie();
  if (token) {
    await prisma.session
      .delete({ where: { sessionToken: token } })
      .catch(() => undefined);
  }
  await clearSessionCookie();
  redirect("/");
}

export async function forgotPasswordAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse({
    email: getFormString(formData, "email"),
  });
  if (!parsed.success) {
    // Generic message — never leak account existence.
    return { ok: true };
  }
  const { email } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const token = await createToken(email, "PASSWORD_RESET");
    const url = `${appBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;
    // eslint-disable-next-line no-console
    console.info(`[email] reset link for ${email}: ${url}`);
    await sendEmail({
      to: email,
      subject: "Reset your password",
      react: ResetPasswordEmail({ resetUrl: url }),
    });
  }
  return { ok: true };
}

export async function resetPasswordAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse({
    token: getFormString(formData, "token"),
    password: getFormString(formData, "password"),
    confirm: getFormString(formData, "confirm"),
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Invalid input" };
  }
  const consumed = await consumeToken(parsed.data.token, "PASSWORD_RESET");
  if (!consumed) {
    return { ok: false, error: "This reset link is invalid or has expired" };
  }
  const user = await prisma.user.findUnique({
    where: { email: consumed.identifier },
  });
  if (!user) {
    return { ok: false, error: "This reset link is invalid or has expired" };
  }
  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, failedAttempts: 0, lockedUntil: null },
    }),
    prisma.session.deleteMany({ where: { userId: user.id } }),
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

export async function resendVerificationAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = resendVerificationSchema.safeParse({
    email: getFormString(formData, "email"),
  });
  if (!parsed.success) return { ok: true };
  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (user && !user.emailVerified) {
    await sendVerificationFor(user.email);
  }
  return { ok: true };
}

function safeCallbackUrl(input: string | undefined): string {
  if (!input) return "/account";
  if (input.startsWith("/") && !input.startsWith("//")) return input;
  return "/account";
}
