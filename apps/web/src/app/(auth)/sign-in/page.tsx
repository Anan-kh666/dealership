import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser, safeCallbackUrl } from "@/server/session";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to manage your test drives, financing applications and trade-ins.",
  robots: { index: false },
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}): Promise<React.ReactElement> {
  const { callbackUrl: raw } = await searchParams;
  const callbackUrl = safeCallbackUrl(raw);
  if (await getSessionUser()) redirect(callbackUrl);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-neutral-500)]">
          Welcome back
        </p>
        <h1
          className="font-[family-name:var(--font-display)] tracking-[-0.02em]"
          style={{ fontSize: "clamp(36px, 5vw, 48px)", lineHeight: 1.05 }}
        >
          Sign in
        </h1>
        <p className="text-[15px] text-[var(--color-neutral-600)]">
          New here?{" "}
          <Link
            href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="font-medium text-[var(--color-accent-deep)] underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </p>
      </header>
      <SignInForm callbackUrl={callbackUrl} />
    </div>
  );
}
