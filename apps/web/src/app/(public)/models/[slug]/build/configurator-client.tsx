"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useConfiguratorStore } from "@/stores/configurator-store";
import { parseConfig, buildQueryString } from "./lib/url-sync";
import { computeTotal, formatRM } from "./lib/pricing";
import { TotalBar } from "./components/total-bar";
import { StepIndicator } from "./components/step-indicator";
import { TrimStep } from "./steps/trim-step";
import { ExteriorStep } from "./steps/exterior-step";
import { InteriorStep } from "./steps/interior-step";
import { OptionsStep } from "./steps/options-step";
import { SummaryStep } from "./steps/summary-step";

export interface ConfiguratorColor {
  id: string;
  name: string;
  hexCode: string;
  isMetallic: boolean;
  upcharge: string;
}

export interface ConfiguratorOption {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: string;
  image: string | null;
}

export interface ConfiguratorTrim {
  id: string;
  name: string;
  price: string;
  displayOrder: number;
  wheelStyle: "standard" | "sport";
  features: string[];
  seats: number;
  doors: number;
  horsepower: number | null;
  drivetrain: string;
  fuelType: string;
  transmission: string;
  exteriorColors: ConfiguratorColor[];
  interiorColors: ConfiguratorColor[];
  standardFeatures: { id: string; name: string }[];
  options: ConfiguratorOption[];
}

export interface ConfiguratorModel {
  id: string;
  slug: string;
  name: string;
  year: number;
  heroImage: string;
  currency: string;
  trims: ConfiguratorTrim[];
}

const PreviewCanvas = dynamic(() => import("./components/preview-canvas"), {
  ssr: false,
  loading: () => <PreviewFallback />,
});

export type StepKind =
  | "trim"
  | "exterior"
  | "interior"
  | "options"
  | "summary";

interface StepDef {
  kind: StepKind;
  label: string;
  /** True if the step has only one valid choice — auto-selected and skipped. */
  autoOnly: boolean;
}

