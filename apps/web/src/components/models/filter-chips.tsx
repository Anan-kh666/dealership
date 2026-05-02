"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@dealership/ui/lib/cn";

type Chip = {
  label: string;
  param?: "bodyType" | "fuelType";
  value?: string;
};

const CHIPS: Chip[] = [
  { label: "All" },
  { label: "Sedan", param: "bodyType", value: "SEDAN" },
  { label: "SUV", param: "bodyType", value: "SUV" },
  { label: "Hatchback", param: "bodyType", value: "HATCHBACK" },
  { label: "Coupe", param: "bodyType", value: "COUPE" },
  { label: "EV", param: "fuelType", value: "ELECTRIC" },
  { label: "Hybrid", param: "fuelType", value: "HYBRID" },
];

export function FilterChips(): React.ReactElement {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const activeBody = params.get("bodyType");
  const activeFuel = params.get("fuelType");

  const isActive = (chip: Chip): boolean => {
    if (!chip.param) return !activeBody && !activeFuel;
    if (chip.param === "bodyType") return activeBody === chip.value;
    return activeFuel === chip.value;
  };

  const onClick = (chip: Chip): void => {
    const next = new URLSearchParams(params.toString());
    next.delete("bodyType");
    next.delete("fuelType");
    if (chip.param && chip.value && !isActive(chip)) {
      next.set(chip.param, chip.value);
    }
    const qs = next.toString();
    startTransition(() => {
      router.push(qs ? `/models?${qs}` : "/models", { scroll: false });
    });
  };

  return (
    <div
      role="tablist"
      aria-label="Filter models"
      className="flex flex-wrap gap-2 md:gap-3"
    >
      {CHIPS.map((chip) => {
        const active = isActive(chip);
        return (
          <button
            key={chip.label}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onClick(chip)}
            className={cn(
              "h-10 rounded-full px-5 text-sm transition-[background-color,color,border-color,transform]",
              "duration-[var(--duration-standard)] ease-[var(--ease-out-soft)]",
              "border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2",
              active
                ? "border-[var(--color-graphite)] bg-[var(--color-graphite)] text-white"
                : "border-[var(--color-neutral-200)] bg-[var(--color-surface-warm)] text-[var(--color-neutral-700)] hover:border-[var(--color-neutral-300)] hover:bg-white",
            )}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
