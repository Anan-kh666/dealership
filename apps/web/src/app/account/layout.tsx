import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { Container } from "@dealership/ui/components/container";
import { SiteChrome } from "@/components/site-chrome";
import { requireUser } from "@/server/session";
import { signOutAction } from "../(auth)/actions";
import { AccountNav } from "./account-nav";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Your account", template: "%s · Your account" },
  robots: { index: false },
};

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const user = await requireUser();
  const firstName = user.name?.split(/\s+/)[0] ?? "there";

  return (
    <SiteChrome>
      <div className="bg-[var(--color-surface-warm)] pb-24 pt-28 md:pt-36">
        <Container>
          <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-2">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-neutral-500)]">
                Your account
              </p>
              <h1
                className="font-[family-name:var(--font-display)] tracking-[-0.02em]"
                style={{ fontSize: "clamp(36px, 5vw, 56px)", lineHeight: 1.05 }}
              >
                Hello, {firstName}.
              </h1>
              <p className="text-sm text-[var(--color-neutral-600)]">{user.email}</p>
            </div>
            <form action={signOutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 text-sm text-[var(--color-neutral-600)] underline-offset-4 hover:text-[var(--color-graphite)] hover:underline"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                Sign out
              </button>
            </form>
          </header>

          <div className="mt-10 grid gap-8 lg:grid-cols-[220px_1fr] lg:gap-12">
            <AccountNav />
            <div className="min-w-0">{children}</div>
          </div>
        </Container>
      </div>
    </SiteChrome>
  );
}
