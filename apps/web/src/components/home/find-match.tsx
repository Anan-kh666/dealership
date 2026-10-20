import Link from "next/link";
import { BatteryCharging, Car, CarFront, Leaf } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Container } from "@dealership/ui/components/container";
import { Section } from "@dealership/ui/components/section";
import { Reveal } from "@/components/reveal";

/** Shortcuts into /models — values must match the Prisma enums the page filters on. */
const MATCHES: { label: string; blurb: string; href: string; icon: LucideIcon }[] = [
  {
    label: "Sedan",
    blurb: "Quiet, efficient, made for the daily commute.",
    href: "/models?bodyType=SEDAN",
    icon: Car,
  },
  {
    label: "SUV",
    blurb: "Seven seats and room for the weekend.",
    href: "/models?bodyType=SUV",
    icon: CarFront,
  },
  {
    label: "Hybrid",
    blurb: "Electric in traffic, petrol on the highway.",
    href: "/models?fuelType=HYBRID",
    icon: Leaf,
  },
  {
    label: "Electric",
    blurb: "Zero tailpipe, charged at home overnight.",
    href: "/models?fuelType=ELECTRIC",
    icon: BatteryCharging,
  },
];

export function FindMatch(): React.ReactElement {
  return (
    <Section variant="warm" spacing="default">
      <Container>
        <Reveal>
          <div className="mb-12 flex flex-col gap-3 md:mb-16 md:max-w-2xl">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-neutral-500)]">
              By the way you drive
            </p>
            <h2
              className="font-[family-name:var(--font-display)] tracking-[-0.02em]"
              style={{ fontSize: "clamp(36px, 5vw, 56px)", lineHeight: 1.05 }}
            >
              Find your match.
            </h2>
            <p className="max-w-xl text-base text-[var(--color-neutral-600)] md:text-lg">
              Skip the brochure. Tell us how you actually drive — we&rsquo;ll show you the cars
              that fit.
            </p>
          </div>
        </Reveal>

        <ul className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {MATCHES.map((m, idx) => {
            const Icon = m.icon;
            return (
              <li key={m.label}>
                <Reveal delay={Math.min(idx, 3) * 0.05} className="h-full">
                  <Link
                    href={m.href}
                    className="group flex h-full flex-col items-start gap-6 rounded-[var(--radius-lg)] border border-[var(--color-neutral-200)] bg-white p-6 transition-[transform,border-color,box-shadow] duration-[var(--duration-standard)] ease-[var(--ease-out-soft)] hover:-translate-y-1 hover:border-[var(--color-accent)] hover:shadow-[var(--shadow-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 md:p-8"
                  >
                    <Icon className="h-8 w-8 text-[var(--color-accent)]" strokeWidth={1.5} />
                    <div className="flex flex-col gap-2">
                      <span className="font-[family-name:var(--font-display)] text-2xl tracking-[-0.02em] text-foreground">
                        {m.label}
                      </span>
                      <span className="text-sm text-[var(--color-neutral-600)]">{m.blurb}</span>
                    </div>
                    <span
                      aria-hidden
                      className="mt-auto text-sm text-[var(--color-accent-deep)] transition-transform duration-[var(--duration-standard)] group-hover:translate-x-1"
                    >
                      Explore →
                    </span>
                  </Link>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </Container>
    </Section>
  );
}
