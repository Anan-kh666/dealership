"use client";

import { useId, useMemo } from "react";
import {
  FINANCING_DOWN_MAX_PCT,
  FINANCING_DOWN_MIN_PCT,
  FINANCING_DOWN_STEP_PCT,
  FINANCING_RATE_MAX,
  FINANCING_RATE_MIN,
  FINANCING_RATE_STEP,
  FINANCING_TENURE_YEARS,
  calculateMalaysianLoan,
  type FinancingTenureYears,
} from "@dealership/types";
import { BrandButton } from "@dealership/ui/components/brand-button";
import { useFinancingStore } from "@/stores/financingStore";

const myr = new Intl.NumberFormat("en-MY", { maximumFractionDigits: 0 });
function rm(n: number): string {
  return `RM ${myr.format(Math.round(n))}`;
}

export function StepLoan({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}): React.ReactElement {
  const vehiclePrice = useFinancingStore((s) => s.vehiclePrice);
  const downPct = useFinancingStore((s) => s.downPaymentPercent);
  const tenure = useFinancingStore((s) => s.tenureYears);
  const rate = useFinancingStore((s) => s.interestRatePercent);
  const patch = useFinancingStore((s) => s.patch);

  const downId = useId();
  const rateId = useId();

  const result = useMemo(
    () =>
      calculateMalaysianLoan({
        vehiclePrice: vehiclePrice ?? 0,
        downPaymentPercent: downPct,
        tenureYears: tenure,
        interestRatePercent: rate,
      }),
    [vehiclePrice, downPct, tenure, rate],
  );

  return (
    <div>
      <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-[-0.02em] text-[var(--color-graphite)] md:text-4xl">
        Pick your loan terms
      </h2>
      <p className="mt-2 max-w-xl text-sm text-[var(--color-neutral-600)]">
        Indicative only — your actual rate is confirmed by the bank after
        credit assessment.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-[1fr_auto] md:items-start">
        <div className="flex flex-col gap-6">
          <div>
            <div className="flex items-baseline justify-between">
              <label
                htmlFor={downId}
                className="text-sm font-medium text-[var(--color-graphite)]"
              >
                Down payment
              </label>
              <span className="text-sm tabular-nums text-[var(--color-neutral-700)]">
                {downPct}%{" "}
                <span className="text-[var(--color-neutral-500)]">
                  · {rm(result.downPaymentAmount)}
                </span>
              </span>
            </div>
            <input
              id={downId}
              type="range"
              min={FINANCING_DOWN_MIN_PCT}
              max={FINANCING_DOWN_MAX_PCT}
              step={FINANCING_DOWN_STEP_PCT}
              value={downPct}
              onChange={(e) =>
                patch({ downPaymentPercent: Number(e.target.value) })
              }
              className="mt-3 w-full accent-[var(--color-accent)]"
            />
            <div className="mt-1 flex justify-between text-[11px] uppercase tracking-[0.12em] text-[var(--color-neutral-500)]">
              <span>{FINANCING_DOWN_MIN_PCT}%</span>
              <span>{FINANCING_DOWN_MAX_PCT}%</span>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-[var(--color-graphite)]">
              Loan tenure
            </p>
            <div className="mt-3 inline-flex flex-wrap gap-2">
              {FINANCING_TENURE_YEARS.map((y) => {
                const active = y === tenure;
                return (
                  <button
                    key={y}
                    type="button"
                    onClick={() =>
                      patch({ tenureYears: y as FinancingTenureYears })
                    }
                    aria-pressed={active}
                    className={`rounded-[var(--radius-md)] border px-4 py-2 text-sm transition-colors ${
                      active
                        ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-graphite)]"
                        : "border-[var(--color-neutral-200)] bg-white text-[var(--color-neutral-700)] hover:border-[var(--color-neutral-400)]"
                    }`}
                  >
                    {y} years
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <label
                htmlFor={rateId}
                className="text-sm font-medium text-[var(--color-graphite)]"
              >
                Indicative rate
              </label>
              <span className="text-sm tabular-nums text-[var(--color-neutral-700)]">
                {rate.toFixed(1)}%
              </span>
            </div>
            <input
              id={rateId}
              type="range"
              min={FINANCING_RATE_MIN}
              max={FINANCING_RATE_MAX}
              step={FINANCING_RATE_STEP}
              value={rate}
              onChange={(e) =>
                patch({ interestRatePercent: Number(e.target.value) })
              }
              className="mt-3 w-full accent-[var(--color-accent)]"
            />
            <div className="mt-1 flex justify-between text-[11px] uppercase tracking-[0.12em] text-[var(--color-neutral-500)]">
              <span>{FINANCING_RATE_MIN.toFixed(1)}%</span>
              <span>{FINANCING_RATE_MAX.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] bg-white p-6 md:min-w-[260px]">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-neutral-500)]">
            Estimated monthly
          </p>
          <p
            className="mt-1 font-[family-name:var(--font-display)] tracking-[-0.02em] tabular-nums text-[var(--color-graphite)]"
            style={{ fontSize: "clamp(34px, 5vw, 42px)", lineHeight: 1.05 }}
          >
            {rm(result.monthlyPayment)}
          </p>
          <dl className="mt-4 space-y-2 border-t border-[var(--color-neutral-200)] pt-4 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-[var(--color-neutral-600)]">Loan principal</dt>
              <dd className="tabular-nums">{rm(result.principal)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-[var(--color-neutral-600)]">Total interest</dt>
              <dd className="tabular-nums">{rm(result.totalInterest)}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="sticky bottom-0 -mx-4 mt-12 flex items-center justify-between border-t border-[var(--color-neutral-200)] bg-[var(--color-surface-warm)] px-4 py-4 md:static md:mx-0 md:border-0 md:px-0">
        <BrandButton type="button" variant="ghost-dark" onClick={onBack}>
          Back
        </BrandButton>
        <BrandButton type="button" size="lg" onClick={onNext}>
          Next
        </BrandButton>
      </div>
    </div>
  );
}
