import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@dealership/db";
import { auth } from "@/server/auth";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  const session = await auth();
  if (!session?.user?.id)
    redirect("/sign-in?callbackUrl=/account/applications");
  const { id } = await params;
  const app = await prisma.financeApplication.findUnique({ where: { id } });
  if (!app || app.userId !== session.user.id) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/account/applications"
          className="text-xs text-[var(--color-neutral-500)] underline-offset-2 hover:underline"
        >
          ← All applications
        </Link>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-[-0.02em] text-[var(--color-graphite)]">
          {app.referenceNumber}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-neutral-600)]">
          Submitted{" "}
          {app.createdAt.toLocaleDateString("en-MY", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}{" "}
          · status {app.status.toLowerCase().replace("_", " ")}
        </p>
      </div>

      <Section title="Vehicle">
        <Field label="Vehicle" value={app.vehicleLabel ?? "—"} />
        <Field label="OTR price" value={formatPrice(app.vehiclePrice.toString())} />
      </Section>

      <Section title="Loan">
        <Field
          label="Loan amount"
          value={formatPrice(app.loanAmount.toString())}
        />
        <Field
          label="Down payment"
          value={`${formatPrice(app.downPayment.toString())} (${app.downPaymentPercent.toString()}%)`}
        />
        <Field label="Tenure" value={`${app.tenureYears} years`} />
        <Field label="Indicative rate" value={`${app.interestRatePct.toString()}%`} />
        <Field
          label="Estimated monthly"
          value={formatPrice(app.estimatedMonthly.toString())}
        />
      </Section>

      <Section title="Applicant">
        <Field label="Name" value={app.applicantName} />
        <Field label="Email" value={app.email} />
        <Field label="Mobile" value={app.phone} />
        <Field label="IC" value={app.icNumber} />
        <Field label="Nationality" value={app.nationality} />
      </Section>

      <Section title="Employment">
        <Field label="Employer" value={app.employerName} />
        <Field label="Position" value={app.position} />
        <Field label="Type" value={app.employmentType} />
        <Field
          label="Monthly income"
          value={formatPrice(app.monthlyIncome.toString())}
        />
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="rounded-md border border-[var(--color-neutral-200)] bg-white p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-neutral-500)]">
        {title}
      </p>
      <dl className="mt-3 grid grid-cols-1 gap-y-2 sm:grid-cols-2">
        {children}
      </dl>
    </div>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.ReactElement {
  return (
    <div className="flex justify-between gap-4 py-1 text-sm sm:flex-col sm:gap-0">
      <dt className="text-[var(--color-neutral-500)]">{label}</dt>
      <dd className="text-[var(--color-graphite)]">{value}</dd>
    </div>
  );
}
