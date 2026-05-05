"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  MALAYSIAN_STATES,
  MARITAL_STATUSES,
  NATIONALITIES,
  type MalaysianState,
  type MaritalStatus,
  type Nationality,
} from "@dealership/types";
import { Input } from "@dealership/ui/components/input";
import { Label } from "@dealership/ui/components/label";
import { BrandButton } from "@dealership/ui/components/brand-button";
import { useFinancingStore } from "@/stores/financingStore";
import { isValidMlPhone } from "@/lib/phone";

const IC_RE = /^\d{6}-?\d{2}-?\d{4}$/;

const schema = z.object({
  fullName: z.string().trim().min(1, "Required").max(120),
  icNumber: z
    .string()
    .trim()
    .regex(IC_RE, "Enter a 12-digit IC, e.g. 900101-14-5678"),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  nationality: z.enum(NATIONALITIES),
  maritalStatus: z.enum(MARITAL_STATUSES),
  mobile: z
    .string()
    .trim()
    .refine(isValidMlPhone, "Enter a valid Malaysian mobile number"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  addressStreet: z.string().trim().min(1, "Required").max(200),
  addressCity: z.string().trim().min(1, "Required").max(80),
  addressState: z.enum(MALAYSIAN_STATES),
  addressPostcode: z.string().trim().regex(/^\d{5}$/, "Postcode must be 5 digits"),
});

type Values = z.infer<typeof schema>;

const NATIONALITY_LABELS: Record<Nationality, string> = {
  MALAYSIAN: "Malaysian",
  PERMANENT_RESIDENT: "Malaysian PR",
  FOREIGNER: "Foreigner",
};

const MARITAL_LABELS: Record<MaritalStatus, string> = {
  SINGLE: "Single",
  MARRIED: "Married",
  DIVORCED: "Divorced",
  WIDOWED: "Widowed",
};

export function StepPersonal({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}): React.ReactElement {
  const initialName = useFinancingStore((s) => s.fullName);
  const initialIc = useFinancingStore((s) => s.icNumber);
  const initialDob = useFinancingStore((s) => s.dateOfBirth);
  const initialNationality = useFinancingStore((s) => s.nationality);
  const initialMarital = useFinancingStore((s) => s.maritalStatus);
  const initialMobile = useFinancingStore((s) => s.mobile);
  const initialEmail = useFinancingStore((s) => s.email);
  const initialStreet = useFinancingStore((s) => s.addressStreet);
  const initialCity = useFinancingStore((s) => s.addressCity);
  const initialStateValue = useFinancingStore((s) => s.addressState);
  const initialPostcode = useFinancingStore((s) => s.addressPostcode);
  const patch = useFinancingStore((s) => s.patch);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      fullName: initialName || "",
      icNumber: initialIc || "",
      dateOfBirth: initialDob || "",
      nationality: initialNationality ?? "MALAYSIAN",
      maritalStatus: initialMarital ?? "SINGLE",
      mobile: initialMobile || "",
      email: initialEmail || "",
      addressStreet: initialStreet || "",
      addressCity: initialCity || "",
      addressState: (initialStateValue as MalaysianState) ?? "Selangor",
      addressPostcode: initialPostcode || "",
    },
  });

  return (
    <form
      onSubmit={handleSubmit((v) => {
        patch({
          fullName: v.fullName,
          icNumber: v.icNumber,
          dateOfBirth: v.dateOfBirth,
          nationality: v.nationality,
          maritalStatus: v.maritalStatus,
          mobile: v.mobile,
          email: v.email,
          addressStreet: v.addressStreet,
          addressCity: v.addressCity,
          addressState: v.addressState,
          addressPostcode: v.addressPostcode,
        });
        onNext();
      })}
    >
      <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-[-0.02em] text-[var(--color-graphite)] md:text-4xl">
        Tell us about yourself
      </h2>
      <p className="mt-2 text-sm text-[var(--color-neutral-600)]">
        Banks need these details to assess your application. We won&rsquo;t
        share them with anyone outside our financing partners.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label htmlFor="fullName">Full name (as on IC)</Label>
          <Input id="fullName" className="mt-2" {...register("fullName")} />
          <ErrorMsg msg={errors.fullName?.message} />
        </div>

        <div>
          <Label htmlFor="icNumber">IC number</Label>
          <Input
            id="icNumber"
            placeholder="900101-14-5678"
            inputMode="numeric"
            className="mt-2"
            {...register("icNumber")}
          />
          <ErrorMsg msg={errors.icNumber?.message} />
        </div>

        <div>
          <Label htmlFor="dateOfBirth">Date of birth</Label>
          <Input
            id="dateOfBirth"
            type="date"
            className="mt-2"
            {...register("dateOfBirth")}
          />
          <ErrorMsg msg={errors.dateOfBirth?.message} />
        </div>

        <div>
          <Label htmlFor="nationality">Nationality</Label>
          <select
            id="nationality"
            className="mt-2 flex h-10 w-full rounded-md border border-[var(--color-neutral-200)] bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            {...register("nationality")}
          >
            {NATIONALITIES.map((n) => (
              <option key={n} value={n}>
                {NATIONALITY_LABELS[n]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="maritalStatus">Marital status</Label>
          <select
            id="maritalStatus"
            className="mt-2 flex h-10 w-full rounded-md border border-[var(--color-neutral-200)] bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            {...register("maritalStatus")}
          >
            {MARITAL_STATUSES.map((m) => (
              <option key={m} value={m}>
                {MARITAL_LABELS[m]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="mobile">Mobile number</Label>
          <Input
            id="mobile"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="012-3456789"
            className="mt-2"
            {...register("mobile")}
          />
          <ErrorMsg msg={errors.mobile?.message} />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            className="mt-2"
            {...register("email")}
          />
          <ErrorMsg msg={errors.email?.message} />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="addressStreet">Street address</Label>
          <Input
            id="addressStreet"
            autoComplete="street-address"
            className="mt-2"
            {...register("addressStreet")}
          />
          <ErrorMsg msg={errors.addressStreet?.message} />
        </div>

        <div>
          <Label htmlFor="addressCity">City</Label>
          <Input
            id="addressCity"
            autoComplete="address-level2"
            className="mt-2"
            {...register("addressCity")}
          />
          <ErrorMsg msg={errors.addressCity?.message} />
        </div>

        <div>
          <Label htmlFor="addressState">State</Label>
          <select
            id="addressState"
            className="mt-2 flex h-10 w-full rounded-md border border-[var(--color-neutral-200)] bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            {...register("addressState")}
          >
            {MALAYSIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="addressPostcode">Postcode</Label>
          <Input
            id="addressPostcode"
            inputMode="numeric"
            maxLength={5}
            className="mt-2"
            {...register("addressPostcode")}
          />
          <ErrorMsg msg={errors.addressPostcode?.message} />
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

function ErrorMsg({ msg }: { msg?: string }): React.ReactElement | null {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-[var(--color-error)]">{msg}</p>;
}
