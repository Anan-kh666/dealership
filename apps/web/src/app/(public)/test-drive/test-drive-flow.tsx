"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { useTestDriveStore, type SelectedVehicle } from "@/stores/test-drive-store";
import { VehicleStep } from "./steps/vehicle-step";
import { DateTimeStep } from "./steps/datetime-step";
import { DetailsStep } from "./steps/details-step";
import { ConfirmationStep } from "./steps/confirmation-step";
import { SuccessState } from "./steps/success-state";
import { HeaderCard } from "./header-card";
import { ProgressDots } from "./progress-dots";

export type ModelOption = {
  id: string;
  slug: string;
  name: string;
  bodyType: string;
  heroImage: string;
  startingPrice: string;
  isFeatured: boolean;
};

export type StockOption = {
  id: string;
  slug: string;
  modelId: string;
  modelName: string;
  trimName: string;
  totalPrice: string;
  image: string | null;
};

export type PrefilledVehicle =
  | { kind: "model"; modelId: string; label: string }
  | {
      kind: "stockUnit";
      stockUnitId: string;
      modelId: string;
      label: string;
      trimLabel: string;
    };

export interface TestDriveFlowProps {
  prefill: PrefilledVehicle | null;
  models: ModelOption[];
  stockUnits: StockOption[];
  /** Pre-built spec summary from the configurator's `&config=` param. */
  configNotes?: string | null;
}

export interface SuccessPayload {
  id: string;
  reference: string;
  scheduledAt: string;
  vehicleLabel: string;
  guestName: string;
  guestEmail: string;
}

export function TestDriveFlow({
  prefill,
  models,
  stockUnits,
  configNotes,
}: TestDriveFlowProps): React.ReactElement {
  const step = useTestDriveStore((s) => s.step);
  const vehicle = useTestDriveStore((s) => s.vehicle);
  const setStep = useTestDriveStore((s) => s.setStep);
  const selectVehicle = useTestDriveStore((s) => s.selectVehicle);
  const clearVehicle = useTestDriveStore((s) => s.clearVehicle);
  const hasHydrated = useTestDriveStore((s) => s.hasHydrated);
  const detailsNotes = useTestDriveStore((s) => s.details.notes);
  const setDetails = useTestDriveStore((s) => s.setDetails);

  // Apply configurator-derived spec summary to the notes field once on
  // hydration, but only if the user hasn't already typed something.
  const configAppliedRef = useRef(false);
  useEffect(() => {
    if (!hasHydrated || configAppliedRef.current) return;
    if (!configNotes) {
      configAppliedRef.current = true;
      return;
    }
    if (!detailsNotes || detailsNotes.trim().length === 0) {
      setDetails({ notes: configNotes });
    }
    configAppliedRef.current = true;
  }, [hasHydrated, configNotes, detailsNotes, setDetails]);

  const [success, setSuccess] = React.useState<SuccessPayload | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  // Apply prefill once after hydration if there's no existing vehicle.
  useEffect(() => {
    if (!hasHydrated) return;
    if (success) return;
    if (prefill && !vehicle) {
      const v: SelectedVehicle =
        prefill.kind === "stockUnit"
          ? {
              kind: "stockUnit",
              stockUnitId: prefill.stockUnitId,
              modelId: prefill.modelId,
              label: prefill.label,
              trimLabel: prefill.trimLabel,
            }
          : { kind: "model", modelId: prefill.modelId, label: prefill.label };
      selectVehicle(v);
      setStep(2);
    }
  }, [hasHydrated, prefill, vehicle, success, selectVehicle, setStep]);

  // Move focus to the step heading on step change for accessibility.
  useEffect(() => {
    if (success) return;
    if (headingRef.current) {
      headingRef.current.focus();
    }
  }, [step, success]);

  if (!hasHydrated) {
    return (
      <div className="min-h-[480px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-neutral-100)]" />
    );
  }

  if (success) {
    return <SuccessState payload={success} />;
  }

  const stepIndex = step === 1 ? 1 : step === 2 ? 2 : step === 3 ? 3 : 4;

  return (
    <div className="flex flex-col gap-6">
      <ProgressDots current={stepIndex} />
      {vehicle && step !== 1 ? (
        <HeaderCard
          vehicle={vehicle}
          onChange={() => clearVehicle()}
        />
      ) : null}
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-neutral-200)] bg-card p-6 shadow-[var(--shadow-1)] md:p-10">
        {step === 1 ? (
          <VehicleStep
            headingRef={headingRef}
            models={models}
            stockUnits={stockUnits}
          />
        ) : step === 2 ? (
          <DateTimeStep headingRef={headingRef} />
        ) : step === 3 ? (
          <DetailsStep headingRef={headingRef} />
        ) : (
          <ConfirmationStep
            headingRef={headingRef}
            onSuccess={(p) => setSuccess(p)}
          />
        )}
      </div>
    </div>
  );
}
