import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Text,
} from "@react-email/components";
import * as React from "react";
import {
  body,
  container,
  DEALERSHIP_NAME,
  h1,
  hr,
  muted,
  paragraph,
} from "./styles.js";

export function AccountDeletedEmail(): React.ReactElement {
  return (
    <Html>
      <Head />
      <Preview>Your {DEALERSHIP_NAME} account has been deleted</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={h1}>Account deleted.</Heading>
          <Text style={paragraph}>
            Your {DEALERSHIP_NAME} account has been deleted at your request.
            Your saved builds, profile, and active sessions are gone.
          </Text>
          <Text style={paragraph}>
            For our records — and to comply with PDPA — any test-drive
            bookings, financing applications, and trade-in quotes you
            submitted have been kept but anonymised. They&rsquo;re no longer
            linked to a profile.
          </Text>
          <Text style={paragraph}>
            You&rsquo;re welcome back any time. We&rsquo;ll keep this email as
            confirmation that the deletion ran.
          </Text>
          <Hr style={hr} />
          <Text style={muted}>
            You&rsquo;re receiving this because you deleted your{" "}
            {DEALERSHIP_NAME} account. No further marketing emails will be
            sent to this address.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default AccountDeletedEmail;
