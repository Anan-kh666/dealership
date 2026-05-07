import type { Metadata } from "next";
import Link from "next/link";
import { verifyEmailAction } from "@/server/actions/verify-actions";

export const metadata: Metadata = { title: "Verify email" };

export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}): Promise<React.ReactElement> {
  const { token } = await searchParams;
  if (!token) {
    return <Invalid />;
  }
  const result = await verifyEmailAction(token);
  // verifyEmailAction redirects on success, so we only get here on failure.
  if (result && result.ok === false) {
    return <Invalid message={result.error} />;
  }
  return <Invalid />;
}

function Invalid({ message }: { message?: string } = {}): React.ReactElement {
  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-[-0.02em]">
        Link invalid or expired.
      </h1>
      <p className="mt-2 text-sm text-[var(--color-neutral-700)]">
        {message ??
          "Verification links expire after 24 hours. Sign in and we'll send you a new one."}
      </p>
      <Link
        href="/sign-in"
        className="mt-6 inline-block text-sm text-[var(--color-graphite)] underline underline-offset-2"
      >
        Go to sign in
      </Link>
    </div>
  );
}
