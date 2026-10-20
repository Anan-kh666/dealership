/** Display formatters pinned to the showroom's timezone (Asia/Kuala_Lumpur). */
const TZ = "Asia/Kuala_Lumpur";

const date = new Intl.DateTimeFormat("en-MY", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: TZ,
});

const dateLong = new Intl.DateTimeFormat("en-MY", {
  weekday: "short",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: TZ,
});

const time = new Intl.DateTimeFormat("en-MY", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: TZ,
});

export function formatDate(d: Date): string {
  return date.format(d);
}

export function formatDateLong(d: Date): string {
  return dateLong.format(d);
}

export function formatTime(d: Date): string {
  return time.format(d).replace(/\s?([ap])m$/i, (_, p: string) => ` ${p.toUpperCase()}M`);
}

export function formatDateTime(d: Date): string {
  return `${formatDate(d)}, ${formatTime(d)}`;
}

/** "3 days ago", "in 2 hours" — coarse, for activity feeds. */
export function formatRelative(d: Date, now = new Date()): string {
  const diffSec = Math.round((d.getTime() - now.getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const abs = Math.abs(diffSec);
  if (abs < 60) return rtf.format(diffSec, "second");
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
  if (abs < 86_400) return rtf.format(Math.round(diffSec / 3600), "hour");
  if (abs < 86_400 * 30) return rtf.format(Math.round(diffSec / 86_400), "day");
  return formatDate(d);
}
