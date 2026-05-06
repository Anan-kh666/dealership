"use client";

import * as React from "react";
import type { StepKind } from "../configurator-client";

interface StepIndicatorProps {
  steps: { kind: StepKind; label: string; autoOnly: boolean }[];
  currentIndex: number;
  onJump: (index: number) => void;
}

export function StepIndicator({
  steps,
  currentIndex,
  onJump,
}: StepIndicatorProps): React.ReactElement {
  const total = steps.length;
  const current = steps[currentIndex];
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-neutral-500)]">
        {currentIndex + 1} / {total} · {current?.label}
      </p>
      <ol className="flex gap-1.5">
        {steps.map((s, i) => {
          const isPast = i < currentIndex;
          const isCurrent = i === currentIndex;
          return (
            <li key={s.kind} className="flex-1">
              <button
                type="button"
                disabled={!isPast}
                aria-label={`Step ${i + 1}: ${s.label}`}
                onClick={() => onJump(i)}
                className={[
                  "h-1 w-full rounded-full transition-colors duration-[var(--duration-standard)] ease-[var(--ease-out-soft)]",
                  isPast || isCurrent
                    ? "bg-[var(--color-graphite)]"
                    : "bg-[var(--color-neutral-200)]",
                  isPast ? "cursor-pointer" : "cursor-default",
                ].join(" ")}
              />
            </li>
          );
        })}
      </ol>
    </div>
  );
}
