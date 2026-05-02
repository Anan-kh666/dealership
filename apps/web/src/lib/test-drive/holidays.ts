/**
 * Malaysian public holidays for 2026 used to disable the test-drive calendar.
 * Mirrors apps/api/src/lib/holidays.ts. Move to a DB-backed admin-config later.
 */
export const MY_HOLIDAYS_2026: ReadonlyArray<{ date: string; name: string }> = [
  { date: "2026-01-01", name: "New Year's Day" },
  { date: "2026-02-17", name: "Chinese New Year" },
  { date: "2026-02-18", name: "Chinese New Year (Day 2)" },
  { date: "2026-03-21", name: "Hari Raya Puasa" },
  { date: "2026-03-22", name: "Hari Raya Puasa (Day 2)" },
  { date: "2026-05-01", name: "Wesak Day" },
  { date: "2026-05-27", name: "Hari Raya Haji" },
  { date: "2026-08-31", name: "Merdeka Day" },
  { date: "2026-09-16", name: "Malaysia Day" },
  { date: "2026-10-28", name: "Deepavali" },
  { date: "2026-12-25", name: "Christmas Day" },
];

const HOLIDAY_SET = new Set(MY_HOLIDAYS_2026.map((h) => h.date));

export function isHoliday(ymd: string): boolean {
  return HOLIDAY_SET.has(ymd);
}

export function holidayName(ymd: string): string | null {
  return MY_HOLIDAYS_2026.find((h) => h.date === ymd)?.name ?? null;
}
