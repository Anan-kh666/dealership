"use client";

import * as React from "react";
import Link from "next/link";
import { BrandButton } from "@dealership/ui/components/brand-button";
import { SpecList } from "../components/spec-list";
import { NearMatches } from "../components/near-matches";
import { SaveBuildModal } from "../components/save-build-modal";
import { buildQueryString } from "../lib/url-sync";
import { findStockAction } from "../actions";
import type { MatchResult } from "../lib/stock-match";
import type {
  ConfiguratorModel,
  ConfiguratorTrim,
} from "../configurator-client";

interface SummaryStepProps {
  model: ConfiguratorModel;
  trim: ConfiguratorTrim;
  exteriorColorId: string | null;
  interiorColorId: string | null;
  optionIds: string[];
  totalLabel: string;
  total: number;
  onBack: () => void;
  isSignedIn: boolean;
}

export function SummaryStep({
  model,
  trim,
  exteriorColorId,
  interiorColorId,
  optionIds,
  totalLabel,
  total,
  onBack,
  isSignedIn,
}: SummaryStepProps): React.ReactElement {
  const exterior = trim.exteriorColors.find((c) => c.id === exteriorColorId);
  const interior = trim.interiorColors.find((c) => c.id === interiorColorId);
  const selectedOptions = trim.options.filter((o) => optionIds.includes(o.id));

  const items = [
    {
      label: "Trim",
      value: trim.name,
      delta: null as number | null,
    },
    ...(exterior
      ? [
          {
            label: "Exterior",
            value:
              exterior.name + (exterior.isMetallic ? " · Metallic" : ""),
            delta: Number.parseFloat(exterior.upcharge),
          },
        ]
      : []),
    ...(interior
      ? [
          {
            label: "Interior",
            value: interior.name,
            delta: Number.parseFloat(interior.upcharge),
          },
        ]
      : []),
    ...selectedOptions.map((o) => ({
      label: "Option",
      value: o.name,
      delta: Number.parseFloat(o.price),
    })),
  ];

  const [matchState, setMatchState] = React.useState<
    | { kind: "idle" }
    | { kind: "loading" }
    | { kind: "result"; result: MatchResult }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  const [shareToast, setShareToast] = React.useState<string | null>(null);
  const toastTimerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  function showToast(message: string): void {
    setShareToast(message);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setShareToast(null), 2400);
  }

  async function handleFindStock(): Promise<void> {
    if (!exteriorColorId || !interiorColorId) {
      setMatchState({
        kind: "error",
        message: "Pick a colour before searching stock.",
      });
      return;
    }
    setMatchState({ kind: "loading" });
    try {
      const result = await findStockAction({
        modelId: model.id,
        trimId: trim.id,
        exteriorColorId,
        interiorColorId,
        optionIds,
      });
      // If exact, the action redirects server-side; if we got here it's near-match.
      setMatchState({ kind: "result", result });
    } catch (err) {
      // redirect() throws an internal Next.js sentinel — let it bubble.
      if (
        err &&
        typeof err === "object" &&
        "digest" in err &&
        typeof (err as { digest?: string }).digest === "string" &&
        (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
      ) {
        throw err;
      }
      setMatchState({
        kind: "error",
        message: "Couldn't reach stock right now. Try again in a moment.",
      });
    }
  }

  async function handleShare(): Promise<void> {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function" &&
      // The Web Share API is mostly a mobile thing — gate on coarse pointer.
      window.matchMedia?.("(pointer: coarse)").matches
    ) {
      try {
        await navigator.share({
          title: `My ${model.name} build`,
          text: `Spec'd ${trim.name} · ${totalLabel}`,
          url,
        });
        return;
      } catch {
        // Fall through to clipboard.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link copied to clipboard.");
    } catch {
      showToast("Couldn't copy. Long-press the address bar to share.");
    }
  }

  const configQuery = buildQueryString({
    trim: trim.id,
    exterior: exteriorColorId,
    interior: interiorColorId,
    options: optionIds,
  }).slice(1);
  const testDriveHref = `/test-drive?slug=${encodeURIComponent(
    model.slug,
  )}&config=${encodeURIComponent(configQuery)}`;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-neutral-500)]">
          Your build
        </p>
        <h2
          className="font-[family-name:var(--font-display)] tracking-[-0.02em]"
          style={{ fontSize: "clamp(32px, 5vw, 44px)", lineHeight: 1.05 }}
        >
          {model.year} {model.name} {trim.name}
        </h2>
      </div>

      <SpecList items={items} total={total} />

      <div className="flex flex-col gap-3">
        <BrandButton
          variant="primary"
          size="lg"
          onClick={() => {
            void handleFindStock();
          }}
          disabled={matchState.kind === "loading"}
          type="button"
        >
          {matchState.kind === "loading" ? "Searching stock…" : "Find in stock"}
        </BrandButton>
        <BrandButton asChild variant="ghost-dark" size="lg">
          <Link href={testDriveHref}>Schedule test drive</Link>
        </BrandButton>
        <BrandButton
          variant="ghost-dark"
          size="md"
          onClick={() => {
            void handleShare();
          }}
          type="button"
        >
          Share build
        </BrandButton>
        {isSignedIn ? (
          <SaveBuildModal
            modelSlug={model.slug}
            trim={trim.id}
            exterior={exteriorColorId}
            interior={interiorColorId}
            options={optionIds}
            totalAtSave={total}
            defaultName={`${model.name} ${trim.name}`}
          />
        ) : (
          <BrandButton asChild variant="ghost-dark" size="md">
            <Link
              href={`/sign-in?callbackUrl=${encodeURIComponent(
                typeof window !== "undefined" ? window.location.pathname + window.location.search : `/models/${model.slug}/build`,
              )}`}
            >
              Sign in to save
            </Link>
          </BrandButton>
        )}
      </div>

      {matchState.kind === "error" ? (
        <p className="text-sm text-[var(--color-neutral-700)]">
          {matchState.message}
        </p>
      ) : null}

      {matchState.kind === "result" && matchState.result.empty ? (
        <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--color-neutral-200)] bg-white p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-neutral-500)]">
            Nothing in stock yet
          </p>
          <p className="text-[15px] text-[var(--color-neutral-700)]">
            We don&rsquo;t have a {model.name} on the lot at the moment, but we
            can source one to your spec. A test drive is the quickest next step.
          </p>
          <BrandButton asChild variant="primary" size="md">
            <Link href={testDriveHref}>Schedule test drive</Link>
          </BrandButton>
        </div>
      ) : null}

      {matchState.kind === "result" &&
      !matchState.result.empty &&
      matchState.result.near.length > 0 ? (
        <NearMatches matches={matchState.result.near} modelSlug={model.slug} />
      ) : null}

      <div className="pt-4">
        <BrandButton variant="ghost-dark" size="md" onClick={onBack}>
          Back
        </BrandButton>
      </div>

      {shareToast ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[var(--color-graphite)] px-5 py-2 text-sm text-white shadow-lg lg:bottom-10"
        >
          {shareToast}
        </div>
      ) : null}
    </div>
  );
}
