"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@dealership/ui/components/input";
import { Label } from "@dealership/ui/components/label";
import { BrandButton } from "@dealership/ui/components/brand-button";
import { useTradeInStore } from "@/stores/tradeInStore";

const MAKES = [
  "Toyota",
  "Honda",
  "Perodua",
  "Proton",
  "Mazda",
  "Nissan",
  "Mitsubishi",
  "Hyundai",
  "Kia",
  "Mercedes-Benz",
  "BMW",
  "Audi",
  "Volkswagen",
  "Subaru",
  "Suzuki",
  "Lexus",
  "Volvo",
  "Ford",
  "Chevrolet",
  "Tesla",
  "BYD",
  "MG",
  "Chery",
  "Mini",
  "Land Rover",
  "Jaguar",
  "Porsche",
];

const VIN_RE = /^[A-HJ-NPR-Z0-9]{17}$/;

const vinSchema = z.object({
  vin: z
    .string()
    .trim()
    .toUpperCase()
    .regex(VIN_RE, "VIN must be 17 characters, no I/O/Q"),
});

const manualSchema = z.object({
  make: z.string().trim().min(1, "Required").max(80),
  model: z.string().trim().min(1, "Required").max(80),
  year: z.coerce.number().int().min(2000).max(new Date().getFullYear()),
  trim: z.string().trim().max(80).optional(),
});

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 2000 + 1 }, (_, i) =>
  String(CURRENT_YEAR - i),
);

export function StepVehicle({ onNext }: { onNext: () => void }): React.ReactElement {
  const initialVin = useTradeInStore((s) => s.vin);
  const initialMake = useTradeInStore((s) => s.make);
  const initialModel = useTradeInStore((s) => s.model);
  const initialYear = useTradeInStore((s) => s.year);
  const initialTrim = useTradeInStore((s) => s.trim);
  const patch = useTradeInStore((s) => s.patch);

  const [tab, setTab] = useState<"vin" | "manual">(initialVin ? "vin" : "manual");

  return (
    <div>
      <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-[-0.02em] text-[var(--color-graphite)] md:text-4xl">
        Tell us about your car
      </h2>
      <p className="mt-2 text-sm text-[var(--color-neutral-600)]">
        Use a VIN if you have one, or enter the details manually.
      </p>

      <div
        role="tablist"
        aria-label="Entry method"
        className="mt-8 inline-flex rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] bg-white p-1"
      >
        {(["vin", "manual"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            type="button"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`rounded-[calc(var(--radius-md)-2px)] px-4 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? "bg-[var(--color-graphite)] text-white"
                : "text-[var(--color-neutral-700)] hover:text-[var(--color-graphite)]"
            }`}
          >
            {t === "vin" ? "Use VIN" : "Enter manually"}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === "vin" ? (
          <VinForm
            initialVin={initialVin}
            onSubmit={(vin) => {
              patch({ vin });
              onNext();
            }}
          />
        ) : (
          <ManualForm
            initial={{
              make: initialMake,
              model: initialModel,
              year: initialYear,
              trim: initialTrim,
            }}
            onSubmit={(v) => {
              patch({
                make: v.make,
                model: v.model,
                year: v.year,
                trim: v.trim ?? null,
                vin: null,
              });
              onNext();
            }}
          />
        )}
      </div>
    </div>
  );
}

function VinForm({
  initialVin,
  onSubmit,
}: {
  initialVin: string | null;
  onSubmit: (vin: string) => void;
}): React.ReactElement {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<z.infer<typeof vinSchema>>({
    resolver: zodResolver(vinSchema),
    mode: "onChange",
    defaultValues: { vin: initialVin ?? "" },
  });
  return (
    <form
      onSubmit={handleSubmit((v) => onSubmit(v.vin))}
      className="max-w-md space-y-4"
    >
      <div>
        <Label htmlFor="vin">VIN</Label>
        <Input
          id="vin"
          autoComplete="off"
          autoCapitalize="characters"
          maxLength={17}
          spellCheck={false}
          className="mt-2 font-mono uppercase tracking-wider"
          {...register("vin")}
        />
        <p className="mt-2 text-xs text-[var(--color-neutral-500)]">
          We&rsquo;ll prefill the rest from records (lookup not yet wired —
          you&rsquo;ll confirm details on the next step).
        </p>
        {errors.vin && (
          <p className="mt-1 text-xs text-[var(--color-error)]">
            {errors.vin.message}
          </p>
        )}
      </div>
      <BrandButton type="submit" disabled={!isValid} size="lg">
        Next
      </BrandButton>
    </form>
  );
}

function ManualForm({
  initial,
  onSubmit,
}: {
  initial: {
    make: string | null;
    model: string | null;
    year: number | null;
    trim: string | null;
  };
  onSubmit: (v: z.infer<typeof manualSchema>) => void;
}): React.ReactElement {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<z.infer<typeof manualSchema>>({
    resolver: zodResolver(manualSchema),
    mode: "onChange",
    defaultValues: {
      make: initial.make ?? "",
      model: initial.model ?? "",
      year: initial.year ?? CURRENT_YEAR,
      trim: initial.trim ?? "",
    },
  });

  const makeValue = watch("make");
  const suggestions = useMemo(() => {
    if (!makeValue) return [];
    const q = makeValue.toLowerCase();
    return MAKES.filter((m) => m.toLowerCase().includes(q)).slice(0, 6);
  }, [makeValue]);
  const [showSuggest, setShowSuggest] = useState(false);

  return (
    <form
      onSubmit={handleSubmit((v) => onSubmit(v))}
      className="grid max-w-2xl grid-cols-1 gap-5 md:grid-cols-2"
    >
      <div className="md:col-span-2">
        <Label htmlFor="make">Make</Label>
        <div className="relative mt-2">
          <Input
            id="make"
            autoComplete="off"
            {...register("make")}
            onFocus={() => setShowSuggest(true)}
            onBlur={() => setTimeout(() => setShowSuggest(false), 120)}
            placeholder="e.g. Toyota"
          />
          {showSuggest && suggestions.length > 0 && (
            <ul
              role="listbox"
              className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] bg-white shadow-[var(--shadow-2)]"
            >
              {suggestions.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setValue("make", s, { shouldValidate: true });
                      setShowSuggest(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-neutral-100)]"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {errors.make && (
          <p className="mt-1 text-xs text-[var(--color-error)]">
            {errors.make.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="model">Model</Label>
        <Input id="model" className="mt-2" {...register("model")} />
        {errors.model && (
          <p className="mt-1 text-xs text-[var(--color-error)]">
            {errors.model.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="year">Year</Label>
        <select
          id="year"
          className="mt-2 flex h-10 w-full rounded-md border border-[var(--color-neutral-200)] bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          {...register("year")}
        >
          {YEARS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        {errors.year && (
          <p className="mt-1 text-xs text-[var(--color-error)]">
            {errors.year.message}
          </p>
        )}
      </div>

      <div className="md:col-span-2">
        <Label htmlFor="trim">Trim or variant (optional)</Label>
        <Input id="trim" className="mt-2" {...register("trim")} />
      </div>

      <div className="md:col-span-2">
        <BrandButton type="submit" disabled={!isValid} size="lg">
          Next
        </BrandButton>
      </div>
    </form>
  );
}
