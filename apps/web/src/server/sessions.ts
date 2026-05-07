import { randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { prisma } from "@dealership/db";

/**
 * Helpers around the Session table. We create rows directly here for the
 * credentials-sign-in path; OAuth sign-ins go through the Prisma adapter
 * and land in the same table.
 *
 * Cookie name follows Auth.js's convention so `auth()` can read it back:
 *   - `__Secure-authjs.session-token` over HTTPS
 *   - `authjs.session-token` otherwise (local dev)
 */

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function isSecureCookie(): boolean {
  return (process.env.AUTH_URL ?? "").startsWith("https://");
}

export function sessionCookieName(): string {
  return isSecureCookie() ? "__Secure-authjs.session-token" : "authjs.session-token";
}

function newSessionToken(): string {
  return randomBytes(32).toString("hex");
}

/** Parse a User-Agent string into something humans recognise. Cheap and
 *  imperfect on purpose — phase 8 isn't doing real device fingerprinting. */
export function deviceLabelFromUA(ua: string | null | undefined): string {
  if (!ua) return "Unknown device";
  if (/iPhone/i.test(ua)) return "iPhone";
  if (/iPad/i.test(ua)) return "iPad";
  if (/Android/i.test(ua)) return "Android";
  if (/Macintosh/i.test(ua)) return "Mac";
  if (/Windows/i.test(ua)) return "Windows PC";
  if (/Linux/i.test(ua)) return "Linux";
  return "Browser";
}

export async function createSessionForUser(userId: string): Promise<{
  sessionToken: string;
  expires: Date;
}> {
  const h = await headers();
  const sessionToken = newSessionToken();
  const expires = new Date(Date.now() + SESSION_TTL_MS);
  await prisma.session.create({
    data: {
      sessionToken,
      userId,
      expires,
      deviceLabel: deviceLabelFromUA(h.get("user-agent")),
      lastIp: clientIpFromHeaders(h),
      lastSeenAt: new Date(),
    },
  });
  return { sessionToken, expires };
}

export async function setSessionCookie(
  sessionToken: string,
  expires: Date,
): Promise<void> {
  const c = await cookies();
  c.set({
    name: sessionCookieName(),
    value: sessionToken,
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureCookie(),
    path: "/",
    expires,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const c = await cookies();
  c.set({
    name: sessionCookieName(),
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureCookie(),
    path: "/",
    expires: new Date(0),
  });
}

export async function readSessionTokenFromCookie(): Promise<string | null> {
  const c = await cookies();
  return c.get(sessionCookieName())?.value ?? null;
}

export function clientIpFromHeaders(h: {
  get(name: string): string | null;
}): string | null {
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() ?? null;
  return h.get("x-real-ip");
}

const TOUCH_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Update Session.lastSeenAt + lastIp at most once per 5 minutes per
 * session. Called from the /account layout. Intentionally swallows
 * errors: a stale lastSeenAt isn't worth a 500 to the user.
 */
export async function touchSessionIfStale(): Promise<void> {
  const { prisma } = await import("@dealership/db");
  const sessionToken = await readSessionTokenFromCookie();
  if (!sessionToken) return;
  try {
    const row = await prisma.session.findUnique({
      where: { sessionToken },
      select: { id: true, lastSeenAt: true },
    });
    if (!row) return;
    if (row.lastSeenAt && Date.now() - row.lastSeenAt.getTime() < TOUCH_INTERVAL_MS) {
      return;
    }
    const h = await headers();
    await prisma.session.update({
      where: { id: row.id },
      data: {
        lastSeenAt: new Date(),
        lastIp: clientIpFromHeaders(h),
      },
    });
  } catch {
    // best-effort
  }
}
