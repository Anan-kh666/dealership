import Link from "next/link";
import type { Metadata } from "next";
import { SITE } from "@dealership/types";
import { Container } from "@dealership/ui/components/container";
import { Section } from "@dealership/ui/components/section";
import { PageHero } from "@/components/page-hero";

export const metadata: Metadata = {
  title: "Press",
  description: "News, announcements and media contacts.",
};

const RELEASES = [
  {
    date: "2026-03-02",
    title: "Lumen EV arrives in Malaysia with an eight-year battery warranty",
    body: "The all-electric Lumen sedan is now available to order, with three trims from RM 218,000 and DC fast-charging support up to 150 kW.",
  },
  {
    date: "2025-11-18",
    title: "New twelve-bay service centre opens in Petaling Jaya",
    body: "The expanded facility adds dedicated high-voltage bays for hybrid and electric servicing and cuts average waiting times by a third.",
  },
  {
    date: "2025-06-09",
    title: "Dealership marks 18,000th delivery",
    body: "Twenty-four years after opening as a two-bay workshop, the family-run dealership celebrates a milestone handover to a returning customer.",
  },
];

const fmt = new Intl.DateTimeFormat("en-MY", { day: "numeric", month: "long", year: "numeric" });

export default function PressPage(): React.ReactElement {
  return (
    <>
      <PageHero
        eyebrow="Press"
        title="News from the showroom."
        intro="Announcements, launches and milestones. For interviews, images or test-car requests, contact our media team."
      />
      <Section spacing="default">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr] lg:gap-16">
            <ol className="flex flex-col divide-y divide-[var(--color-neutral-200)] border-y border-[var(--color-neutral-200)]">
              {RELEASES.map((r) => (
                <li key={r.title} className="flex flex-col gap-2 py-8">
                  <time dateTime={r.date} className="text-xs uppercase tracking-[0.16em] text-[var(--color-neutral-500)]">
                    {fmt.format(new Date(r.date))}
                  </time>
                  <h2 className="font-[family-name:var(--font-display)] text-2xl leading-tight tracking-[-0.02em]">
                    {r.title}
                  </h2>
                  <p className="max-w-2xl text-[15px] text-[var(--color-neutral-600)]">{r.body}</p>
                </li>
              ))}
            </ol>
            <aside className="h-fit rounded-[var(--radius-lg)] bg-[var(--color-surface-warm)] p-6 md:p-8">
              <h2 className="mb-3 font-[family-name:var(--font-display)] text-2xl tracking-[-0.02em]">
                Media contact
              </h2>
              <p className="text-[15px] text-[var(--color-neutral-700)]">
                Press enquiries, interviews and press-car loans:
              </p>
              <p className="mt-3">
                <a href="mailto:press@dealership.my" className="underline underline-offset-4">
                  press@dealership.my
                </a>
                <br />
                <a href={SITE.phone.href} className="underline underline-offset-4">
                  {SITE.phone.display}
                </a>
              </p>
              <p className="mt-6 text-sm text-[var(--color-neutral-600)]">
                Looking for stories from the road? Read our{" "}
                <Link href="/blog" className="underline underline-offset-4">
                  journal
                </Link>
                .
              </p>
            </aside>
          </div>
        </Container>
      </Section>
    </>
  );
}
