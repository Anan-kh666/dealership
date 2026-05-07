import { createSign } from "node:crypto";

/**
 * Apple "Sign in with Apple" requires a JWT-based client secret rather
 * than a static string. We generate it on demand from the env-supplied
 * private key. If any of the four required vars are missing, this
 * returns null and the Apple provider should be skipped at config time.
 *
 * Required env:
 *   AUTH_APPLE_ID         — services ID, e.g. com.example.web
 *   AUTH_APPLE_TEAM_ID    — Apple developer team ID
 *   AUTH_APPLE_KEY_ID     — the key ID from the Apple developer console
 *   AUTH_APPLE_KEY        — the .p8 contents (PEM, with literal \n newlines)
 */
export function generateAppleClientSecret(): string | null {
  const clientId = process.env.AUTH_APPLE_ID;
  const teamId = process.env.AUTH_APPLE_TEAM_ID;
  const keyId = process.env.AUTH_APPLE_KEY_ID;
  const privateKey = process.env.AUTH_APPLE_KEY?.replace(/\\n/g, "\n");

  if (!clientId || !teamId || !keyId || !privateKey) return null;

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "ES256", kid: keyId };
  const payload = {
    iss: teamId,
    iat: now,
    exp: now + 60 * 60 * 24 * 180,
    aud: "https://appleid.apple.com",
    sub: clientId,
  };

  const segments = [
    base64UrlEncode(JSON.stringify(header)),
    base64UrlEncode(JSON.stringify(payload)),
  ];
  const signing = segments.join(".");
  const signer = createSign("RSA-SHA256");
  signer.update(signing);
  const signature = signer.sign(privateKey);
  segments.push(toBase64Url(signature));
  return segments.join(".");
}

function base64UrlEncode(input: string): string {
  return toBase64Url(Buffer.from(input, "utf8"));
}

function toBase64Url(buf: Buffer): string {
  return buf.toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}
