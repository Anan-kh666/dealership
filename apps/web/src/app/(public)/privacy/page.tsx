import type { Metadata } from "next";
import { SITE } from "@dealership/types";
import { Container } from "@dealership/ui/components/container";
import { Section } from "@dealership/ui/components/section";
import { PageHero } from "@/components/page-hero";
import { Prose } from "@/components/prose";

export const metadata: Metadata = {
  title: "Privacy notice",
  description: `How ${SITE.legalName} collects, uses and protects your personal data under Malaysia's Personal Data Protection Act 2010.`,
};

const UPDATED = "1 October 2026";

export default function PrivacyPage(): React.ReactElement {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Privacy notice"
        intro={`Last updated ${UPDATED}. This notice is issued under the Personal Data Protection Act 2010 (PDPA).`}
      />
      <Section spacing="default">
        <Container>
          <Prose>
            <p>
              {SITE.legalName} (&ldquo;we&rdquo;, &ldquo;us&rdquo;) respects your privacy. This
              notice explains what personal data we collect when you use our website or visit our
              showroom, why we collect it, and the choices you have.
            </p>

            <h2>1. What we collect</h2>
            <ul>
              <li>
                <strong>Contact details</strong> — name, email address, mobile number and postal
                address.
              </li>
              <li>
                <strong>Booking details</strong> — the vehicle, date and time of a test drive, and
                your driving licence number.
              </li>
              <li>
                <strong>Financing details</strong> — NRIC number, date of birth, nationality, marital
                status, employment and income information, and any documents you upload (IC copies,
                payslips, bank statements).
              </li>
              <li>
                <strong>Trade-in details</strong> — your vehicle&rsquo;s make, model, year, mileage,
                condition, VIN and photos.
              </li>
              <li>
                <strong>Account details</strong> — if you create an account, your login email and a
                securely hashed password. We never store your password in readable form.
              </li>
              <li>
                <strong>Technical data</strong> — IP address and basic usage information, used to
                keep the site secure and to prevent abuse.
              </li>
            </ul>

            <h2>2. Why we use it</h2>
            <ul>
              <li>To arrange and confirm test drives and showroom visits.</li>
              <li>
                To prepare and submit hire-purchase applications to our panel of financing banks on
                your behalf.
              </li>
              <li>To value your trade-in and send you a quote.</li>
              <li>To reply to your enquiries and provide after-sales service.</li>
              <li>To meet our legal, regulatory and accounting obligations.</li>
            </ul>
            <p>
              We will only send you marketing messages if you have agreed to receive them, and you
              can opt out at any time.
            </p>

            <h2>3. Who we share it with</h2>
            <p>
              We share personal data only where needed for the purposes above: with financing banks
              you apply to, insurers you choose, the vehicle manufacturer for warranty and recall
              purposes, JPJ for registration, and service providers who host our systems under
              confidentiality obligations. We do not sell your personal data.
            </p>

            <h2>4. How long we keep it</h2>
            <p>
              We keep personal data only for as long as necessary for the purpose it was collected,
              or as required by law. Financing documents not used for an approved application are
              deleted within 12 months.
            </p>

            <h2>5. Security</h2>
            <p>
              Your data is transmitted over encrypted connections and stored with access restricted
              to staff who need it. Uploaded documents are held in private storage and are not
              publicly listed.
            </p>

            <h2>6. Your rights</h2>
            <p>
              Under the PDPA you may request access to, or correction of, your personal data, and
              you may limit how we process it. To make a request, email{" "}
              <a href={`mailto:${SITE.email}`}>{SITE.email}</a> or write to us at{" "}
              {SITE.address.oneLine}. We may charge the fee permitted by the PDPA for access
              requests and will respond within 21 days.
            </p>

            <h2>7. Changes</h2>
            <p>
              We may update this notice from time to time. The date at the top shows when it last
              changed.
            </p>

            <p>
              In the event of any inconsistency between the English and Bahasa Malaysia versions of
              this notice, the English version prevails.
            </p>
          </Prose>
        </Container>
      </Section>
    </>
  );
}
