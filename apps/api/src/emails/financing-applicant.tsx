import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

export interface FinancingApplicantEmailProps {
  applicantName: string;
  reference: string;
  vehicleLabel: string;
  vehiclePrice: string;
  estimatedMonthly: string;
  tenureYears: number;
  interestRatePct: string;
  downPayment: string;
  dealershipPhone: string;
  whatsappUrl: string;
}

const DEFAULTS: FinancingApplicantEmailProps = {
  applicantName: "there",
  reference: "FA-XXXXXX",
  vehicleLabel: "your selected vehicle",
  vehiclePrice: "RM 0",
  estimatedMonthly: "RM 0",
  tenureYears: 9,
  interestRatePct: "2.5",
  downPayment: "RM 0",
  dealershipPhone: "+60 3 7801 2345",
  whatsappUrl: "https://wa.me/60378012345",
};

export function FinancingApplicantEmail(
  props: Partial<FinancingApplicantEmailProps> = {},
): React.ReactElement {
  const p = { ...DEFAULTS, ...props };
  const subject = `We received your financing application — ${p.reference}`;
  return (
    <Html>
      <Head />
      <Preview>{subject}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={h1}>Application received.</Heading>
          <Text style={paragraph}>Hi {p.applicantName},</Text>
          <Text style={paragraph}>
            Thanks for applying. A financing specialist will review your
            details and reach out within 1–2 business days. Keep this email
            for your records.
          </Text>

          <Section style={card}>
            <Text style={cardLabel}>Reference</Text>
            <Text style={cardValue}>{p.reference}</Text>
            <Hr style={hr} />
            <Text style={cardLabel}>Vehicle</Text>
            <Text style={cardValue}>{p.vehicleLabel}</Text>
            <Text style={cardSub}>OTR estimate {p.vehiclePrice}</Text>
            <Hr style={hr} />
            <Text style={cardLabel}>Indicative terms</Text>
            <Text style={cardValue}>
              {p.tenureYears}-year loan · {p.interestRatePct}% indicative rate
              · {p.downPayment} down
            </Text>
            <Text style={cardSub}>
              Estimated {p.estimatedMonthly} per month — final rate is subject
              to bank approval and credit assessment.
            </Text>
          </Section>

          <Heading as="h2" style={h2}>
            What happens next
          </Heading>
          <Text style={paragraph}>
            • We&rsquo;ll verify your details and submit your application to our
            partner banks.
            <br />• If we need additional documents (IC, payslips, bank
            statements), we&rsquo;ll request them by email.
            <br />• You&rsquo;ll hear back from us with the bank&rsquo;s
            indicative offer within 1–2 business days.
          </Text>

          <Heading as="h2" style={h2}>
            Need to update something?
          </Heading>
          <Text style={paragraph}>
            Reply to this email or message us on{" "}
            <Link href={p.whatsappUrl}>WhatsApp</Link>. Quote {p.reference} so
            we can pull up your file quickly.
          </Text>

          <Hr style={hr} />
          <Text style={footer}>
            You&rsquo;re receiving this because you submitted a financing
            application with us. Reach us anytime at {p.dealershipPhone}.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default FinancingApplicantEmail;

const body = {
  backgroundColor: "#f7f5f1",
  fontFamily: "Helvetica, Arial, sans-serif",
} as const;
const container = {
  margin: "0 auto",
  padding: "32px 24px",
  maxWidth: "560px",
  backgroundColor: "#ffffff",
} as const;
const h1 = {
  fontSize: "32px",
  fontWeight: 300,
  letterSpacing: "-0.02em",
  margin: "0 0 16px",
} as const;
const h2 = {
  fontSize: "18px",
  fontWeight: 600,
  margin: "24px 0 8px",
} as const;
const paragraph = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#333",
  margin: "0 0 12px",
} as const;
const card = {
  backgroundColor: "#faf7f2",
  padding: "20px",
  borderRadius: "8px",
  margin: "16px 0",
} as const;
const cardLabel = {
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: "0.16em",
  color: "#777",
  margin: "0",
} as const;
const cardValue = {
  fontSize: "14px",
  color: "#1a1a1a",
  margin: "4px 0 4px",
} as const;
const cardSub = {
  fontSize: "12px",
  color: "#666",
  margin: "0 0 8px",
} as const;
const hr = { borderColor: "#eee", margin: "12px 0" } as const;
const footer = { fontSize: "12px", color: "#888", margin: "16px 0 0" } as const;
