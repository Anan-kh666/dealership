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

export interface VerifyEmailProps {
  verifyUrl: string;
}

export function VerifyEmail({
  verifyUrl,
}: VerifyEmailProps): React.ReactElement {
  return (
    <Html>
      <Head />
      <Preview>Verify your email to start using {DEALERSHIP_NAME}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={h1}>Verify your email.</Heading>
          <Text style={paragraph}>
            Confirm your email address to activate your {DEALERSHIP_NAME}{" "}
            account. The link expires in 24 hours.
          </Text>
          <Button href={verifyUrl} style={buttonStyle}>
            Verify email
          </Button>
          <Text style={paragraph}>
            Or paste this URL into your browser: <br />
            {verifyUrl}
          </Text>
          <Hr style={hr} />
          <Text style={muted}>
            You&rsquo;re receiving this because someone signed up for{" "}
            {DEALERSHIP_NAME} with this email address. If that wasn&rsquo;t
            you, you can safely ignore this message.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default VerifyEmail;
