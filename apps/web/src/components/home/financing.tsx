import Image from "next/image";
import Link from "next/link";
import { Container } from "@dealership/ui/components/container";
import { Section } from "@dealership/ui/components/section";
import { BrandButton } from "@dealership/ui/components/brand-button";
import { Reveal } from "@/components/reveal";
import { FINANCING_IMAGE } from "@/data/placeholders";

export function Financing(): React.ReactElement {
  return (
    <Section variant="warm" spacing="default">
      <Container>
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-16">
          <Reveal className="order-1 md:order-1">
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

          <Reveal delay={0.08} className="order-2 md:order-2">
            <div className="flex max-w-xl flex-col gap-5">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-neutral-500)]">
                Hire purchase
              </p>
              <h2
                className="font-[family-name:var(--font-display)] tracking-[-0.02em]"
                style={{ fontSize: "clamp(36px, 5vw, 56px)", lineHeight: 1.05 }}
              >
                Own it from RM 1,250/month.
              </h2>
              <p className="text-base text-[var(--color-neutral-700)] md:text-lg">
                Pre-approved hire-purchase from our panel of local banks, structured around your
                income and a deposit you can actually afford. No surprises at signing — full
                breakdown before you commit.
              </p>
              <div className="pt-2">
                <BrandButton asChild variant="secondary" size="lg">
                  <Link href="/financing">Calculate your payment</Link>
                </BrandButton>
              </div>
              <p className="pt-2 text-xs text-[var(--color-neutral-500)]">
                Indicative figure based on a 90% loan, 7-year tenure on entry-grade Meridian. Final
                rates subject to bank approval.
              </p>
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
