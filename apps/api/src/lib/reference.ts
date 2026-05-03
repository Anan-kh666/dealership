/**
 * A trade-in reference number derived from the row id: `TI-` + the last
 * 6 characters of the cuid, uppercased. The id stays canonical; the
 * reference is just a friendlier surface for customers to quote when
 * following up.
 */
export function tradeInReferenceFromId(id: string): string {
  return `TI-${id.slice(-6).toUpperCase()}`;
}

export function tradeInIdSuffixFromReference(reference: string): string | null {
  const m = /^TI-([A-Z0-9]{6})$/i.exec(reference.trim());
  if (!m) return null;
  return m[1]!.toLowerCase();
}
