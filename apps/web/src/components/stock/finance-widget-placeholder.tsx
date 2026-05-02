import Link from "next/link";

export interface FinanceWidgetPlaceholderProps {
  stockUnitId: string;
  estimatedMonthly: number;
}

export function FinanceWidgetPlaceholder({
  stockUnitId,
  estimatedMonthly,
}: FinanceWidgetPlaceholderProps): React.ReactElement {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-neutral-200)] bg-[var(--color-surface-warm)] p-6">
      <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-neutral-500)]">
        Financing
      </p>
      <p
        className="mt-2 font-[family-name:var(--font-display)] tracking-[-0.02em]"
        style={{ fontSize: "28px", lineHeight: 1.1 }}
      >
        From RM {estimatedMonthly.toLocaleString("en-MY")} / month
      </p>
      <p className="mt-2 max-w-md text-sm text-[var(--color-neutral-600)]">
        Estimate based on a 7-year term at 3.5% APR with 10% down. Adjust the term,
        rate, and trade-in on the financing page.
      </p>
      <Link
        href={`/financing?stockUnitId=${stockUnitId}`}
        className="mt-4 inline-flex text-sm font-medium text-[var(--color-accent)] underline-offset-4 hover:underline"
      >
        Estimate your monthly payment →
      </Link>
    </div>
  );
}
