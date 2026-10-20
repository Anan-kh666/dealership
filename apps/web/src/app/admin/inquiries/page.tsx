import Link from "next/link";
import type { Metadata } from "next";
import { prisma, type InquiryStatus } from "@dealership/db";
import { formatDateTime } from "@/lib/dates";
import { INQUIRY_STATUS } from "@/lib/status";
import { requireStaff } from "@/server/session";
import { setInquiryStatus } from "../actions";
import { StatusSelect } from "../status-select";
import { AdminPageHeader, EmptyRow, Muted, StatusTabs, Table, parseStatus } from "../ui";

export const metadata: Metadata = { title: "Enquiries" };

const STATUSES = Object.keys(INQUIRY_STATUS) as InquiryStatus[];
const OPTIONS = STATUSES.map((s) => ({ value: s, label: INQUIRY_STATUS[s].label }));

const SOURCE_LABEL: Record<string, string> = {
  "contact-page": "Contact page",
  "stock-detail-inquire": "Stock page",
};

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}): Promise<React.ReactElement> {
  await requireStaff();
  const status = parseStatus((await searchParams).status, STATUSES);

  const [rows, grouped] = await Promise.all([
    prisma.inquiry.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        model: { select: { name: true, slug: true } },
        stockUnit: {
          select: { slug: true, trim: { select: { name: true, model: { select: { name: true } } } } },
        },
      },
    }),
    prisma.inquiry.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const counts: Partial<Record<InquiryStatus | "ALL", number>> = { ALL: 0 };
  for (const g of grouped) {
    counts[g.status] = g._count._all;
    counts.ALL = (counts.ALL ?? 0) + g._count._all;
  }

  return (
    <>
      <AdminPageHeader
        title="Enquiries"
        description="Messages from the contact page and stock enquiry forms."
      />
      <StatusTabs basePath="/admin/inquiries" current={status} options={OPTIONS} counts={counts} />
      <Table>
        <thead>
          <tr>
            <th>From</th>
            <th>Message</th>
            <th>About</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <EmptyRow colSpan={4}>No enquiries match this filter.</EmptyRow>
          ) : (
            rows.map((r) => {
              const about = r.stockUnit
                ? { label: `${r.stockUnit.trim.model.name} ${r.stockUnit.trim.name}`, href: `/stock/${r.stockUnit.slug}` }
                : r.model
                  ? { label: r.model.name, href: `/models/${r.model.slug}` }
                  : null;
              return (
                <tr key={r.id}>
                  <td className="whitespace-nowrap">
                    <div className="font-medium">{r.name}</div>
                    <div>
                      <a href={`mailto:${r.email}`} className="text-xs hover:underline">
                        {r.email}
                      </a>
                    </div>
                    {r.phone ? (
                      <div>
                        <a href={`tel:${r.phone}`} className="text-xs hover:underline">
                          {r.phone}
                        </a>
                      </div>
                    ) : null}
                    <Muted>{formatDateTime(r.createdAt)}</Muted>
                  </td>
                  <td>
                    <p className="max-w-md whitespace-pre-line text-[13px] leading-relaxed text-[var(--color-neutral-700)]">
                      {r.message || <span className="text-[var(--color-neutral-400)]">No message</span>}
                    </p>
                  </td>
                  <td>
                    {about ? (
                      <Link href={about.href} target="_blank" className="hover:underline">
                        {about.label}
                      </Link>
                    ) : (
                      "—"
                    )}
                    <div>
                      <Muted>{SOURCE_LABEL[r.source ?? ""] ?? r.source ?? "Website"}</Muted>
                    </div>
                  </td>
                  <td>
                    <StatusSelect
                      action={setInquiryStatus}
                      id={r.id}
                      value={r.status}
                      options={OPTIONS}
                      label={`Status for ${r.name}`}
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
