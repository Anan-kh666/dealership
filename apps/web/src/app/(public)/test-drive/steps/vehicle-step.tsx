"use client";

import * as React from "react";
import Image from "next/image";
import { Sparkles, Car, PackageCheck } from "lucide-react";
import { BrandButton } from "@dealership/ui/components/brand-button";
import { useTestDriveStore } from "@/stores/test-drive-store";
import { formatPrice } from "@/lib/format";
import type { ModelOption, StockOption } from "../test-drive-flow";

type Mode = "menu" | "model" | "stock";

export function VehicleStep({
  headingRef,
  models,
  stockUnits,
}: {
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  models: ModelOption[];
  stockUnits: StockOption[];
}): React.ReactElement {
  const [mode, setMode] = React.useState<Mode>("menu");
  const selectVehicle = useTestDriveStore((s) => s.selectVehicle);
  const setStep = useTestDriveStore((s) => s.setStep);

  function pickModel(m: ModelOption): void {
    selectVehicle({ kind: "model", modelId: m.id, label: m.name });
    setStep(2);
  }

  function pickStock(u: StockOption): void {
    selectVehicle({
      kind: "stockUnit",
      stockUnitId: u.id,
      modelId: u.modelId,
      label: u.modelName,
      trimLabel: u.trimName,
    });
    setStep(2);
  }

  function pickSurprise(): void {
    const featured = models.find((m) => m.isFeatured) ?? models[0];
    if (!featured) return;
    selectVehicle({
      kind: "model",
      modelId: featured.id,
      label: featured.name,
    });
    setStep(2);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="font-[family-name:var(--font-display)] tracking-[-0.02em] outline-none"
          style={{ fontSize: "clamp(28px, 4vw, 40px)", lineHeight: 1.1 }}
        >
          Which vehicle would you like to drive?
        </h2>
        <p className="text-[var(--color-neutral-600)]">
          Pick a model from the lineup, a specific in-stock car, or let us pick.
        </p>
      </div>

      {mode === "menu" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <ChooserCard
            icon={<Car className="h-6 w-6" aria-hidden />}
            title="Pick a model"
            blurb="Choose from our 2026 lineup."
            onClick={() => setMode("model")}
          />
          <ChooserCard
            icon={<PackageCheck className="h-6 w-6" aria-hidden />}
            title="Pick a specific in-stock unit"
            blurb="Drive the exact car you'd take home."
            onClick={() => setMode("stock")}
            disabled={stockUnits.length === 0}
            disabledHint="No in-stock units right now."
          />
          <ChooserCard
            icon={<Sparkles className="h-6 w-6" aria-hidden />}
            title="Surprise me"
            blurb="We'll pick a popular one for you."
            onClick={pickSurprise}
            disabled={models.length === 0}
          />
        </div>
      ) : null}

      {mode === "model" ? (
        <div className="flex flex-col gap-4">
          <BackToMenu onClick={() => setMode("menu")} />
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {models.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => pickModel(m)}
                  className="group flex w-full flex-col gap-3 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] bg-card text-left transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
                >
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-[var(--color-neutral-100)]">
                    <Image
                      src={m.heroImage}
                      alt={m.name}
                      fill
                      sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-[var(--duration-reveal)] group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="flex flex-col gap-1 px-4 pb-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-neutral-500)]">
                      {m.bodyType}
                    </p>
                    <p className="font-[family-name:var(--font-display)] text-xl tracking-[-0.02em]">
                      {m.name}
                    </p>
                    <p className="text-sm text-[var(--color-neutral-600)] tabular-nums">
                      From {formatPrice(m.startingPrice)}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {mode === "stock" ? (
        <div className="flex flex-col gap-4">
          <BackToMenu onClick={() => setMode("menu")} />
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stockUnits.map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={() => pickStock(u)}
                  className="group flex w-full flex-col gap-3 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] bg-card text-left transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--color-neutral-100)]">
                    {u.image ? (
                      <Image
                        src={u.image}
                        alt={`${u.modelName} ${u.trimName}`}
                        fill
                        sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-[var(--duration-reveal)] group-hover:scale-[1.03]"
                      />
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-1 px-4 pb-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-neutral-500)]">
                      In stock
                    </p>
                    <p className="font-[family-name:var(--font-display)] text-lg tracking-[-0.02em]">
                      {u.modelName} {u.trimName}
                    </p>
                    <p className="text-sm text-[var(--color-neutral-600)] tabular-nums">
                      {formatPrice(u.totalPrice)}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function ChooserCard({
  icon,
  title,
  blurb,
  onClick,
  disabled,
  disabledHint,
}: {
  icon: React.ReactNode;
  title: string;
  blurb: string;
  onClick: () => void;
  disabled?: boolean;
  disabledHint?: string;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group flex h-full flex-col items-start gap-4 rounded-[var(--radius-lg)] border border-[var(--color-neutral-200)] bg-card p-6 text-left transition hover:-translate-y-0.5 hover:border-[var(--color-accent)] hover:shadow-[var(--shadow-2)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
    >
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface-warm)] text-[var(--color-accent-deep)] group-hover:bg-[var(--color-accent)]/10">
        {icon}
      </span>
      <div className="flex flex-col gap-1">
        <p className="font-[family-name:var(--font-display)] text-xl tracking-[-0.02em]">
          {title}
        </p>
        <p className="text-sm text-[var(--color-neutral-600)]">{blurb}</p>
        {disabled && disabledHint ? (
          <p className="pt-1 text-xs text-[var(--color-neutral-500)]">{disabledHint}</p>
        ) : null}
      </div>
    </button>
  );
}

function BackToMenu({ onClick }: { onClick: () => void }): React.ReactElement {
  return (
    <BrandButton variant="ghost-dark" size="sm" onClick={onClick}>
      ← Back to options
    </BrandButton>
  );
}
