import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Handshake, ShieldCheck, Wrench } from "lucide-react";
import { Container } from "@dealership/ui/components/container";
import { Section } from "@dealership/ui/components/section";
import { CtaBand } from "@/components/cta-band";
import { PageHero } from "@/components/page-hero";
import { Prose } from "@/components/prose";
import { ABOUT_IMAGE, SHOWROOM_IMAGE } from "@/data/media";

export const metadata: Metadata = {
  title: "Our story",
  description:
    "An authorised dealership in Petaling Jaya since 2001 — how we sell, service and stand behind every car we deliver.",
};

const NUMBERS = [
  { value: "25", label: "years in Petaling Jaya" },
  { value: "18,000+", label: "cars delivered" },
  { value: "4.8★", label: "average Google rating" },
  { value: "62%", label: "of customers come back" },
];

const PRINCIPLES = [
  {
    icon: Handshake,
    title: "One price, said out loud",
    body: "The price on the website is the price at the desk. No dealer add-ons, no 'mandatory' accessory packs, no surprise handling fees.",
  },
  {
    icon: ShieldCheck,
    title: "Prepared, not just parked",
    body: "Every car passes the same 120-point pre-delivery check by the same team before it leaves the showroom floor — new or in stock.",
  },
  {
    icon: Wrench,
    title: "Here after the handover",
    body: "Our service centre is on the same site. The people who sold you the car are a two-minute walk from the people who look after it.",
  },
];

export default function AboutPage(): React.ReactElement {
  return (
    <>
      <PageHero
        eyebrow="Our story"
        title="Twenty-five years on the same corner."
        intro="We started as a two-bay workshop in Petaling Jaya. We're still family-run, still on the same road, and still the people you call when something isn't right."
        image={{ src: ABOUT_IMAGE, alt: "A coupé parked at a marina at dusk" }}
      />

      <Section spacing="default">
        <Container>
          <dl className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {NUMBERS.map((n) => (
              <div key={n.label} className="flex flex-col gap-1 border-t border-[var(--color-neutral-200)] pt-5">
                <dt className="order-2 text-sm text-[var(--color-neutral-600)]">{n.label}</dt>
                <dd className="font-[family-name:var(--font-display)] text-4xl tabular-nums tracking-[-0.02em] md:text-5xl">
                  {n.value}
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </Section>

      <Section variant="warm" spacing="default">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-16">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-neutral-100)]">
              <Image src={SHOWROOM_IMAGE} alt="A car prepared for handover in the showroom" fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
            </div>
            <Prose>
              <h2>How we got here</h2>
              <p>
                In 2001 our founder, a mechanic by trade, opened a two-bay workshop off Jalan Sultan
                Ismail. Customers kept asking him which new car to buy, so he started selling them.
                Within five years the workshop had become an authorised dealership.
              </p>
              <p>
                The workshop never went away. Today it&rsquo;s a twelve-bay service centre on the
                same site as the showroom, and it shapes how we sell: we know which cars come back
                with problems and which don&rsquo;t, and we&rsquo;d rather tell you than find out
                together later.
              </p>
              <p>
                We&rsquo;re a small team by design. You&rsquo;ll deal with the same consultant from
                test drive to handover, and you can call them directly afterwards.
              </p>
            </Prose>
          </div>
        </Container>
      </Section>

      <Section spacing="default">
        <Container>
          <h2
            className="mb-12 max-w-2xl font-[family-name:var(--font-display)] tracking-[-0.02em]"
            style={{ fontSize: "clamp(32px, 4.5vw, 48px)", lineHeight: 1.05 }}
          >
            Three things we won&rsquo;t compromise on.
          </h2>
          <ul className="grid gap-6 md:grid-cols-3">
            {PRINCIPLES.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-[var(--color-neutral-200)] p-6 md:p-8">
                <Icon className="h-7 w-7 text-[var(--color-accent)]" strokeWidth={1.5} aria-hidden />
                <h3 className="font-[family-name:var(--font-display)] text-2xl tracking-[-0.02em]">{title}</h3>
                <p className="text-[15px] leading-relaxed text-[var(--color-neutral-600)]">{body}</p>
              </li>
            ))}
          </ul>
          <p className="mt-10 text-sm text-[var(--color-neutral-600)]">
            Meet the people behind this —{" "}
            <Link href="/about/team" className="underline underline-offset-4">
              our team
            </Link>
            , or{" "}
            <Link href="/careers" className="underline underline-offset-4">
              join us
            </Link>
            .
          </p>
        </Container>
      </Section>

      <CtaBand
        title="Come and see us."
        body="The kettle's on six days a week. No appointment needed — though booking a test drive guarantees a car is ready."
        primary={{ href: "/test-drive", label: "Book a test drive" }}
        secondary={{ href: "/contact", label: "Opening hours & directions" }}
      />
    </>
  );
}
