/**
 * Customer-facing reference numbers. Each is a prefix plus the last six
 * characters of the row's cuid, uppercased. The id stays canonical; the
 * reference is just a friendlier thing to quote on the phone.
 *
 *   TD-XXXXXX  test drive
 *   TI-XXXXXX  trade-in
 *   FA-XXXXXX  financing application (also stored on the row)
 */

export function testDriveReferenceFromId(id: string): string {
  return `TD-${id.slice(-6).toUpperCase()}`;
}

export function tradeInReferenceFromId(id: string): string {
  return `TI-${id.slice(-6).toUpperCase()}`;
}

export function financingReferenceFromId(id: string): string {
  return `FA-${id.slice(-6).toUpperCase()}`;
}

/** Lower-cased id suffix for a `TI-XXXXXX` reference, or null if malformed. */
export function tradeInIdSuffixFromReference(reference: string): string | null {
  const m = /^TI-([A-Z0-9]{6})$/i.exec(reference.trim());
  if (!m) return null;
  return m[1]!.toLowerCase();
}
