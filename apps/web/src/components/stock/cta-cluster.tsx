"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandButton } from "@dealership/ui/components/brand-button";
import { InquireDialog } from "./inquire-dialog";
import { StickyTopBar } from "./sticky-top-bar";
import { StickyMobileCta } from "./sticky-mobile-cta";

export interface CtaClusterProps {
  stockUnitId: string;
  stickyTitle: string;
  price: string;
  trimDisplayName: string;
  exteriorColorName: string;
}

/**
 * Owns inquire-dialog state and renders the three primary CTAs plus the
 * sticky top bar (desktop) and sticky bottom bar (mobile). All three
 * surfaces open the same dialog.
 */
export function CtaCluster({
  stockUnitId,
  stickyTitle,
  price,
  trimDisplayName,
  exteriorColorName,
}: CtaClusterProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const prefill = `I'd like to know more about the ${trimDisplayName} in ${exteriorColorName} available at your showroom.`;

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row">
        <BrandButton asChild variant="primary" size="lg">
          <Link href={`/test-drive?stockUnitId=${stockUnitId}`}>Test Drive</Link>
        </BrandButton>
        <BrandButton asChild variant="secondary" size="lg">
          <Link href={`/financing?stockUnitId=${stockUnitId}`}>Get Financing</Link>
        </BrandButton>
        <BrandButton
          type="button"
          variant="ghost-dark"
          size="lg"
          onClick={() => setOpen(true)}
        >
          Reserve / Inquire
        </BrandButton>
      </div>

      <StickyTopBar title={stickyTitle} price={price} onInquire={() => setOpen(true)} />
      <StickyMobileCta
        stockUnitId={stockUnitId}
        price={price}
        onInquire={() => setOpen(true)}
      />

      <InquireDialog
        open={open}
        onOpenChange={setOpen}
        stockUnitId={stockUnitId}
        prefillMessage={prefill}
      />
    </>
  );
}
