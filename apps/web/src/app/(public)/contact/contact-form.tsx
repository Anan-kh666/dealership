"use client";

import { useState } from "react";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";
import {
  Field,
  FormAlert,
  NativeSelect,
  TextArea,
  TextInput,
} from "@/components/forms/fields";
import { BrandButton } from "@dealership/ui/components/brand-button";

const TOPICS = [
  { value: "sales", label: "Buying a new car" },
  { value: "stock", label: "A car in stock" },
  { value: "financing", label: "Financing" },
  { value: "trade-in", label: "Trading in my car" },
  { value: "service", label: "Service & after-sales" },
  { value: "other", label: "Something else" },
] as const;

const schema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a phone number we can reach you on")
    .max(20)
    .regex(/^\+?[\d\s-]+$/, "Use digits, spaces or dashes"),
  topic: z.enum(TOPICS.map((t) => t.value) as [string, ...string[]]),
  message: z.string().trim().min(10, "Tell us a little more (10+ characters)").max(2000),
});

type Errors = Partial<Record<keyof z.infer<typeof schema>, string>>;

export function ContactForm(): React.ReactElement {
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error" | "limited">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = schema.safeParse(Object.fromEntries(form));
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof Errors;
        next[k] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    setStatus("sending");
    const topicLabel = TOPICS.find((t) => t.value === parsed.data.topic)?.label ?? "General";
    try {
      const res = await fetch("/api/public/inquiries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: parsed.data.name,
          email: parsed.data.email,
          phone: parsed.data.phone,
          message: `[${topicLabel}] ${parsed.data.message}`,
          source: "contact-page",
        }),
      });
      if (res.status === 429) return setStatus("limited");
      if (!res.ok) return setStatus("error");
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div role="status" className="flex flex-col items-start gap-4 rounded-[var(--radius-lg)] border border-[var(--color-neutral-200)] bg-white p-8">
        <CheckCircle2 className="h-8 w-8 text-[var(--color-success)]" aria-hidden />
        <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-[-0.02em]">
          Message received.
        </h2>
        <p className="text-[15px] text-[var(--color-neutral-700)]">
          Thanks for getting in touch. Someone from the showroom will reply within one business
          day — usually much sooner.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="text-sm text-[var(--color-neutral-600)] underline underline-offset-4"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      noValidate
      className="grid gap-5 rounded-[var(--radius-lg)] border border-[var(--color-neutral-200)] bg-white p-6 md:grid-cols-2 md:p-8"
    >
      {status === "error" ? (
        <div className="md:col-span-2">
          <FormAlert>We couldn&rsquo;t send your message. Please try again, or call us.</FormAlert>
        </div>
      ) : null}
      {status === "limited" ? (
        <div className="md:col-span-2">
          <FormAlert>
            You&rsquo;ve sent a few messages already — we&rsquo;ll be in touch. For anything
            urgent, please call or WhatsApp us.
          </FormAlert>
        </div>
      ) : null}

      <Field label="Full name" htmlFor="name" error={errors.name} required>
        <TextInput id="name" name="name" autoComplete="name" invalid={!!errors.name} />
      </Field>
      <Field label="Phone" htmlFor="phone" error={errors.phone} required>
        <TextInput id="phone" name="phone" type="tel" autoComplete="tel" invalid={!!errors.phone} />
      </Field>
      <Field label="Email" htmlFor="email" error={errors.email} required className="md:col-span-2">
        <TextInput
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          invalid={!!errors.email}
        />
      </Field>
      <Field label="What's it about?" htmlFor="topic" className="md:col-span-2">
        <NativeSelect id="topic" name="topic" defaultValue="sales">
          {TOPICS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field label="Message" htmlFor="message" error={errors.message} required className="md:col-span-2">
        <TextArea id="message" name="message" rows={5} maxLength={2000} invalid={!!errors.message} />
      </Field>
      <div className="flex flex-col gap-3 md:col-span-2 md:flex-row md:items-center md:justify-between">
        <p className="text-xs text-[var(--color-neutral-500)]">
          We&rsquo;ll only use your details to reply. See our{" "}
          <a href="/privacy" className="underline underline-offset-4">
            privacy notice
          </a>
          .
        </p>
        <BrandButton type="submit" size="lg" disabled={status === "sending"}>
          {status === "sending" ? "Sending…" : "Send message"}
        </BrandButton>
      </div>
    </form>
  );
}
