"use client";

import type { FinancingStep } from "@/stores/financingStore";

const STEPS: { id: FinancingStep; label: string }[] = [
  { id: 1, label: "Vehicle" },
  { id: 2, label: "Loan" },
  { id: 3, label: "Personal" },
  { id: 4, label: "Employment" },
  { id: 5, label: "Documents" },
  { id: 6, label: "Review" },
];

export function FinancingProgress({
  current,
  onJump,
}: {
  current: FinancingStep;
  onJump?: (step: FinancingStep) => void;
}): React.ReactElement {
  return (
    <ol className="flex flex-wrap items-center gap-2" aria-label="Steps">
      {STEPS.map((s) => {
        const state =
          s.id < current ? "done" : s.id === current ? "current" : "upcoming";
        const dotClasses =
          state === "current"
            ? "bg-[var(--color-accent)]"
            : state === "done"
              ? "bg-[var(--color-graphite)]"
              : "bg-[var(--color-neutral-300)]";
        const button = (
          <button
            type="button"
            onClick={onJump && state === "done" ? () => onJump(s.id) : undefined}
            disabled={!onJump || state !== "done"}
            className={`flex items-center gap-2 ${
              state === "done" && onJump
                ? "cursor-pointer hover:opacity-80"
                : "cursor-default"
            }`}
            aria-current={state === "current" ? "step" : undefined}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full transition-colors ${dotClasses}`}
            />
            <span
              className={`hidden text-xs uppercase tracking-[0.16em] sm:inline ${
                state === "upcoming"
                  ? "text-[var(--color-neutral-400)]"
                  : "text-[var(--color-neutral-700)]"
              }`}
            >
              {s.label}
            </span>
          </button>
        );
        return (
          <li key={s.id} className="flex items-center gap-2">
            {button}
            {s.id !== STEPS[STEPS.length - 1]!.id && (
              <span
                aria-hidden
                className="hidden h-px w-6 bg-[var(--color-neutral-300)] sm:inline-block"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
