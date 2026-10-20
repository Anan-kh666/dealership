"use client";

import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@dealership/ui/lib/cn";

/**
 * Inline status changer: a <select> that submits its form on change. Works
 * without JS too (falls back to the visible "Save" button via <noscript>).
 */
export function StatusSelect({
  action,
  id,
  value,
  options,
  label,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  value: string;
  options: { value: string; label: string }[];
  label: string;
}): React.ReactElement {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form ref={formRef} action={action} className="inline-flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <Inner formRef={formRef} value={value} options={options} label={label} />
      <noscript>
        <button type="submit" className="text-xs underline">
          Save
        </button>
      </noscript>
    </form>
  );
}

function Inner({
  formRef,
  value,
  options,
  label,
}: {
  formRef: React.RefObject<HTMLFormElement | null>;
  value: string;
  options: { value: string; label: string }[];
  label: string;
}): React.ReactElement {
  const { pending } = useFormStatus();
  return (
    <select
      name="status"
      aria-label={label}
      // Stop the browser restoring a stale value on reload, which would
      // disagree with the server-rendered selection during hydration.
      autoComplete="off"
      defaultValue={value}
      disabled={pending}
      onChange={() => formRef.current?.requestSubmit()}
      className={cn(
        "h-8 rounded-[var(--radius-sm)] border border-[var(--color-neutral-200)] bg-white px-2 text-xs",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
        pending && "opacity-60",
      )}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
