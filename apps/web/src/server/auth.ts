import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@dealership/db";
import { generateAppleClientSecret } from "./apple-secret.js";

/**
 * Auth.js v5 configuration.
 *
 * Session strategy: "database" — sessions live in the Session table so
 * we can revoke them cleanly (signing out everywhere, kicking individual
 * devices, rotating after password change). DB sessions don't play
 * naturally with the built-in Credentials provider, so credentials
 * sign-in is handled outside of Auth.js (see `credentials-signin.ts`):
 * we validate the password there, create the Session row directly, and
 * set the `authjs.session-token` cookie ourselves. OAuth (Google, Apple)
 * goes through Auth.js normally and the Prisma adapter creates the
 * Session row automatically.
 *
 * Providers are env-gated. If the OAuth env vars aren't set the provider
 * is omitted from `providers`; the sign-in page renders a non-functional
 * placeholder button to make the absence visible to the user.
 */

const providers: NextAuthConfig["providers"] = [];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  );
}

const appleSecret = generateAppleClientSecret();
if (process.env.AUTH_APPLE_ID && appleSecret) {
  providers.push(
    Apple({
      clientId: process.env.AUTH_APPLE_ID,
      clientSecret: appleSecret,
    }),
  );
}

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers,
  session: { strategy: "database" },
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  callbacks: {
    authorized({ auth, request }) {
      const path = request.nextUrl.pathname;
      const isProtected = path.startsWith("/account") || path.startsWith("/admin");
      if (!isProtected) return true;
      return Boolean(auth?.user);
    },
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

/** True if the named provider is configured via env. Used by /sign-in to
 *  render the right button label. */
export function providerConfigured(name: "google" | "apple"): boolean {
  if (name === "google") {
    return Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
  }
  return Boolean(process.env.AUTH_APPLE_ID && appleSecret);
}
