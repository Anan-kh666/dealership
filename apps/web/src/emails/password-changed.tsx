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

export interface PasswordChangedEmailProps {
  changedAt: string;
  contactUrl: string;
}

export function PasswordChangedEmail({
  changedAt,
  contactUrl,
}: PasswordChangedEmailProps): React.ReactElement {
  return (
    <Html>
      <Head />
      <Preview>Your {DEALERSHIP_NAME} password was changed</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={h1}>Password changed.</Heading>
          <Text style={paragraph}>
            Your {DEALERSHIP_NAME} account password was changed on {changedAt}.
            All other devices have been signed out.
          </Text>
          <Text style={paragraph}>
            Wasn&rsquo;t you? Reply to this email or contact us right away at{" "}
            {contactUrl} so we can secure your account.
          </Text>
          <Hr style={hr} />
          <Text style={muted}>
            You&rsquo;re receiving this security notification because a
            password change happened on your {DEALERSHIP_NAME} account.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default PasswordChangedEmail;
