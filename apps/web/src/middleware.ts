import NextAuth from "next-auth";
import { authConfig } from "@/server/auth.config";

/**
 * Redirects signed-out visitors away from /account and /admin, and
 * customers away from /admin. Pages and server actions re-check the session
 * themselves (see `server/session.ts`) — this is the UX layer, not the only
 * line of defence.
 */
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/account/:path*", "/admin/:path*"],
};
