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

export interface TestDriveConfirmationProps {
  guestName: string;
  vehicleLabel: string;
  formattedDate: string;
  formattedTime: string;
  reference: string;
  dealershipAddress: string;
  dealershipPhone: string;
  whatsappUrl: string;
}

const DEFAULTS: TestDriveConfirmationProps = {
  guestName: "there",
  vehicleLabel: "your selected vehicle",
  formattedDate: "Saturday, 9 May 2026",
  formattedTime: "11:00 AM",
  reference: "TD-XXXXXX",
  dealershipAddress: "Lot 12, Jalan Sultan Ismail, 50250 Petaling Jaya, Selangor",
  dealershipPhone: "+60 3 7801 2345",
  whatsappUrl: "https://wa.me/60378012345",
};

export function TestDriveConfirmationEmail(
  props: Partial<TestDriveConfirmationProps> = {},
): React.ReactElement {
  const p = { ...DEFAULTS, ...props };
  const subject = `Test drive confirmed — ${p.vehicleLabel} on ${p.formattedDate}`;

  return (
    <Html>
      <Head />
      <Preview>{subject}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={h1}>You&rsquo;re confirmed.</Heading>
          <Text style={paragraph}>Hi {p.guestName},</Text>
          <Text style={paragraph}>
            Thanks for booking a test drive. Here&rsquo;s the summary &mdash; keep this email
            for your records.
          </Text>

          <Section style={card}>
            <Text style={cardLabel}>Reference</Text>
            <Text style={cardValue}>{p.reference}</Text>
            <Hr style={hr} />
            <Text style={cardLabel}>Vehicle</Text>
            <Text style={cardValue}>{p.vehicleLabel}</Text>
            <Hr style={hr} />
            <Text style={cardLabel}>Date &amp; time</Text>
            <Text style={cardValue}>
              {p.formattedDate} · {p.formattedTime}
            </Text>
            <Hr style={hr} />
            <Text style={cardLabel}>Showroom</Text>
            <Text style={cardValue}>{p.dealershipAddress}</Text>
            <Text style={cardValue}>{p.dealershipPhone}</Text>
          </Section>

          <Heading as="h2" style={h2}>
            What to bring on the day
          </Heading>
          <Text style={paragraph}>
            • NRIC or passport
            <br />• Your driving license (the one you provided when booking)
            <br />• Comfortable footwear
          </Text>

          <Heading as="h2" style={h2}>
            Need to reschedule?
          </Heading>
          <Text style={paragraph}>
            Message us on <Link href={p.whatsappUrl}>WhatsApp</Link> and we&rsquo;ll
            move things around.
          </Text>

          <Hr style={hr} />
          <Text style={footer}>
            Sent from {p.dealershipAddress}. You&rsquo;re receiving this because you
            booked a test drive with us.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default TestDriveConfirmationEmail;

const body = { backgroundColor: "#f7f5f1", fontFamily: "Helvetica, Arial, sans-serif" } as const;
const container = { margin: "0 auto", padding: "32px 24px", maxWidth: "560px", backgroundColor: "#ffffff" } as const;
const h1 = { fontSize: "32px", fontWeight: 300, letterSpacing: "-0.02em", margin: "0 0 16px" } as const;
const h2 = { fontSize: "18px", fontWeight: 600, margin: "24px 0 8px" } as const;
const paragraph = { fontSize: "14px", lineHeight: "22px", color: "#333", margin: "0 0 12px" } as const;
const card = { backgroundColor: "#faf7f2", padding: "20px", borderRadius: "8px", margin: "16px 0" } as const;
const cardLabel = { fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.16em", color: "#777", margin: "0" } as const;
const cardValue = { fontSize: "14px", color: "#1a1a1a", margin: "4px 0 8px" } as const;
const hr = { borderColor: "#eee", margin: "12px 0" } as const;
const footer = { fontSize: "12px", color: "#888", margin: "16px 0 0" } as const;
