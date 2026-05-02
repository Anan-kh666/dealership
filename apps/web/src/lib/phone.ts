/**
 * Malaysian mobile-phone helper. Mirrors `mlPhone` in `@dealership/types`
 * so the frontend can validate before calling the API. **TODO:** dedupe
 * with the test-drive flow's helper once that lands — both should call
 * into the same primitive from `@dealership/types`.
 */
const ML_PHONE_RE = /^(\+?60|0)1[0-9]\d{7,8}$/;

export function normalizeMlPhone(input: string): string {
  return input.trim().replace(/[\s-]/g, "");
}

export function isValidMlPhone(input: string): boolean {
  return ML_PHONE_RE.test(normalizeMlPhone(input));
}
