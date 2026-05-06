"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { formatRM } from "../lib/pricing";
import type { StockMatch } from "../lib/stock-match";

interface NearMatchesProps {
  matches: StockMatch[];
  modelSlug: string;
}

export function NearMatches({
  matches,
  modelSlug,
}: NearMatchesProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-neutral-500)]">
        Closest matches in stock
      </p>
      <ul className="flex flex-col gap-3">
        {matches.map((m) => (
          <li
            key={m.id}
            className="flex items-stretch gap-3 rounded-[var(--radius-lg)] border border-[var(--color-neutral-200)] bg-white p-3"
          >
            <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-neutral-100)]">
              {m.imageUrl ? (
                <Image
                  src={m.imageUrl}
                  alt={m.imageAlt ?? m.trimName}
                  fill
                  sizes="128px"
                  className="object-cover"
                />
              ) : null}
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
              <div className="flex flex-col gap-1">
                <Link
                  href={`/stock/${m.slug}`}
                  className="text-[15px] font-medium text-[var(--color-graphite)] hover:underline"
                >
                  {m.trimName} · {m.exteriorColor.name}
                </Link>
                {m.deltas.length > 0 ? (
                  <p className="text-xs text-[var(--color-neutral-600)]">
                    {m.deltas.join(" · ")}
                  </p>
                ) : (
                  <p className="text-xs text-[var(--color-accent)]">Exact spec</p>
                )}
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <span
                  className="font-[family-name:var(--font-display)] tracking-[-0.02em] tabular-nums"
                  style={{ fontSize: "16px" }}
                >
                  {formatRM(Number.parseFloat(m.totalPrice))}
                </span>
                <Link
                  href={`/stock/${m.slug}`}
                  className="text-xs uppercase tracking-[0.2em] text-[var(--color-graphite)] underline-offset-4 hover:underline"
                >
                  View →
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <Link
        href={`/stock?model=${modelSlug}`}
        className="text-xs uppercase tracking-[0.2em] text-[var(--color-graphite)] underline-offset-4 hover:underline"
      >
        View all stock for this model →
      </Link>
    </div>
  );
}
