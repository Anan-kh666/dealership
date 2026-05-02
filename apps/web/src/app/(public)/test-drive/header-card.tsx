"use client";

import type { SelectedVehicle } from "@/stores/test-drive-store";

export function HeaderCard({
  vehicle,
  onChange,
}: {
  vehicle: SelectedVehicle;
  onChange: () => void;
}): React.ReactElement {
  const trim = vehicle.trimLabel ? ` ${vehicle.trimLabel}` : "";
  return (
    <div className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] bg-[var(--color-surface-warm)] px-4 py-3 text-sm md:px-5">
      <p className="text-[var(--color-neutral-700)]">
        You&rsquo;re booking a test drive for:{" "}
        <span className="font-medium text-[var(--color-graphite)]">
          {vehicle.label}
          {trim}
        </span>
      </p>
      <button
        type="button"
        onClick={onChange}
        className="text-xs uppercase tracking-[0.16em] text-[var(--color-accent-deep)] underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
      >
        Change
      </button>
    </div>
  );
}
