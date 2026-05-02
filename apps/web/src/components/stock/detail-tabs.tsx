"use client";

import { useState } from "react";
import { cn } from "@dealership/ui/lib/cn";
import { SpecRow } from "@dealership/ui/components/spec-row";

type TabKey = "overview" | "specs" | "included";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "specs", label: "Specifications" },
  { key: "included", label: "What's included" },
];

export interface DetailTabsProps {
  description: string;
  features: string[];
  installedOptions: string[];
  specs: { label: string; value: string }[];
  includedCopy: string;
}

export function DetailTabs({
  description,
  features,
  installedOptions,
  specs,
  includedCopy,
}: DetailTabsProps): React.ReactElement {
  const [tab, setTab] = useState<TabKey>("overview");

  return (
    <div className="flex flex-col gap-8">
      <div role="tablist" className="flex gap-2 border-b border-[var(--color-neutral-200)]">
        {TABS.map((t) => {
          const active = t.key === tab;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.key)}
              className={cn(
                "relative -mb-px px-4 py-3 text-sm transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2",
                active
                  ? "text-[var(--color-graphite)] border-b-2 border-[var(--color-accent)] font-medium"
                  : "text-[var(--color-neutral-500)] hover:text-[var(--color-graphite)]",
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "overview" ? (
        <div className="flex flex-col gap-6">
          <p className="max-w-3xl text-base text-[var(--color-neutral-700)] md:text-lg">
            {description}
          </p>
          {features.length > 0 || installedOptions.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-2">
              {features.length > 0 ? (
                <div className="flex flex-col gap-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-neutral-500)]">
                    Standard equipment
                  </p>
                  <ul className="flex flex-col gap-2 text-sm text-[var(--color-neutral-700)]">
                    {features.map((f) => (
                      <li key={f}>· {f}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {installedOptions.length > 0 ? (
                <div className="flex flex-col gap-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-neutral-500)]">
                    Installed options
                  </p>
                  <ul className="flex flex-col gap-2 text-sm text-[var(--color-neutral-700)]">
                    {installedOptions.map((f) => (
                      <li key={f}>· {f}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === "specs" ? (
        <div className="flex flex-col">
          {specs.map((s) => (
            <SpecRow key={s.label} label={s.label} value={s.value} />
          ))}
        </div>
      ) : null}

      {tab === "included" ? (
        <div className="prose max-w-3xl text-sm text-[var(--color-neutral-700)]">
          <p className="whitespace-pre-line">{includedCopy}</p>
        </div>
      ) : null}
    </div>
  );
}
