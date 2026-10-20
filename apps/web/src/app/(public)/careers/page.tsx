import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { SITE } from "@dealership/types";
import { Container } from "@dealership/ui/components/container";
import { Section } from "@dealership/ui/components/section";
import { PageHero } from "@/components/page-hero";

export const metadata: Metadata = {
  title: "Careers",
  description: "Open roles in sales, service and finance at our Petaling Jaya showroom.",
};

const ROLES = [
  {
    title: "Sales Consultant",
    team: "Sales",
    type: "Full-time",
    summary:
      "Guide customers from first visit to handover. Salary plus uncapped commission; no sales experience needed if you're curious and patient.",
  },
  {
    title: "EV Service Technician",
    team: "Service",
    type: "Full-time",
    summary:
      "Diagnose and maintain hybrid and electric drivetrains. High-voltage certification provided; 3+ years' workshop experience preferred.",
  },
  {
    title: "Finance & Insurance Executive",
    team: "Finance",
    type: "Full-time",
    summary:
      "Prepare hire-purchase applications, liaise with panel banks and explain the numbers to customers in plain language.",
  },
  {
    title: "Customer Care Associate",
    team: "After-sales",
    type: "Full-time",
    summary:
      "Be the friendly voice on the phone and WhatsApp — booking services, chasing parts and following up after every visit.",
  },
];

const BENEFITS = [
  "Five-day week with rotating Saturdays",
  "Medical, dental and optical cover",
  "Paid manufacturer training and certification",
  "Staff pricing on new cars and servicing",
  "EPF contribution above statutory minimum",
  "Parking on site (and EV charging)",
];

export default function CareersPage(): React.ReactElement {
  return (
    <>
      <PageHero
        eyebrow="Careers"
        title="Build a career, not a quota."
        intro="We're a small team that stays together — the average tenure here is over eight years. If you care about doing right by customers, you'll fit in."
      />

      <Section spacing="default">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr] lg:gap-16">
            <section aria-labelledby="roles">
              <h2 id="roles" className="mb-6 font-[family-name:var(--font-display)] text-3xl tracking-[-0.02em]">
                Open roles
              </h2>
              <ul className="divide-y divide-[var(--color-neutral-200)] border-y border-[var(--color-neutral-200)]">
                {ROLES.map((r) => (
                  <li key={r.title}>
                    <a
                      href={`mailto:careers@dealership.my?subject=${encodeURIComponent(`Application — ${r.title}`)}`}
                      className="group flex flex-col gap-2 py-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="font-[family-name:var(--font-display)] text-2xl tracking-[-0.02em] group-hover:text-[var(--color-accent-deep)]">
                          {r.title}
                        </h3>
                        <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-[var(--color-neutral-400)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--color-accent-deep)]" aria-hidden />
                      </div>
                      <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-neutral-500)]">
                        {r.team} · {r.type} · {SITE.address.city}
                      </p>
                      <p className="max-w-2xl text-[15px] text-[var(--color-neutral-600)]">{r.summary}</p>
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-[var(--color-neutral-600)]">
                Don&rsquo;t see your role? Send your CV to{" "}
                <a href="mailto:careers@dealership.my" className="underline underline-offset-4">
                  careers@dealership.my
                </a>{" "}
                — we read every one.
              </p>
            </section>

            <aside className="h-fit rounded-[var(--radius-lg)] bg-[var(--color-surface-warm)] p-6 md:p-8">
              <h2 className="mb-4 font-[family-name:var(--font-display)] text-2xl tracking-[-0.02em]">
                What you get
              </h2>
              <ul className="flex flex-col gap-3 text-[15px] text-[var(--color-neutral-700)]">
                {BENEFITS.map((b) => (
                  <li key={b} className="flex gap-3">
                    <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
                    {b}
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </Container>
      </Section>
    </>
  );
}
