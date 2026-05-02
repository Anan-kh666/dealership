/**
 * Malaysian phone number validation + formatting.
 *
 * Accepts:
 *   +60 12 345 6789
 *   60123456789
 *   012-345 6789
 *   0123456789
 *
 * Normalises to "+60XXXXXXXXX" for storage / API submission. The matching
 * `phone` zod primitive in `@dealership/types` accepts the +60 form.
 */
const DIGITS_RE = /\D+/g;

/** Normalise to E.164-ish "+60XXXXXXXXX". Returns null if not a valid MY number. */
export function normaliseMyPhone(input: string): string | null {
  const digits = input.replace(DIGITS_RE, "");
  let national: string;
  if (digits.startsWith("60")) {
    national = digits.slice(2);
  } else if (digits.startsWith("0")) {
    national = digits.slice(1);
  } else {
    return null;
  }
  // Mobile (1xxxxxxxx, 9 or 10 digits) or fixed line (3xxxxxxxx etc).
  if (national.length < 8 || national.length > 10) return null;
  if (!/^[1-9]\d+$/.test(national)) return null;
  return `+60${national}`;
}

export function isValidMyPhone(input: string): boolean {
  return normaliseMyPhone(input) !== null;
}

/** As-you-type formatter for display. Returns the input unchanged if unparseable. */
export function formatMyPhone(input: string): string {
  const digits = input.replace(DIGITS_RE, "");
  if (!digits) return "";
  let rest: string;
  let prefix: string;
  if (digits.startsWith("60")) {
    prefix = "+60 ";
    rest = digits.slice(2);
  } else if (digits.startsWith("0")) {
    prefix = "0";
    rest = digits.slice(1);
  } else {
    return input;
  }
  // Group "1X XXX XXXX" or "1XX XXX XXXX".
  if (rest.length <= 2) return prefix + rest;
  if (rest.length <= 5) return `${prefix}${rest.slice(0, 2)} ${rest.slice(2)}`;
  if (rest.length <= 9) {
    return `${prefix}${rest.slice(0, 2)} ${rest.slice(2, 5)} ${rest.slice(5)}`;
  }
  return `${prefix}${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6, 10)}`;
}
