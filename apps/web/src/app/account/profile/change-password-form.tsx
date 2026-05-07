"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Input } from "@dealership/ui/components/input";
import { Label } from "@dealership/ui/components/label";
import { BrandButton } from "@dealership/ui/components/brand-button";
import {
  changePasswordAction,
  type Result,
} from "@/server/actions/account-actions";

export function ChangePasswordForm(): React.ReactElement {
  const [state, action] = useActionState<Result | null, FormData>(
    changePasswordAction,
    null,
  );
  const formRef = React.useRef<HTMLFormElement | null>(null);

  React.useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label htmlFor="currentPassword">Current password</Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          className="mt-2"
        />
      </div>
      <div>
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="mt-2"
        />
      </div>
      <div>
        <Label htmlFor="confirm">Confirm new password</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="mt-2"
        />
      </div>
      {state ? (
        <div className="sm:col-span-2">
          {state.ok ? (
            <p className="text-sm text-[var(--color-neutral-700)]">
              Password updated. Other devices have been signed out.
            </p>
          ) : (
            <div className="rounded-md bg-[#FBE9E5] px-4 py-3 text-sm text-[var(--color-graphite)]">
              {state.error}
            </div>
          )}
        </div>
      ) : null}
      <div className="sm:col-span-2">
        <Submit />
      </div>
    </form>
  );
}

function Submit(): React.ReactElement {
  const { pending } = useFormStatus();
  return (
    <BrandButton type="submit" size="md" disabled={pending}>
      {pending ? "Updating…" : "Change password"}
    </BrandButton>
  );
}
