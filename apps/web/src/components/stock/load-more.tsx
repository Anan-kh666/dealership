"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandButton } from "@dealership/ui/components/brand-button";

export interface LoadMoreProps {
  nextPage: number;
  remaining: number;
}

export function LoadMore({ nextPage, remaining }: LoadMoreProps): React.ReactElement {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const onClick = (): void => {
    const next = new URLSearchParams(params.toString());
    next.set("page", String(nextPage));
    startTransition(() => {
      router.push(`/stock?${next.toString()}`, { scroll: false });
    });
  };

  return (
    <div className="flex flex-col items-center gap-2 pt-8">
      <BrandButton type="button" variant="ghost-dark" size="md" onClick={onClick} disabled={pending}>
        {pending ? "Loading…" : `Load ${remaining} more`}
      </BrandButton>
    </div>
  );
}
