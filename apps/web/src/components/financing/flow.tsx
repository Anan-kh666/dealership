"use client";

import { useEffect } from "react";
import { FinancingProgress } from "./progress";
import { StepVehicle } from "./step-vehicle";
import { StepLoan } from "./step-loan";
import { StepPersonal } from "./step-personal";
import { StepEmployment } from "./step-employment";
import { StepDocuments } from "./step-documents";
import { StepReview } from "./step-review";
import { FinancingSuccess } from "./success";
import {
  useFinancingStore,
  type FinancingStep,
} from "@/stores/financingStore";

interface PreselectedVehicle {
  id: string;
  label: string;
  price: number;
}

export function FinancingFlow({
  preselected,
}: {
  preselected: PreselectedVehicle | null;
}): React.ReactElement {
  const step = useFinancingStore((s) => s.step);
  const setStep = useFinancingStore((s) => s.setStep);
  const submitted = useFinancingStore((s) => s.submitted);
  const hasHydrated = useFinancingStore((s) => s.hasHydrated);
  const patch = useFinancingStore((s) => s.patch);

  // When the page receives ?vehicleId=... and we resolve it server-side, sync
  // the store on hydrate. Only overwrite if the stored stockUnitId doesn't
  // match — preserves any in-progress edits the user already made.
  useEffect(() => {
    if (!hasHydrated || !preselected) return;
    const current = useFinancingStore.getState();
    if (current.stockUnitId !== preselected.id) {
      patch({
        stockUnitId: preselected.id,
        vehicleLabel: preselected.label,
        vehiclePrice: preselected.price,
      });
    }
  }, [hasHydrated, preselected, patch]);

  if (!hasHydrated) {
    return (
      <div
        aria-hidden
        className="min-h-[480px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-neutral-100)]"
      />
    );
  }

  if (submitted) {
    return <FinancingSuccess reference={submitted.reference} />;
  }

  const goTo = (s: FinancingStep): void => setStep(s);
  const next = (): void =>
    setStep(Math.min(6, step + 1) as FinancingStep);
  const back = (): void =>
    setStep(Math.max(1, step - 1) as FinancingStep);

  return (
    <div>
      <div className="mb-8">
        <FinancingProgress current={step} onJump={goTo} />
      </div>
      {step === 1 && (
        <StepVehicle preselected={preselected} onNext={next} />
      )}
      {step === 2 && <StepLoan onNext={next} onBack={back} />}
      {step === 3 && <StepPersonal onNext={next} onBack={back} />}
      {step === 4 && <StepEmployment onNext={next} onBack={back} />}
      {step === 5 && <StepDocuments onNext={next} onBack={back} />}
      {step === 6 && <StepReview onBack={back} onJump={goTo} />}
    </div>
  );
}
