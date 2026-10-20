import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { SITE } from "@dealership/types";
import { Container } from "@dealership/ui/components/container";
import { Section } from "@dealership/ui/components/section";
import { PageHero } from "@/components/page-hero";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact us",
  description: `Visit our ${SITE.address.city} showroom, call ${SITE.phone.display}, WhatsApp us, or send a message — we reply within one business day.`,
};

export default function ContactPage(): React.ReactElement {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    name: SITE.name,
    telephone: SITE.phone.display,
    email: SITE.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE.address.street,
      postalCode: SITE.address.postcode,
      addressLocality: SITE.address.city,
      addressRegion: SITE.address.state,
      addressCountry: "MY",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "09:00",
        closes: "19:00",
      },
    ],
  };

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Talk to a person, not a script."
        intro="Questions about a car, a quote, financing or your service booking — send us a note, call, or drop by the showroom."
      />

      <Section spacing="default">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1fr_1.35fr] lg:gap-16">
            <div className="flex flex-col gap-8">
              <ContactItem icon={<MapPin className="h-5 w-5" />} title="Showroom">
                <address className="not-italic">
                  {SITE.address.street}
                  <br />
                  {SITE.address.postcode} {SITE.address.city}, {SITE.address.state}
                </address>
                <a href={SITE.mapsUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block underline underline-offset-4">
                  Get directions
                </a>
              </ContactItem>
              <ContactItem icon={<Clock className="h-5 w-5" />} title="Opening hours">
                <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
                  {SITE.hours.map((h) => (
                    <div key={h.days} className="contents">
                      <dt>{h.days}</dt>
                      <dd className="tabular-nums text-[var(--color-graphite)]">{h.time}</dd>
                    </div>
                  ))}
                </dl>
              </ContactItem>
              <ContactItem icon={<Phone className="h-5 w-5" />} title="Call">
                <a href={SITE.phone.href} className="text-[var(--color-graphite)] underline-offset-4 hover:underline">
                  {SITE.phone.display}
                </a>
              </ContactItem>
              <ContactItem icon={<MessageCircle className="h-5 w-5" />} title="WhatsApp">
                <a href={SITE.whatsappUrl} target="_blank" rel="noreferrer" className="text-[var(--color-graphite)] underline-offset-4 hover:underline">
                  Message us on WhatsApp
                </a>
                <p className="text-sm">Fastest for quick questions during opening hours.</p>
              </ContactItem>
              <ContactItem icon={<Mail className="h-5 w-5" />} title="Email">
                <ul className="flex flex-col gap-1">
                  <li>
                    Sales —{" "}
                    <a href={`mailto:${SITE.salesEmail}`} className="text-[var(--color-graphite)] underline-offset-4 hover:underline">
                      {SITE.salesEmail}
                    </a>
                  </li>
                  <li>
                    Service —{" "}
                    <a href={`mailto:${SITE.serviceEmail}`} className="text-[var(--color-graphite)] underline-offset-4 hover:underline">
                      {SITE.serviceEmail}
                    </a>
                  </li>
                  <li>
                    General —{" "}
                    <a href={`mailto:${SITE.email}`} className="text-[var(--color-graphite)] underline-offset-4 hover:underline">
                      {SITE.email}
                    </a>
                  </li>
                </ul>
              </ContactItem>
            </div>

            <div>
              <h2 className="mb-6 font-[family-name:var(--font-display)] text-3xl tracking-[-0.02em]">
                Send us a message
              </h2>
              <ContactForm />
            </div>
          </div>
        </Container>
      </Section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </>
  );
}

function ContactItem({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex gap-4">
      <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-warm)] text-[var(--color-accent-deep)]">
        {icon}
      </span>
      <div className="flex flex-col gap-1 text-[15px] text-[var(--color-neutral-600)]">
        <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-graphite)]">
          {title}
        </h3>
        {children}
      </div>
    </div>
  );
}
