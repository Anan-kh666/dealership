"use client";

import * as React from "react";
import { BrandButton } from "@dealership/ui/components/brand-button";
import { formatRM } from "../lib/pricing";
import type { ConfiguratorTrim } from "../configurator-client";

interface TrimStepProps {
  trims: ConfiguratorTrim[];
  selectedTrimId: string;
  onSelect: (id: string) => void;
  onContinue: () => void;
}

export function TrimStep({
  trims,
  selectedTrimId,
  onSelect,
  onContinue,
}: TrimStepProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2
          className="font-[family-name:var(--font-display)] tracking-[-0.02em]"
          style={{ fontSize: "clamp(28px, 4vw, 40px)", lineHeight: 1.05 }}
        >
          Choose a trim.
        </h2>
        <p className="text-sm text-[var(--color-neutral-600)]">
          Each trim ships complete. Standard equipment stays standard.
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {trims.map((t) => {
          const selected = t.id === selectedTrimId;
          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => onSelect(t.id)}
                aria-pressed={selected}
                className={[
                  "w-full rounded-[var(--radius-lg)] border bg-white p-5 text-left transition-colors duration-[var(--duration-standard)] ease-[var(--ease-out-soft)]",
                  selected
                    ? "border-[var(--color-accent)] shadow-[var(--shadow-1)]"
                    : "border-[var(--color-neutral-200)] hover:border-[var(--color-neutral-400)]",
                ].join(" ")}
              >
                <div className="flex items-baseline justify-between gap-4">
                  <h3
                    className="font-[family-name:var(--font-display)] tracking-[-0.02em]"
                    style={{ fontSize: "22px" }}
                  >
                    {t.name}
                  </h3>
                  <span className="font-[family-name:var(--font-display)] text-base tabular-nums">
                    {formatRM(Number.parseFloat(t.price))}
                  </span>
                </div>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--color-neutral-500)]">
                  {t.horsepower ? `${t.horsepower} hp · ` : ""}
                  {t.drivetrain} · {t.seats} seats
                </p>
                {t.features.length > 0 ? (
                  <p className="mt-3 text-sm text-[var(--color-neutral-700)]">
                    {t.features.slice(0, 3).join(" · ")}
                    {t.features.length > 3 ? ` · +${t.features.length - 3} more` : ""}
                  </p>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex justify-end pt-2">
        <BrandButton variant="primary" size="lg" onClick={onContinue}>
          Continue
        </BrandButton>
      </div>
    </div>
  );
}
