import Link from "next/link";
import type { Metadata } from "next";
import { prisma, type StockStatus } from "@dealership/db";
import { formatPrice } from "@/lib/format";
import { STOCK_STATUS } from "@/lib/status";
import { requireStaff } from "@/server/session";
import { setStockStatus } from "../actions";
import { StatusSelect } from "../status-select";
import { AdminPageHeader, EmptyRow, Muted, StatusTabs, Table, parseStatus } from "../ui";

export const metadata: Metadata = { title: "Inventory" };

const STATUSES = Object.keys(STOCK_STATUS) as StockStatus[];
const OPTIONS = STATUSES.map((s) => ({ value: s, label: STOCK_STATUS[s].label }));

export default async function AdminInventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}): Promise<React.ReactElement> {
  await requireStaff();
  const status = parseStatus((await searchParams).status, STATUSES);

  const [rows, grouped, colors] = await Promise.all([
    prisma.stockUnit.findMany({
      where: status ? { status } : {},
      orderBy: [{ status: "asc" }, { daysOnLot: "desc" }],
      include: {
        trim: { select: { name: true, model: { select: { name: true, year: true } } } },
        _count: { select: { testDrives: true, inquiries: true, applications: true } },
      },
    }),
    prisma.stockUnit.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.color.findMany({ select: { id: true, name: true, hexCode: true } }),
  ]);
  const colorById = new Map(colors.map((c) => [c.id, c] as const));
  const counts: Partial<Record<StockStatus | "ALL", number>> = { ALL: 0 };
  for (const g of grouped) {
    counts[g.status] = g._count._all;
    counts.ALL = (counts.ALL ?? 0) + g._count._all;
  }

  return (
    <>
      <AdminPageHeader
        title="Inventory"
        description="Reserved and sold units disappear from the public stock list immediately."
      />
      <StatusTabs basePath="/admin/inventory" current={status} options={OPTIONS} counts={counts} />
      <Table>
        <thead>
          <tr>
            <th>Unit</th>
            <th>Colour</th>
            <th>Price</th>
            <th>On lot</th>
            <th>Interest</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <EmptyRow colSpan={6}>No units match this filter.</EmptyRow>
          ) : (
            rows.map((u) => {
              const color = colorById.get(u.exteriorColorId);
              const title = `${u.trim.model.year} ${u.trim.model.name} ${u.trim.name}`;
              return (
                <tr key={u.id}>
                  <td>
                    <Link href={`/stock/${u.slug}`} target="_blank" className="font-medium hover:underline">
                      {title}
                    </Link>
                    <div>
                      <Muted>
                        <span className="font-mono">{u.vin}</span>
                      </Muted>
                    </div>
                  </td>
                  <td className="whitespace-nowrap">
                    <span className="inline-flex items-center gap-2">
                      <span
                        aria-hidden
                        className="h-3 w-3 rounded-full border border-black/10"
                        style={{ backgroundColor: color?.hexCode ?? "#ccc" }}
                      />
                      {color?.name ?? "—"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap tabular-nums">
                    {formatPrice(u.totalPrice.toString())}
                  </td>
                  <td className="whitespace-nowrap tabular-nums">
                    {u.status === "IN_TRANSIT" ? (
                      <Muted>Arriving</Muted>
                    ) : (
                      <span className={u.daysOnLot > 60 ? "text-[var(--color-error)]" : ""}>
                        {u.daysOnLot} days
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap text-xs text-[var(--color-neutral-600)]">
                    {u.views} views · {u._count.testDrives} drives · {u._count.inquiries} enq. ·{" "}
                    {u._count.applications} apps
                  </td>
                  <td>
                    <StatusSelect
                      action={setStockStatus}
                      id={u.id}
                      value={u.status}
                      options={OPTIONS}
                      label={`Status for ${title}`}
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
