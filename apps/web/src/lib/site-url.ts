/**
 * Canonical public origin of the web app, used for metadata, sitemap and
 * absolute links. Prefers NEXT_PUBLIC_SITE_URL, then AUTH_URL, then the
 * Vercel deployment URL, then localhost.
 */
export function siteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.AUTH_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ??
    "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}
