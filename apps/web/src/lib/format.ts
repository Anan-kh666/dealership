/**
 * Format a Decimal-string price (e.g. "168000.00") as a Malaysian Ringgit
 * display string ("RM 168,000"). Prisma Decimal columns serialize as strings.
 */
export function formatPrice(amount: string | number, currency = "MYR"): string {
  const n =
    typeof amount === "number" ? amount : Number.parseFloat(amount.replace(/,/g, ""));
  if (!Number.isFinite(n)) return `${currency} 0`;
  const prefix = currency === "MYR" ? "RM" : currency;
  return `${prefix} ${n.toLocaleString("en-MY", {
    maximumFractionDigits: 0,
  })}`;
}
