"use client";

import * as React from "react";
import { useActionState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { Input } from "@dealership/ui/components/input";
import { Label } from "@dealership/ui/components/label";
import { BrandButton } from "@dealership/ui/components/brand-button";
import {
  signInAction,
  resendVerificationAction,
  type ActionResult,
} from "@/server/actions/auth-actions";
import { startOAuthSignIn } from "@/server/actions/oauth-actions";

export function SignInForm({
  callbackUrl,
  googleEnabled,
  appleEnabled,
}: {
  callbackUrl?: string;
  googleEnabled: boolean;
  appleEnabled: boolean;
}): React.ReactElement {
  const [state, action] = useActionState<ActionResult | null, FormData>(
    signInAction,
    null,
  );
  const [resentFor, setResentFor] = React.useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <ProviderButton
          name="google"
          label="Continue with Google"
          enabled={googleEnabled}
          callbackUrl={callbackUrl}
        />
        <ProviderButton
          name="apple"
          label="Continue with Apple"
          enabled={appleEnabled}
          callbackUrl={callbackUrl}
        />
      </div>

      <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-[var(--color-neutral-500)]">
        <span className="h-px flex-1 bg-[var(--color-neutral-200)]" />
        or
        <span className="h-px flex-1 bg-[var(--color-neutral-200)]" />
      </div>

      <form action={action} className="flex flex-col gap-4">
        {callbackUrl ? (
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
        ) : null}
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs text-[var(--color-neutral-600)] underline-offset-2 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="mt-2"
          />
        </div>

        {state && state.ok === false ? (
          <ErrorBanner
            error={state.error}
            code={state.code}
            email={
              state.code === "unverified"
                ? formEmailFallback()
                : null
            }
            onResent={setResentFor}
          />
        ) : null}

        {resentFor ? (
          <p className="text-sm text-[var(--color-neutral-700)]">
            Verification email sent to {resentFor}.
          </p>
        ) : null}

        <SubmitButton label="Sign in" />
      </form>

      <p className="text-sm text-[var(--color-neutral-600)]">
        Don&rsquo;t have an account?{" "}
        <Link href="/sign-up" className="text-[var(--color-graphite)] underline-offset-2 hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}

function formEmailFallback(): string | null {
  if (typeof document === "undefined") return null;
  const el = document.getElementById("email") as HTMLInputElement | null;
  return el?.value ?? null;
}

function ErrorBanner({
  error,
  code,
  email,
  onResent,
}: {
  error: string;
  code?: string;
  email: string | null;
  onResent: (e: string) => void;
}): React.ReactElement {
  return (
    <div className="rounded-md bg-[#FBE9E5] px-4 py-3 text-sm text-[var(--color-graphite)]">
      <p>{error}</p>
      {code === "unverified" && email ? (
        <form
          className="mt-2"
          action={async (fd: FormData) => {
            fd.set("email", email);
            await resendVerificationAction(null, fd);
            onResent(email);
          }}
        >
          <button
            type="submit"
            className="text-[var(--color-graphite)] underline underline-offset-2 hover:opacity-70"
          >
            Resend verification email
          </button>
        </form>
      ) : null}
    </div>
  );
}

function SubmitButton({ label }: { label: string }): React.ReactElement {
  const { pending } = useFormStatus();
  return (
    <BrandButton type="submit" size="lg" disabled={pending}>
      {pending ? "Signing in…" : label}
    </BrandButton>
  );
}

function ProviderButton({
  name,
  label,
  enabled,
  callbackUrl,
}: {
  name: "google" | "apple";
  label: string;
  enabled: boolean;
  callbackUrl?: string;
}): React.ReactElement {
  const [notice, setNotice] = React.useState<string | null>(null);
  return (
    <>
      <button
        type="button"
        onClick={async () => {
          if (!enabled) {
            setNotice(`${label.replace("Continue with ", "")} sign-in is not configured.`);
            return;
          }
          await startOAuthSignIn(name, callbackUrl);
        }}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-graphite)]/30 bg-white px-6 text-[15px] text-[var(--color-graphite)] transition-colors hover:bg-[var(--color-graphite)]/5"
      >
        {label}
      </button>
      {notice ? (
        <p className="text-xs text-[var(--color-neutral-600)]">{notice}</p>
      ) : null}
    </>
  );
}
