/**
 * Finance defaults used across stock filters and the financing widget. Keep
 * the public-facing assumptions here so the calculator, the per-unit "Est.
 * RM X/mo" line, and the monthly-payment slider all read from one place.
 *
 * Defaults: 7-year term, 3.5% APR, 10% down. Documented copy in the UI
 * should match.
 */
export const FINANCE_DEFAULTS = {
  termMonths: 84,
  aprPercent: 3.5,
  downPaymentPercent: 0.1,
} as const;

export interface MonthlyPaymentInput {
  totalPrice: number;
  termMonths?: number;
  aprPercent?: number;
  downPaymentPercent?: number;
}

/**
 * Returns the estimated monthly payment for a given out-the-door price using
 * a standard amortizing-loan formula. Falls back to a flat divide if the
 * monthly rate is zero.
 */
export function monthlyPayment({
  totalPrice,
  termMonths = FINANCE_DEFAULTS.termMonths,
  aprPercent = FINANCE_DEFAULTS.aprPercent,
  downPaymentPercent = FINANCE_DEFAULTS.downPaymentPercent,
}: MonthlyPaymentInput): number {
  if (!Number.isFinite(totalPrice) || totalPrice <= 0) return 0;
  const principal = totalPrice * (1 - downPaymentPercent);
  const monthlyRate = aprPercent / 100 / 12;
  if (monthlyRate === 0) return principal / termMonths;
  const n = termMonths;
  const factor = Math.pow(1 + monthlyRate, n);
  return (principal * monthlyRate * factor) / (factor - 1);
}

/**
 * Inverse of monthlyPayment — given a monthly budget and the same loan
 * defaults, returns the maximum out-the-door price.
 */
export function priceForMonthly({
  monthly,
  termMonths = FINANCE_DEFAULTS.termMonths,
  aprPercent = FINANCE_DEFAULTS.aprPercent,
  downPaymentPercent = FINANCE_DEFAULTS.downPaymentPercent,
}: {
  monthly: number;
  termMonths?: number;
  aprPercent?: number;
  downPaymentPercent?: number;
}): number {
  if (!Number.isFinite(monthly) || monthly <= 0) return 0;
  const monthlyRate = aprPercent / 100 / 12;
  let principal: number;
  if (monthlyRate === 0) {
    principal = monthly * termMonths;
  } else {
    const factor = Math.pow(1 + monthlyRate, termMonths);
    principal = (monthly * (factor - 1)) / (monthlyRate * factor);
  }
  return principal / (1 - downPaymentPercent);
}
