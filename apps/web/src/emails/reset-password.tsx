import {
  Body,
  Button,
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
  buttonStyle,
  container,
  DEALERSHIP_NAME,
  h1,
  hr,
  muted,
  paragraph,
} from "./styles.js";

export interface ResetPasswordEmailProps {
  resetUrl: string;
}

export function ResetPasswordEmail({
  resetUrl,
}: ResetPasswordEmailProps): React.ReactElement {
  return (
    <Html>
      <Head />
      <Preview>Reset your {DEALERSHIP_NAME} password</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={h1}>Reset your password.</Heading>
          <Text style={paragraph}>
            Click the button below to choose a new password. The link expires
            in 24 hours.
          </Text>
          <Button href={resetUrl} style={buttonStyle}>
            Reset password
          </Button>
          <Text style={paragraph}>
            Or paste this URL into your browser: <br />
            {resetUrl}
          </Text>
          <Hr style={hr} />
          <Text style={muted}>
            You requested a password reset for your {DEALERSHIP_NAME} account.
            If you didn&rsquo;t request this, you can safely ignore this email
            — your password won&rsquo;t change.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default ResetPasswordEmail;
