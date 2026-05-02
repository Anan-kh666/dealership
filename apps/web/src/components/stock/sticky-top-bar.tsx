"use client";

import { useEffect, useState } from "react";
import { cn } from "@dealership/ui/lib/cn";
import { BrandButton } from "@dealership/ui/components/brand-button";

export interface StickyTopBarProps {
  title: string;
  price: string;
  onInquire: () => void;
}

export function StickyTopBar({
  title,
  price,
  onInquire,
}: StickyTopBarProps): React.ReactElement {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const onScroll = (): void => setShown(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-hidden={!shown}
      className={cn(
        "fixed inset-x-0 top-0 z-40 hidden border-b border-[var(--color-neutral-200)] bg-white/95 shadow-[var(--shadow-1)] backdrop-blur transition-transform duration-[var(--duration-standard)] ease-[var(--ease-out-soft)] md:block",
        shown ? "translate-y-0" : "-translate-y-full",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between gap-6 px-4 md:px-6 lg:px-12">
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-[0.16em] text-[var(--color-neutral-500)]">
            {title}
          </span>
          <span className="font-[family-name:var(--font-display)] text-base tracking-[-0.02em] tabular-nums">
            {price}
          </span>
        </div>
        <BrandButton type="button" variant="primary" size="md" onClick={onInquire}>
          Reserve / Inquire
        </BrandButton>
      </div>
    </div>
  );
}
