import type { Metadata } from "next";
import { Container } from "@dealership/ui/components/container";
import { Section } from "@dealership/ui/components/section";
import { CtaBand } from "@/components/cta-band";
import { PageHero } from "@/components/page-hero";

export const metadata: Metadata = {
  title: "Our team",
  description: "The consultants, technicians and advisers you'll meet at our Petaling Jaya showroom.",
};

const TEAM: { group: string; people: { name: string; role: string; since: number; note: string }[] }[] = [
  {
    group: "Leadership",
    people: [
      { name: "Farid Ismail", role: "Managing Director", since: 2004, note: "Started in the workshop; still checks every pre-delivery report." },
      { name: "Mei Ling Wong", role: "Head of Finance & Insurance", since: 2011, note: "Has negotiated with every panel bank in the Klang Valley." },
    ],
  },
  {
    group: "Sales",
    people: [
      { name: "Daniel Tan", role: "Senior Sales Consultant", since: 2014, note: "Aurora specialist and father of three — ask him about the third row." },
      { name: "Aisyah Rahman", role: "EV Product Specialist", since: 2021, note: "Has driven a Lumen to every state in the Peninsula." },
      { name: "Arjun Nair", role: "Sales Consultant", since: 2019, note: "Your man for the Continental GT and anything with a V8." },
    ],
  },
  {
    group: "Service & after-sales",
    people: [
      { name: "Lim Wei Jie", role: "Service Manager", since: 2009, note: "Runs the twelve-bay service centre next door." },
      { name: "Nurul Huda", role: "Customer Care Lead", since: 2017, note: "The person who calls you back — every time." },
    ],
  },
];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("");
}

export default function TeamPage(): React.ReactElement {
  return (
    <>
      <PageHero
        eyebrow="Our team"
        title="The people you'll actually meet."
        intro="Small by design. One consultant looks after you from first visit to handover — and picks up the phone afterwards."
      />

      <Section spacing="default">
        <Container>
          <div className="flex flex-col gap-16">
            {TEAM.map((g) => (
              <section key={g.group} aria-labelledby={`team-${g.group}`}>
                <h2
                  id={`team-${g.group}`}
                  className="mb-6 text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-neutral-500)]"
                >
                  {g.group}
                </h2>
                <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {g.people.map((p) => (
                    <li key={p.name} className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-[var(--color-neutral-200)] bg-white p-6">
                      <span
                        aria-hidden
                        className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-graphite)] font-[family-name:var(--font-display)] text-lg text-white"
                      >
                        {initials(p.name)}
                      </span>
                      <div>
                        <h3 className="font-[family-name:var(--font-display)] text-xl tracking-[-0.02em]">{p.name}</h3>
                        <p className="text-sm text-[var(--color-accent-deep)]">{p.role}</p>
                      </div>
                      <p className="text-[15px] text-[var(--color-neutral-600)]">{p.note}</p>
                      <p className="mt-auto text-xs text-[var(--color-neutral-500)]">With us since {p.since}</p>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </Container>
      </Section>

      <CtaBand
        title="Want to work with us?"
        body="We hire for patience and honesty first. The product knowledge we can teach."
        primary={{ href: "/careers", label: "See open roles" }}
      />
    </>
  );
}
