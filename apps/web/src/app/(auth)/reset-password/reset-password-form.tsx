"use client";

import * as React from "react";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { Input } from "@dealership/ui/components/input";
import { Label } from "@dealership/ui/components/label";
import { BrandButton } from "@dealership/ui/components/brand-button";
import {
  resetPasswordAction,
  type ActionResult,
} from "@/server/actions/auth-actions";

export function ResetPasswordForm({
  token,
}: {
  token: string;
}): React.ReactElement {
  const router = useRouter();
  const [state, action] = useActionState<ActionResult | null, FormData>(
    resetPasswordAction,
    null,
  );

  useEffect(() => {
    if (state?.ok) {
      router.push("/sign-in?reset=1");
    }
  }, [state, router]);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
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
        <p className="mt-1 text-xs text-[var(--color-neutral-600)]">
          At least 8 characters, with one letter and one number.
        </p>
      </div>
      <div>
        <Label htmlFor="confirm">Confirm new password</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          className="mt-2"
        />
      </div>

      {state && state.ok === false ? (
        <div className="rounded-md bg-[#FBE9E5] px-4 py-3 text-sm text-[var(--color-graphite)]">
          {state.error}
        </div>
      ) : null}

      <Submit />
    </form>
  );
}

function Submit(): React.ReactElement {
  const { pending } = useFormStatus();
  return (
    <BrandButton type="submit" size="lg" disabled={pending}>
      {pending ? "Updating…" : "Update password"}
    </BrandButton>
  );
}
