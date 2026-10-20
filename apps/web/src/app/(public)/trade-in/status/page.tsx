import Link from "next/link";
import type { Metadata } from "next";
import { Check } from "lucide-react";
import { prisma } from "@dealership/db";
import {
  SITE,
  tradeInIdSuffixFromReference,
  tradeInReferenceFromId,
} from "@dealership/types";
import { Container } from "@dealership/ui/components/container";
import { BrandButton } from "@dealership/ui/components/brand-button";
import { cn } from "@dealership/ui/lib/cn";
import { StatusPill } from "@/components/status-pill";
import { formatPrice } from "@/lib/format";
import { TRADE_IN_STATUS, TRADE_IN_STEPS } from "@/lib/status";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Track your trade-in",
  description: "Check the status of your trade-in valuation with your TI- reference number.",
  robots: { index: false },
};

const dateFmt = new Intl.DateTimeFormat("en-MY", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Kuala_Lumpur",
});

/**
 * Public, reference-as-token lookup — mirrors GET /public/trade-ins/:reference
 * on the API. Shows status only; no personal details are rendered.
 */
async function lookup(reference: string) {
  const suffix = tradeInIdSuffixFromReference(reference);
  if (!suffix) return { kind: "invalid" as const };
  try {
    const row = await prisma.tradeIn.findFirst({
      where: { id: { endsWith: suffix } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        createdAt: true,
        estimatedValue: true,
        year: true,
        make: true,
        model: true,
      },
    });
    if (!row) return { kind: "missing" as const };
    return { kind: "found" as const, row };
  } catch {
    return { kind: "error" as const };
  }
}

export default async function TradeInStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>;
}): Promise<React.ReactElement> {
  const { reference: raw } = await searchParams;
  const reference = raw?.trim().toUpperCase() ?? "";
  const result = reference ? await lookup(reference) : null;

  return (
    <div className="bg-[var(--color-surface-warm)] pb-24 pt-28 md:pt-36">
      <Container>
        <div className="mx-auto flex max-w-2xl flex-col gap-10">
          <header className="flex flex-col gap-3">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-accent)]">
              Trade-in
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-[clamp(36px,5vw,56px)] leading-[1.05] tracking-[-0.02em] text-[var(--color-graphite)]">
              Track your valuation
            </h1>
            <p className="text-[var(--color-neutral-700)]">
              Enter the reference from your confirmation email — it starts with{" "}
              <span className="font-mono">TI-</span>.
            </p>
          </header>

          <form action="/trade-in/status" method="get" className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
            <label htmlFor="reference" className="sr-only">
              Reference number
            </label>
            <input
              id="reference"
              name="reference"
              defaultValue={reference}
              placeholder="TI-XXXXXX"
              autoComplete="off"
              spellCheck={false}
              className="h-12 w-full min-w-0 rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] bg-white px-4 font-mono text-[15px] uppercase tracking-wider focus-visible:border-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/25"
            />
            </div>
            <BrandButton type="submit" size="lg" variant="secondary" className="h-12">
              Check status
            </BrandButton>
          </form>

          {result?.kind === "invalid" ? (
            <Notice>
              That doesn&rsquo;t look like a trade-in reference. It should look like{" "}
              <span className="font-mono">TI-4F7K2Q</span>.
            </Notice>
          ) : null}
          {result?.kind === "missing" ? (
            <Notice>
              We couldn&rsquo;t find <span className="font-mono">{reference}</span>. Check the
              reference in your email, or{" "}
              <a href={SITE.whatsappUrl} className="underline underline-offset-4">
                message us on WhatsApp
              </a>
              .
            </Notice>
          ) : null}
          {result?.kind === "error" ? (
            <Notice>We couldn&rsquo;t check right now. Please try again in a moment.</Notice>
          ) : null}

          {result?.kind === "found" ? <StatusCard row={result.row} /> : null}

          <p className="text-sm text-[var(--color-neutral-600)]">
            Have an account?{" "}
            <Link href="/account/trade-ins" className="underline underline-offset-4">
              See all your trade-ins
            </Link>
            . Want another valuation?{" "}
            <Link href="/trade-in" className="underline underline-offset-4">
              Start a new one
            </Link>
            .
          </p>
        </div>
      </Container>
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <p className="rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] bg-white px-5 py-4 text-sm text-[var(--color-neutral-700)]">
      {children}
    </p>
  );
}

function StatusCard({
  row,
}: {
  row: {
    id: string;
    status: keyof typeof TRADE_IN_STATUS;
    createdAt: Date;
    estimatedValue: { toString(): string } | null;
    year: number;
    make: string;
    model: string;
  };
}): React.ReactElement {
  const meta = TRADE_IN_STATUS[row.status];
  const currentIdx = TRADE_IN_STEPS.indexOf(row.status);
  const closed = row.status === "REJECTED";

  return (
    <section
      aria-label="Trade-in status"
      className="flex flex-col gap-6 rounded-[var(--radius-lg)] border border-[var(--color-neutral-200)] bg-white p-6 md:p-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm text-[var(--color-neutral-500)]">
            {tradeInReferenceFromId(row.id)}
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl tracking-[-0.02em]">
            {row.year} {row.make} {row.model}
          </h2>
          <p className="mt-1 text-sm text-[var(--color-neutral-600)]">
            Submitted {dateFmt.format(row.createdAt)}
          </p>
        </div>
        <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
      </div>

      {!closed ? (
        <ol className="grid grid-cols-4 gap-2">
          {TRADE_IN_STEPS.map((s, i) => {
            const done = i <= currentIdx;
            return (
              <li key={s} className="flex flex-col gap-2">
                <span
                  className={cn(
                    "h-1.5 rounded-full",
                    done ? "bg-[var(--color-accent)]" : "bg-[var(--color-neutral-200)]",
                  )}
                />
                <span
                  className={cn(
                    "flex items-center gap-1 text-xs",
                    done ? "text-[var(--color-graphite)]" : "text-[var(--color-neutral-500)]",
                  )}
                >
                  {done ? <Check className="h-3 w-3" aria-hidden /> : null}
                  {TRADE_IN_STATUS[s].label}
                </span>
              </li>
            );
          })}
        </ol>
      ) : null}

      <p className="text-[15px] text-[var(--color-neutral-700)]">{meta.description}</p>

      {row.status === "QUOTED" && row.estimatedValue ? (
        <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-warm)] p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-neutral-500)]">
            Indicative valuation
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-3xl tracking-[-0.02em] tabular-nums">
            {formatPrice(row.estimatedValue.toString())}
          </p>
          <p className="mt-2 text-xs text-[var(--color-neutral-500)]">
            Subject to a physical inspection at the showroom. Valid for 7 days.
          </p>
        </div>
      ) : null}
    </section>
  );
}
