"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, FormAlert, SubmitButton, TextInput } from "@/components/forms/fields";
import { registerAction, type AuthFormState } from "../actions";

export function RegisterForm({ callbackUrl }: { callbackUrl: string }): React.ReactElement {
  const [state, formAction] = useActionState<AuthFormState, FormData>(registerAction, {});
  const fe = state.fieldErrors ?? {};
  const v = state.values ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      {state.error ? <FormAlert>{state.error}</FormAlert> : null}

      <Field label="Full name" htmlFor="name" error={fe.name} required>
        <TextInput
          id="name"
          name="name"
          autoComplete="name"
          defaultValue={v.name}
          invalid={Boolean(fe.name)}
          required
          autoFocus
        />
      </Field>

      <Field label="Email" htmlFor="email" error={fe.email} required>
        <TextInput
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          defaultValue={v.email}
          invalid={Boolean(fe.email)}
          required
        />
      </Field>

      <Field
        label="Mobile number"
        htmlFor="phone"
        error={fe.phone}
        hint="Optional — e.g. 012-345 6789"
      >
        <TextInput
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          defaultValue={v.phone}
          invalid={Boolean(fe.phone)}
        />
      </Field>

      <Field
        label="Password"
        htmlFor="password"
        error={fe.password}
        hint="At least 8 characters."
        required
      >
        <TextInput
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          invalid={Boolean(fe.password)}
          required
        />
      </Field>

      <div className="flex flex-col gap-1">
        <label className="flex items-start gap-3 text-sm text-[var(--color-neutral-700)]">
          <input
            type="checkbox"
            name="terms"
            className="mt-0.5 h-4 w-4 rounded border-[var(--color-neutral-300)] accent-[var(--color-accent)]"
          />
          <span>
            I agree to the{" "}
            <Link href="/terms" className="underline underline-offset-4" target="_blank">
              terms of use
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline underline-offset-4" target="_blank">
              privacy notice
            </Link>
            .
          </span>
        </label>
        {fe.terms ? (
          <p role="alert" className="pl-7 text-xs text-[var(--color-error)]">
            {fe.terms}
          </p>
        ) : null}
      </div>

      <SubmitButton size="lg" className="mt-2 w-full" pendingLabel="Creating account…">
        Create account
      </SubmitButton>
    </form>
  );
}
