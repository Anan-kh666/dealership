import { randomBytes } from "node:crypto";
import { prisma } from "@dealership/db";

/**
 * Verification + password-reset tokens share the same VerificationToken
 * table, distinguished by `type`. Both expire after 24h.
 */

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export type TokenType = "EMAIL_VERIFICATION" | "PASSWORD_RESET";

function newToken(): string {
  return randomBytes(32).toString("hex");
}

export async function createToken(
  identifier: string,
  type: TokenType,
): Promise<string> {
  const token = newToken();
  const expires = new Date(Date.now() + TOKEN_TTL_MS);
  await prisma.verificationToken.create({
    data: { identifier, token, expires, type },
  });
  return token;
}

export async function consumeToken(
  token: string,
  type: TokenType,
): Promise<{ identifier: string } | null> {
  const row = await prisma.verificationToken.findUnique({ where: { token } });
  if (!row) return null;
  if (row.type !== type) return null;
  if (row.expires.getTime() < Date.now()) {
    await prisma.verificationToken
      .delete({ where: { token } })
      .catch(() => undefined);
    return null;
  }
  await prisma.verificationToken.delete({ where: { token } });
  return { identifier: row.identifier };
}

export async function peekToken(
  token: string,
  type: TokenType,
): Promise<{ identifier: string } | null> {
  const row = await prisma.verificationToken.findUnique({ where: { token } });
  if (!row || row.type !== type) return null;
  if (row.expires.getTime() < Date.now()) return null;
  return { identifier: row.identifier };
}
