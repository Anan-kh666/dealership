import Image from "next/image";
import Link from "next/link";
import { prisma } from "@dealership/db";
import {
  FINANCING_DOWN_DEFAULT_PCT,
  FINANCING_RATE_DEFAULT,
  FINANCING_TENURE_DEFAULT_YEARS,
  calculateMalaysianLoan,
} from "@dealership/types";
import { Container } from "@dealership/ui/components/container";
import { Section } from "@dealership/ui/components/section";
import { BrandButton } from "@dealership/ui/components/brand-button";
import { Reveal } from "@/components/reveal";
import { FINANCING_IMAGE } from "@/data/media";
import { formatPrice } from "@/lib/format";

async function entryModel(): Promise<{ name: string; price: number } | null> {
  try {
    const m = await prisma.model.findFirst({
      where: { isActive: true },
      orderBy: { startingPrice: "asc" },
      select: { name: true, startingPrice: true },
    });
    return m ? { name: m.name, price: Number(m.startingPrice) } : null;
  } catch {
    return null;
  }
}

export async function Financing(): Promise<React.ReactElement> {
  const entry = await entryModel();
  // Same flat-rate maths and defaults as the calculator on /financing, so
  // the headline can never drift from what the customer sees there.
  const monthly = entry
    ? calculateMalaysianLoan({
        vehiclePrice: entry.price,
        downPaymentPercent: FINANCING_DOWN_DEFAULT_PCT,
        tenureYears: FINANCING_TENURE_DEFAULT_YEARS,
        interestRatePercent: FINANCING_RATE_DEFAULT,
      }).monthlyPayment
    : null;

  return (
    <Section variant="warm" spacing="default">
      <Container>
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-16">
          <Reveal>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-neutral-100)]">
              <Image
                src={FINANCING_IMAGE}
                alt="A handover at the showroom — keys exchanged across a desk"
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="flex max-w-xl flex-col gap-5">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-neutral-500)]">
                Hire purchase
              </p>
              <h2
                className="font-[family-name:var(--font-display)] tracking-[-0.02em]"
                style={{ fontSize: "clamp(36px, 5vw, 56px)", lineHeight: 1.05 }}
              >
                {monthly ? (
                  <>Own it from {formatPrice(Math.ceil(monthly))}/month.</>
                ) : (
                  <>Financing that fits your month.</>
                )}
              </h2>
              <p className="text-base text-[var(--color-neutral-700)] md:text-lg">
                Pre-approved hire-purchase from our panel of local banks, structured around your
                income and a deposit you can actually afford. No surprises at signing — full
                breakdown before you commit.
              </p>
              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <BrandButton asChild variant="secondary" size="lg">
                  <Link href="/financing#calculator">Calculate your payment</Link>
                </BrandButton>
                <BrandButton asChild variant="ghost-dark" size="lg">
                  <Link href="/financing/apply">Apply online</Link>
                </BrandButton>
              </div>
              {entry ? (
                <p className="pt-2 text-xs text-[var(--color-neutral-500)]">
                  Indicative figure for the {entry.name} at {formatPrice(entry.price)} with{" "}
                  {FINANCING_DOWN_DEFAULT_PCT}% down over {FINANCING_TENURE_DEFAULT_YEARS} years
                  at {FINANCING_RATE_DEFAULT.toFixed(1)}% flat. Final rates subject to bank
                  approval.
                </p>
              ) : null}
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
