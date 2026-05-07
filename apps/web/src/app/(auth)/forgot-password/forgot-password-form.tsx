"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Input } from "@dealership/ui/components/input";
import { Label } from "@dealership/ui/components/label";
import { BrandButton } from "@dealership/ui/components/brand-button";
import {
  forgotPasswordAction,
  type ActionResult,
} from "@/server/actions/auth-actions";

export function ForgotPasswordForm(): React.ReactElement {
  const [state, action] = useActionState<ActionResult | null, FormData>(
    forgotPasswordAction,
    null,
  );

  if (state?.ok) {
    return (
      <div className="rounded-md bg-[var(--color-surface-warm)] px-5 py-6">
        <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-[-0.02em]">
          Check your email.
        </h2>
        <p className="mt-2 text-sm text-[var(--color-neutral-700)]">
          If that email exists, a reset link has been sent. The link expires
          in 24 hours.
        </p>
        <Link
          href="/sign-in"
          className="mt-4 inline-block text-sm text-[var(--color-graphite)] underline-offset-2 hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="email">Email</Label>
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
      <Link
        href="/sign-in"
        className="text-sm text-[var(--color-neutral-600)] underline-offset-2 hover:underline"
      >
        Back to sign in
      </Link>
    </form>
  );
}

function Submit(): React.ReactElement {
  const { pending } = useFormStatus();
  return (
    <BrandButton type="submit" size="lg" disabled={pending}>
      {pending ? "Sending…" : "Send reset link"}
    </BrandButton>
  );
}
