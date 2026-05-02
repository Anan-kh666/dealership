"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SORT_LABELS, type StockSort } from "@/lib/stock/filter";

const OPTIONS: StockSort[] = ["newest", "price-asc", "price-desc", "days-on-lot"];

export function SortDropdown(): React.ReactElement {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const current = (params.get("sort") as StockSort) || "newest";

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const next = new URLSearchParams(params.toString());
    if (e.target.value === "newest") next.delete("sort");
    else next.set("sort", e.target.value);
    next.delete("page");
    const qs = next.toString();
    startTransition(() => {
      router.push(qs ? `/stock?${qs}` : "/stock", { scroll: false });
    });
  };

  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="text-[var(--color-neutral-500)]">Sort</span>
      <select
        value={current}
        onChange={onChange}
        className="rounded-[var(--radius-sm)] border border-[var(--color-neutral-200)] bg-white px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
      >
        {OPTIONS.map((o) => (
          <option key={o} value={o}>
            {SORT_LABELS[o]}
          </option>
        ))}
      </select>
    </label>
  );
}
