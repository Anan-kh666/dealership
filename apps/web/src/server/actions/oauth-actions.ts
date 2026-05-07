"use server";

import { signIn } from "@/server/auth";

/**
 * OAuth sign-in entrypoint. Wraps Auth.js's signIn so the client form
 * can post directly without importing server-only code.
 */
export async function startOAuthSignIn(
  provider: "google" | "apple",
  callbackUrl?: string,
): Promise<void> {
  await signIn(provider, { redirectTo: callbackUrl ?? "/account" });
}
