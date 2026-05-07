import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = { title: "Create account" };

export const dynamic = "force-dynamic";

export default async function SignUpPage(): Promise<React.ReactElement> {
  const session = await auth();
  if (session?.user) redirect("/account");

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-neutral-500)]">
        Account
      </p>
      <h1
        className="mt-2 font-[family-name:var(--font-display)] tracking-[-0.02em] text-[var(--color-graphite)]"
        style={{ fontSize: "clamp(32px, 4vw, 44px)", lineHeight: 1.05 }}
      >
        Create account
      </h1>
      <p className="mt-2 text-sm text-[var(--color-neutral-600)]">
        We&rsquo;ll email you a link to verify your address.
      </p>
      <div className="mt-8">
        <SignUpForm />
      </div>
    </div>
  );
}
