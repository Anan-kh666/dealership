"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BrandButton } from "@dealership/ui/components/brand-button";
import {
  claimBookingsAction,
  dismissClaimAction,
} from "@/server/actions/account-actions";

export function ClaimBanner({
  counts,
}: {
  counts: {
    testDrives: number;
    financeApplications: number;
    tradeIns: number;
    total: number;
  };
}): React.ReactElement | null {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [hidden, setHidden] = React.useState(false);
  if (hidden) return null;

  const parts: string[] = [];
  if (counts.testDrives > 0) parts.push(plural(counts.testDrives, "test drive"));
  if (counts.financeApplications > 0)
    parts.push(plural(counts.financeApplications, "financing application"));
  if (counts.tradeIns > 0) parts.push(plural(counts.tradeIns, "trade-in"));

  return (
    <div className="rounded-md border border-[var(--color-accent)]/40 bg-[var(--color-surface-warm)] p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-neutral-500)]">
        We found prior bookings
      </p>
      <p className="mt-2 text-[15px] text-[var(--color-graphite)]">
        We found {parts.join(" and ")} under this email. Link them to your
        account so you can manage them here.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <BrandButton
          size="md"
          variant="primary"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await claimBookingsAction();
              router.refresh();
            })
          }
        >
          {pending ? "Linking…" : "Link them"}
        </BrandButton>
        <BrandButton
          size="md"
          variant="ghost-dark"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await dismissClaimAction();
              setHidden(true);
              router.refresh();
            })
          }
        >
          Not now
        </BrandButton>
      </div>
    </div>
  );
}

function plural(n: number, noun: string): string {
  return `${n} ${noun}${n === 1 ? "" : "s"}`;
}
