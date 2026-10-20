import Link from "next/link";
import type { Metadata } from "next";
import { prisma, type AppStatus } from "@dealership/db";
import { formatDate } from "@/lib/dates";
import { formatPrice } from "@/lib/format";
import { APP_STATUS } from "@/lib/status";
import { requireStaff } from "@/server/session";
import { setApplicationStatus } from "../actions";
import { StatusSelect } from "../status-select";
import { AdminPageHeader, EmptyRow, Muted, StatusTabs, Table, parseStatus } from "../ui";

export const metadata: Metadata = { title: "Financing" };

const STATUSES = Object.keys(APP_STATUS) as AppStatus[];
const OPTIONS = STATUSES.map((s) => ({ value: s, label: APP_STATUS[s].label }));

export default async function AdminFinancingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}): Promise<React.ReactElement> {
  await requireStaff();
  const status = parseStatus((await searchParams).status, STATUSES);

  const [rows, grouped] = await Promise.all([
    prisma.financeApplication.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        referenceNumber: true,
        applicantName: true,
        email: true,
        phone: true,
        vehicleLabel: true,
        vehiclePrice: true,
        loanAmount: true,
        estimatedMonthly: true,
        tenureYears: true,
        monthlyIncome: true,
        monthlyCommitments: true,
        documentsSkipped: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.financeApplication.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const counts: Partial<Record<AppStatus | "ALL", number>> = { ALL: 0 };
  for (const g of grouped) {
    counts[g.status] = g._count._all;
    counts.ALL = (counts.ALL ?? 0) + g._count._all;
  }

  return (
    <>
      <AdminPageHeader
        title="Financing applications"
        description="Review applications, forward to panel banks, and record the outcome."
      />
      <StatusTabs basePath="/admin/financing" current={status} options={OPTIONS} counts={counts} />
      <Table>
        <thead>
          <tr>
            <th>Applicant</th>
            <th>Vehicle</th>
            <th>Loan</th>
            <th>Affordability</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <EmptyRow colSpan={5}>No applications match this filter.</EmptyRow>
          ) : (
            rows.map((r) => {
              const income = Number(r.monthlyIncome);
              const commitments = Number(r.monthlyCommitments ?? 0);
              const monthly = Number(r.estimatedMonthly);
              // Debt-service ratio including the new instalment — banks
              // typically want this under ~60–70%.
              const dsr = income > 0 ? ((commitments + monthly) / income) * 100 : null;
              return (
                <tr key={r.id}>
                  <td>
                    <Link href={`/admin/financing/${r.id}`} className="font-medium hover:underline">
                      {r.applicantName}
                    </Link>
                    <div>
                      <Muted>
                        <span className="font-mono">{r.referenceNumber}</span> ·{" "}
                        {formatDate(r.createdAt)}
                      </Muted>
                    </div>
                    <div>
                      <Muted>{r.phone}</Muted>
                    </div>
                  </td>
                  <td>
                    <div>{r.vehicleLabel ?? "—"}</div>
                    <Muted>{formatPrice(r.vehiclePrice.toString())}</Muted>
                  </td>
                  <td className="whitespace-nowrap">
                    <div className="tabular-nums">{formatPrice(r.loanAmount.toString())}</div>
                    <Muted>
                      {formatPrice(Math.round(monthly))}/mo · {r.tenureYears} yrs
                    </Muted>
                  </td>
                  <td className="whitespace-nowrap">
                    <div className="tabular-nums">{formatPrice(income)}/mo income</div>
                    {dsr !== null ? (
                      <span
                        className={`text-xs tabular-nums ${dsr > 70 ? "text-[var(--color-error)]" : dsr > 60 ? "text-[oklch(0.5_0.12_60)]" : "text-[var(--color-success)]"}`}
                      >
                        DSR {dsr.toFixed(0)}%
                      </span>
                    ) : null}
                    {r.documentsSkipped ? (
                      <div>
                        <Muted>Documents to chase</Muted>
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <StatusSelect
                      action={setApplicationStatus}
                      id={r.id}
                      value={r.status}
                      options={OPTIONS}
                      label={`Status for ${r.applicantName}`}
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
