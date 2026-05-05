import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@dealership/ui/components/container";
import { Section } from "@dealership/ui/components/section";
import { BrandButton } from "@dealership/ui/components/brand-button";
import { FinanceWidget } from "@/components/finance/finance-widget";
import { FinancingHero } from "@/components/finance/financing-hero";
import { BankPartners } from "@/components/finance/bank-partners";
import { FinancingFaq } from "@/components/finance/financing-faq";

export const metadata: Metadata = {
  title: "Car financing in Malaysia — flexible hire-purchase loans",
  description:
    "Estimate your monthly payment with our financing calculator and apply for hire-purchase loans through Malaysia's leading banks. Indicative rates from 2.5%.",
};

const STEPS: { title: string; body: string }[] = [
  {
    title: "Estimate",
    body: "Use the calculator to see how down payment, tenure, and rate shape your monthly. No login, no commitment.",
  },
  {
    title: "Apply",
    body: "Submit your application online in about ten minutes. We forward your details to our partner banks for indicative approval.",
  },
  {
    title: "Confirm",
    body: "Once a bank issues a letter of offer, we walk you through signing, registration, road tax, and insurance for collection day.",
  },
];

export default function FinancingPage(): React.ReactElement {
  return (
    <>
      <Section spacing="loose">
        <Container>
          <div className="pt-12 md:pt-20">
            <FinancingHero />
          </div>
        </Container>
      </Section>

      <Section variant="warm" spacing="default">
        <Container>
          <div id="calculator" className="scroll-mt-24">
            <FinanceWidget editablePrice variant="standalone" />
          </div>
        </Container>
      </Section>

      <Section spacing="default">
        <Container>
          <div className="grid gap-12 md:grid-cols-[1fr_2fr] md:gap-16">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-neutral-500)]">
                Process
              </p>
              <h2
                className="mt-3 font-[family-name:var(--font-display)] tracking-[-0.02em] text-[var(--color-graphite)]"
                style={{ fontSize: "clamp(32px, 4.5vw, 44px)", lineHeight: 1.1 }}
              >
                How it works
              </h2>
              <p className="mt-4 max-w-md text-base leading-relaxed text-[var(--color-neutral-700)]">
                Three steps from interest to keys-in-hand. Most customers
                finish the application in well under fifteen minutes.
              </p>
            </div>
            <ol className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <li
                  key={s.title}
                  className="rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] bg-white p-6"
                >
                  <p className="font-[family-name:var(--font-display)] text-3xl tracking-[-0.02em] text-[var(--color-accent)]">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-3 font-[family-name:var(--font-display)] text-2xl tracking-[-0.02em] text-[var(--color-graphite)]">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-neutral-700)]">
                    {s.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </Section>

      <Section variant="warm" spacing="default">
        <Container>
          <div className="flex flex-col gap-8">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-neutral-500)]">
                Partners
              </p>
              <h2
                className="mt-3 font-[family-name:var(--font-display)] tracking-[-0.02em] text-[var(--color-graphite)]"
                style={{ fontSize: "clamp(28px, 4vw, 40px)", lineHeight: 1.1 }}
              >
                Banks we work with
              </h2>
              <p className="mt-3 max-w-2xl text-sm text-[var(--color-neutral-600)]">
                We submit your application to our network of authorised
                financing partners — and present the most competitive offer.
              </p>
            </div>
            <BankPartners />
          </div>
        </Container>
      </Section>

      <Section spacing="default">
        <Container>
          <div className="grid gap-10 md:grid-cols-[1fr_2fr] md:gap-16">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-neutral-500)]">
                FAQ
              </p>
              <h2
                className="mt-3 font-[family-name:var(--font-display)] tracking-[-0.02em] text-[var(--color-graphite)]"
                style={{ fontSize: "clamp(28px, 4vw, 40px)", lineHeight: 1.1 }}
              >
                Common questions
              </h2>
            </div>
            <div>
              <FinancingFaq />
            </div>
          </div>
        </Container>
      </Section>

      <Section variant="dark" spacing="default">
        <Container>
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <p className="text-xs uppercase tracking-[0.24em] text-white/60">
                Ready when you are
              </p>
              <h2
                className="mt-3 font-[family-name:var(--font-display)] tracking-[-0.02em]"
                style={{ fontSize: "clamp(32px, 4.5vw, 44px)", lineHeight: 1.1 }}
              >
                Apply in about ten minutes.
              </h2>
              <p className="mt-3 text-base leading-relaxed text-white/80">
                Save your progress between steps and pick up where you left
                off. We&rsquo;ll handle the bank conversations.
              </p>
            </div>
            <BrandButton asChild size="lg" variant="primary">
              <Link href="/financing/apply">Start your application →</Link>
            </BrandButton>
          </div>
        </Container>
      </Section>
    </>
  );
}
