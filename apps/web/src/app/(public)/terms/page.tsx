import Link from "next/link";
import type { Metadata } from "next";
import { SITE } from "@dealership/types";
import { Container } from "@dealership/ui/components/container";
import { Section } from "@dealership/ui/components/section";
import { PageHero } from "@/components/page-hero";
import { Prose } from "@/components/prose";

export const metadata: Metadata = {
  title: "Terms of use",
  description: `Terms that apply when you use the ${SITE.name} website.`,
};

const UPDATED = "1 October 2026";

export default function TermsPage(): React.ReactElement {
  return (
    <>
      <PageHero eyebrow="Legal" title="Terms of use" intro={`Last updated ${UPDATED}.`} />
      <Section spacing="default">
        <Container>
          <Prose>
            <p>
              This website is operated by {SITE.legalName} ({SITE.registrationNo}). By using it you
              agree to these terms. If you don&rsquo;t agree, please don&rsquo;t use the site.
            </p>

            <h2>1. Prices and specifications</h2>
            <p>
              Prices shown are on-the-road estimates for Peninsular Malaysia, including registration
              and road tax but excluding insurance unless stated. Specifications, equipment and
              colours shown are for guidance and may change. Configurator totals are indicative; a
              vehicle is only sold when a sales agreement is signed and a booking fee is paid.
            </p>

            <h2>2. Stock availability</h2>
            <p>
              We update stock in real time, but a car shown as available may be reserved by another
              customer before you contact us. In-transit arrival dates are estimates supplied by the
              manufacturer.
            </p>

            <h2>3. Financing estimates</h2>
            <p>
              Monthly payments from our calculator are illustrations using flat-rate interest and do
              not constitute an offer of credit. Approval, rates and terms are decided by the
              financing bank. Submitting an application does not oblige you to accept an offer.
            </p>

            <h2>4. Trade-in valuations</h2>
            <p>
              Online valuations are based on the information and photos you provide and are subject
              to a physical inspection. Unless stated otherwise, a quote is valid for 7 days.
            </p>

            <h2>5. Test drives</h2>
            <p>
              Drivers must hold a valid, full Malaysian or international driving licence and be at
              least 21 years old. A staff member will accompany every test drive. We may decline or
              reschedule a booking for safety reasons.
            </p>

            <h2>6. Your account</h2>
            <p>
              You&rsquo;re responsible for keeping your password secure and for activity on your
              account. Tell us straight away if you think it has been misused.
            </p>

            <h2>7. Acceptable use</h2>
            <p>
              Don&rsquo;t misuse the site — for example by submitting false information, attempting
              to access other people&rsquo;s data, or interfering with its operation.
            </p>

            <h2>8. Liability</h2>
            <p>
              We take care to keep the site accurate and available, but we can&rsquo;t guarantee it
              will always be error-free. Nothing in these terms limits rights you have under the
              Consumer Protection Act 1999.
            </p>

            <h2>9. Privacy</h2>
            <p>
              How we handle personal data is described in our{" "}
              <Link href="/privacy">privacy notice</Link>.
            </p>

            <h2>10. Governing law</h2>
            <p>
              These terms are governed by the laws of Malaysia, and the courts of Malaysia have
              jurisdiction over any dispute.
            </p>

            <p>
              Questions? Email <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
            </p>
          </Prose>
        </Container>
      </Section>
    </>
  );
}
