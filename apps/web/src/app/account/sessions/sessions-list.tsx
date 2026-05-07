"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BrandButton } from "@dealership/ui/components/brand-button";
import {
  revokeSessionAction,
  revokeAllOtherSessionsAction,
} from "@/server/actions/account-actions";

interface SessionRow {
  id: string;
  deviceLabel: string;
  lastIp: string | null;
  lastSeenAt: string;
  createdAt: string;
  isCurrent: boolean;
}

export function SessionsList({
  sessions,
}: {
  sessions: SessionRow[];
}): React.ReactElement {
  const router = useRouter();
  const [pending, start] = React.useTransition();

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-3">
        {sessions.map((s) => {
          const lastSeen = new Date(s.lastSeenAt).toLocaleString("en-MY", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
          const created = new Date(s.createdAt).toLocaleDateString("en-MY", {
            day: "numeric",
            month: "short",
          });
          return (
            <li
              key={s.id}
              className="flex flex-col items-start justify-between gap-3 rounded-md border border-[var(--color-neutral-200)] bg-white p-4 sm:flex-row sm:items-center"
            >
              <div>
                <p className="font-[family-name:var(--font-display)] text-lg tracking-[-0.02em] text-[var(--color-graphite)]">
                  {s.deviceLabel}{" "}
                  {s.isCurrent ? (
                    <span className="ml-2 text-xs uppercase tracking-[0.2em] text-[var(--color-accent)]">
                      This device
                    </span>
                  ) : null}
                </p>
                <p className="text-sm text-[var(--color-neutral-600)]">
                  Last seen {lastSeen}
                  {s.lastIp ? ` · ${s.lastIp}` : ""} · created {created}
                </p>
              </div>
              {!s.isCurrent ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      await revokeSessionAction(s.id);
                      router.refresh();
                    })
                  }
                  className="text-xs text-[var(--color-neutral-500)] underline underline-offset-2 hover:text-[var(--color-graphite)]"
                >
                  Sign out
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
      <div>
        <BrandButton
          variant="ghost-dark"
          size="md"
          disabled={pending || sessions.filter((s) => !s.isCurrent).length === 0}
          onClick={() =>
            start(async () => {
              await revokeAllOtherSessionsAction();
              router.refresh();
            })
          }
        >
          {pending ? "Working…" : "Sign out everywhere except this device"}
        </BrandButton>
      </div>
    </div>
  );
}
