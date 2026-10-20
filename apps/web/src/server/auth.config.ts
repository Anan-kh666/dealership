import type { NextAuthConfig } from "next-auth";
import type { Role } from "@dealership/db";

/**
 * Edge-safe Auth.js config. Imported by `middleware.ts`, so it must not pull
 * in Prisma, bcrypt or anything else that needs the Node.js runtime. The
 * Credentials provider (which does) is added in `auth.ts`.
 */

const STAFF: ReadonlySet<Role> = new Set<Role>(["STAFF", "MANAGER", "ADMIN"]);

const ROLES: ReadonlySet<string> = new Set<Role>(["CUSTOMER", "STAFF", "MANAGER", "ADMIN"]);

function isRole(v: unknown): v is Role {
  return typeof v === "string" && ROLES.has(v);
}

export function isStaffRole(role: Role | undefined | null): boolean {
  return role ? STAFF.has(role) : false;
}

export const authConfig = {
  // Required when running behind a proxy or on a host other than Vercel.
  trustHost: true,
  providers: [],
  pages: {
    signIn: "/sign-in",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30,
  },
  callbacks: {
    authorized({ auth, request }) {
      const path = request.nextUrl.pathname;
      const isAccount = path === "/account" || path.startsWith("/account/");
      const isAdmin = path === "/admin" || path.startsWith("/admin/");
      if (!isAccount && !isAdmin) return true;
      if (!auth?.user) {
        // Relative callbackUrl so `safeCallbackUrl` accepts it on the way back.
        const target = `${path}${request.nextUrl.search}`;
        const signIn = new URL("/sign-in", request.nextUrl);
        signIn.searchParams.set("callbackUrl", target);
        return Response.redirect(signIn);
      }
      if (isAdmin && !isStaffRole(auth.user.role)) {
        return Response.redirect(new URL("/account", request.nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      session.user.role = isRole(token.role) ? token.role : "CUSTOMER";
      return session;
    },
  },
} satisfies NextAuthConfig;
