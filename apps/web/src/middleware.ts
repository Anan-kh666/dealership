import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge middleware: cheap path protection for /account/*. The actual
 * session validation happens server-side in `auth()` inside each
 * page/action — Prisma can't run in the Edge runtime, so we only check
 * for the presence of the session cookie here. A logged-out request is
 * redirected up front; a request with an invalid/expired cookie still
 * makes it to the page where `auth()` returns null and the page
 * redirects again.
 *
 * The lastSeenAt/lastIp throttling lives in the /account layout
 * (`touchSession` in src/server/sessions.ts), not here, for the same
 * Edge-runtime reason.
 */

const SESSION_COOKIE = "authjs.session-token";
const SECURE_COOKIE = "__Secure-authjs.session-token";

export function middleware(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/account")) return NextResponse.next();

  const hasSession =
    req.cookies.has(SESSION_COOKIE) || req.cookies.has(SECURE_COOKIE);
  if (hasSession) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/sign-in";
  url.searchParams.set("callbackUrl", pathname + req.nextUrl.search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/account/:path*"],
};
