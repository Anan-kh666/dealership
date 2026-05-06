"use client";

import * as React from "react";
import { BrandButton } from "@dealership/ui/components/brand-button";

interface TotalBarProps {
  total: string;
  showContinue: boolean;
  showBack: boolean;
  onContinue: () => void;
  onBack: () => void;
}

export function TotalBar({
  total,
  showContinue,
  showBack,
  onContinue,
  onBack,
}: TotalBarProps): React.ReactElement {
  return (
    <div
      className={[
        "fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-neutral-200)] bg-white/95 backdrop-blur",
        "lg:absolute lg:left-1/2 lg:right-0 lg:bottom-0 lg:w-1/2 lg:bg-white",
      ].join(" ")}
    >
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-3 lg:px-6 lg:py-4">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-neutral-500)]">
            Estimated total
          </span>
          <span
            className="font-[family-name:var(--font-display)] tracking-[-0.02em]"
            style={{ fontSize: "22px", lineHeight: 1.1 }}
          >
            {total}
          </span>
          <span className="text-[10px] text-[var(--color-neutral-500)]">
            Excludes road tax, registration, insurance.
          </span>
        </div>
        <div className="flex items-center gap-2">
          {showBack ? (
            <BrandButton
              variant="ghost-dark"
              size="md"
              onClick={onBack}
              type="button"
            >
              Back
            </BrandButton>
          ) : null}
          {showContinue ? (
            <BrandButton
              variant="primary"
              size="md"
              onClick={onContinue}
              type="button"
            >
              Continue
            </BrandButton>
          ) : null}
        </div>
      </div>
    </div>
  );
}
