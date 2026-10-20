"use client";

import { useActionState } from "react";
import { Field, FormAlert, SubmitButton, TextInput } from "@/components/forms/fields";
import { signInAction, type AuthFormState } from "../actions";

export function SignInForm({ callbackUrl }: { callbackUrl: string }): React.ReactElement {
  const [state, formAction] = useActionState<AuthFormState, FormData>(signInAction, {});
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      {state.error ? <FormAlert>{state.error}</FormAlert> : null}

      <Field label="Email" htmlFor="email" error={fe.email}>
        <TextInput
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          defaultValue={state.values?.email}
          invalid={Boolean(fe.email)}
          required
          autoFocus
        />
      </Field>

      <Field label="Password" htmlFor="password" error={fe.password}>
        <TextInput
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          invalid={Boolean(fe.password)}
          required
        />
      </Field>

      <SubmitButton size="lg" className="mt-2 w-full" pendingLabel="Signing in…">
        Sign in
      </SubmitButton>

      <p className="text-center text-xs text-[var(--color-neutral-500)]">
        Forgotten your password? Contact the showroom and we&rsquo;ll reset it for you.
      </p>
    </form>
  );
}
