"use client";

import { useActionState, useEffect, useRef } from "react";
import { Field, FormAlert, SubmitButton, TextInput } from "@/components/forms/fields";
import { changePasswordAction, updateProfileAction, type AccountFormState } from "../actions";

export function ProfileForm({
  name,
  email,
  phone,
}: {
  name: string;
  email: string;
  phone: string;
}): React.ReactElement {
  const [state, action] = useActionState<AccountFormState, FormData>(updateProfileAction, {});
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="grid gap-5 p-6 md:grid-cols-2" noValidate>
      {state.ok ? (
        <div className="md:col-span-2">
          <FormAlert tone="success">{state.message}</FormAlert>
        </div>
      ) : null}
      <Field label="Full name" htmlFor="name" error={fe.name}>
        <TextInput id="name" name="name" defaultValue={name} autoComplete="name" invalid={!!fe.name} />
      </Field>
      <Field label="Mobile number" htmlFor="phone" error={fe.phone} hint="e.g. 012-345 6789">
        <TextInput
          id="phone"
          name="phone"
          type="tel"
          defaultValue={phone}
          autoComplete="tel"
          invalid={!!fe.phone}
        />
      </Field>
      <Field label="Email" htmlFor="email" className="md:col-span-2">
        <TextInput id="email" value={email} disabled readOnly />
      </Field>
      <div className="md:col-span-2">
        <SubmitButton variant="secondary" size="md" pendingLabel="Saving…">
          Save changes
        </SubmitButton>
      </div>
    </form>
  );
}

export function PasswordForm(): React.ReactElement {
  const [state, action] = useActionState<AccountFormState, FormData>(changePasswordAction, {});
  const formRef = useRef<HTMLFormElement>(null);
  const fe = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="grid gap-5 p-6 md:grid-cols-2" noValidate>
      {state.ok ? (
        <div className="md:col-span-2">
          <FormAlert tone="success">{state.message}</FormAlert>
        </div>
      ) : null}
      <Field
        label="Current password"
        htmlFor="currentPassword"
        error={fe.currentPassword}
        className="md:col-span-2"
      >
        <TextInput
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          invalid={!!fe.currentPassword}
        />
      </Field>
      <Field label="New password" htmlFor="newPassword" error={fe.newPassword} hint="At least 8 characters.">
        <TextInput
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          invalid={!!fe.newPassword}
        />
      </Field>
      <Field label="Confirm new password" htmlFor="confirmPassword" error={fe.confirmPassword}>
        <TextInput
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          invalid={!!fe.confirmPassword}
        />
      </Field>
      <div className="md:col-span-2">
        <SubmitButton variant="secondary" size="md" pendingLabel="Updating…">
          Update password
        </SubmitButton>
      </div>
    </form>
  );
}
