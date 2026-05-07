import type { Metadata } from "next";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage(): React.ReactElement {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-neutral-500)]">
        Account
      </p>
      <h1
        className="mt-2 font-[family-name:var(--font-display)] tracking-[-0.02em] text-[var(--color-graphite)]"
        style={{ fontSize: "clamp(32px, 4vw, 44px)", lineHeight: 1.05 }}
      >
        Forgot password
      </h1>
      <p className="mt-2 text-sm text-[var(--color-neutral-600)]">
        Enter your email and we&rsquo;ll send you a reset link.
      </p>
      <div className="mt-8">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
