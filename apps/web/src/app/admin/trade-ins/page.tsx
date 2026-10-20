import Link from "next/link";
import type { Metadata } from "next";
import { prisma, type TradeInStatus } from "@dealership/db";
import { tradeInReferenceFromId } from "@dealership/types";
import { StatusPill } from "@/components/status-pill";
import { formatDate } from "@/lib/dates";
import { formatPrice } from "@/lib/format";
import { TRADE_IN_STATUS } from "@/lib/status";
import { requireStaff } from "@/server/session";
import { AdminPageHeader, EmptyRow, Muted, StatusTabs, Table, parseStatus } from "../ui";

export const metadata: Metadata = { title: "Trade-ins" };

const STATUSES = Object.keys(TRADE_IN_STATUS) as TradeInStatus[];
const OPTIONS = STATUSES.map((s) => ({ value: s, label: TRADE_IN_STATUS[s].label }));

export default async function AdminTradeInsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}): Promise<React.ReactElement> {
  await requireStaff();
  const status = parseStatus((await searchParams).status, STATUSES);

  const [rows, grouped] = await Promise.all([
    prisma.tradeIn.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.tradeIn.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const counts: Partial<Record<TradeInStatus | "ALL", number>> = { ALL: 0 };
  for (const g of grouped) {
    counts[g.status] = g._count._all;
    counts.ALL = (counts.ALL ?? 0) + g._count._all;
  }

  return (
    <>
      <AdminPageHeader
        title="Trade-in valuations"
        description="Customers are promised a quote within one business day."
      />
      <StatusTabs basePath="/admin/trade-ins" current={status} options={OPTIONS} counts={counts} />
      <Table>
        <thead>
          <tr>
            <th>Vehicle</th>
            <th>Customer</th>
            <th>Condition</th>
            <th>Quote</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <EmptyRow colSpan={5}>No trade-ins match this filter.</EmptyRow>
          ) : (
            rows.map((r) => {
              const meta = TRADE_IN_STATUS[r.status];
              return (
                <tr key={r.id}>
                  <td>
                    <Link href={`/admin/trade-ins/${r.id}`} className="font-medium hover:underline">
                      {r.year} {r.make} {r.model}
                    </Link>
                    <div>
                      <Muted>
                        <span className="font-mono">{tradeInReferenceFromId(r.id)}</span> ·{" "}
                        {formatDate(r.createdAt)}
                      </Muted>
                    </div>
                  </td>
                  <td>
                    <div>{r.contactName}</div>
                    <Muted>{r.contactPhone}</Muted>
                  </td>
                  <td className="whitespace-nowrap">
                    <div className="capitalize">{r.condition.toLowerCase()}</div>
                    <Muted>
                      {r.mileage.toLocaleString("en-MY")} km · {r.photos.length} photo
                      {r.photos.length === 1 ? "" : "s"}
                    </Muted>
                  </td>
                  <td className="whitespace-nowrap tabular-nums">
                    {r.estimatedValue ? formatPrice(r.estimatedValue.toString()) : "—"}
                  </td>
                  <td>
                    <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
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
