import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser, safeCallbackUrl } from "@/server/session";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create an account to track your test drives, financing and trade-in requests.",
  robots: { index: false },
};

export default async function RegisterPage({
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
          Join us
        </p>
        <h1
          className="font-[family-name:var(--font-display)] tracking-[-0.02em]"
          style={{ fontSize: "clamp(36px, 5vw, 48px)", lineHeight: 1.05 }}
        >
          Create an account
        </h1>
        <p className="text-[15px] text-[var(--color-neutral-600)]">
          Already registered?{" "}
          <Link
            href={`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="font-medium text-[var(--color-accent-deep)] underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </header>
      <RegisterForm callbackUrl={callbackUrl} />
    </div>
  );
}