export function ConfiguratorClient({
  model,
}: {
  model: ConfiguratorModel;
}): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const trimId = useConfiguratorStore((s) => s.trimId);
  const exteriorColorId = useConfiguratorStore((s) => s.exteriorColorId);
  const interiorColorId = useConfiguratorStore((s) => s.interiorColorId);
  const optionIds = useConfiguratorStore((s) => s.optionIds);
  const step = useConfiguratorStore((s) => s.step);
  const hasHydrated = useConfiguratorStore((s) => s.hasHydrated);
  const hydrate = useConfiguratorStore((s) => s.hydrate);
  const setTrim = useConfiguratorStore((s) => s.setTrim);
  const setExterior = useConfiguratorStore((s) => s.setExterior);
  const setInterior = useConfiguratorStore((s) => s.setInterior);
  const setOptions = useConfiguratorStore((s) => s.setOptions);
  const setStep = useConfiguratorStore((s) => s.setStep);

  // ---- Initial hydrate from URL (once) ----------------------------------
  const hasHydratedRef = React.useRef(false);
  React.useEffect(() => {
    if (hasHydratedRef.current) return;
    hasHydratedRef.current = true;
    const params = parseConfig(searchParams);
    const initial = resolveSelection(model, {
      trim: params.trim ?? null,
      exterior: params.exterior ?? null,
      interior: params.interior ?? null,
      options: params.options ?? [],
    });
    hydrate(initial);
    // We intentionally only run this once on mount — URL is the source of
    // truth on initial load; subsequent updates flow store → URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Resolve current trim (and its valid colours/options) -------------
  const trim: ConfiguratorTrim =
    model.trims.find((t) => t.id === trimId) ?? model.trims[0]!;

  // Reconcile: if URL/store carries IDs that aren't valid for the resolved
  // trim, drop them (and keep the URL clean on the next sync).
  React.useEffect(() => {
    if (!hasHydrated) return;
    const validExt = trim.exteriorColors.some((c) => c.id === exteriorColorId);
    if (!validExt) {
      setExterior(trim.exteriorColors[0]?.id ?? null);
    }
    const validInt = trim.interiorColors.some((c) => c.id === interiorColorId);
    if (!validInt) {
      setInterior(trim.interiorColors[0]?.id ?? null);
    }
    const validOptionIds = new Set(trim.options.map((o) => o.id));
    const filtered = optionIds.filter((id) => validOptionIds.has(id));
    if (filtered.length !== optionIds.length) setOptions(filtered);
  }, [
    hasHydrated,
    trim,
    exteriorColorId,
    interiorColorId,
    optionIds,
    setExterior,
    setInterior,
    setOptions,
  ]);

  // ---- Sync store → URL (debounced) -------------------------------------
  React.useEffect(() => {
    if (!hasHydrated) return;
    const id = window.setTimeout(() => {
      const qs = buildQueryString({
        trim: trimId,
        exterior: exteriorColorId,
        interior: interiorColorId,
        options: optionIds,
      });
      router.replace(`${pathname}${qs}`, { scroll: false });
    }, 120);
    return () => window.clearTimeout(id);
  }, [
    hasHydrated,
    trimId,
    exteriorColorId,
    interiorColorId,
    optionIds,
    pathname,
    router,
  ]);

  // ---- Step list (schema-driven) ----------------------------------------
  const steps = React.useMemo<StepDef[]>(() => {
    const list: StepDef[] = [];
    list.push({
      kind: "trim",
      label: "Trim",
      autoOnly: model.trims.length <= 1,
    });
    list.push({
      kind: "exterior",
      label: "Exterior",
      autoOnly: trim.exteriorColors.length <= 1,
    });
    list.push({
      kind: "interior",
      label: "Interior",
      autoOnly: trim.interiorColors.length <= 1,
    });
    if (trim.options.length > 0) {
      list.push({ kind: "options", label: "Options", autoOnly: false });
    }
    list.push({ kind: "summary", label: "Summary", autoOnly: false });
    return list;
  }, [model.trims.length, trim.exteriorColors.length, trim.interiorColors.length, trim.options.length]);

  // Clamp current step to valid range when step list changes (e.g. a
  // re-trim shrinks the wizard).
  React.useEffect(() => {
    if (step < 1) setStep(1);
    if (step > steps.length) setStep(steps.length);
  }, [step, steps.length, setStep]);

  // Skip auto-only steps automatically on first mount.
  React.useEffect(() => {
    if (!hasHydrated) return;
    // Don't auto-skip if user is on summary; also don't move backwards.
    const currentIdx = step - 1;
    if (currentIdx < 0 || currentIdx >= steps.length) return;
    if (steps[currentIdx]!.autoOnly && currentIdx < steps.length - 1) {
      setStep(step + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated, steps]);

  // ---- Pricing ----------------------------------------------------------
  const total = computeTotal({
    trimPrice: trim.price,
    exteriorColorId,
    trimColors: trim.exteriorColors.map((c) => ({
      colorId: c.id,
      upcharge: c.upcharge,
    })),
    trimOptions: trim.options.map((o) => ({ id: o.id, price: o.price })),
    selectedOptionIds: optionIds,
  });
  const totalLabel = formatRM(total);

  // ---- Render -----------------------------------------------------------
  const currentStep = steps[step - 1];
  const isSummary = currentStep?.kind === "summary";
  const exteriorHex =
    trim.exteriorColors.find((c) => c.id === exteriorColorId)?.hexCode ?? "#1A1A1A";
  const interiorHex =
    trim.interiorColors.find((c) => c.id === interiorColorId)?.hexCode ?? "#1A1A1A";

  function goNext(): void {
    if (step < steps.length) setStep(step + 1);
  }
  function goBack(): void {
    if (step > 1) setStep(step - 1);
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-warm)] pb-32 pt-20 lg:pb-0">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 pt-6 lg:hidden">
        <BreadcrumbHeader model={model} />
      </div>

      {/* Mobile: stacked. Desktop: split halves. */}
      <div className="mx-auto flex max-w-[1400px] flex-col lg:flex-row lg:gap-8 lg:px-6 lg:pt-8">
        {/* Preview */}
        <div className="relative h-[42vh] w-full lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)] lg:w-1/2 lg:self-start">
          <div className="absolute inset-0 lg:rounded-[var(--radius-lg)] lg:overflow-hidden">
            {hasHydrated ? (
              <PreviewCanvas
                bodyHex={exteriorHex}
                interiorHex={interiorHex}
                wheelStyle={trim.wheelStyle}
              />
            ) : (
              <PreviewFallback heroImage={model.heroImage} />
            )}
          </div>
        </div>

        {/* Step content */}
        <div className="w-full lg:w-1/2">
          <div className="hidden px-2 pt-2 lg:block">
            <BreadcrumbHeader model={model} />
          </div>
          <div className="px-4 pb-32 pt-6 lg:px-2 lg:pb-12">
            <StepIndicator
              steps={steps}
              currentIndex={Math.max(0, Math.min(step - 1, steps.length - 1))}
              onJump={(i) => {
                // Allow jumping back, not forward.
                if (i + 1 <= step) setStep(i + 1);
              }}
            />

            <div className="mt-8">
              {!hasHydrated ? (
                <div className="h-64 animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-neutral-100)]" />
              ) : currentStep?.kind === "trim" ? (
                <TrimStep
                  trims={model.trims}
                  selectedTrimId={trim.id}
                  onSelect={(id) => {
                    setTrim(id);
                  }}
                  onContinue={goNext}
                />
              ) : currentStep?.kind === "exterior" ? (
                <ExteriorStep
                  colors={trim.exteriorColors}
                  selectedId={exteriorColorId}
                  onSelect={(id) => setExterior(id)}
                  onContinue={goNext}
                  onBack={goBack}
                />
              ) : currentStep?.kind === "interior" ? (
                <InteriorStep
                  colors={trim.interiorColors}
                  selectedId={interiorColorId}
                  onSelect={(id) => setInterior(id)}
                  onContinue={goNext}
                  onBack={goBack}
                />
              ) : currentStep?.kind === "options" ? (
                <OptionsStep
                  options={trim.options}
                  selectedIds={optionIds}
                  onToggle={(id) => {
                    const next = optionIds.includes(id)
                      ? optionIds.filter((x) => x !== id)
                      : [...optionIds, id];
                    setOptions(next);
                  }}
                  onContinue={goNext}
                  onBack={goBack}
                />
              ) : currentStep?.kind === "summary" ? (
                <SummaryStep
                  model={model}
                  trim={trim}
                  exteriorColorId={exteriorColorId}
                  interiorColorId={interiorColorId}
                  optionIds={optionIds}
                  totalLabel={totalLabel}
                  total={total}
                  onBack={goBack}
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky total bar — mobile only (desktop has it inline on summary, plus it's visible on every page anyway) */}
      <TotalBar
        total={totalLabel}
        showContinue={!isSummary && hasHydrated}
        showBack={step > 1 && hasHydrated}
        onContinue={goNext}
        onBack={goBack}
      />
    </div>
  );
}

function PreviewFallback({ heroImage }: { heroImage?: string } = {}): React.ReactElement {
  return (
    <div className="relative h-full w-full bg-gradient-to-br from-[var(--color-surface-warm)] via-[#EFEAE0] to-[var(--color-neutral-200)]">
      {heroImage ? (
        <Image
          src={heroImage}
          alt=""
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover opacity-50"
          priority={false}
        />
      ) : null}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs uppercase tracking-[0.24em] text-[var(--color-neutral-500)]">
          Loading preview
        </span>
      </div>
    </div>
  );
}

function BreadcrumbHeader({
  model,
}: {
  model: ConfiguratorModel;
}): React.ReactElement {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-neutral-500)]">
        Configure
      </p>
      <div className="flex items-baseline gap-3">
        <h1
          className="font-[family-name:var(--font-display)] tracking-[-0.02em]"
          style={{ fontSize: "clamp(28px, 4vw, 40px)", lineHeight: 1.05 }}
        >
          Build your {model.name}
        </h1>
        <Link
          href={`/models/${model.slug}`}
          className="text-sm text-[var(--color-neutral-600)] underline-offset-4 hover:underline"
        >
          Back to overview
        </Link>
      </div>
    </div>
  );
}

interface ResolveInput {
  trim: string | null;
  exterior: string | null;
  interior: string | null;
  options: string[];
}

interface ResolvedSelection {
  trimId: string;
  exteriorColorId: string | null;
  interiorColorId: string | null;
  optionIds: string[];
}

function resolveSelection(
  model: ConfiguratorModel,
  input: ResolveInput,
): ResolvedSelection {
  const trim =
    model.trims.find((t) => t.id === input.trim) ?? model.trims[0]!;
  const exteriorColorId =
    trim.exteriorColors.find((c) => c.id === input.exterior)?.id ??
    trim.exteriorColors[0]?.id ??
    null;
  const interiorColorId =
    trim.interiorColors.find((c) => c.id === input.interior)?.id ??
    trim.interiorColors[0]?.id ??
    null;
  const validOptionIds = new Set(trim.options.map((o) => o.id));
  const optionIds = (input.options ?? []).filter((id) => validOptionIds.has(id));
  return {
    trimId: trim.id,
    exteriorColorId,
    interiorColorId,
    optionIds,
  };
}

