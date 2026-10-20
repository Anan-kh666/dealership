import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma, type AppStatus } from "@dealership/db";
import { formatDate, formatDateTime } from "@/lib/dates";
import { formatPrice } from "@/lib/format";
import { APP_STATUS } from "@/lib/status";
import { requireStaff } from "@/server/session";
import { setApplicationStatus } from "../../actions";
import { StatusSelect } from "../../status-select";
import { AdminPageHeader, Card } from "../../ui";
import { NoteForm } from "./note-form";

export const metadata: Metadata = { title: "Financing application" };

const OPTIONS = (Object.keys(APP_STATUS) as AppStatus[]).map((s) => ({
  value: s,
  label: APP_STATUS[s].label,
}));

const LABEL: Record<string, string> = {
  PERMANENT: "Permanent",
  CONTRACT: "Contract",
  SELF_EMPLOYED: "Self-employed",
  RETIRED: "Retired",
  OTHER: "Other",
  MALAYSIAN: "Malaysian",
  PERMANENT_RESIDENT: "Permanent resident",
  FOREIGNER: "Foreigner",
  SINGLE: "Single",
  MARRIED: "Married",
  DIVORCED: "Divorced",
  WIDOWED: "Widowed",
};

function formatIc(ic: string): string {
  return ic.length === 12 ? `${ic.slice(0, 6)}-${ic.slice(6, 8)}-${ic.slice(8)}` : ic;
}

export default async function AdminFinancingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  await requireStaff();
  const { id } = await params;
  const a = await prisma.financeApplication.findUnique({
    where: { id },
    include: { stockUnit: { select: { slug: true, vin: true, status: true } } },
  });
  if (!a) notFound();

  const docs: { label: string; url: string }[] = [
    ...(a.icFrontUrl ? [{ label: "IC (front)", url: a.icFrontUrl }] : []),
    ...(a.icBackUrl ? [{ label: "IC (back)", url: a.icBackUrl }] : []),
    ...a.payslipUrls.map((url, i) => ({ label: `Payslip ${i + 1}`, url })),
    ...a.bankStatementUrls.map((url, i) => ({ label: `Bank statement ${i + 1}`, url })),
  ];

  return (
    <>
      <Link
        href="/admin/financing"
        className="inline-flex items-center gap-2 text-sm text-[var(--color-neutral-600)] hover:text-[var(--color-graphite)]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> All applications
      </Link>
      <AdminPageHeader
        title={a.applicantName}
        description={`${a.referenceNumber} · submitted ${formatDateTime(a.createdAt)}`}
        actions={
          <StatusSelect
            action={setApplicationStatus}
            id={a.id}
            value={a.status}
            options={OPTIONS}
            label="Application status"
          />
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Vehicle & loan">
          <Item label="Vehicle">
            {a.vehicleLabel ?? "—"}
            {a.stockUnit ? (
              <>
                {" "}
                ·{" "}
                <Link href={`/stock/${a.stockUnit.slug}`} target="_blank" className="underline">
                  view unit
                </Link>
              </>
            ) : null}
          </Item>
          <Item label="Vehicle price">{formatPrice(a.vehiclePrice.toString())}</Item>
          <Item label="Down payment">
            {formatPrice(a.downPayment.toString())} ({Number(a.downPaymentPercent)}%)
          </Item>
          <Item label="Loan amount">{formatPrice(a.loanAmount.toString())}</Item>
          <Item label="Tenure">{a.tenureYears} years</Item>
          <Item label="Rate (flat)">{Number(a.interestRatePct).toFixed(2)}%</Item>
          <Item label="Est. monthly">{formatPrice(Math.round(Number(a.estimatedMonthly)))}</Item>
        </Section>

        <Section title="Applicant">
          <Item label="IC number">
            <span className="font-mono">{formatIc(a.icNumber)}</span>
          </Item>
          <Item label="Date of birth">{formatDate(a.dateOfBirth)}</Item>
          <Item label="Nationality">{LABEL[a.nationality] ?? a.nationality}</Item>
          <Item label="Marital status">{LABEL[a.maritalStatus] ?? a.maritalStatus}</Item>
          <Item label="Mobile">
            <a href={`tel:${a.phone}`} className="underline">
              {a.phone}
            </a>
          </Item>
          <Item label="Email">
            <a href={`mailto:${a.email}`} className="underline">
              {a.email}
            </a>
          </Item>
          <Item label="Address">
            {a.addressStreet}, {a.addressPostcode} {a.addressCity}, {a.addressState}
          </Item>
        </Section>

        <Section title="Employment & income">
          <Item label="Employment">{LABEL[a.employmentType] ?? a.employmentType}</Item>
          <Item label="Employer">{a.employerName}</Item>
          <Item label="Position">{a.position}</Item>
          <Item label="Years employed">{Number(a.yearsEmployed)}</Item>
          <Item label="Gross income">{formatPrice(a.monthlyIncome.toString())}/mo</Item>
          <Item label="Commitments">
            {a.monthlyCommitments ? `${formatPrice(a.monthlyCommitments.toString())}/mo` : "—"}
          </Item>
        </Section>

        <Section title="Documents">
          {docs.length === 0 ? (
            <p className="px-5 py-4 text-sm text-[var(--color-neutral-600)]">
              {a.documentsSkipped
                ? "The applicant skipped uploads — request IC, payslips and statements directly."
                : "No documents attached."}
            </p>
          ) : (
            <ul className="divide-y divide-[var(--color-neutral-200)]">
              {docs.map((d) => (
                <li key={d.url} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span>{d.label}</span>
                  <a href={d.url} target="_blank" rel="noreferrer" className="underline">
                    Open
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <Card>
        <div className="border-b border-[var(--color-neutral-200)] px-5 py-4">
          <h2 className="font-medium">Internal notes</h2>
          <p className="text-xs text-[var(--color-neutral-500)]">Visible to staff only.</p>
        </div>
        <NoteForm id={a.id} notes={a.notes ?? ""} />
      </Card>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }): React.ReactElement {
  return (
    <Card>
      <h2 className="border-b border-[var(--color-neutral-200)] px-5 py-4 font-medium">{title}</h2>
      <dl className="divide-y divide-[var(--color-neutral-200)]">{children}</dl>
    </Card>
  );
}

function Item({ label, children }: { label: string; children: React.ReactNode }): React.ReactElement {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-4 px-5 py-3 text-sm">
      <dt className="text-[var(--color-neutral-500)]">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}
