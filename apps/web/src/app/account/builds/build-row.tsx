"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteBuildAction } from "@/server/actions/account-actions";

export function BuildRow({
  id,
  name,
  modelSlug,
  trim,
  total,
  createdAt,
  reloadHref,
}: {
  id: string;
  name: string;
  modelSlug: string;
  trim: string;
  total: string;
  createdAt: string;
  reloadHref: string;
}): React.ReactElement {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const date = new Date(createdAt).toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return (
    <li className="flex flex-col items-start justify-between gap-3 rounded-md border border-[var(--color-neutral-200)] bg-white p-4 sm:flex-row sm:items-center">
      <div>
        <Link
          href={reloadHref}
          className="font-[family-name:var(--font-display)] text-xl tracking-[-0.02em] text-[var(--color-graphite)] hover:text-[var(--color-accent)]"
        >
          {name}
        </Link>
        <p className="text-sm text-[var(--color-neutral-600)]">
          {modelSlug} · {trim} · saved {date}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <p className="text-sm text-[var(--color-graphite)]">{total}</p>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              await deleteBuildAction(id);
              router.refresh();
            })
          }
          className="text-xs text-[var(--color-neutral-500)] underline-offset-2 hover:text-[var(--color-graphite)] hover:underline"
        >
          {pending ? "Deleting…" : "Delete"}
        </button>
      </div>
    </li>
  );
}
