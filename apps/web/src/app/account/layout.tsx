import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { prisma } from "@dealership/db";
import { touchSessionIfStale } from "@/server/sessions";

const NAV = [
  { href: "/account", label: "Overview" },
  { href: "/account/builds", label: "Saved builds" },
  { href: "/account/test-drives", label: "Test drives" },
  { href: "/account/applications", label: "Financing" },
  { href: "/account/trade-ins", label: "Trade-ins" },
  { href: "/account/profile", label: "Profile" },
  { href: "/account/sessions", label: "Sessions" },
];

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=/account");
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true },
  });
  if (!user) {
    redirect("/sign-in?callbackUrl=/account");
  }
  await touchSessionIfStale();

  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-[200px_1fr]">
        <aside className="md:sticky md:top-24 md:self-start">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-neutral-500)]">
            Account
          </p>
          <nav className="mt-3 flex flex-col gap-1 text-sm">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="py-2 text-[var(--color-graphite)] hover:text-[var(--color-accent)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="min-w-0">
          {children}
          <div className="mt-16 border-t border-[var(--color-neutral-200)] pt-6 text-right">
            <Link
              href="/account/profile#delete"
              className="text-xs text-[var(--color-neutral-500)] hover:text-[var(--color-graphite)]"
            >
              Delete account
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
