"use client";

import * as React from "react";
import { addDays } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { dayOfWeekInKL, isClosedDay, ymdInKL } from "@/lib/test-drive/slots";
import { holidayName } from "@/lib/test-drive/holidays";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export interface CalendarProps {
  selected: string | null;
  onSelect: (ymd: string) => void;
}

interface DayCell {
  ymd: string;
  day: number;
  inWindow: boolean;
  closed: boolean;
  closedReason: string | null;
  isToday: boolean;
}

export function Calendar({ selected, onSelect }: CalendarProps): React.ReactElement {
  const today = React.useMemo(() => new Date(), []);
  const [monthOffset, setMonthOffset] = React.useState(0);
  const focusGridRef = React.useRef<HTMLDivElement | null>(null);

  // Window: today through today + 30 days (inclusive of selectable range).
  const windowStart = today;
  const windowEnd = addDays(today, 30);

  // Month being displayed.
  const visibleMonthAnchor = React.useMemo(() => {
    const d = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    return d;
  }, [today, monthOffset]);

  const cells = React.useMemo<DayCell[]>(() => {
    const year = visibleMonthAnchor.getFullYear();
    const month = visibleMonthAnchor.getMonth();
    const firstDow = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const list: DayCell[] = [];
    for (let i = 0; i < firstDow; i++) {
      const placeholderDate = new Date(year, month, i - firstDow + 1);
      list.push({
        ymd: `pad-${i}`,
        day: placeholderDate.getDate(),
        inWindow: false,
        closed: true,
        closedReason: null,
        isToday: false,
      });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const ymd = ymdInKL(date);
      const inWindow = date >= startOfDay(windowStart) && date <= addDays(windowStart, 30);
      const closed = !inWindow || isClosedDay(ymd);
      const closedReason = inWindow
        ? dayOfWeekInKL(ymd) === 0
          ? "Closed Sundays"
          : holidayName(ymd)
        : null;
      list.push({
        ymd,
        day: d,
        inWindow,
        closed,
        closedReason,
        isToday: ymd === ymdInKL(today),
      });
    }
    return list;
  }, [visibleMonthAnchor, windowStart, today]);

  const monthLabel = visibleMonthAnchor.toLocaleString("en-MY", {
    month: "long",
    year: "numeric",
  });

  const canPrev = monthOffset > 0;
  const lastWindowMonthOffset =
    (windowEnd.getFullYear() - today.getFullYear()) * 12 +
    (windowEnd.getMonth() - today.getMonth());
  const canNext = monthOffset < lastWindowMonthOffset;

  function handleKey(e: React.KeyboardEvent<HTMLButtonElement>, idx: number): void {
    const moves: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };
    const delta = moves[e.key];
    if (delta === undefined) return;
    e.preventDefault();
    const buttons = focusGridRef.current?.querySelectorAll<HTMLButtonElement>(
      "button[data-day-cell='true']",
    );
    if (!buttons) return;
    let next = idx + delta;
    while (
      next >= 0 &&
      next < buttons.length &&
      buttons[next]?.getAttribute("aria-disabled") === "true"
    ) {
      next += delta;
    }
    if (next >= 0 && next < buttons.length) {
      buttons[next]?.focus();
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="font-[family-name:var(--font-display)] text-lg tracking-[-0.02em]">
          {monthLabel}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMonthOffset((m) => m - 1)}
            disabled={!canPrev}
            aria-label="Previous month"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-neutral-200)] text-[var(--color-graphite)] transition hover:bg-[var(--color-surface-warm)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setMonthOffset((m) => m + 1)}
            disabled={!canNext}
            aria-label="Next month"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-neutral-200)] text-[var(--color-graphite)] transition hover:bg-[var(--color-surface-warm)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
      <div role="grid" aria-label="Date picker" ref={focusGridRef} className="grid grid-cols-7 gap-1">
        {WEEKDAY_LABELS.map((d) => (
          <div
            key={d}
            role="columnheader"
            className="p-2 text-center text-[10px] uppercase tracking-[0.16em] text-[var(--color-neutral-500)]"
          >
            {d}
          </div>
        ))}
        {cells.map((c, idx) => {
          const isSelected = !c.closed && c.ymd === selected;
          return (
            <button
              key={`${c.ymd}-${idx}`}
              data-day-cell="true"
              type="button"
              role="gridcell"
              aria-disabled={c.closed}
              aria-selected={isSelected}
              aria-label={
                c.closed && c.closedReason
                  ? `${c.day} — ${c.closedReason}`
                  : undefined
              }
              tabIndex={c.closed ? -1 : isSelected ? 0 : -1}
              onClick={() => {
                if (!c.closed) onSelect(c.ymd);
              }}
              onKeyDown={(e) => handleKey(e, idx)}
              disabled={c.closed}
              className={[
                "relative aspect-square rounded-[var(--radius-md)] text-sm tabular-nums transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1",
                c.closed
                  ? "cursor-not-allowed text-[var(--color-neutral-400)] line-through"
                  : "text-[var(--color-graphite)] hover:bg-[var(--color-surface-warm)]",
                isSelected
                  ? "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-deep)]"
                  : "",
                c.isToday && !isSelected
                  ? "ring-1 ring-[var(--color-accent)]/40"
                  : "",
                !c.inWindow ? "opacity-30" : "",
              ].join(" ")}
            >
              {c.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
