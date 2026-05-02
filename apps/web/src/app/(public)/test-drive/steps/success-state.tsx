"use client";

import * as React from "react";
import Link from "next/link";
import { BrandButton } from "@dealership/ui/components/brand-button";
import { formatKlDate, formatSlotLabel, KL_TZ } from "@/lib/test-drive/slots";
import { toZonedTime } from "date-fns-tz";
import type { SuccessPayload } from "../test-drive-flow";

const SHOWROOM_ADDRESS =
  "Lot 12, Jalan Sultan Ismail, 50250 Petaling Jaya, Selangor";
const WHATSAPP_BASE = "https://wa.me/60378012345";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function SuccessState({
  payload,
}: {
  payload: SuccessPayload;
}): React.ReactElement {
  const scheduled = new Date(payload.scheduledAt);
  const klMinutes = (() => {
    const z = toZonedTime(scheduled, KL_TZ);
    return z.getHours() * 60 + z.getMinutes();
  })();
  const formattedDate = formatKlDate(scheduled);
  const formattedTime = formatSlotLabel(klMinutes);
  const icsHref = `${API_URL}/public/test-drives/${payload.id}/ics`;
  const googleHref = buildGoogleCalendarUrl({
    title: `Test drive — ${payload.vehicleLabel}`,
    start: scheduled,
    durationMinutes: 60,
    location: SHOWROOM_ADDRESS,
    description: `Booking reference: ${payload.reference}\n\nBring your NRIC/passport, your driving license, and comfortable footwear.`,
  });
  const whatsappHref = `${WHATSAPP_BASE}?text=${encodeURIComponent(
    `Hi, I'd like to reschedule test drive ${payload.reference}.`,
  )}`;

  return (
    <div className="flex flex-col gap-10 rounded-[var(--radius-xl)] border border-[var(--color-neutral-200)] bg-card p-6 shadow-[var(--shadow-1)] md:p-12">
      <div className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-accent-deep)]">
          Booking confirmed
        </p>
        <h1
          className="font-[family-name:var(--font-display)] tracking-[-0.02em]"
          style={{ fontSize: "clamp(40px, 6vw, 56px)", lineHeight: 1.05 }}
        >
          You&rsquo;re confirmed.
        </h1>
        <p className="text-[var(--color-neutral-600)]">
          Reference{" "}
          <span className="font-medium tabular-nums text-[var(--color-graphite)]">
            {payload.reference}
          </span>{" "}
          &mdash; we&rsquo;ve sent a copy to {payload.guestEmail}.
        </p>
      </div>

      <dl className="grid grid-cols-1 gap-4 rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] bg-[var(--color-surface-warm)] p-5 text-sm md:grid-cols-2">
        <Detail label="Vehicle" value={payload.vehicleLabel} />
        <Detail label="Date" value={formattedDate} />
        <Detail label="Time" value={formattedTime} />
        <Detail label="Name" value={payload.guestName} />
        <Detail label="Showroom" value={SHOWROOM_ADDRESS} />
      </dl>

      <div className="flex flex-wrap gap-3">
        <BrandButton asChild variant="primary" size="md">
          <a href={icsHref} download={`${payload.reference}.ics`}>
            Add to calendar
          </a>
        </BrandButton>
        <BrandButton asChild variant="secondary" size="md">
          <a href={googleHref} target="_blank" rel="noreferrer">
            Add to Google Calendar
          </a>
        </BrandButton>
        <BrandButton asChild variant="ghost-dark" size="md">
          <Link href="/models">Browse more vehicles</Link>
        </BrandButton>
      </div>

      <section className="flex flex-col gap-3 border-t border-[var(--color-neutral-200)] pt-6">
        <h2 className="font-[family-name:var(--font-display)] text-xl tracking-[-0.02em]">
          What to bring on the day
        </h2>
        <ul className="list-disc pl-5 text-sm text-[var(--color-neutral-700)]">
          <li>NRIC or passport</li>
          <li>Your driving license (the one you provided when booking)</li>
          <li>Comfortable footwear</li>
        </ul>
        <p className="text-sm text-[var(--color-neutral-600)]">
          We&rsquo;ll guide you through a short urban-and-highway loop around
          Petaling Jaya &mdash; about 25 minutes door-to-door.
        </p>
      </section>

      <section className="flex flex-col gap-2 border-t border-[var(--color-neutral-200)] pt-6">
        <h2 className="font-[family-name:var(--font-display)] text-xl tracking-[-0.02em]">
          Need to reschedule?
        </h2>
        <p className="text-sm text-[var(--color-neutral-600)]">
          Message us on{" "}
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="text-[var(--color-accent-deep)] underline-offset-4 hover:underline"
          >
            WhatsApp
          </a>{" "}
          and we&rsquo;ll move things around.
        </p>
      </section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs uppercase tracking-[0.16em] text-[var(--color-neutral-500)]">
        {label}
      </dt>
      <dd className="text-[var(--color-graphite)]">{value}</dd>
    </div>
  );
}

function buildGoogleCalendarUrl(input: {
  title: string;
  start: Date;
  durationMinutes: number;
  location: string;
  description: string;
}): string {
  const start = formatGCalDate(input.start);
  const end = formatGCalDate(
    new Date(input.start.getTime() + input.durationMinutes * 60_000),
  );
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: input.title,
    dates: `${start}/${end}`,
    details: input.description,
    location: input.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function formatGCalDate(d: Date): string {
  const pad = (n: number): string => n.toString().padStart(2, "0");
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    "00Z"
  );
}
