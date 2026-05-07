import type { Metadata } from "next";
import Link from "next/link";
import { peekToken } from "@/server/auth-tokens";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Reset password" };

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}): Promise<React.ReactElement> {
  const { token } = await searchParams;
  const valid = token ? await peekToken(token, "PASSWORD_RESET") : null;

  if (!token || !valid) {
    return (
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-[-0.02em]">
          Link invalid or expired.
        </h1>
        <p className="mt-2 text-sm text-[var(--color-neutral-700)]">
          Reset links expire after 24 hours. Request a new one to continue.
        </p>
        <Link
          href="/forgot-password"
          className="mt-6 inline-block text-sm text-[var(--color-graphite)] underline underline-offset-2"
        >
          Request a new reset link
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-neutral-500)]">
        Account
      </p>
      <h1
        className="mt-2 font-[family-name:var(--font-display)] tracking-[-0.02em] text-[var(--color-graphite)]"
        style={{ fontSize: "clamp(32px, 4vw, 44px)", lineHeight: 1.05 }}
      >
        Choose a new password
      </h1>
      <div className="mt-8">
        <ResetPasswordForm token={token} />
      </div>
    </div>
  );
}
