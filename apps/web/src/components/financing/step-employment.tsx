"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { EMPLOYMENT_TYPES, type EmploymentType } from "@dealership/types";
import { Input } from "@dealership/ui/components/input";
import { Label } from "@dealership/ui/components/label";
import { BrandButton } from "@dealership/ui/components/brand-button";
import { useFinancingStore } from "@/stores/financingStore";

const schema = z.object({
  employmentType: z.enum(EMPLOYMENT_TYPES),
  employerName: z.string().trim().min(1, "Required").max(160),
  position: z.string().trim().min(1, "Required").max(120),
  monthlyGrossIncome: z.coerce
    .number()
    .nonnegative("Enter zero or more")
    .max(10_000_000),
  monthlyCommitments: z.coerce
    .number()
    .nonnegative("Enter zero or more")
    .max(10_000_000)
    .optional(),
  yearsEmployed: z.coerce.number().nonnegative().max(70),
});

type Values = z.infer<typeof schema>;

const EMPLOYMENT_LABELS: Record<EmploymentType, string> = {
  PERMANENT: "Permanent",
  CONTRACT: "Contract",
  SELF_EMPLOYED: "Self-employed",
  RETIRED: "Retired",
  OTHER: "Other",
};

export function StepEmployment({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}): React.ReactElement {
  const initialEmploymentType = useFinancingStore((s) => s.employmentType);
  const initialEmployerName = useFinancingStore((s) => s.employerName);
  const initialPosition = useFinancingStore((s) => s.position);
  const initialIncome = useFinancingStore((s) => s.monthlyGrossIncome);
  const initialCommitments = useFinancingStore((s) => s.monthlyCommitments);
  const initialYears = useFinancingStore((s) => s.yearsEmployed);
  const patch = useFinancingStore((s) => s.patch);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      employmentType: initialEmploymentType ?? "PERMANENT",
      employerName: initialEmployerName || "",
      position: initialPosition || "",
      monthlyGrossIncome: initialIncome ?? 0,
      monthlyCommitments: initialCommitments ?? undefined,
      yearsEmployed: initialYears ?? 0,
    },
  });

  return (
    <form
      onSubmit={handleSubmit((v) => {
        patch({
          employmentType: v.employmentType,
          employerName: v.employerName,
          position: v.position,
          monthlyGrossIncome: v.monthlyGrossIncome,
          monthlyCommitments:
            v.monthlyCommitments != null && Number.isFinite(v.monthlyCommitments)
              ? v.monthlyCommitments
              : null,
          yearsEmployed: v.yearsEmployed,
        });
        onNext();
      })}
    >
      <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-[-0.02em] text-[var(--color-graphite)] md:text-4xl">
        Employment & income
      </h2>
      <p className="mt-2 max-w-xl text-sm text-[var(--color-neutral-600)]">
        Banks use these figures to assess your debt service ratio. Provide
        gross income before tax and EPF.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <Label htmlFor="employmentType">Employment type</Label>
          <select
            id="employmentType"
            className="mt-2 flex h-10 w-full rounded-md border border-[var(--color-neutral-200)] bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            {...register("employmentType")}
          >
            {EMPLOYMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {EMPLOYMENT_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="yearsEmployed">Years employed</Label>
          <Input
            id="yearsEmployed"
            type="number"
            inputMode="decimal"
            min={0}
            step={0.5}
            className="mt-2"
            {...register("yearsEmployed")}
          />
          <ErrorMsg msg={errors.yearsEmployed?.message} />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="employerName">Employer / company name</Label>
          <Input
            id="employerName"
            className="mt-2"
            {...register("employerName")}
          />
          <ErrorMsg msg={errors.employerName?.message} />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="position">Position / job title</Label>
          <Input id="position" className="mt-2" {...register("position")} />
          <ErrorMsg msg={errors.position?.message} />
        </div>

        <div>
          <Label htmlFor="monthlyGrossIncome">Monthly gross income (RM)</Label>
          <Input
            id="monthlyGrossIncome"
            type="number"
            inputMode="numeric"
            min={0}
            step={100}
            className="mt-2"
            {...register("monthlyGrossIncome")}
          />
          <ErrorMsg msg={errors.monthlyGrossIncome?.message} />
        </div>

        <div>
          <Label htmlFor="monthlyCommitments">
            Monthly commitments (RM){" "}
            <span className="font-normal text-[var(--color-neutral-500)]">
              · optional
            </span>
          </Label>
          <Input
            id="monthlyCommitments"
            type="number"
            inputMode="numeric"
            min={0}
            step={100}
            placeholder="e.g. existing loan or card commitments"
            className="mt-2"
            {...register("monthlyCommitments")}
          />
          <ErrorMsg msg={errors.monthlyCommitments?.message} />
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
