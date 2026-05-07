import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, providerConfigured } from "@/server/auth";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; verified?: string; reset?: string }>;
}): Promise<React.ReactElement> {
  const session = await auth();
  const sp = await searchParams;
  if (session?.user) {
    redirect(sp.callbackUrl ?? "/account");
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
        Sign in
      </h1>
      <p className="mt-2 text-sm text-[var(--color-neutral-600)]">
        Welcome back.
      </p>

      {sp.verified === "1" ? (
        <div className="mt-6 rounded-md bg-[#FBE9E5] px-4 py-3 text-sm text-[var(--color-graphite)]">
          Email verified. You can sign in now.
        </div>
      ) : null}
      {sp.reset === "1" ? (
        <div className="mt-6 rounded-md bg-[#FBE9E5] px-4 py-3 text-sm text-[var(--color-graphite)]">
          Password updated. Sign in with your new password.
        </div>
      ) : null}

      <div className="mt-8">
        <SignInForm
          callbackUrl={sp.callbackUrl}
          googleEnabled={providerConfigured("google")}
          appleEnabled={providerConfigured("apple")}
        />
      </div>
    </div>
  );
}
