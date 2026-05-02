"use client";

const STEPS: ReadonlyArray<{ index: number; label: string }> = [
  { index: 1, label: "Vehicle" },
  { index: 2, label: "Date & time" },
  { index: 3, label: "Your details" },
  { index: 4, label: "Confirm" },
];

export function ProgressDots({ current }: { current: number }): React.ReactElement {
  return (
    <ol
      aria-label="Booking progress"
      className="flex items-center gap-3 text-xs uppercase tracking-[0.16em] text-[var(--color-neutral-500)]"
    >
      {STEPS.map((s, i) => {
        const active = s.index === current;
        const done = s.index < current;
        return (
          <li key={s.index} className="flex items-center gap-3">
            <span
              aria-current={active ? "step" : undefined}
              className={[
                "inline-flex h-2.5 w-2.5 rounded-full transition-colors",
                active
                  ? "bg-[var(--color-accent)]"
                  : done
                    ? "bg-[var(--color-graphite)]"
                    : "bg-[var(--color-neutral-300)]",
              ].join(" ")}
            />
            <span className={active ? "text-[var(--color-graphite)]" : undefined}>
              {s.label}
            </span>
            {i < STEPS.length - 1 ? (
              <span aria-hidden className="hidden h-px w-6 bg-[var(--color-neutral-200)] sm:inline-block" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
