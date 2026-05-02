"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@dealership/ui/lib/cn";
import { Slider } from "@dealership/ui/components/slider";
import { ColorSwatch } from "@dealership/ui/components/color-swatch";
import {
  monthlyPayment,
  priceForMonthly,
} from "@dealership/types";
import {
  DEFAULT_MONTHLY_MAX,
  DEFAULT_MONTHLY_MIN,
  DEFAULT_PRICE_MAX,
  DEFAULT_PRICE_MIN,
  PRICE_STEP,
} from "@/lib/stock/filter";

const STORAGE_KEY = "dealership.stock.filters";

export interface FacetCounts {
  models: { slug: string; name: string; count: number }[];
  trims: { name: string; count: number }[];
  bodyTypes: { value: string; label: string; count: number }[];
  fuelTypes: { value: string; label: string; count: number }[];
  colors: { slug: string; name: string; hex: string; count: number }[];
}

export interface FilterSidebarProps {
  facets: FacetCounts;
  totalAvailable: number;
}

function formatRM(n: number): string {
  return `RM ${n.toLocaleString("en-MY", { maximumFractionDigits: 0 })}`;
}

export function FilterSidebar({
  facets,
  totalAvailable,
}: FilterSidebarProps): React.ReactElement {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showRestoredToast, setShowRestoredToast] = useState(false);
  const restoreAttempted = useRef(false);

  const selectedModels = useMemo(() => params.getAll("model"), [params]);
  const selectedTrims = useMemo(() => params.getAll("trim"), [params]);
  const selectedBody = useMemo(() => params.getAll("bodyType"), [params]);
  const selectedFuel = useMemo(() => params.getAll("fuelType"), [params]);
  const selectedColors = useMemo(() => params.getAll("color"), [params]);
  const priceMin = Number.parseInt(params.get("priceMin") ?? "", 10);
  const priceMax = Number.parseInt(params.get("priceMax") ?? "", 10);

  // Local state for sliders so dragging stays smooth (URL push is debounced).
  const [priceRange, setPriceRange] = useState<[number, number]>(() => [
    Number.isFinite(priceMin) ? priceMin : DEFAULT_PRICE_MIN,
    Number.isFinite(priceMax) ? priceMax : DEFAULT_PRICE_MAX,
  ]);
  const [monthlyRange, setMonthlyRange] = useState<[number, number]>(() => {
    const baseMin = Number.isFinite(priceMin) ? priceMin : DEFAULT_PRICE_MIN;
    const baseMax = Number.isFinite(priceMax) ? priceMax : DEFAULT_PRICE_MAX;
    return [
      Math.max(DEFAULT_MONTHLY_MIN, Math.round(monthlyPayment({ totalPrice: baseMin }))),
      Math.min(DEFAULT_MONTHLY_MAX, Math.round(monthlyPayment({ totalPrice: baseMax }))),
    ];
  });

  // Sync priceRange ↔ URL when URL changes from outside (back/forward, restore toast click).
  useEffect(() => {
    setPriceRange([
      Number.isFinite(priceMin) ? priceMin : DEFAULT_PRICE_MIN,
      Number.isFinite(priceMax) ? priceMax : DEFAULT_PRICE_MAX,
    ]);
  }, [priceMin, priceMax]);

  const pushParams = (
    next: URLSearchParams,
    immediate = false,
  ): void => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const apply = (): void => {
      next.delete("page");
      const qs = next.toString();
      // Persist a copy to localStorage for next visit.
      try {
        if (qs) localStorage.setItem(STORAGE_KEY, qs);
        else localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* sandboxed iframes etc — non-fatal */
      }
      startTransition(() => {
        router.push(qs ? `/stock?${qs}` : "/stock", { scroll: false });
      });
    };
    if (immediate) apply();
    else debounceRef.current = setTimeout(apply, 300);
  };

  // Restore persisted filters on first mount when the URL is empty.
  useEffect(() => {
    if (restoreAttempted.current) return;
    restoreAttempted.current = true;
    if (params.toString()) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const next = new URLSearchParams(saved);
        next.delete("page");
        startTransition(() => {
          router.replace(`/stock?${next.toString()}`, { scroll: false });
        });
        setShowRestoredToast(true);
      }
    } catch {
      /* non-fatal */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleMulti = (key: string, value: string): void => {
    const next = new URLSearchParams(params.toString());
    const current = next.getAll(key);
    next.delete(key);
    if (current.includes(value)) {
      for (const v of current) if (v !== value) next.append(key, v);
    } else {
      for (const v of current) next.append(key, v);
      next.append(key, value);
    }
    // If models change, clear trims that are no longer valid (simple: just clear all trims).
    if (key === "model") next.delete("trim");
    pushParams(next, true);
  };

  const onPriceCommit = (vals: number[]): void => {
    const [lo, hi] = vals as [number, number];
    const next = new URLSearchParams(params.toString());
    if (lo > DEFAULT_PRICE_MIN) next.set("priceMin", String(lo));
    else next.delete("priceMin");
    if (hi < DEFAULT_PRICE_MAX) next.set("priceMax", String(hi));
    else next.delete("priceMax");
    pushParams(next);
  };

  const onMonthlyCommit = (vals: number[]): void => {
    const [lo, hi] = vals as [number, number];
    const minPrice = Math.round(priceForMonthly({ monthly: lo }) / PRICE_STEP) * PRICE_STEP;
    const maxPrice = Math.round(priceForMonthly({ monthly: hi }) / PRICE_STEP) * PRICE_STEP;
    const clampedMin = Math.max(DEFAULT_PRICE_MIN, Math.min(DEFAULT_PRICE_MAX, minPrice));
    const clampedMax = Math.max(DEFAULT_PRICE_MIN, Math.min(DEFAULT_PRICE_MAX, maxPrice));
    setPriceRange([clampedMin, clampedMax]);
    onPriceCommit([clampedMin, clampedMax]);
  };

  const reset = (): void => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* non-fatal */
    }
    setPriceRange([DEFAULT_PRICE_MIN, DEFAULT_PRICE_MAX]);
    setMonthlyRange([DEFAULT_MONTHLY_MIN, DEFAULT_MONTHLY_MAX]);
    startTransition(() => router.push("/stock", { scroll: false }));
  };

  // Trims facet — only show trims for selected models, or all if none selected.
  const visibleTrims = useMemo(() => {
    if (selectedModels.length === 0) return facets.trims;
    return facets.trims; // facets are precomputed by the server with respect to current model filter
  }, [facets.trims, selectedModels]);

  return (
    <div className="flex flex-col gap-8">
      {showRestoredToast ? (
        <div
          role="status"
          className="flex items-start justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-3 py-2 text-xs text-[var(--color-accent-deep)]"
        >
          <span>Applied your last filters</span>
          <button
            type="button"
            aria-label="Dismiss"
            className="font-medium underline-offset-2 hover:underline"
            onClick={() => setShowRestoredToast(false)}
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <div className="flex items-baseline justify-between">
        <h2 className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--color-neutral-700)]">
          Filters
        </h2>
        <span className="text-xs text-[var(--color-neutral-500)]">
          {totalAvailable} in stock
        </span>
      </div>

      <FacetGroup label="Model">
        {facets.models.map((m) => (
          <CheckboxRow
            key={m.slug}
            label={`${m.name}`}
            count={m.count}
            checked={selectedModels.includes(m.slug)}
            onChange={() => toggleMulti("model", m.slug)}
          />
        ))}
      </FacetGroup>

      {visibleTrims.length > 0 ? (
        <FacetGroup label="Trim">
          {visibleTrims.map((t) => (
            <CheckboxRow
              key={t.name}
              label={t.name}
              count={t.count}
              checked={selectedTrims.includes(t.name)}
              onChange={() => toggleMulti("trim", t.name)}
            />
          ))}
        </FacetGroup>
      ) : null}

      <FacetGroup label="Body type">
        {facets.bodyTypes.map((b) => (
          <CheckboxRow
            key={b.value}
            label={b.label}
            count={b.count}
            checked={selectedBody.includes(b.value)}
            onChange={() => toggleMulti("bodyType", b.value)}
          />
        ))}
      </FacetGroup>

      <FacetGroup label="Fuel type">
        {facets.fuelTypes.map((f) => (
          <CheckboxRow
            key={f.value}
            label={f.label}
            count={f.count}
            checked={selectedFuel.includes(f.value)}
            onChange={() => toggleMulti("fuelType", f.value)}
          />
        ))}
      </FacetGroup>

      <FacetGroup label="Exterior color">
        <div className="flex flex-wrap gap-3">
          {facets.colors.map((c) => (
            <div key={c.slug} className="flex flex-col items-center gap-1">
              <ColorSwatch
                hex={c.hex}
                name={c.name}
                size="md"
                selected={selectedColors.includes(c.slug)}
                onClick={() => toggleMulti("color", c.slug)}
                disabled={c.count === 0}
                className={cn(c.count === 0 && "opacity-40")}
              />
              <span className="text-[10px] text-[var(--color-neutral-500)]">
                ({c.count})
              </span>
            </div>
          ))}
        </div>
      </FacetGroup>

      <FacetGroup label="Price range">
        <div className="flex flex-col gap-3 pt-2">
          <Slider
            min={DEFAULT_PRICE_MIN}
            max={DEFAULT_PRICE_MAX}
            step={PRICE_STEP}
            value={priceRange}
            onValueChange={(v) => setPriceRange([v[0]!, v[1]!])}
            onValueCommit={onPriceCommit}
            aria-label="Price range"
          />
          <p className="text-xs text-[var(--color-neutral-600)] tabular-nums">
            {formatRM(priceRange[0])} – {formatRM(priceRange[1])}
          </p>
        </div>
      </FacetGroup>

      <FacetGroup label="Monthly payment">
        <div className="flex flex-col gap-3 pt-2">
          <Slider
            min={DEFAULT_MONTHLY_MIN}
            max={DEFAULT_MONTHLY_MAX}
            step={50}
            value={monthlyRange}
            onValueChange={(v) => setMonthlyRange([v[0]!, v[1]!])}
            onValueCommit={onMonthlyCommit}
            aria-label="Monthly payment range"
          />
          <p className="text-xs text-[var(--color-neutral-600)] tabular-nums">
            RM {monthlyRange[0]}/mo – RM {monthlyRange[1]}/mo
          </p>
          <p className="text-[10px] text-[var(--color-neutral-500)]">
            7-yr term · 3.5% APR · 10% down
          </p>
        </div>
      </FacetGroup>

      <button
        type="button"
        onClick={reset}
        className="self-start text-xs text-[var(--color-accent)] underline-offset-4 hover:underline"
      >
        Reset filters
      </button>
    </div>
  );
}

function FacetGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--color-neutral-500)]">
        {label}
      </p>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function CheckboxRow({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count: number;
  checked: boolean;
  onChange: () => void;
}): React.ReactElement {
  const dim = count === 0 && !checked;
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center justify-between gap-2 text-sm",
        dim && "cursor-not-allowed text-[var(--color-neutral-400)]",
      )}
    >
      <span className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={dim}
          className="h-4 w-4 rounded border-[var(--color-neutral-300)] text-[var(--color-graphite)] focus:ring-[var(--color-accent)] focus:ring-offset-1"
        />
        <span>{label}</span>
      </span>
      <span className="tabular-nums text-xs text-[var(--color-neutral-500)]">
        ({count})
      </span>
    </label>
  );
}
