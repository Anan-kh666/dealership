import Link from "next/link";
import { Car, CarFront, Truck, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Container } from "@dealership/ui/components/container";
import { Section } from "@dealership/ui/components/section";
import { Reveal } from "@/components/reveal";
import { bodyTypes } from "@/data/placeholders";

const ICONS: Record<string, LucideIcon> = { Car, CarFront, Truck, Zap };

export function FindMatch(): React.ReactElement {
  return (
    <Section variant="warm" spacing="default">
      <Container>
        <Reveal>
          <div className="mb-12 flex flex-col gap-3 md:mb-16 md:max-w-2xl">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-neutral-500)]">
              By body type
            </p>
            <h2
              className="font-[family-name:var(--font-display)] tracking-[-0.02em]"
              style={{ fontSize: "clamp(36px, 5vw, 56px)", lineHeight: 1.05 }}
            >
              Find your match.
            </h2>
            <p className="max-w-xl text-base text-[var(--color-neutral-600)] md:text-lg">
              Skip the brochure. Tell us how you actually drive — we&rsquo;ll show you the cars that fit.
            </p>
          </div>
        </Reveal>

        <ul className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {bodyTypes.map((b, idx) => {
            const Icon = ICONS[b.icon] ?? Car;
            return (
              <li key={b.label}>
                <Reveal delay={Math.min(idx, 3) * 0.05}>
                  <Link
                    href={`/models?bodyType=${b.query}`}
                    className="group flex h-full flex-col items-start gap-6 rounded-[var(--radius-lg)] border border-[var(--color-neutral-200)] bg-white p-8 transition-[transform,border-color,box-shadow] duration-[var(--duration-standard)] ease-[var(--ease-out-soft)] hover:-translate-y-1 hover:border-[var(--color-accent)] hover:shadow-[var(--shadow-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
                  >
                    <Icon className="h-8 w-8 text-[var(--color-accent)]" strokeWidth={1.5} />
                    <span className="font-[family-name:var(--font-display)] text-2xl tracking-[-0.02em] text-foreground">
                      {b.label}
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
