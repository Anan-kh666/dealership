import "server-only";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@dealership/db";
import { signInSchema } from "@dealership/types";
import { authConfig } from "./auth.config";

/**
 * Auth.js v5 — email + password (Credentials) with JWT sessions.
 *
 * Passwords are bcrypt-hashed in `User.passwordHash`. Accounts are created
 * through `/register` (or the opt-in checkbox in the test-drive flow) and
 * staff accounts are provisioned by the seed or by an admin.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = signInSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({ where: { email } });
        // Always run a compare so response timing doesn't reveal whether
        // the email exists.
        const hash =
          user?.passwordHash ??
          "$2b$12$jXjTq6ykGiFRMRE2ALp0CuCuJzL57v/G47QXLkc1eRNrMvOBV1Uzy";
        const ok = await compare(password, hash);
        if (!user || !user.passwordHash || !ok) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
});
