import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { format } from "date-fns";
import { isHoliday } from "./holidays";

export const KL_TZ = "Asia/Kuala_Lumpur";

export const SLOT_MINUTES_OF_DAY: ReadonlyArray<number> = (() => {
  const slots: number[] = [];
  for (let h = 9; h < 18; h++) {
    for (const m of [0, 30]) {
      const minutes = h * 60 + m;
      if (minutes >= 12 * 60 + 30 && minutes < 13 * 60 + 30) continue;
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

export function ymd(year: number, month: number, day: number): string {
  return `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

export function ymdInKL(utc: Date): string {
  return format(toZonedTime(utc, KL_TZ), "yyyy-MM-dd");
}

/** Build the canonical UTC for a KL-local YYYY-MM-DD + minutes-of-day. */
export function slotToUtc(ymdString: string, minutes: number): Date {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const local = `${ymdString}T${h.toString().padStart(2, "0")}:${m
    .toString()
    .padStart(2, "0")}:00`;
  return fromZonedTime(local, KL_TZ);
}

export function dayOfWeekInKL(ymdString: string): number {
  return toZonedTime(slotToUtc(ymdString, 0), KL_TZ).getDay();
}

export function isClosedDay(ymdString: string): boolean {
  return dayOfWeekInKL(ymdString) === 0 || isHoliday(ymdString);
}

/** Friendly KL date string like "Saturday, 9 May 2026". */
export function formatKlDate(utc: Date): string {
  return format(toZonedTime(utc, KL_TZ), "EEEE, d LLLL yyyy");
}
