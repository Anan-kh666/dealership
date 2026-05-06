"use client";

import * as React from "react";
import { BrandButton } from "@dealership/ui/components/brand-button";
import { formatRM } from "../lib/pricing";
import type { ConfiguratorOption } from "../configurator-client";

interface OptionsStepProps {
  options: ConfiguratorOption[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onContinue: () => void;
  onBack: () => void;
}

const CATEGORY_LABEL: Record<string, string> = {
  SAFETY: "Safety & assist",
  COMFORT: "Comfort",
  TECH: "Technology",
  PERFORMANCE: "Performance",
  EXTERIOR: "Exterior",
  INTERIOR: "Interior",
};

export function OptionsStep({
  options,
  selectedIds,
  onToggle,
  onContinue,
  onBack,
}: OptionsStepProps): React.ReactElement {
  const selected = new Set(selectedIds);
  // Group by category for editorial grouping.
  const groups = React.useMemo(() => {
    const map = new Map<string, ConfiguratorOption[]>();
    for (const o of options) {
      const arr = map.get(o.category) ?? [];
      arr.push(o);
      map.set(o.category, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [options]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2
          className="font-[family-name:var(--font-display)] tracking-[-0.02em]"
          style={{ fontSize: "clamp(28px, 4vw, 40px)", lineHeight: 1.05 }}
        >
          Add à la carte options.
        </h2>
        <p className="text-sm text-[var(--color-neutral-600)]">
          Optional packages on top of standard equipment.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        {groups.map(([cat, opts]) => (
          <div key={cat} className="flex flex-col gap-3">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-neutral-500)]">
              {CATEGORY_LABEL[cat] ?? cat}
            </p>
            <ul className="flex flex-col gap-2">
              {opts.map((o) => {
                const isSelected = selected.has(o.id);
                return (
                  <li key={o.id}>
                    <button
                      type="button"
                      onClick={() => onToggle(o.id)}
                      aria-pressed={isSelected}
                      className={[
                        "flex w-full items-start gap-4 rounded-[var(--radius-lg)] border bg-white p-4 text-left transition-colors duration-[var(--duration-standard)] ease-[var(--ease-out-soft)]",
                        isSelected
                          ? "border-[var(--color-accent)] shadow-[var(--shadow-1)]"
                          : "border-[var(--color-neutral-200)] hover:border-[var(--color-neutral-400)]",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border",
                          isSelected
                            ? "border-[var(--color-accent)] bg-[var(--color-accent)]"
                            : "border-[var(--color-neutral-400)] bg-white",
                        ].join(" ")}
                        aria-hidden
                      >
                        {isSelected ? (
                          <svg
                            viewBox="0 0 12 12"
                            className="h-3 w-3 text-white"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M2 6.5l2.5 2.5L10 3.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : null}
                      </span>
                      <span className="flex flex-1 flex-col gap-1">
                        <span className="flex items-baseline justify-between gap-4">
                          <span className="text-[15px] text-[var(--color-graphite)]">
                            {o.name}
                          </span>
                          <span className="text-sm tabular-nums text-[var(--color-neutral-700)]">
                            + {formatRM(Number.parseFloat(o.price))}
                          </span>
                        </span>
                        {o.description ? (
                          <span className="text-sm text-[var(--color-neutral-600)]">
                            {o.description}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="hidden">
        <BrandButton variant="ghost-dark" size="md" onClick={onBack}>
          Back
        </BrandButton>
        <BrandButton variant="primary" size="lg" onClick={onContinue}>
          Continue
        </BrandButton>
      </div>
    </div>
  );
}
