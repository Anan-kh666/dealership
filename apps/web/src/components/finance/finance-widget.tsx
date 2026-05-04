"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import {
  FINANCING_DOWN_DEFAULT_PCT,
  FINANCING_DOWN_MAX_PCT,
  FINANCING_DOWN_MIN_PCT,
  FINANCING_DOWN_STEP_PCT,
  FINANCING_RATE_DEFAULT,
  FINANCING_RATE_MAX,
  FINANCING_RATE_MIN,
  FINANCING_RATE_STEP,
  FINANCING_TENURE_DEFAULT_YEARS,
  FINANCING_TENURE_YEARS,
  calculateMalaysianLoan,
  type FinancingTenureYears,
} from "@dealership/types";
import { BrandButton } from "@dealership/ui/components/brand-button";

const myr = new Intl.NumberFormat("en-MY", {
  maximumFractionDigits: 0,
});

function formatRm(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "RM 0";
  return `RM ${myr.format(Math.round(n))}`;
}

export interface FinanceWidgetProps {
  /** Pre-filled vehicle price. Required unless `editablePrice` is true. */
  vehiclePrice?: number;
  /** When true, render a price input. Used on the standalone /financing page. */
  editablePrice?: boolean;
  /** Pre-selects the vehicle when the user clicks "Apply for financing". */
  vehicleId?: string;
  /** Renders a slim card variant suitable for the stock detail page. */
  variant?: "card" | "standalone";
}

export function FinanceWidget({
  vehiclePrice,
  editablePrice = false,
  vehicleId,
  variant = "card",
}: FinanceWidgetProps): React.ReactElement {
  const fallbackPrice = vehiclePrice ?? 150_000;
  const [price, setPrice] = useState<number>(fallbackPrice);
  const [downPct, setDownPct] = useState<number>(FINANCING_DOWN_DEFAULT_PCT);
  const [tenure, setTenure] = useState<FinancingTenureYears>(
    FINANCING_TENURE_DEFAULT_YEARS,
  );
  const [rate, setRate] = useState<number>(FINANCING_RATE_DEFAULT);

  const result = useMemo(
    () =>
      calculateMalaysianLoan({
        vehiclePrice: editablePrice ? price : (vehiclePrice ?? price),
        downPaymentPercent: downPct,
        tenureYears: tenure,
        interestRatePercent: rate,
      }),
    [editablePrice, price, vehiclePrice, downPct, tenure, rate],
  );

  const downId = useId();
  const rateId = useId();
  const priceId = useId();

  const applyHref = vehicleId
    ? `/financing/apply?vehicleId=${encodeURIComponent(vehicleId)}`
    : "/financing/apply";

  const containerClasses =
    variant === "standalone"
      ? "rounded-[var(--radius-lg)] border border-[var(--color-neutral-200)] bg-white p-6 md:p-8"
      : "rounded-[var(--radius-lg)] border border-[var(--color-neutral-200)] bg-[var(--color-surface-warm)] p-6 md:p-8";

  return (
    <div className={containerClasses}>
      <div className="flex flex-col gap-1">
        <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-neutral-500)]">
          Financing calculator
        </p>
        <h3
          className="font-[family-name:var(--font-display)] tracking-[-0.02em] text-[var(--color-graphite)]"
          style={{ fontSize: "clamp(24px, 3vw, 32px)", lineHeight: 1.15 }}
        >
          Estimate your monthly payment
        </h3>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto] md:items-start md:gap-10">
        {/* Inputs */}
        <div className="flex flex-col gap-6">
          {editablePrice ? (
            <div>
              <label
                htmlFor={priceId}
                className="block text-sm font-medium text-[var(--color-graphite)]"
              >
                Vehicle price (RM)
              </label>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm text-[var(--color-neutral-600)]">
                  RM
                </span>
                <input
                  id={priceId}
                  type="number"
                  inputMode="numeric"
                  min={10_000}
                  max={5_000_000}
                  step={1000}
                  value={price}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    setPrice(Number.isFinite(n) && n > 0 ? n : 0);
                  }}
                  className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] bg-white px-3 text-sm tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                />
              </div>
            </div>
          ) : (
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-neutral-500)]">
                Vehicle price
              </p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-2xl tracking-[-0.02em] tabular-nums text-[var(--color-graphite)]">
                {formatRm(vehiclePrice ?? 0)}
              </p>
            </div>
          )}

          {/* Down payment slider */}
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
                  · {formatRm(result.downPaymentAmount)}
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
              onChange={(e) => setDownPct(Number(e.target.value))}
              className="mt-3 w-full accent-[var(--color-accent)]"
            />
            <div className="mt-1 flex justify-between text-[11px] uppercase tracking-[0.12em] text-[var(--color-neutral-500)]">
              <span>{FINANCING_DOWN_MIN_PCT}%</span>
              <span>{FINANCING_DOWN_MAX_PCT}%</span>
            </div>
          </div>

          {/* Tenure */}
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
                    onClick={() => setTenure(y)}
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

          {/* Interest rate */}
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
              onChange={(e) => setRate(Number(e.target.value))}
              className="mt-3 w-full accent-[var(--color-accent)]"
            />
            <div className="mt-1 flex justify-between text-[11px] uppercase tracking-[0.12em] text-[var(--color-neutral-500)]">
              <span>{FINANCING_RATE_MIN.toFixed(1)}%</span>
              <span>{FINANCING_RATE_MAX.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Output */}
        <div className="rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] bg-white p-6 md:min-w-[260px]">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-neutral-500)]">
            Estimated monthly
          </p>
          <p
            className="mt-1 font-[family-name:var(--font-display)] tracking-[-0.02em] tabular-nums text-[var(--color-graphite)]"
            style={{ fontSize: "clamp(36px, 5vw, 44px)", lineHeight: 1.05 }}
          >
            {formatRm(result.monthlyPayment)}
          </p>
          <dl className="mt-4 space-y-2 border-t border-[var(--color-neutral-200)] pt-4 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-[var(--color-neutral-600)]">Loan principal</dt>
              <dd className="tabular-nums text-[var(--color-graphite)]">
                {formatRm(result.principal)}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-[var(--color-neutral-600)]">Total interest</dt>
              <dd className="tabular-nums text-[var(--color-graphite)]">
                {formatRm(result.totalInterest)}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-[var(--color-neutral-600)]">Total payable</dt>
              <dd className="tabular-nums text-[var(--color-graphite)]">
                {formatRm(result.totalPayable + result.downPaymentAmount)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <p className="mt-6 text-xs leading-relaxed text-[var(--color-neutral-500)]">
        Indicative only. Final rates subject to bank approval and credit
        assessment.
      </p>

      <div className="mt-5">
        <BrandButton asChild size="md">
          <Link href={applyHref}>Apply for financing →</Link>
        </BrandButton>
      </div>
    </div>
  );
}
