"use client";

import * as React from "react";
import { BrandButton } from "@dealership/ui/components/brand-button";
import { ColorSwatch } from "@dealership/ui/components/color-swatch";
import { formatRM } from "../lib/pricing";
import type { ConfiguratorColor } from "../configurator-client";

interface ExteriorStepProps {
  colors: ConfiguratorColor[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function ExteriorStep({
  colors,
  selectedId,
  onSelect,
  onContinue,
  onBack,
}: ExteriorStepProps): React.ReactElement {
  const selected = colors.find((c) => c.id === selectedId);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2
          className="font-[family-name:var(--font-display)] tracking-[-0.02em]"
          style={{ fontSize: "clamp(28px, 4vw, 40px)", lineHeight: 1.05 }}
        >
          Pick an exterior colour.
        </h2>
        <p className="text-sm text-[var(--color-neutral-600)]">
          Metallic finishes and premium pearls carry a small upcharge.
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        {colors.map((c) => {
          const isSelected = c.id === selectedId;
          const upcharge = Number.parseFloat(c.upcharge);
          return (
            <div key={c.id} className="flex flex-col items-center gap-2">
              <ColorSwatch
                hex={c.hexCode}
                name={c.name}
                size="lg"
                selected={isSelected}
                onClick={() => onSelect(c.id)}
              />
              <span className="text-xs text-[var(--color-graphite)]">
                {c.name}
              </span>
              {upcharge > 0 ? (
                <span className="text-[10px] text-[var(--color-neutral-500)]">
                  + {formatRM(upcharge)}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>

      {selected ? (
        <p className="text-sm text-[var(--color-neutral-600)]">
          Selected: {selected.name}
          {selected.isMetallic ? " · Metallic" : ""}
        </p>
      ) : null}

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
