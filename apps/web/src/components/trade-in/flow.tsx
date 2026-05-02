"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ProgressIndicator } from "./progress";
import { StepVehicle } from "./step-vehicle";
import { StepCondition } from "./step-condition";
import { StepPhotos } from "./step-photos";
import { StepContact } from "./step-contact";
import { StepReview } from "./step-review";
import { Success } from "./success";
import { useTradeInStore, type TradeInStep } from "@/stores/tradeInStore";

export function TradeInFlow(): React.ReactElement | null {
  const searchParams = useSearchParams();
  const setConfigurationId = useTradeInStore((s) => s.setConfigurationId);
  const step = useTradeInStore((s) => s.step);
  const setStep = useTradeInStore((s) => s.setStep);
  const submitted = useTradeInStore((s) => s.submitted);
  const configurationIdInStore = useTradeInStore((s) => s.configurationId);

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    const cfg = searchParams.get("configurationId");
    if (cfg && /^[a-z0-9]{20,32}$/i.test(cfg)) {
      setConfigurationId(cfg);
    }
  }, [searchParams, setConfigurationId]);

  if (!hydrated) {
    // Avoid SSR/CSR mismatch from sessionStorage-backed state.
    return <div className="min-h-[40vh]" aria-hidden />;
  }

  if (submitted) {
    return (
      <Success
        reference={submitted.reference}
        hadConfigurationId={Boolean(configurationIdInStore)}
      />
    );
  }

  const goTo = (s: TradeInStep): void => setStep(s);
  const next = (): void => setStep((Math.min(5, step + 1) as TradeInStep));
  const back = (): void => setStep((Math.max(1, step - 1) as TradeInStep));

  return (
    <div>
      <div className="mb-8">
        <ProgressIndicator current={step} onJump={goTo} />
      </div>
      {step === 1 && <StepVehicle onNext={next} />}
      {step === 2 && <StepCondition onNext={next} onBack={back} />}
      {step === 3 && <StepPhotos onNext={next} onBack={back} />}
      {step === 4 && <StepContact onNext={next} onBack={back} />}
      {step === 5 && <StepReview onBack={back} onJump={goTo} />}
    </div>
  );
}
