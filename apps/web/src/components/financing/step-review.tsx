"use client";

import { useMemo, useState } from "react";
import { calculateMalaysianLoan } from "@dealership/types";
import { BrandButton } from "@dealership/ui/components/brand-button";
import {
  useFinancingStore,
  type FinancingStep,
} from "@/stores/financingStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const myr = new Intl.NumberFormat("en-MY", { maximumFractionDigits: 0 });
function rm(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `RM ${myr.format(Math.round(n))}`;
}

const NATIONALITY_LABELS: Record<string, string> = {
  MALAYSIAN: "Malaysian",
  PERMANENT_RESIDENT: "Malaysian PR",
  FOREIGNER: "Foreigner",
};
const MARITAL_LABELS: Record<string, string> = {
  SINGLE: "Single",
  MARRIED: "Married",
  DIVORCED: "Divorced",
  WIDOWED: "Widowed",
};
const EMPLOYMENT_LABELS: Record<string, string> = {
  PERMANENT: "Permanent",
  CONTRACT: "Contract",
  SELF_EMPLOYED: "Self-employed",
  RETIRED: "Retired",
  OTHER: "Other",
};

export function StepReview({
  onBack,
  onJump,
}: {
  onBack: () => void;
  onJump: (step: FinancingStep) => void;
}): React.ReactElement {
  const stockUnitId = useFinancingStore((s) => s.stockUnitId);
  const configurationId = useFinancingStore((s) => s.configurationId);
  const vehicleLabel = useFinancingStore((s) => s.vehicleLabel);
  const vehiclePrice = useFinancingStore((s) => s.vehiclePrice);

  const downPaymentPercent = useFinancingStore((s) => s.downPaymentPercent);
  const tenureYears = useFinancingStore((s) => s.tenureYears);
  const interestRatePercent = useFinancingStore((s) => s.interestRatePercent);

  const fullName = useFinancingStore((s) => s.fullName);
  const icNumber = useFinancingStore((s) => s.icNumber);
  const dateOfBirth = useFinancingStore((s) => s.dateOfBirth);
  const nationality = useFinancingStore((s) => s.nationality);
  const maritalStatus = useFinancingStore((s) => s.maritalStatus);
  const mobile = useFinancingStore((s) => s.mobile);
  const email = useFinancingStore((s) => s.email);
  const addressStreet = useFinancingStore((s) => s.addressStreet);
  const addressCity = useFinancingStore((s) => s.addressCity);
  const addressState = useFinancingStore((s) => s.addressState);
  const addressPostcode = useFinancingStore((s) => s.addressPostcode);

  const employmentType = useFinancingStore((s) => s.employmentType);
  const employerName = useFinancingStore((s) => s.employerName);
  const position = useFinancingStore((s) => s.position);
  const monthlyGrossIncome = useFinancingStore((s) => s.monthlyGrossIncome);
  const monthlyCommitments = useFinancingStore((s) => s.monthlyCommitments);
  const yearsEmployed = useFinancingStore((s) => s.yearsEmployed);

  const icFront = useFinancingStore((s) => s.icFront);
  const icBack = useFinancingStore((s) => s.icBack);
  const payslips = useFinancingStore((s) => s.payslips);
  const bankStatements = useFinancingStore((s) => s.bankStatements);
  const documentsSkipped = useFinancingStore((s) => s.documentsSkipped);

  const setSubmitted = useFinancingStore((s) => s.setSubmitted);

  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const result = useMemo(
    () =>
      calculateMalaysianLoan({
        vehiclePrice: vehiclePrice ?? 0,
        downPaymentPercent,
        tenureYears,
        interestRatePercent,
      }),
    [vehiclePrice, downPaymentPercent, tenureYears, interestRatePercent],
  );

  const submit = async (): Promise<void> => {
    setError(null);
    if (
      vehiclePrice == null ||
      !nationality ||
      !maritalStatus ||
      !addressState ||
      !employmentType ||
      monthlyGrossIncome == null ||
      yearsEmployed == null
    ) {
      setError(
        "Some required fields are missing. Please review the previous steps.",
      );
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        stockUnitId: stockUnitId ?? undefined,
        configurationId: configurationId ?? undefined,
        vehicleLabel: vehicleLabel ?? undefined,
        vehiclePrice,
        downPaymentPercent,
        tenureYears,
        interestRatePercent,
        fullName,
        icNumber,
        dateOfBirth,
        nationality,
        maritalStatus,
        mobile,
        email,
        addressStreet,
        addressCity,
        addressState,
        addressPostcode,
        employmentType,
        employerName,
        position,
        monthlyGrossIncome,
        monthlyCommitments:
          monthlyCommitments != null && Number.isFinite(monthlyCommitments)
            ? monthlyCommitments
            : undefined,
        yearsEmployed,
        icFrontUrl: icFront?.url,
        icBackUrl: icBack?.url,
        payslipUrls: payslips.map((p) => p.url),
        bankStatementUrls: bankStatements.map((b) => b.url),
        documentsSkipped,
        consent: true as const,
      };
      const res = await fetch(`${API_URL}/public/financing/applications`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Submit failed: ${res.status} ${text}`.trim());
      }
      const json = (await res.json()) as { id: string; reference: string };
      setSubmitted({ id: json.id, reference: json.reference });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const docCount =
    (icFront ? 1 : 0) +
    (icBack ? 1 : 0) +
    payslips.length +
    bankStatements.length;

  return (
    <div>
      <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-[-0.02em] text-[var(--color-graphite)] md:text-4xl">
        Review your application
      </h2>

      <div className="mt-8 space-y-6">
        <SummaryCard title="Vehicle" onEdit={() => onJump(1)}>
          <Row label="Vehicle" value={vehicleLabel || "Not specified"} />
          <Row label="OTR price" value={rm(vehiclePrice)} />
        </SummaryCard>

        <SummaryCard title="Loan terms" onEdit={() => onJump(2)}>
          <Row label="Down payment" value={`${downPaymentPercent}% · ${rm(result.downPaymentAmount)}`} />
          <Row label="Tenure" value={`${tenureYears} years`} />
          <Row label="Indicative rate" value={`${interestRatePercent.toFixed(1)}%`} />
          <Row label="Estimated monthly" value={rm(result.monthlyPayment)} />
          <Row label="Total interest" value={rm(result.totalInterest)} />
        </SummaryCard>

        <SummaryCard title="Personal" onEdit={() => onJump(3)}>
          <Row label="Full name" value={fullName || "—"} />
          <Row label="IC" value={icNumber || "—"} />
          <Row label="Date of birth" value={dateOfBirth || "—"} />
          <Row
            label="Nationality"
            value={nationality ? (NATIONALITY_LABELS[nationality] ?? nationality) : "—"}
          />
          <Row
            label="Marital status"
            value={maritalStatus ? (MARITAL_LABELS[maritalStatus] ?? maritalStatus) : "—"}
          />
          <Row label="Mobile" value={mobile || "—"} />
          <Row label="Email" value={email || "—"} />
          <Row
            label="Address"
            value={
              addressStreet
                ? `${addressStreet}, ${addressCity}, ${addressPostcode} ${addressState ?? ""}`.trim()
                : "—"
            }
          />
        </SummaryCard>

        <SummaryCard title="Employment & income" onEdit={() => onJump(4)}>
          <Row
            label="Employment"
            value={
              employmentType
                ? `${EMPLOYMENT_LABELS[employmentType] ?? employmentType} · ${yearsEmployed ?? 0} yrs`
                : "—"
            }
          />
          <Row label="Employer" value={employerName || "—"} />
          <Row label="Position" value={position || "—"} />
          <Row label="Monthly gross income" value={rm(monthlyGrossIncome)} />
          {monthlyCommitments != null && (
            <Row label="Monthly commitments" value={rm(monthlyCommitments)} />
          )}
        </SummaryCard>

        <SummaryCard title="Documents" onEdit={() => onJump(5)}>
          {documentsSkipped ? (
            <p className="text-sm text-[var(--color-neutral-700)]">
              Skipped — staff will request these by email.
            </p>
          ) : docCount === 0 ? (
            <p className="text-sm text-[var(--color-neutral-700)]">
              No documents uploaded yet.
            </p>
          ) : (
            <ul className="space-y-1 text-sm text-[var(--color-graphite)]">
              {icFront && <li>IC — front uploaded</li>}
              {icBack && <li>IC — back uploaded</li>}
              {payslips.length > 0 && (
                <li>{payslips.length} payslip{payslips.length === 1 ? "" : "s"}</li>
              )}
              {bankStatements.length > 0 && (
                <li>
                  {bankStatements.length} bank statement
                  {bankStatements.length === 1 ? "" : "s"}
                </li>
              )}
            </ul>
          )}
        </SummaryCard>
      </div>

      <p className="mt-6 text-xs leading-relaxed text-[var(--color-neutral-500)]">
        Indicative only. Final rates are confirmed by the bank after credit
        assessment.
      </p>

      <label className="mt-6 flex items-start gap-3 text-sm text-[var(--color-neutral-700)]">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-[var(--color-neutral-300)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
        />
        <span>
          I confirm the details above are accurate and consent to my data
          being shared with our financing partners for credit assessment, in
          line with the PDPA.
        </span>
      </label>

      {error && (
        <p className="mt-3 text-sm text-[var(--color-error)]">{error}</p>
      )}

      <div className="sticky bottom-0 -mx-4 mt-10 flex items-center justify-between border-t border-[var(--color-neutral-200)] bg-[var(--color-surface-warm)] px-4 py-4 md:static md:mx-0 md:border-0 md:px-0">
        <BrandButton type="button" variant="ghost-dark" onClick={onBack}>
          Back
        </BrandButton>
        <BrandButton
          type="button"
          size="lg"
          disabled={!consent || submitting}
          onClick={() => void submit()}
        >
          {submitting ? "Submitting…" : "Submit application"}
        </BrandButton>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-neutral-200)] bg-white p-5">
      <header className="flex items-center justify-between">
        <h3 className="text-sm font-medium uppercase tracking-[0.16em] text-[var(--color-neutral-700)]">
          {title}
        </h3>
        <button
          type="button"
          onClick={onEdit}
          className="text-xs text-[var(--color-accent)] hover:underline"
        >
          Edit
        </button>
      </header>
      <div className="mt-4 space-y-2">{children}</div>
    </section>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.ReactElement {
  return (
    <div className="grid grid-cols-3 gap-4 text-sm">
      <dt className="col-span-1 text-[var(--color-neutral-500)]">{label}</dt>
      <dd className="col-span-2 text-[var(--color-graphite)]">{value}</dd>
    </div>
  );
}
