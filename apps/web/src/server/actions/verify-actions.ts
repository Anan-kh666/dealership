"use server";

import { redirect } from "next/navigation";
import { prisma } from "@dealership/db";
import { consumeToken } from "@/server/auth-tokens";
import {
  createSessionForUser,
  setSessionCookie,
} from "@/server/sessions";
import { countClaimable } from "@/server/claim";

/**
 * Verify-email handler. Called from /verify-email page when ?token is
 * present. On success: marks email verified, signs the user in, and
 * redirects to /account (with ?claim=1 if they have anonymous bookings
 * matching their email).
 */
export async function verifyEmailAction(
  token: string,
): Promise<{ ok: false; error: string } | never> {
  const consumed = await consumeToken(token, "EMAIL_VERIFICATION");
  if (!consumed) {
    return {
      ok: false,
      error: "This verification link is invalid or has expired.",
    };
  }

  // Email-change flow: identifier is `${userId}::${newEmail}`.
  if (consumed.identifier.includes("::")) {
    const [userId, newEmail] = consumed.identifier.split("::", 2);
    if (!userId || !newEmail) {
      return { ok: false, error: "This verification link is invalid." };
    }
    const collision = await prisma.user.findUnique({ where: { email: newEmail } });
    if (collision && collision.id !== userId) {
      return { ok: false, error: "That email is already in use." };
    }
    await prisma.user.update({
      where: { id: userId },
      data: { email: newEmail, emailVerified: new Date() },
    });
    redirect("/account/profile?email=changed");
  }

  // Normal sign-up verification flow.
  const user = await prisma.user.findUnique({
    where: { email: consumed.identifier },
  });
  if (!user) {
    return { ok: false, error: "This verification link is invalid." };
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: new Date() },
  });
  const { sessionToken, expires } = await createSessionForUser(user.id);
  await setSessionCookie(sessionToken, expires);
  const claimable = await countClaimable(user.email);
  redirect(claimable.total > 0 ? "/account?claim=1" : "/account");
}
