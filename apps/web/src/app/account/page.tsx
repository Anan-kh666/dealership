import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@dealership/db";
import { auth } from "@/server/auth";
import { countClaimable } from "@/server/claim";
import { ClaimBanner } from "./claim-banner";

export const dynamic = "force-dynamic";

export default async function AccountIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ claim?: string }>;
}): Promise<React.ReactElement> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in?callbackUrl=/account");
  const userId = session.user.id;
  const sp = await searchParams;

  const [user, builds, upcomingDrives, applications] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, claimedAt: true },
    }),
    prisma.build.count({ where: { userId } }),
    prisma.testDrive.count({
      where: {
        userId,
        scheduledAt: { gte: new Date() },
        status: { in: ["REQUESTED", "CONFIRMED"] },
      },
    }),
    prisma.financeApplication.count({
      where: {
        userId,
        status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
      },
    }),
  ]);
  if (!user) redirect("/sign-in?callbackUrl=/account");

  const claimable = await countClaimable(user.email);
  const showBanner =
    claimable.total > 0 && (!user.claimedAt || sp.claim === "1");

  return (
    <div className="flex flex-col gap-10">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-neutral-500)]">
          Welcome back
        </p>
        <h1
          className="mt-2 font-[family-name:var(--font-display)] tracking-[-0.02em] text-[var(--color-graphite)]"
          style={{ fontSize: "clamp(32px, 4vw, 44px)", lineHeight: 1.05 }}
        >
          {user.name ?? user.email}
        </h1>
      </div>

      {showBanner ? <ClaimBanner counts={claimable} /> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Saved builds" value={builds} href="/account/builds" />
        <Stat
          label="Upcoming test drives"
          value={upcomingDrives}
          href="/account/test-drives"
        />
        <Stat
          label="Open applications"
          value={applications}
          href="/account/applications"
        />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}): React.ReactElement {
  return (
    <Link
      href={href}
      className="block rounded-md border border-[var(--color-neutral-200)] bg-white p-5 transition-colors hover:border-[var(--color-accent)]"
    >
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-neutral-500)]">
        {label}
      </p>
      <p className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-[-0.02em] text-[var(--color-graphite)]">
        {value}
      </p>
    </Link>
  );
}
