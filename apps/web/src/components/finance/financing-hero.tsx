"use client";

import Link from "next/link";
import { BrandButton } from "@dealership/ui/components/brand-button";

export function FinancingHero(): React.ReactElement {
  const onCalculate = (): void => {
    if (typeof window === "undefined") return;
    const target = document.getElementById("calculator");
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="grid gap-10 md:grid-cols-[3fr_2fr] md:items-end">
      <div className="flex flex-col gap-6">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-neutral-500)]">
          Financing
        </p>
        <h1
          className="font-[family-name:var(--font-display)] tracking-[-0.02em] text-[var(--color-graphite)]"
          style={{ fontSize: "clamp(40px, 6vw, 64px)", lineHeight: 1.05 }}
        >
          Drive home with confidence.
        </h1>
        <p className="max-w-xl text-base leading-relaxed text-[var(--color-neutral-700)] md:text-lg">
          Flexible hire-purchase financing through Malaysia&rsquo;s leading
          banks. Adjust your tenure and down payment, see your monthly payment
          in real time, and apply in minutes.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <BrandButton type="button" size="lg" onClick={onCalculate}>
            Calculate your payment
          </BrandButton>
          <BrandButton asChild variant="ghost-dark" size="lg">
            <Link href="/financing/apply">Apply now</Link>
          </BrandButton>
        </div>
      </div>
      <div className="hidden md:block">
        <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-neutral-500)]">
          Indicative rates from
        </p>
        <p
          className="mt-2 font-[family-name:var(--font-display)] tracking-[-0.02em] text-[var(--color-graphite)]"
          style={{ fontSize: "72px", lineHeight: 1 }}
        >
          2.5%
        </p>
        <p className="mt-1 max-w-xs text-sm text-[var(--color-neutral-600)]">
          Subject to bank approval and credit assessment.
        </p>
      </div>
    </div>
  );
}
