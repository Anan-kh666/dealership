"use client";

import { useEffect } from "react";
import Link from "next/link";
import { BrandButton } from "@dealership/ui/components/brand-button";
import { Container } from "@dealership/ui/components/container";

/** Shared body for the route-level error boundaries. */
export function ErrorPanel({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <section className="bg-[var(--color-surface-warm)] pb-24 pt-40 md:pb-32 md:pt-48">
      <Container>
        <div className="flex max-w-2xl flex-col items-start gap-5">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-neutral-500)]">
            Something went wrong
          </p>
          <h1
            className="font-[family-name:var(--font-display)] tracking-[-0.02em]"
            style={{ fontSize: "clamp(36px, 6vw, 60px)", lineHeight: 1.05 }}
          >
            We hit a pothole.
          </h1>
          <p className="max-w-lg text-base text-[var(--color-neutral-600)] md:text-lg">
            An unexpected error stopped this page from loading. Please try again — if it keeps
            happening, our team would like to hear about it.
          </p>
          {error.digest ? (
            <p className="font-mono text-xs text-[var(--color-neutral-500)]">
              Reference: {error.digest}
            </p>
          ) : null}
          <div className="flex flex-col gap-3 pt-4 sm:flex-row">
            <BrandButton variant="primary" size="lg" onClick={reset}>
              Try again
            </BrandButton>
            <BrandButton asChild variant="ghost-dark" size="lg">
              <Link href="/">Back to home</Link>
            </BrandButton>
          </div>
        </div>
      </Container>
    </section>
  );
}
