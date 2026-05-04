"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@dealership/ui/components/input";
import { Label } from "@dealership/ui/components/label";
import { BrandButton } from "@dealership/ui/components/brand-button";
import { useFinancingStore } from "@/stores/financingStore";

interface PreselectedVehicle {
  id: string;
  label: string;
  price: number;
}

const manualSchema = z.object({
  vehicleLabel: z.string().trim().max(160).optional(),
  vehiclePrice: z.coerce
    .number()
    .positive("Enter a price greater than zero")
    .max(10_000_000),
});

const myr = new Intl.NumberFormat("en-MY", { maximumFractionDigits: 0 });

export function StepVehicle({
  preselected,
  onNext,
}: {
  preselected: PreselectedVehicle | null;
  onNext: () => void;
}): React.ReactElement {
  const storedLabel = useFinancingStore((s) => s.vehicleLabel);
  const storedPrice = useFinancingStore((s) => s.vehiclePrice);
  const patch = useFinancingStore((s) => s.patch);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<z.infer<typeof manualSchema>>({
    resolver: zodResolver(manualSchema),
    mode: "onChange",
    defaultValues: {
      vehicleLabel: preselected?.label ?? storedLabel ?? "",
      vehiclePrice: preselected?.price ?? storedPrice ?? 0,
    },
  });

  if (preselected) {
    return (
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-[-0.02em] text-[var(--color-graphite)] md:text-4xl">
          Confirm your vehicle
        </h2>
        <p className="mt-2 text-sm text-[var(--color-neutral-600)]">
          We&rsquo;ll calculate your loan against the vehicle below. You can
          change the vehicle from your stock page if this isn&rsquo;t right.
        </p>

        <div className="mt-8 rounded-[var(--radius-lg)] border border-[var(--color-neutral-200)] bg-white p-6">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-neutral-500)]">
            Selected vehicle
          </p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-2xl tracking-[-0.02em] text-[var(--color-graphite)]">
            {preselected.label}
          </p>
          <p className="mt-1 text-sm text-[var(--color-neutral-700)]">
            RM {myr.format(preselected.price)} OTR
          </p>
        </div>

        <div className="sticky bottom-0 -mx-4 mt-12 flex items-center justify-end border-t border-[var(--color-neutral-200)] bg-[var(--color-surface-warm)] px-4 py-4 md:static md:mx-0 md:border-0 md:px-0">
          <BrandButton
            type="button"
            size="lg"
            onClick={() => {
              patch({
                vehicleLabel: preselected.label,
                vehiclePrice: preselected.price,
                stockUnitId: preselected.id,
              });
              onNext();
            }}
          >
            Continue
          </BrandButton>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit((v) => {
        patch({
          vehicleLabel: v.vehicleLabel ? v.vehicleLabel : null,
          vehiclePrice: v.vehiclePrice,
          stockUnitId: null,
        });
        onNext();
      })}
    >
      <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-[-0.02em] text-[var(--color-graphite)] md:text-4xl">
        What are you financing?
      </h2>
      <p className="mt-2 max-w-xl text-sm text-[var(--color-neutral-600)]">
        Apply for indicative pre-approval based on a vehicle price. Have a
        unit picked? Browse our{" "}
        <Link
          href="/stock"
          className="text-[var(--color-accent)] underline-offset-4 hover:underline"
        >
          stock
        </Link>{" "}
        and click &ldquo;Apply for financing&rdquo; from the listing.
      </p>

      <div className="mt-8 grid max-w-2xl grid-cols-1 gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label htmlFor="vehicleLabel">Vehicle (optional)</Label>
          <Input
            id="vehicleLabel"
            placeholder="e.g. 2025 Model X Premium"
            className="mt-2"
            {...register("vehicleLabel")}
          />
          <p className="mt-1 text-xs text-[var(--color-neutral-500)]">
            Helps the bank match your application to a specific unit. Skip if
            you&rsquo;re still deciding.
          </p>
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="vehiclePrice">Vehicle price (RM)</Label>
          <Input
            id="vehiclePrice"
            type="number"
            inputMode="numeric"
            min={10_000}
            step={1000}
            className="mt-2"
            {...register("vehiclePrice")}
          />
          {errors.vehiclePrice && (
            <p className="mt-1 text-xs text-[var(--color-error)]">
              {errors.vehiclePrice.message}
            </p>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 -mx-4 mt-12 flex items-center justify-end border-t border-[var(--color-neutral-200)] bg-[var(--color-surface-warm)] px-4 py-4 md:static md:mx-0 md:border-0 md:px-0">
        <BrandButton type="submit" disabled={!isValid} size="lg">
          Next
        </BrandButton>
      </div>
    </form>
  );
}
