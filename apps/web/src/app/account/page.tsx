import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, CalendarClock, Car, Landmark } from "lucide-react";
import { BrandButton } from "@dealership/ui/components/brand-button";
import { StatusPill } from "@/components/status-pill";
import { getApplications, getTestDrives, getTradeIns } from "@/server/account-data";
import { requireUser } from "@/server/session";
import { formatDateLong, formatTime } from "@/lib/dates";
import { APP_STATUS, TEST_DRIVE_STATUS, TRADE_IN_STATUS } from "@/lib/status";
import { Panel } from "./ui";

export const metadata: Metadata = { title: "Overview" };

export default async function AccountOverviewPage(): Promise<React.ReactElement> {
  const user = await requireUser();
  const [drives, applications, tradeIns] = await Promise.all([
    getTestDrives(user),
    getApplications(user),
    getTradeIns(user),
  ]);

  const upcoming = drives
    .filter((d) => d.canCancel)
    .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())[0];
  const latestApp = applications[0];
  const latestTradeIn = tradeIns[0];
  const isNew = drives.length + applications.length + tradeIns.length === 0;

  return (
    <div className="flex flex-col gap-6">
      {isNew ? (
        <Panel>
          <div className="flex flex-col gap-4 p-6 md:p-8">
            <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-[-0.02em]">
              Welcome — let&rsquo;s get you behind the wheel.
            </h2>
            <p className="max-w-xl text-[15px] text-[var(--color-neutral-600)]">
              Bookings, financing applications and trade-ins you make with this email address will
              appear here automatically.
            </p>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <BrandButton asChild variant="primary" size="md">
                <Link href="/test-drive">Book a test drive</Link>
              </BrandButton>
              <BrandButton asChild variant="ghost-dark" size="md">
                <Link href="/build">Build &amp; price</Link>
              </BrandButton>
            </div>
          </div>
        </Panel>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Stat
          href="/account/test-drives"
          icon={<CalendarClock className="h-5 w-5" />}
          label="Test drives"
          value={drives.length}
        />
        <Stat
          href="/account/financing"
          icon={<Landmark className="h-5 w-5" />}
          label="Financing applications"
          value={applications.length}
        />
        <Stat
          href="/account/trade-ins"
          icon={<Car className="h-5 w-5" />}
          label="Trade-in valuations"
          value={tradeIns.length}
        />
      </div>

      <Panel
        title="Next test drive"
        action={
          <Link
            href="/test-drive"
            className="text-sm text-[var(--color-accent-deep)] underline-offset-4 hover:underline"
          >
            Book another
          </Link>
        }
      >
        {upcoming ? (
          <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-[family-name:var(--font-display)] text-2xl tracking-[-0.02em]">
                {upcoming.vehicleLabel}
              </p>
              <p className="mt-1 text-[15px] text-[var(--color-neutral-700)]">
                {formatDateLong(upcoming.scheduledAt)} at {formatTime(upcoming.scheduledAt)}
              </p>
              <p className="mt-1 font-mono text-xs text-[var(--color-neutral-500)]">
                {upcoming.reference}
              </p>
            </div>
            <StatusPill tone={TEST_DRIVE_STATUS[upcoming.status].tone}>
              {TEST_DRIVE_STATUS[upcoming.status].label}
            </StatusPill>
          </div>
        ) : (
          <p className="px-6 py-6 text-sm text-[var(--color-neutral-600)]">
            Nothing booked. Weekday mornings are the quietest time to visit.
          </p>
        )}
      </Panel>

      <div className="grid gap-6 md:grid-cols-2">
        <Panel title="Latest financing">
          {latestApp ? (
            <div className="flex flex-col gap-3 p-6">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium">{latestApp.vehicleLabel}</p>
                <StatusPill tone={APP_STATUS[latestApp.status].tone}>
                  {APP_STATUS[latestApp.status].label}
                </StatusPill>
              </div>
              <p className="text-sm text-[var(--color-neutral-600)]">
                {APP_STATUS[latestApp.status].description}
              </p>
            </div>
          ) : (
            <p className="px-6 py-6 text-sm text-[var(--color-neutral-600)]">
              No applications yet.{" "}
              <Link href="/financing" className="underline underline-offset-4">
                Estimate your monthly
              </Link>
              .
            </p>
          )}
        </Panel>
        <Panel title="Latest trade-in">
          {latestTradeIn ? (
            <div className="flex flex-col gap-3 p-6">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium">{latestTradeIn.vehicleLabel}</p>
                <StatusPill tone={TRADE_IN_STATUS[latestTradeIn.status].tone}>
                  {TRADE_IN_STATUS[latestTradeIn.status].label}
                </StatusPill>
              </div>
              <p className="text-sm text-[var(--color-neutral-600)]">
                {TRADE_IN_STATUS[latestTradeIn.status].description}
              </p>
            </div>
          ) : (
            <p className="px-6 py-6 text-sm text-[var(--color-neutral-600)]">
              No trade-ins yet.{" "}
              <Link href="/trade-in" className="underline underline-offset-4">
                Get a valuation
              </Link>
              .
            </p>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Stat({
  href,
  icon,
  label,
  value,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: number;
}): React.ReactElement {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-4 rounded-[var(--radius-lg)] border border-[var(--color-neutral-200)] bg-white p-5 transition-shadow hover:shadow-[var(--shadow-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
    >
      <div className="flex items-center gap-4">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-warm)] text-[var(--color-accent-deep)]">
          {icon}
        </span>
        <div>
          <p className="font-[family-name:var(--font-display)] text-2xl tabular-nums tracking-[-0.02em]">
            {value}
          </p>
          <p className="text-xs text-[var(--color-neutral-600)]">{label}</p>
        </div>
      </div>
      <ArrowRight
        className="h-4 w-4 text-[var(--color-neutral-400)] transition-transform group-hover:translate-x-0.5"
        aria-hidden
      />
    </Link>
  );
}
