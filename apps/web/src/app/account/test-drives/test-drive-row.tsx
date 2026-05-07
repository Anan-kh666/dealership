"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cancelTestDriveAction } from "@/server/actions/account-actions";

export function TestDriveRow({
  id,
  modelLabel,
  scheduledAt,
  status,
  modelSlug,
  isUpcoming,
}: {
  id: string;
  modelLabel: string;
  scheduledAt: string;
  status: string;
  modelSlug: string | null;
  isUpcoming: boolean;
}): React.ReactElement {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const dt = new Date(scheduledAt);
  const dateStr = dt.toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const timeStr = dt.toLocaleTimeString("en-MY", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <li className="flex flex-col items-start justify-between gap-3 rounded-md border border-[var(--color-neutral-200)] bg-white p-4 sm:flex-row sm:items-center">
      <div>
        <p className="font-[family-name:var(--font-display)] text-xl tracking-[-0.02em] text-[var(--color-graphite)]">
          {modelLabel}
        </p>
        <p className="text-sm text-[var(--color-neutral-600)]">
          {dateStr} at {timeStr} · {status.toLowerCase()}
        </p>
      </div>
      {isUpcoming ? (
        <div className="flex gap-3 text-xs text-[var(--color-neutral-500)]">
          {modelSlug ? (
            <Link
              href={`/test-drive?slug=${encodeURIComponent(modelSlug)}`}
              className="underline-offset-2 hover:text-[var(--color-graphite)] hover:underline"
            >
              Reschedule
            </Link>
          ) : null}
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                await cancelTestDriveAction(id);
                router.refresh();
              })
            }
            className="underline-offset-2 hover:text-[var(--color-graphite)] hover:underline"
          >
            {pending ? "Cancelling…" : "Cancel"}
          </button>
        </div>
      ) : null}
    </li>
  );
}
