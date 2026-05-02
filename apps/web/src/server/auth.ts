import NextAuth, { type NextAuthConfig } from "next-auth";

/**
 * Auth.js v5 scaffold. Routes are intentionally not wired up yet — login,
 * register, and session callbacks are added by the auth-flows agent.
 *
 * Add providers to `providers` and persistence via the Prisma adapter when
 * customer auth is built out.
 */
export const authConfig: NextAuthConfig = {
  providers: [],
  pages: {
    signIn: "/sign-in",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth, request }) {
      const path = request.nextUrl.pathname;
      const isProtected = path.startsWith("/account") || path.startsWith("/admin");
      if (!isProtected) return true;
      return Boolean(auth?.user);
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
