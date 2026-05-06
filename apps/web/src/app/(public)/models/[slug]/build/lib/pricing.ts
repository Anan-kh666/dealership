/**
 * Configurator pricing utilities. The total is just base trim price + the
 * sum of selected option deltas (and any per-trim exterior-colour upcharge).
 * Tax/registration/insurance are out of scope — a small disclaimer is shown
 * under the running total.
 */

// Use the currency formatter to compute the grouped digit string, then strip
// the locale's currency prefix and re-prepend `RM ` so the output stays
// identical across ICU builds (some render `MYR285,000`, others `RM 285,000`).
const formatter = new Intl.NumberFormat("en-MY", {
  style: "currency",
  currency: "MYR",
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

/**
 * Format a numeric price as `RM 285,000`. Negative values get a leading `-`
 * after the `RM ` prefix.
 */
export function formatRM(amount: number): string {
  if (!Number.isFinite(amount)) return "RM 0";
  const rounded = Math.round(amount);
  const raw = formatter.format(Math.abs(rounded));
  // Keep digits and grouping commas; drop the locale-specific currency prefix.
  const digits = raw.replace(/[^\d,]/g, "");
  const sign = rounded < 0 ? "-" : "";
  return `RM ${sign}${digits}`;
}

export interface PriceableOption {
  id: string;
  /** Decimal-string price (e.g. "1500.00") as it comes off Prisma. */
  price: string;
}

export interface PriceableTrimColor {
  colorId: string;
  /** Decimal-string upcharge. Most colours are 0. */
  upcharge: string;
}

export interface ComputeTotalInput {
  /** Decimal-string trim base price. */
  trimPrice: string;
  exteriorColorId: string | null;
  trimColors: PriceableTrimColor[];
  /** All options offered on the trim, used to look up deltas. */
  trimOptions: PriceableOption[];
  selectedOptionIds: string[];
}

/**
 * Compute the running total. Unknown option IDs are ignored (URL params can
 * contain stale ids if a model changes).
 */
export function computeTotal({
  trimPrice,
  exteriorColorId,
  trimColors,
  trimOptions,
  selectedOptionIds,
}: ComputeTotalInput): number {
  const base = toNum(trimPrice);
  let total = base;
  if (exteriorColorId) {
    const tc = trimColors.find((c) => c.colorId === exteriorColorId);
    if (tc) total += toNum(tc.upcharge);
  }
  const selected = new Set(selectedOptionIds);
  for (const opt of trimOptions) {
    if (selected.has(opt.id)) total += toNum(opt.price);
  }
  return total;
}

function toNum(s: string): number {
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}
