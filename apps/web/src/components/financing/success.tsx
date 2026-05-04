"use client";

import Link from "next/link";
import { BrandButton } from "@dealership/ui/components/brand-button";
import { useFinancingStore } from "@/stores/financingStore";

const WHATSAPP_URL = "https://wa.me/60378012345";

export function FinancingSuccess({
  reference,
}: {
  reference: string;
}): React.ReactElement {
  const reset = useFinancingStore((s) => s.reset);
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-accent)]">
        Reference {reference}
      </p>
      <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(40px,5vw,56px)] leading-[1.05] tracking-[-0.02em] text-[var(--color-graphite)]">
        Application received.
      </h2>
      <p className="mt-4 text-[var(--color-neutral-700)]">
        A financing specialist will review your details and reach out within
        1–2 business days. We&rsquo;ve emailed you a confirmation; quote
        reference {reference} when you follow up.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <BrandButton asChild size="lg">
          <Link href="/stock">Continue browsing stock</Link>
        </BrandButton>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium text-[var(--color-accent)] hover:underline"
        >
          Or follow up on WhatsApp →
        </a>
      </div>

      <button
        type="button"
        onClick={reset}
        className="mt-10 text-xs text-[var(--color-neutral-500)] hover:underline"
      >
        Start a new application
      </button>
    </div>
  );
}
