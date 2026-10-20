import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { prisma } from "@dealership/db";
import { testDriveReferenceFromId } from "@dealership/types";
import { StatusPill } from "@/components/status-pill";
import { formatDateLong, formatRelative, formatTime } from "@/lib/dates";
import { formatPrice } from "@/lib/format";
import { STOCK_STATUS, TEST_DRIVE_STATUS } from "@/lib/status";
import { requireStaff } from "@/server/session";
import { AdminPageHeader, Card } from "./ui";

export const metadata: Metadata = { title: "Overview" };

const DAY = 24 * 60 * 60 * 1000;

async function loadOverview() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * DAY);

  const [
    drivesWeek,
    appsWeek,
    tradeInsWeek,
    inquiriesWeek,
    upcoming,
    stockGroups,
    stockValue,
    recentApps,
    recentTradeIns,
    recentInquiries,
    recentDrives,
  ] = await Promise.all([
    prisma.testDrive.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.financeApplication.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.tradeIn.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.inquiry.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.testDrive.findMany({
      where: { scheduledAt: { gte: now }, status: { in: ["REQUESTED", "CONFIRMED"] } },
      orderBy: { scheduledAt: "asc" },
      take: 6,
      include: {
        model: { select: { name: true } },
        stockUnit: { select: { trim: { select: { name: true, model: { select: { name: true } } } } } },
      },
    }),
    prisma.stockUnit.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.stockUnit.aggregate({
      where: { status: { in: ["AVAILABLE", "IN_TRANSIT"] } },
      _sum: { totalPrice: true },
    }),
    prisma.financeApplication.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, applicantName: true, vehicleLabel: true, createdAt: true },
    }),
    prisma.tradeIn.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, contactName: true, year: true, make: true, model: true, createdAt: true },
    }),
    prisma.inquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, source: true, createdAt: true },
    }),
    prisma.testDrive.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        guestName: true,
        scheduledAt: true,
        createdAt: true,
        status: true,
        model: { select: { name: true } },
        stockUnit: { select: { trim: { select: { name: true, model: { select: { name: true } } } } } },
      },
    }),
  ]);

  const activity = [
    ...recentApps.map((a) => ({
      at: a.createdAt,
      href: `/admin/financing/${a.id}`,
      text: `${a.applicantName} applied for financing${a.vehicleLabel ? ` · ${a.vehicleLabel}` : ""}`,
    })),
    ...recentTradeIns.map((t) => ({
      at: t.createdAt,
      href: `/admin/trade-ins/${t.id}`,
      text: `${t.contactName} submitted a ${t.year} ${t.make} ${t.model} for valuation`,
    })),
    ...recentDrives.map((d) => ({
      at: d.createdAt,
      href: "/admin/test-drives",
      text: `${d.guestName ?? "A customer"} booked a test drive · ${
        d.stockUnit ? `${d.stockUnit.trim.model.name} ${d.stockUnit.trim.name}` : (d.model?.name ?? "vehicle TBC")
      }, ${formatDateLong(d.scheduledAt)}${d.status === "CANCELED" ? " (cancelled)" : ""}`,
    })),
    ...recentInquiries.map((i) => ({
      at: i.createdAt,
      href: "/admin/inquiries",
      text: `${i.name} sent an enquiry${i.source ? ` (${i.source})` : ""}`,
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 8);

  return {
    week: { drivesWeek, appsWeek, tradeInsWeek, inquiriesWeek },
    upcoming,
    stock: Object.fromEntries(stockGroups.map((g) => [g.status, g._count._all])) as Partial<
      Record<keyof typeof STOCK_STATUS, number>
    >,
    stockValue: Number(stockValue._sum.totalPrice ?? 0),
    activity,
  };
}

export default async function AdminOverviewPage(): Promise<React.ReactElement> {
  const user = await requireStaff();
  const data = await loadOverview();
  const firstName = user.name?.split(/\s+/)[0] ?? "there";

  return (
    <>
      <AdminPageHeader
        title={`Good to see you, ${firstName}.`}
        description="Here's what's happening at the showroom this week."
      />

      <section aria-label="Leads in the last 7 days" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Test drives booked" value={data.week.drivesWeek} href="/admin/test-drives" />
        <Kpi label="Finance applications" value={data.week.appsWeek} href="/admin/financing" />
        <Kpi label="Trade-in requests" value={data.week.tradeInsWeek} href="/admin/trade-ins" />
        <Kpi label="Enquiries" value={data.week.inquiriesWeek} href="/admin/inquiries" />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <div className="flex items-center justify-between border-b border-[var(--color-neutral-200)] px-5 py-4">
            <h2 className="font-medium">Upcoming test drives</h2>
            <Link href="/admin/test-drives" className="text-xs text-[var(--color-accent-deep)] hover:underline">
              View all
            </Link>
          </div>
          {data.upcoming.length === 0 ? (
            <p className="px-5 py-8 text-sm text-[var(--color-neutral-500)]">Nothing scheduled.</p>
          ) : (
            <ul className="divide-y divide-[var(--color-neutral-200)]">
              {data.upcoming.map((d) => {
                const vehicle = d.stockUnit
                  ? `${d.stockUnit.trim.model.name} ${d.stockUnit.trim.name}`
                  : (d.model?.name ?? "Vehicle TBC");
                const meta = TEST_DRIVE_STATUS[d.status];
                return (
                  <li key={d.id} className="flex items-center justify-between gap-4 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {d.guestName ?? "Customer"} · {vehicle}
                      </p>
                      <p className="text-xs text-[var(--color-neutral-500)]">
                        {formatDateLong(d.scheduledAt)}, {formatTime(d.scheduledAt)} ·{" "}
                        <span className="font-mono">{testDriveReferenceFromId(d.id)}</span>
                      </p>
                    </div>
                    <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between border-b border-[var(--color-neutral-200)] px-5 py-4">
            <h2 className="font-medium">Inventory</h2>
            <Link href="/admin/inventory" className="text-xs text-[var(--color-accent-deep)] hover:underline">
              Manage
            </Link>
          </div>
          <dl className="grid grid-cols-2 gap-px bg-[var(--color-neutral-200)]">
            {(Object.keys(STOCK_STATUS) as (keyof typeof STOCK_STATUS)[]).map((s) => (
              <div key={s} className="bg-white px-5 py-4">
                <dt className="text-xs text-[var(--color-neutral-500)]">{STOCK_STATUS[s].label}</dt>
                <dd className="font-[family-name:var(--font-display)] text-2xl tabular-nums">
                  {data.stock[s] ?? 0}
                </dd>
              </div>
            ))}
          </dl>
          <p className="border-t border-[var(--color-neutral-200)] px-5 py-4 text-sm text-[var(--color-neutral-600)]">
            Saleable stock value{" "}
            <span className="font-medium tabular-nums text-[var(--color-graphite)]">
              {formatPrice(data.stockValue)}
            </span>
          </p>
        </Card>
      </div>

      <Card>
        <div className="border-b border-[var(--color-neutral-200)] px-5 py-4">
          <h2 className="font-medium">Recent activity</h2>
        </div>
        {data.activity.length === 0 ? (
          <p className="px-5 py-8 text-sm text-[var(--color-neutral-500)]">No activity yet.</p>
        ) : (
          <ul className="divide-y divide-[var(--color-neutral-200)]">
            {data.activity.map((a, i) => (
              <li key={i}>
                <Link
                  href={a.href}
                  className="flex items-center justify-between gap-4 px-5 py-3 text-sm hover:bg-[var(--color-neutral-50)]"
                >
                  <span className="truncate">{a.text}</span>
                  <span className="shrink-0 text-xs text-[var(--color-neutral-500)]">
                    {formatRelative(a.at)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

function Kpi({ label, value, href }: { label: string; value: number; href: string }): React.ReactElement {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-2 rounded-[var(--radius-lg)] border border-[var(--color-neutral-200)] bg-white p-5 transition-shadow hover:shadow-[var(--shadow-2)]"
    >
      <span className="text-xs text-[var(--color-neutral-500)]">{label}</span>
      <span className="font-[family-name:var(--font-display)] text-3xl tabular-nums tracking-[-0.02em]">
        {value}
      </span>
      <span className="inline-flex items-center gap-1 text-xs text-[var(--color-neutral-500)] group-hover:text-[var(--color-accent-deep)]">
        Last 7 days <ArrowRight className="h-3 w-3" aria-hidden />
      </span>
    </Link>
  );
}
