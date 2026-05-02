import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { format } from "date-fns";
import { isHoliday } from "./holidays.js";

export const KL_TZ = "Asia/Kuala_Lumpur";

/** Working hours: 9:00 – 18:00, 30-min slots, lunch 12:30 – 13:30 disabled. */
export const SLOT_MINUTES_OF_DAY: ReadonlyArray<number> = (() => {
  const slots: number[] = [];
  for (let h = 9; h < 18; h++) {
    for (const m of [0, 30]) {
      const minutes = h * 60 + m;
      if (minutes >= 12 * 60 + 30 && minutes < 13 * 60 + 30) continue; // lunch
      slots.push(minutes);
    }
  }
  return slots;
})();

export function formatSlotLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  const mm = m.toString().padStart(2, "0");
  return `${hh}:${mm} ${ampm}`;
}

/**
 * Build the canonical UTC Date for `${ymd} ${minutes}` in Asia/Kuala_Lumpur.
 * `ymd` is "YYYY-MM-DD" (a KL local date, not a UTC date).
 */
export function slotToUtc(ymd: string, minutes: number): Date {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const local = `${ymd}T${h.toString().padStart(2, "0")}:${m
    .toString()
    .padStart(2, "0")}:00`;
  return fromZonedTime(local, KL_TZ);
}

/** YYYY-MM-DD in KL for the given UTC Date. */
export function ymdInKL(utc: Date): string {
  return format(toZonedTime(utc, KL_TZ), "yyyy-MM-dd");
}

/** Minutes-of-day in KL for the given UTC Date. */
export function minutesInKL(utc: Date): number {
  const z = toZonedTime(utc, KL_TZ);
  return z.getHours() * 60 + z.getMinutes();
}

/** True if the date is a Sunday (KL). */
export function isSundayInKL(ymd: string): boolean {
  // Parse as KL midnight then check the weekday.
  const utc = slotToUtc(ymd, 0);
  return toZonedTime(utc, KL_TZ).getDay() === 0;
}

export function isClosedDay(ymd: string): boolean {
  return isSundayInKL(ymd) || isHoliday(ymd);
}
