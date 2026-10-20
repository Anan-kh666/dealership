import Link from "next/link";
import type { Metadata } from "next";
import { ExternalLink, LogOut } from "lucide-react";
import { prisma } from "@dealership/db";
import { SITE } from "@dealership/types";
import { requireStaff } from "@/server/session";
import { signOutAction } from "../(auth)/actions";
import { AdminNav, type AdminNavCounts } from "./admin-nav";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Admin", template: `%s · Admin · ${SITE.name}` },
  robots: { index: false, follow: false },
};

async function pendingCounts(): Promise<AdminNavCounts> {
  const [testDrives, financing, tradeIns, inquiries] = await Promise.all([
    prisma.testDrive.count({ where: { status: "REQUESTED" } }),
    prisma.financeApplication.count({ where: { status: "SUBMITTED" } }),
    prisma.tradeIn.count({ where: { status: "SUBMITTED" } }),
    prisma.inquiry.count({ where: { status: "NEW" } }),
  ]);
  return { testDrives, financing, tradeIns, inquiries };
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const user = await requireStaff();
  const counts = await pendingCounts();

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-neutral-50)] lg:flex-row">
      <aside className="border-b border-[var(--color-neutral-200)] bg-white lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-5 py-4 lg:py-6">
            <Link
              href="/admin"
              className="font-[family-name:var(--font-display)] text-lg uppercase tracking-[var(--tracking-wide-wordmark)]"
            >
              {SITE.name}
              <span className="ml-2 align-middle text-[10px] font-medium tracking-[0.16em] text-[var(--color-accent-deep)]">
                ADMIN
              </span>
            </Link>
            <form action={signOutAction} className="lg:hidden">
              <button
                type="submit"
                aria-label="Sign out"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-100)]"
              >
                <LogOut className="h-4 w-4" aria-hidden />
              </button>
            </form>
          </div>
          <AdminNav counts={counts} />
          <div className="mt-auto hidden flex-col gap-3 border-t border-[var(--color-neutral-200)] px-5 py-5 text-sm lg:flex">
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-xs text-[var(--color-neutral-500)]">
                {user.email} · {user.role.toLowerCase()}
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[var(--color-neutral-600)] hover:text-[var(--color-graphite)]"
            >
              <ExternalLink className="h-4 w-4" aria-hidden /> View website
            </Link>
            <form action={signOutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 text-[var(--color-neutral-600)] hover:text-[var(--color-graphite)]"
              >
                <LogOut className="h-4 w-4" aria-hidden /> Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>
      <main id="main" className="min-w-0 flex-1 px-4 py-8 md:px-8 lg:px-10 lg:py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">{children}</div>
      </main>
    </div>
  );
}
