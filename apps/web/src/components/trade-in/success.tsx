"use client";

import Link from "next/link";
import { BrandButton } from "@dealership/ui/components/brand-button";
import { useTradeInStore } from "@/stores/tradeInStore";

const WHATSAPP_URL = "https://wa.me/60378012345";

export function Success({
  reference,
  hadConfigurationId,
}: {
  reference: string;
  hadConfigurationId: boolean;
}): React.ReactElement {
  const reset = useTradeInStore((s) => s.reset);
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-accent)]">
        Reference {reference}
      </p>
      <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(40px,5vw,56px)] leading-[1.05] tracking-[-0.02em] text-[var(--color-graphite)]">
        Submitted.
      </h2>
      <p className="mt-4 text-[var(--color-neutral-700)]">
        Our team will review your submission and email you a quote within 24
        hours during business days.
      </p>

      {hadConfigurationId && (
        <p className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] bg-white p-4 text-sm text-[var(--color-neutral-700)]">
          Once we send your quote, we&rsquo;ll email you a link with the
          trade-in value applied to your saved build.
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        {hadConfigurationId ? (
          <BrandButton asChild size="lg">
            <Link href="/build">Continue your build</Link>
          </BrandButton>
        ) : (
          <BrandButton asChild size="lg">
            <Link href="/models">Browse new cars</Link>
          </BrandButton>
        )}
        <BrandButton asChild size="lg" variant="ghost-dark">
          <Link href="/account/trade-ins">Track this submission</Link>
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
        Start a new trade-in
      </button>
    </div>
  );
}
