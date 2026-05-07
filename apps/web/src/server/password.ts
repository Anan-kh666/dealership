import { hash, verify } from "@node-rs/argon2";

/**
 * Argon2id with OWASP-recommended defaults: ~19 MiB memory, t=2, p=1.
 * @node-rs/argon2 picks Argon2id by default; we set the params explicitly
 * so the cost stays predictable across machines.
 */
const ARGON2_OPTS = {
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
} as const;

export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, ARGON2_OPTS);
}

export async function verifyPassword(
  plain: string,
  stored: string,
): Promise<boolean> {
  try {
    return await verify(stored, plain);
  } catch {
    return false;
  }
}
