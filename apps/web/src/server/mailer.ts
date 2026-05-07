import nodemailer, { type Transporter } from "nodemailer";
import { render } from "@react-email/render";
import * as React from "react";

/**
 * Web-side mailer. Mirrors apps/api/src/lib/mailer.ts: reads SMTP env at
 * first send, falls back to console logging if any required var is
 * missing. Local dev without SMTP still works.
 *
 * All auth emails go through here. The verification/reset URLs are
 * logged with the prefix `[email]` so you can grep for them.
 */

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  from: string;
}

let cached: Transporter | null = null;
let cachedFrom: string | null = null;

function readSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST;
  const portStr = process.env.SMTP_PORT;
  const from = process.env.MAIL_FROM ?? process.env.SMTP_FROM;
  if (!host || !portStr || !from) return null;
  const port = Number(portStr);
  if (!Number.isFinite(port) || port <= 0) return null;
  return {
    host,
    port,
    secure: port === 465 || process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from,
  };
}

function getTransport(): { transport: Transporter; from: string } | null {
  if (cached && cachedFrom) return { transport: cached, from: cachedFrom };
  const cfg = readSmtpConfig();
  if (!cfg) return null;
  cached = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: cfg.user && cfg.pass ? { user: cfg.user, pass: cfg.pass } : undefined,
  });
  cachedFrom = cfg.from;
  return { transport: cached, from: cachedFrom };
}

interface SendArgs {
  to: string;
  subject: string;
  react: React.ReactElement;
}

export async function sendEmail({
  to,
  subject,
  react,
}: SendArgs): Promise<{ sent: boolean }> {
  const html = await render(react);
  const text = await render(react, { plainText: true });

  const t = getTransport();
  if (!t) {
    // eslint-disable-next-line no-console
    console.info(`[email] (stub, SMTP not configured) to=${to} subject=${subject}`);
    // eslint-disable-next-line no-console
    console.info(`[email] body:\n${text}`);
    return { sent: false };
  }
  try {
    await t.transport.sendMail({
      from: t.from,
      to,
      subject,
      html,
      text,
    });
    // eslint-disable-next-line no-console
    console.info(`[email] sent to=${to} subject=${subject}`);
    return { sent: true };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[email] send failed to=${to} subject=${subject}`, err);
    return { sent: false };
  }
}

export function appBaseUrl(): string {
  return process.env.AUTH_URL ?? "http://localhost:3000";
}
