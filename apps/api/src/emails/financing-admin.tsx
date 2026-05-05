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

export interface FinancingAdminEmailProps {
  reference: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  vehicleLabel: string;
  vehiclePrice: string;
  tenureYears: number;
  interestRatePct: string;
  downPayment: string;
  estimatedMonthly: string;
  employmentType: string;
  employerName: string;
  monthlyIncome: string;
  documentsAttached: boolean;
  applicationUrl?: string;
}

const DEFAULTS: FinancingAdminEmailProps = {
  reference: "FA-XXXXXX",
  applicantName: "Applicant",
  applicantEmail: "applicant@example.com",
  applicantPhone: "+60 12 345 6789",
  vehicleLabel: "Vehicle",
  vehiclePrice: "RM 0",
  tenureYears: 9,
  interestRatePct: "2.5",
  downPayment: "RM 0",
  estimatedMonthly: "RM 0",
  employmentType: "PERMANENT",
  employerName: "—",
  monthlyIncome: "RM 0",
  documentsAttached: false,
  applicationUrl: undefined,
};

export function FinancingAdminEmail(
  props: Partial<FinancingAdminEmailProps> = {},
): React.ReactElement {
  const p = { ...DEFAULTS, ...props };
  const subject = `New financing application — ${p.reference}`;

  return (
    <Html>
      <Head />
      <Preview>{subject}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={h1}>New financing application</Heading>
          <Text style={paragraph}>
            <strong>{p.reference}</strong> — submitted just now.
          </Text>

          <Section style={card}>
            <Text style={cardLabel}>Applicant</Text>
            <Text style={cardValue}>{p.applicantName}</Text>
            <Text style={cardSub}>
              <Link href={`mailto:${p.applicantEmail}`}>{p.applicantEmail}</Link>
              {" · "}
              {p.applicantPhone}
            </Text>
            <Hr style={hr} />
            <Text style={cardLabel}>Vehicle</Text>
            <Text style={cardValue}>{p.vehicleLabel}</Text>
            <Text style={cardSub}>{p.vehiclePrice}</Text>
            <Hr style={hr} />
            <Text style={cardLabel}>Loan terms</Text>
            <Text style={cardValue}>
              {p.tenureYears} yrs · {p.interestRatePct}% · {p.downPayment} down
            </Text>
            <Text style={cardSub}>{p.estimatedMonthly} estimated monthly</Text>
            <Hr style={hr} />
            <Text style={cardLabel}>Employment</Text>
            <Text style={cardValue}>
              {p.employmentType} · {p.employerName}
            </Text>
            <Text style={cardSub}>Gross monthly income {p.monthlyIncome}</Text>
            <Hr style={hr} />
            <Text style={cardLabel}>Documents</Text>
            <Text style={cardValue}>
              {p.documentsAttached
                ? "Customer uploaded supporting documents"
                : "Not uploaded — request by email"}
            </Text>
          </Section>

          {p.applicationUrl ? (
            <Text style={paragraph}>
              <Link href={p.applicationUrl}>Open application in admin →</Link>
            </Text>
          ) : null}

          <Hr style={hr} />
          <Text style={footer}>
            Reach the applicant at {p.applicantEmail} or {p.applicantPhone}.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default FinancingAdminEmail;

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
  fontSize: "28px",
  fontWeight: 300,
  letterSpacing: "-0.02em",
  margin: "0 0 16px",
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
