import nodemailer, { type Transporter } from "nodemailer";
import type { FastifyBaseLogger } from "fastify";

/**
 * Lightweight email transport. Reads SMTP settings from env at first send.
 * If any required SMTP variable is missing, falls back to logging the
 * payload — local dev without an SMTP server still works, just no real
 * delivery happens.
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

export interface SendMailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export async function sendMail(
  log: FastifyBaseLogger,
  input: SendMailInput,
): Promise<{ sent: boolean; reason?: string }> {
  const t = getTransport();
  if (!t) {
    log.info(
      {
        email: { to: input.to, subject: input.subject, replyTo: input.replyTo },
      },
      "[email-stub] SMTP not configured — payload logged, not sent",
    );
    return { sent: false, reason: "smtp_not_configured" };
  }
  try {
    await t.transport.sendMail({
      from: t.from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo,
    });
    log.info({ to: input.to, subject: input.subject }, "email sent");
    return { sent: true };
  } catch (err) {
    log.error({ err, to: input.to, subject: input.subject }, "email send failed");
    return { sent: false, reason: "send_failed" };
  }
}

export function adminNotificationRecipient(): string | null {
  return process.env.ADMIN_NOTIFY_EMAIL ?? null;
}
