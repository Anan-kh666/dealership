"use client";

import * as React from "react";
import { BrandButton } from "@dealership/ui/components/brand-button";
import { ColorSwatch } from "@dealership/ui/components/color-swatch";
import { formatRM } from "../lib/pricing";
import type { ConfiguratorColor } from "../configurator-client";

interface InteriorStepProps {
  colors: ConfiguratorColor[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function InteriorStep({
  colors,
  selectedId,
  onSelect,
  onContinue,
  onBack,
}: InteriorStepProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2
          className="font-[family-name:var(--font-display)] tracking-[-0.02em]"
          style={{ fontSize: "clamp(28px, 4vw, 40px)", lineHeight: 1.05 }}
        >
          Choose your interior.
        </h2>
        <p className="text-sm text-[var(--color-neutral-600)]">
          Cabin trim, upholstery and stitching combinations.
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {colors.map((c) => {
          const isSelected = c.id === selectedId;
          const upcharge = Number.parseFloat(c.upcharge);
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onSelect(c.id)}
                aria-pressed={isSelected}
                className={[
                  "flex w-full items-center gap-4 rounded-[var(--radius-lg)] border bg-white p-4 text-left transition-colors duration-[var(--duration-standard)] ease-[var(--ease-out-soft)]",
                  isSelected
                    ? "border-[var(--color-accent)] shadow-[var(--shadow-1)]"
                    : "border-[var(--color-neutral-200)] hover:border-[var(--color-neutral-400)]",
                ].join(" ")}
              >
                <span
                  className="h-12 w-12 shrink-0 rounded-[var(--radius-sm)] border border-black/10"
                  style={{ backgroundColor: c.hexCode }}
                />
                <span className="flex flex-1 flex-col gap-0.5">
                  <span className="text-[15px] text-[var(--color-graphite)]">
                    {c.name}
                  </span>
                  <span className="text-xs text-[var(--color-neutral-500)]">
                    {upcharge > 0 ? `+ ${formatRM(upcharge)}` : "Included"}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between pt-2">
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
