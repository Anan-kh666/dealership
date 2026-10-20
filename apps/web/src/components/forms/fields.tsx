"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { BrandButton, type BrandButtonProps } from "@dealership/ui/components/brand-button";
import { cn } from "@dealership/ui/lib/cn";

/**
 * Small form kit for the server-action forms (auth, contact, account,
 * admin). The multi-step flows keep their own RHF-based fields.
 */

const controlBase =
  "w-full rounded-[var(--radius-md)] border bg-white px-4 text-[15px] text-[var(--color-graphite)] " +
  "placeholder:text-[var(--color-neutral-400)] transition-[border-color,box-shadow] duration-[var(--duration-quick)] " +
  "focus-visible:outline-none focus-visible:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/25 " +
  "disabled:cursor-not-allowed disabled:opacity-60";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string | undefined;
  hint?: React.ReactNode;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-[var(--color-graphite)]">
        {label}
        {required ? (
          <span aria-hidden className="ml-0.5 text-[var(--color-accent)]">
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-xs text-[var(--color-error)]">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-xs text-[var(--color-neutral-500)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean };

export const TextInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, id, ...props }, ref) => (
    <input
      ref={ref}
      id={id}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid && id ? `${id}-error` : undefined}
      className={cn(
        controlBase,
        "h-12",
        invalid ? "border-[var(--color-error)]" : "border-[var(--color-neutral-200)]",
        className,
      )}
      {...props}
    />
  ),
);
TextInput.displayName = "TextInput";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean };

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, id, ...props }, ref) => (
    <textarea
      ref={ref}
      id={id}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid && id ? `${id}-error` : undefined}
      className={cn(
        controlBase,
        "min-h-32 py-3 leading-relaxed",
        invalid ? "border-[var(--color-error)]" : "border-[var(--color-neutral-200)]",
        className,
      )}
      {...props}
    />
  ),
);
TextArea.displayName = "TextArea";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean };

export const NativeSelect = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, invalid, ...props }, ref) => (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        controlBase,
        "h-12 appearance-none bg-[length:16px] bg-[right_1rem_center] bg-no-repeat pr-10",
        "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236b6b6b' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")]",
        invalid ? "border-[var(--color-error)]" : "border-[var(--color-neutral-200)]",
        className,
      )}
      {...props}
    />
  ),
);
NativeSelect.displayName = "NativeSelect";

/** Submit button that shows a spinner while its parent <form> is pending. */
export function SubmitButton({
  children,
  pendingLabel,
  className,
  ...props
}: BrandButtonProps & { pendingLabel?: string }): React.ReactElement {
  const { pending } = useFormStatus();
  return (
    <BrandButton
      type="submit"
      disabled={pending || props.disabled}
      aria-busy={pending || undefined}
      className={className}
      {...props}
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          {pendingLabel ?? "Please wait…"}
        </>
      ) : (
        children
      )}
    </BrandButton>
  );
}

export function FormAlert({
  tone = "error",
  children,
}: {
  tone?: "error" | "success";
  children: React.ReactNode;
}): React.ReactElement {
  const Icon = tone === "error" ? AlertCircle : CheckCircle2;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 rounded-[var(--radius-md)] border px-4 py-3 text-sm",
        tone === "error"
          ? "border-[var(--color-error)]/25 bg-[var(--color-error)]/5 text-[var(--color-error)]"
          : "border-[var(--color-success)]/25 bg-[var(--color-success)]/5 text-[var(--color-success)]",
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  );
}
