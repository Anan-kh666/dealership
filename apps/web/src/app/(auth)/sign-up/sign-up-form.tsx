"use client";

import * as React from "react";
import { useActionState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { Input } from "@dealership/ui/components/input";
import { Label } from "@dealership/ui/components/label";
import { BrandButton } from "@dealership/ui/components/brand-button";
import {
  signUpAction,
  type ActionResult,
} from "@/server/actions/auth-actions";

export function SignUpForm(): React.ReactElement {
  const [state, action] = useActionState<ActionResult | null, FormData>(
    signUpAction,
    null,
  );

  if (state?.ok) {
    return (
      <div className="rounded-md bg-[var(--color-surface-warm)] px-5 py-6">
        <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-[-0.02em]">
          Check your email.
        </h2>
        <p className="mt-2 text-sm text-[var(--color-neutral-700)]">
          We&rsquo;ve sent a verification link. Open it in the next 24 hours
          to activate your account.
        </p>
        <p className="mt-3 text-xs text-[var(--color-neutral-600)]">
          Didn&rsquo;t arrive? Check your spam folder, or{" "}
          <Link
            href="/sign-up"
            className="text-[var(--color-graphite)] underline underline-offset-2"
          >
            try again
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="name">Name (optional)</Label>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          className="mt-2"
        />
      </div>
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
      <div>
        <Label htmlFor="password">Password</Label>
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

      {state && state.ok === false ? (
        <div className="rounded-md bg-[#FBE9E5] px-4 py-3 text-sm text-[var(--color-graphite)]">
          {state.error}
        </div>
      ) : null}

      <Submit />

      <p className="text-sm text-[var(--color-neutral-600)]">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="text-[var(--color-graphite)] underline-offset-2 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}

function Submit(): React.ReactElement {
  const { pending } = useFormStatus();
  return (
    <BrandButton type="submit" size="lg" disabled={pending}>
      {pending ? "Creating…" : "Create account"}
    </BrandButton>
  );
}
