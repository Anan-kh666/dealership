"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@dealership/ui/components/input";
import { Label } from "@dealership/ui/components/label";
import { BrandButton } from "@dealership/ui/components/brand-button";
import { useTradeInStore } from "@/stores/tradeInStore";
import { isValidMlPhone } from "@/lib/phone";

const schema = z.object({
  contactName: z.string().trim().min(1, "Required").max(120),
  contactEmail: z.string().trim().toLowerCase().email("Enter a valid email"),
  contactPhone: z
    .string()
    .trim()
    .refine(isValidMlPhone, "Enter a valid Malaysian mobile number"),
  preferredContactMethod: z.enum(["PHONE", "EMAIL", "WHATSAPP"]),
  bestTimeToCall: z.enum(["MORNING", "AFTERNOON", "EVENING", "ANYTIME"]),
});

type Values = z.infer<typeof schema>;

const TIMES: { v: Values["bestTimeToCall"]; label: string }[] = [
  { v: "MORNING", label: "Morning (9 AM – 12 PM)" },
  { v: "AFTERNOON", label: "Afternoon (12 PM – 5 PM)" },
  { v: "EVENING", label: "Evening (5 PM – 7 PM)" },
  { v: "ANYTIME", label: "Anytime" },
];

const METHODS: { v: Values["preferredContactMethod"]; label: string }[] = [
  { v: "PHONE", label: "Phone" },
  { v: "EMAIL", label: "Email" },
  { v: "WHATSAPP", label: "WhatsApp" },
];

export function StepContact({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}): React.ReactElement {
  const s = useTradeInStore();
  const patch = useTradeInStore((x) => x.patch);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      contactName: s.contactName ?? "",
      contactEmail: s.contactEmail ?? "",
      contactPhone: s.contactPhone ?? "",
      preferredContactMethod: s.preferredContactMethod ?? "PHONE",
      bestTimeToCall: s.bestTimeToCall ?? "ANYTIME",
    },
  });

  const method = watch("preferredContactMethod");

  return (
    <form
      onSubmit={handleSubmit((v) => {
        patch({
          contactName: v.contactName,
          contactEmail: v.contactEmail,
          contactPhone: v.contactPhone,
          preferredContactMethod: v.preferredContactMethod,
          bestTimeToCall: v.bestTimeToCall,
        });
        onNext();
      })}
    >
      <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-[-0.02em] text-[var(--color-graphite)] md:text-4xl">
        How should we reach you?
      </h2>

      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label htmlFor="contactName">Full name</Label>
          <Input id="contactName" className="mt-2" {...register("contactName")} />
          {errors.contactName && (
            <p className="mt-1 text-xs text-[var(--color-error)]">
              {errors.contactName.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="contactEmail">Email</Label>
          <Input
            id="contactEmail"
            type="email"
            inputMode="email"
            autoComplete="email"
            className="mt-2"
            {...register("contactEmail")}
          />
          {errors.contactEmail && (
            <p className="mt-1 text-xs text-[var(--color-error)]">
              {errors.contactEmail.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="contactPhone">Mobile phone</Label>
          <Input
            id="contactPhone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="012-3456789"
            className="mt-2"
            {...register("contactPhone")}
          />
          {errors.contactPhone && (
            <p className="mt-1 text-xs text-[var(--color-error)]">
              {errors.contactPhone.message}
            </p>
          )}
        </div>

        <fieldset className="md:col-span-2">
          <legend className="text-sm font-medium text-[var(--color-graphite)]">
            Preferred contact method
          </legend>
          <div className="mt-2 inline-flex flex-wrap gap-2">
            {METHODS.map((m) => (
              <button
                key={m.v}
                type="button"
                onClick={() =>
                  setValue("preferredContactMethod", m.v, {
                    shouldValidate: true,
                  })
                }
                className={`rounded-[var(--radius-md)] border px-4 py-2 text-sm transition-colors ${
                  method === m.v
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-graphite)]"
                    : "border-[var(--color-neutral-200)] bg-white text-[var(--color-neutral-700)] hover:border-[var(--color-neutral-400)]"
                }`}
                aria-pressed={method === m.v}
              >
                {m.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="md:col-span-2">
          <Label htmlFor="bestTimeToCall">Best time to reach you</Label>
          <select
            id="bestTimeToCall"
            className="mt-2 flex h-10 w-full max-w-md rounded-md border border-[var(--color-neutral-200)] bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            {...register("bestTimeToCall")}
          >
            {TIMES.map((t) => (
              <option key={t.v} value={t.v}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="sticky bottom-0 -mx-4 mt-12 flex items-center justify-between border-t border-[var(--color-neutral-200)] bg-[var(--color-surface-warm)] px-4 py-4 md:static md:mx-0 md:border-0 md:px-0">
        <BrandButton type="button" variant="ghost-dark" onClick={onBack}>
          Back
        </BrandButton>
        <BrandButton type="submit" disabled={!isValid} size="lg">
          Next
        </BrandButton>
      </div>
    </form>
  );
}
