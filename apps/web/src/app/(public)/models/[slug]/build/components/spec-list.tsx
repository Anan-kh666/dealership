"use client";

import * as React from "react";
import { formatRM } from "../lib/pricing";

interface SpecListItem {
  label: string;
  value: string;
  /** Numeric delta in RM. 0 means included. null means base price. */
  delta: number | null;
}

interface SpecListProps {
  items: SpecListItem[];
  total: number;
}

export function SpecList({ items, total }: SpecListProps): React.ReactElement {
  return (
    <dl className="flex flex-col divide-y divide-[var(--color-neutral-200)] border-y border-[var(--color-neutral-200)]">
      {items.map((item, i) => (
        <div
          key={`${item.label}-${i}`}
          className="flex items-baseline justify-between gap-6 py-3"
        >
          <dt className="flex flex-col">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-neutral-500)]">
              {item.label}
            </span>
            <span className="text-[15px] text-[var(--color-graphite)]">
              {item.value}
            </span>
          </dt>
          <dd className="text-sm text-[var(--color-neutral-700)] tabular-nums">
            {item.delta === null
              ? formatRM(total - sumDeltas(items))
              : item.delta === 0
                ? "Included"
                : `+ ${formatRM(item.delta)}`}
          </dd>
        </div>
      ))}
      <div className="flex items-baseline justify-between gap-6 py-4">
        <dt className="text-xs uppercase tracking-[0.2em] text-[var(--color-neutral-500)]">
          Total
        </dt>
        <dd
          className="font-[family-name:var(--font-display)] tracking-[-0.02em] tabular-nums"
          style={{ fontSize: "26px" }}
        >
          {formatRM(total)}
        </dd>
      </div>
    </dl>
  );
}

function sumDeltas(items: SpecListItem[]): number {
  return items.reduce((acc, i) => acc + (i.delta ?? 0), 0);
}
