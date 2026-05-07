"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Input } from "@dealership/ui/components/input";
import { Label } from "@dealership/ui/components/label";
import { BrandButton } from "@dealership/ui/components/brand-button";
import {
  requestEmailChangeAction,
  type Result,
} from "@/server/actions/account-actions";

export function ChangeEmailForm(): React.ReactElement {
  const [state, action] = useActionState<Result | null, FormData>(
    requestEmailChangeAction,
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="flex-1">
        <Label htmlFor="email">New email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-2"
        />
      </div>
      <Submit />
      {state ? (
        <div className="w-full">
          {state.ok ? (
            <p className="text-sm text-[var(--color-neutral-700)]">
              Confirmation link sent. Click it to switch your email.
            </p>
          ) : (
            <div className="rounded-md bg-[#FBE9E5] px-4 py-3 text-sm text-[var(--color-graphite)]">
              {state.error}
            </div>
          )}
        </div>
      ) : null}
    </form>
  );
}

function Submit(): React.ReactElement {
  const { pending } = useFormStatus();
  return (
    <BrandButton type="submit" size="md" disabled={pending}>
      {pending ? "Sending…" : "Send link"}
    </BrandButton>
  );
}
