"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@dealership/ui/components/dialog";
import { BrandButton } from "@dealership/ui/components/brand-button";

export interface InquireDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stockUnitId: string;
  prefillMessage: string;
}

type FormState = "idle" | "submitting" | "success" | "error";

export function InquireDialog({
  open,
  onOpenChange,
  stockUnitId,
  prefillMessage,
}: InquireDialogProps): React.ReactElement {
  const [state, setState] = useState<FormState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState(prefillMessage);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setState("submitting");
    setError(null);
    try {
      const res = await fetch("/api/public/inquiries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          message,
          stockUnitId,
          source: "stock-detail-inquire",
        }),
      });
      if (!res.ok) {
        const body: unknown = await res.json().catch(() => ({}));
        const msg =
          typeof body === "object" && body !== null && "error" in body
            ? String((body as { error: unknown }).error)
            : "Something went wrong. Please try again.";
        throw new Error(msg);
      }
      setState("success");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Submission failed.");
    }
  };

  const close = (): void => {
    onOpenChange(false);
    // Reset after the close animation so users see fresh state next open.
    setTimeout(() => {
      setState("idle");
      setError(null);
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>About this unit</DialogTitle>
          <DialogDescription>
            Send us a quick note and we&rsquo;ll be in touch within one business day.
          </DialogDescription>
        </DialogHeader>

        {state === "success" ? (
          <div className="flex flex-col gap-4 py-2">
            <p className="text-sm text-[var(--color-neutral-700)]">
              Thanks — we&rsquo;ll be in touch within one business day.
            </p>
            <BrandButton type="button" variant="primary" size="md" onClick={close}>
              Close
            </BrandButton>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-4 py-2">
            <Field label="Name" required>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-[var(--radius-sm)] border border-[var(--color-neutral-200)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              />
            </Field>
            <Field label="Email" required>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-[var(--radius-sm)] border border-[var(--color-neutral-200)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              />
            </Field>
            <Field label="Phone" required>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+60 12 345 6789"
                className="rounded-[var(--radius-sm)] border border-[var(--color-neutral-200)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              />
            </Field>
            <Field label="Message">
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="rounded-[var(--radius-sm)] border border-[var(--color-neutral-200)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              />
            </Field>

            {error ? (
              <p role="alert" className="text-sm text-[var(--color-error)]">
                {error}
              </p>
            ) : null}

            <div className="flex justify-end gap-2 pt-2">
              <BrandButton
                type="button"
                variant="ghost-dark"
                size="md"
                onClick={close}
                disabled={state === "submitting"}
              >
                Cancel
              </BrandButton>
              <BrandButton
                type="submit"
                variant="primary"
                size="md"
                disabled={state === "submitting"}
              >
                {state === "submitting" ? "Sending…" : "Send inquiry"}
              </BrandButton>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--color-neutral-600)]">
        {label}
        {required ? <span className="ml-1 text-[var(--color-accent)]">*</span> : null}
      </span>
      {children}
    </label>
  );
}
