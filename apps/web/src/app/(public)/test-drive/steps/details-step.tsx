"use client";

import * as React from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BrandButton } from "@dealership/ui/components/brand-button";
import { Input } from "@dealership/ui/components/input";
import { Label } from "@dealership/ui/components/label";
import { useTestDriveStore, type DetailsForm } from "@/stores/test-drive-store";
import { isValidMyPhone, formatMyPhone } from "@/lib/test-drive/phone";

const schema = z
  .object({
    guestName: z.string().trim().min(1, "Required").max(120),
    guestEmail: z.string().trim().email("Enter a valid email"),
    guestPhone: z
      .string()
      .trim()
      .refine(isValidMyPhone, "Enter a Malaysian phone number"),
    drivingLicense: z
      .string()
      .trim()
      .min(6, "Enter your driving license number"),
    notes: z.string().max(500, "500 characters max").optional().default(""),
    createAccount: z.boolean().optional().default(false),
    password: z.string().optional().default(""),
  })
  .superRefine((data, ctx) => {
    if (data.createAccount && (data.password ?? "").length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: "At least 8 characters",
      });
    }
  });

type FormValues = z.infer<typeof schema>;

export function DetailsStep({
  headingRef,
}: {
  headingRef: React.RefObject<HTMLHeadingElement | null>;
}): React.ReactElement {
  const details = useTestDriveStore((s) => s.details);
  const setDetails = useTestDriveStore((s) => s.setDetails);
  const setStep = useTestDriveStore((s) => s.setStep);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: details,
  });

  const createAccount = watch("createAccount");
  const phone = watch("guestPhone");

  const onSubmit: SubmitHandler<FormValues> = (values) => {
    setDetails(values as DetailsForm);
    setStep(4);
  };

  function onBack(): void {
    // Persist whatever has been typed so it isn't lost.
    const v = watch();
    setDetails(v as DetailsForm);
    setStep(2);
  }

  return (
    <form className="flex flex-col gap-8" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="flex flex-col gap-2">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="font-[family-name:var(--font-display)] tracking-[-0.02em] outline-none"
          style={{ fontSize: "clamp(28px, 4vw, 40px)", lineHeight: 1.1 }}
        >
          Tell us who&rsquo;s driving
        </h2>
        <p className="text-[var(--color-neutral-600)]">
          We&rsquo;ll use this to confirm your booking and prepare the paperwork.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field label="Full name" error={errors.guestName?.message} required>
          <Input autoComplete="name" {...register("guestName")} />
        </Field>
        <Field label="Email" error={errors.guestEmail?.message} required>
          <Input type="email" autoComplete="email" {...register("guestEmail")} />
        </Field>
        <Field label="Phone" error={errors.guestPhone?.message} required>
          <Input
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) =>
              setValue("guestPhone", formatMyPhone(e.target.value), {
                shouldValidate: false,
                shouldDirty: true,
              })
            }
            onBlur={(e) =>
              setValue("guestPhone", e.target.value.trim(), {
                shouldValidate: true,
                shouldTouch: true,
              })
            }
            placeholder="+60 12 345 6789"
          />
        </Field>
        <Field
          label="Driving license number"
          hint="We need this to confirm you're eligible to drive — required by law."
          error={errors.drivingLicense?.message}
          required
        >
          <Input autoComplete="off" {...register("drivingLicense")} />
        </Field>
      </div>

      <Field
        label="Anything we should know?"
        hint="Optional — max 500 characters."
        error={errors.notes?.message}
      >
        <textarea
          {...register("notes")}
          rows={4}
          maxLength={500}
          placeholder="e.g. preferred test route, accessibility needs, second driver coming along"
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </Field>

      <div className="rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] bg-[var(--color-surface-warm)] p-4">
        <label className="flex items-start gap-3 text-sm text-[var(--color-neutral-700)]">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4"
            {...register("createAccount")}
          />
          <span className="flex flex-col gap-1">
            <span className="font-medium text-[var(--color-graphite)]">
              Create an account?
            </span>
            <span className="text-[var(--color-neutral-600)]">
              We&rsquo;ll save your saved configurations and bookings. You can do
              this later.
            </span>
          </span>
        </label>
        {createAccount ? (
          <div className="mt-3">
            <Field label="Password" error={errors.password?.message} required>
              <Input
                type="password"
                autoComplete="new-password"
                {...register("password")}
              />
            </Field>
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-[var(--color-neutral-200)] pt-6">
        <BrandButton variant="ghost-dark" size="md" type="button" onClick={onBack}>
          Back
        </BrandButton>
        <BrandButton variant="primary" size="md" type="submit" disabled={!isValid}>
          Next
        </BrandButton>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}): React.ReactElement {
  const id = React.useId();
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>
        {label}
        {required ? <span aria-hidden className="text-[var(--color-accent-deep)]"> *</span> : null}
      </Label>
      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<Record<string, unknown>>, { id })
        : children}
      {hint ? (
        <p className="text-xs text-[var(--color-neutral-500)]">{hint}</p>
      ) : null}
      {error ? (
        <p role="alert" className="text-xs text-[var(--color-error)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
