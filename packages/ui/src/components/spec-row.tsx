import * as React from "react";
import { cn } from "../lib/cn";

export interface SpecRowProps {
  label: string;
  value: React.ReactNode;
  trimLabel?: string;
  className?: string;
}

export function SpecRow({
  label,
  value,
  trimLabel,
  className,
}: SpecRowProps): React.ReactElement {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-4 border-b border-[var(--color-neutral-200)] py-3 last:border-b-0",
        className,
      )}
    >
      <span className="text-sm text-[var(--color-neutral-600)]">{label}</span>
      <span className="text-right text-sm tabular-nums text-foreground">
        {value}
        {trimLabel ? (
          <span className="ml-2 text-xs uppercase tracking-[0.16em] text-[var(--color-neutral-500)]">
            {trimLabel}
          </span>
        ) : null}
      </span>
    </div>
  );
}
