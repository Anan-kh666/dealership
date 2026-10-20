import Link from "next/link";
import type { Metadata } from "next";
import { BatteryCharging, CalendarCheck, Car, LifeBuoy, ShieldCheck, Wrench } from "lucide-react";
import { SITE } from "@dealership/types";
import { Container } from "@dealership/ui/components/container";
import { Section } from "@dealership/ui/components/section";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@dealership/ui/components/accordion";
import { CtaBand } from "@/components/cta-band";
import { PageHero } from "@/components/page-hero";
import { SERVICE_IMAGE } from "@/data/media";

export const metadata: Metadata = {
  title: "After-sales & service",
  description:
    "Five-year warranty, three years of included servicing, 24-hour roadside assistance and a twelve-bay service centre next to the showroom.",
};

const COVER = [
  { icon: ShieldCheck, title: "5-year warranty", body: "Unlimited mileage, manufacturer-backed. Eight years on hybrid and EV batteries." },
  { icon: Wrench, title: "3 years of servicing", body: "Every scheduled service included — parts, lubricants and labour." },
  { icon: LifeBuoy, title: "24/7 roadside assistance", body: "Breakdown, flat battery or lock-out anywhere in Peninsular Malaysia." },
  { icon: Car, title: "Courtesy cars", body: "For any job expected to take longer than four hours — just ask when you book." },
  { icon: BatteryCharging, title: "EV-certified bays", body: "Dedicated high-voltage bays and technicians for hybrid and electric models." },
  { icon: CalendarCheck, title: "Book in two minutes", body: "WhatsApp, phone or email — we'll confirm a slot the same day." },
];

const FAQ = [
  {
    q: "How often does my car need servicing?",
    a: "Every 10,000 km or 6 months, whichever comes first. Electric models follow a 20,000 km / 12-month schedule.",
  },
  {
    q: "Do I have to service with you to keep the warranty?",
    a: "No. Any authorised service centre keeps your warranty valid, as long as servicing follows the schedule and is recorded.",
  },
  {
    q: "What isn't covered by the service plan?",
    a: "Wear-and-tear parts — tyres, brake pads and discs, wiper blades and bulbs — and damage from accidents or misuse. We'll always quote before doing any chargeable work.",
  },
  {
    q: "How long does a standard service take?",
    a: "About two hours. There's a lounge with Wi-Fi and coffee, or we can drop you at the LRT station.",
  },
];

export default function AfterSalesPage(): React.ReactElement {
  return (
    <>
      <PageHero
        eyebrow="After-sales"
        title="The relationship starts at the handover."
        intro="Our twelve-bay service centre sits next to the showroom. The people who sold you your car are a short walk from the people who look after it."
        image={{ src: SERVICE_IMAGE, alt: "Technician topping up engine oil during a service" }}
      />

      <Section spacing="default">
        <Container>
          <h2
            className="mb-12 max-w-2xl font-[family-name:var(--font-display)] tracking-[-0.02em]"
            style={{ fontSize: "clamp(32px, 4.5vw, 48px)", lineHeight: 1.05 }}
          >
            Included with every new car.
          </h2>
          <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {COVER.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex flex-col gap-3">
                <Icon className="h-7 w-7 text-[var(--color-accent)]" strokeWidth={1.5} aria-hidden />
                <h3 className="font-[family-name:var(--font-display)] text-2xl tracking-[-0.02em]">{title}</h3>
                <p className="text-[15px] text-[var(--color-neutral-600)]">{body}</p>
              </li>
            ))}
          </ul>
          <p className="mt-10 text-sm text-[var(--color-neutral-600)]">
            The details, plainly:{" "}
            <Link href="/blog/service-without-the-surprise" className="underline underline-offset-4">
              what our service plan covers
            </Link>
            .
          </p>
        </Container>
      </Section>

      <Section variant="warm" spacing="default">
        <Container>
          <div className="grid gap-10 md:grid-cols-[1fr_2fr] md:gap-16">
            <h2
              className="font-[family-name:var(--font-display)] tracking-[-0.02em]"
              style={{ fontSize: "clamp(28px, 4vw, 40px)", lineHeight: 1.1 }}
            >
              Service questions
            </h2>
            <Accordion type="single" collapsible className="w-full">
              {FAQ.map((f, i) => (
                <AccordionItem key={f.q} value={`q${i}`}>
                  <AccordionTrigger>{f.q}</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-[15px] text-[var(--color-neutral-700)]">{f.a}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </Container>
      </Section>

      <CtaBand
        title="Book a service."
        body={`WhatsApp us or call ${SITE.phone.display} — we'll confirm a slot the same day.`}
        primary={{ href: SITE.whatsappUrl, label: "Book on WhatsApp" }}
        secondary={{ href: "/contact", label: "Other ways to reach us" }}
      />
    </>
  );
}
