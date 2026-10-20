import Link from "next/link";
import type { Metadata } from "next";
import { prisma, type Prisma, type TestDriveStatus } from "@dealership/db";
import { testDriveReferenceFromId } from "@dealership/types";
import { formatDateLong, formatTime } from "@/lib/dates";
import { TEST_DRIVE_STATUS } from "@/lib/status";
import { requireStaff } from "@/server/session";
import { setTestDriveStatus } from "../actions";
import { StatusSelect } from "../status-select";
import { AdminPageHeader, EmptyRow, Muted, StatusTabs, Table, parseStatus } from "../ui";

export const metadata: Metadata = { title: "Test drives" };

const STATUSES = Object.keys(TEST_DRIVE_STATUS) as TestDriveStatus[];
const OPTIONS = STATUSES.map((s) => ({ value: s, label: TEST_DRIVE_STATUS[s].label }));

export default async function AdminTestDrivesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; when?: string }>;
}): Promise<React.ReactElement> {
  await requireStaff();
  const sp = await searchParams;
  const status = parseStatus(sp.status, STATUSES);
  const past = sp.when === "past";

  const now = new Date();
  const where: Prisma.TestDriveWhereInput = {
    ...(status ? { status } : {}),
    scheduledAt: past ? { lt: now } : { gte: now },
  };

  const [rows, grouped] = await Promise.all([
    prisma.testDrive.findMany({
      where,
      orderBy: { scheduledAt: past ? "desc" : "asc" },
      take: 200,
      include: {
        model: { select: { name: true, slug: true } },
        stockUnit: {
          select: { slug: true, vin: true, trim: { select: { name: true, model: { select: { name: true } } } } },
        },
      },
    }),
    prisma.testDrive.groupBy({
      by: ["status"],
      where: { scheduledAt: past ? { lt: now } : { gte: now } },
      _count: { _all: true },
    }),
  ]);
  const counts: Partial<Record<TestDriveStatus | "ALL", number>> = { ALL: 0 };
  for (const g of grouped) {
    counts[g.status] = g._count._all;
    counts.ALL = (counts.ALL ?? 0) + g._count._all;
  }

  return (
    <>
      <AdminPageHeader
        title="Test drives"
        description="Confirm requested bookings, and mark completed or missed drives afterwards."
        actions={
          <div className="inline-flex rounded-full border border-[var(--color-neutral-200)] bg-white p-1 text-xs">
            <Link
              href="/admin/test-drives"
              className={`rounded-full px-3 py-1.5 ${!past ? "bg-[var(--color-graphite)] text-white" : ""}`}
            >
              Upcoming
            </Link>
            <Link
              href="/admin/test-drives?when=past"
              className={`rounded-full px-3 py-1.5 ${past ? "bg-[var(--color-graphite)] text-white" : ""}`}
            >
              Past
            </Link>
          </div>
        }
      />

      <StatusTabs
        basePath="/admin/test-drives"
        current={status}
        options={OPTIONS}
        counts={counts}
        {...(past ? { query: { when: "past" } } : {})}
      />

      <Table>
        <thead>
          <tr>
            <th>When</th>
            <th>Customer</th>
            <th>Vehicle</th>
            <th>Licence</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <EmptyRow colSpan={5}>No test drives match this filter.</EmptyRow>
          ) : (
            rows.map((r) => {
              const vehicle = r.stockUnit
                ? `${r.stockUnit.trim.model.name} ${r.stockUnit.trim.name}`
                : (r.model?.name ?? "Vehicle TBC");
              const href = r.stockUnit
                ? `/stock/${r.stockUnit.slug}`
                : r.model
                  ? `/models/${r.model.slug}`
                  : null;
              return (
                <tr key={r.id}>
                  <td className="whitespace-nowrap">
                    <div className="font-medium">{formatDateLong(r.scheduledAt)}</div>
                    <Muted>
                      {formatTime(r.scheduledAt)} ·{" "}
                      <span className="font-mono">{testDriveReferenceFromId(r.id)}</span>
                    </Muted>
                  </td>
                  <td>
                    <div className="font-medium">{r.guestName ?? "—"}</div>
                    <div className="flex flex-col">
                      {r.guestPhone ? (
                        <a href={`tel:${r.guestPhone}`} className="text-xs hover:underline">
                          {r.guestPhone}
                        </a>
                      ) : null}
                      {r.guestEmail ? (
                        <a href={`mailto:${r.guestEmail}`} className="text-xs hover:underline">
                          {r.guestEmail}
                        </a>
                      ) : null}
                    </div>
                  </td>
                  <td>
                    {href ? (
                      <Link href={href} target="_blank" className="hover:underline">
                        {vehicle}
                      </Link>
                    ) : (
                      vehicle
                    )}
                    {r.stockUnit ? (
                      <div>
                        <Muted>
                          In-stock · <span className="font-mono">{r.stockUnit.vin}</span>
                        </Muted>
                      </div>
                    ) : null}
                    {r.notes ? (
                      <p className="mt-1 max-w-xs text-xs text-[var(--color-neutral-600)]">
                        “{r.notes}”
                      </p>
                    ) : null}
                  </td>
                  <td className="font-mono text-xs">{r.drivingLicense ?? "—"}</td>
                  <td>
                    <StatusSelect
                      action={setTestDriveStatus}
                      id={r.id}
                      value={r.status}
                      options={OPTIONS}
                      label={`Status for ${r.guestName ?? "booking"}`}
                    />
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </Table>
    </>
  );
}
