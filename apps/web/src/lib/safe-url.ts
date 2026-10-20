/**
 * Only allow same-origin relative paths as post-auth redirect targets, so
 * `?callbackUrl=https://evil.example` can't bounce users off-site.
 */
export function safeCallbackUrl(raw: unknown, fallback = "/account"): string {
  if (typeof raw !== "string") return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  return raw;
}
