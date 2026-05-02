"use client";

import Link from "next/link";
import { BrandButton } from "@dealership/ui/components/brand-button";

export function StickyMobileCta({
  stockUnitId,
  price,
  onInquire,
}: {
  stockUnitId: string;
  price: string;
  onInquire: () => void;
}): React.ReactElement {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-neutral-200)] bg-white shadow-[var(--shadow-3)] md:hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-neutral-500)]">
            From
          </span>
          <span className="font-[family-name:var(--font-display)] text-sm tabular-nums">
            {price}
          </span>
        </div>
        <BrandButton asChild variant="primary" size="sm" className="flex-1">
          <Link href={`/test-drive?stockUnitId=${stockUnitId}`}>Test Drive</Link>
        </BrandButton>
        <BrandButton type="button" variant="ghost-dark" size="sm" onClick={onInquire}>
          Inquire
        </BrandButton>
      </div>
    </div>
  );
}
