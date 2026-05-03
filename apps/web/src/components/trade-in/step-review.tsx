"use client";

import { useState } from "react";
import { BrandButton } from "@dealership/ui/components/brand-button";
import { useTradeInStore, type TradeInStep } from "@/stores/tradeInStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const CONDITION_LABELS: Record<string, string> = {
  EXCELLENT: "Excellent",
  GOOD: "Good",
  FAIR: "Fair",
  POOR: "Poor",
};

const CONTACT_METHOD_LABELS: Record<string, string> = {
  PHONE: "Phone",
  EMAIL: "Email",
  WHATSAPP: "WhatsApp",
};

const BEST_TIME_LABELS: Record<string, string> = {
  MORNING: "Morning (9 AM – 12 PM)",
  AFTERNOON: "Afternoon (12 PM – 5 PM)",
  EVENING: "Evening (5 PM – 7 PM)",
  ANYTIME: "Anytime",
};

export function StepReview({
  onBack,
  onJump,
}: {
  onBack: () => void;
  onJump: (step: TradeInStep) => void;
}): React.ReactElement {
  const vin = useTradeInStore((s) => s.vin);
  const make = useTradeInStore((s) => s.make);
  const model = useTradeInStore((s) => s.model);
  const year = useTradeInStore((s) => s.year);
  const trim = useTradeInStore((s) => s.trim);
  const mileage = useTradeInStore((s) => s.mileage);
  const condition = useTradeInStore((s) => s.condition);
  const serviceHistory = useTradeInStore((s) => s.serviceHistory);
  const serviceLocation = useTradeInStore((s) => s.serviceLocation);
  const accidentHistory = useTradeInStore((s) => s.accidentHistory);
  const accidentNote = useTradeInStore((s) => s.accidentNote);
  const modifications = useTradeInStore((s) => s.modifications);
  const modificationsNote = useTradeInStore((s) => s.modificationsNote);
  const photos = useTradeInStore((s) => s.photos);
  const photosSkipped = useTradeInStore((s) => s.photosSkipped);
  const contactName = useTradeInStore((s) => s.contactName);
  const contactEmail = useTradeInStore((s) => s.contactEmail);
  const contactPhone = useTradeInStore((s) => s.contactPhone);
  const preferredContactMethod = useTradeInStore(
    (s) => s.preferredContactMethod,
  );
  const bestTimeToCall = useTradeInStore((s) => s.bestTimeToCall);
  const configurationId = useTradeInStore((s) => s.configurationId);
  const setSubmitted = useTradeInStore((x) => x.setSubmitted);

  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (): Promise<void> => {
    setError(null);
    setSubmitting(true);
    try {
      const body = {
        vin: vin ?? undefined,
        make: make ?? "",
        model: model ?? "",
        year: year ?? new Date().getFullYear(),
        trim: trim ?? undefined,
        mileage: mileage ?? 0,
        condition: condition ?? "GOOD",
        serviceHistory: serviceHistory ?? false,
        serviceLocation: serviceLocation ?? undefined,
        accidentHistory: accidentHistory ?? false,
        accidentNote: accidentNote ?? undefined,
        modifications: modifications ?? false,
        modificationsNote: modificationsNote ?? undefined,
        photos: photos.map((p) => p.publicUrl),
        photosSkipped,
        contactName: contactName ?? "",
        contactEmail: contactEmail ?? "",
        contactPhone: contactPhone ?? "",
        preferredContactMethod: preferredContactMethod ?? "PHONE",
        bestTimeToCall: bestTimeToCall ?? "ANYTIME",
        configurationId: configurationId ?? undefined,
        consent: true as const,
      };
      const res = await fetch(`${API_URL}/public/trade-ins`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        throw new Error(`Submit failed: ${res.status}`);
      }
      const json = (await res.json()) as { id: string; reference: string };
      setSubmitted({ id: json.id, reference: json.reference });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const conditionLabel = condition ? CONDITION_LABELS[condition] : "—";

  return (
    <div>
      <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-[-0.02em] text-[var(--color-graphite)] md:text-4xl">
        Looks right?
      </h2>

      <div className="mt-8 space-y-6">
        <SummaryCard
          title="Vehicle"
          onEdit={() => onJump(1)}
        >
          {vin && <Row label="VIN" value={vin} />}
          <Row
            label="Make / model"
            value={[make, model].filter(Boolean).join(" ") || "—"}
          />
          <Row label="Year" value={year ? String(year) : "—"} />
          {trim && <Row label="Trim" value={trim} />}
        </SummaryCard>

        <SummaryCard title="Condition" onEdit={() => onJump(2)}>
          <Row
            label="Mileage"
            value={mileage != null ? `${mileage.toLocaleString("en-MY")} km` : "—"}
          />
          <Row label="Condition" value={conditionLabel ?? "—"} />
          <Row
            label="Service history"
            value={
              serviceHistory === true
                ? serviceLocation
                  ? `Yes — ${serviceLocation}`
                  : "Yes"
                : serviceHistory === false
                  ? "No"
                  : "—"
            }
          />
          <Row
            label="Accident history"
            value={
              accidentHistory === true
                ? accidentNote
                  ? `Yes — ${accidentNote}`
                  : "Yes"
                : accidentHistory === false
                  ? "No"
                  : "—"
            }
          />
          <Row
            label="Modifications"
            value={
              modifications === true
                ? modificationsNote
                  ? `Yes — ${modificationsNote}`
                  : "Yes"
                : modifications === false
                  ? "No"
                  : "—"
            }
          />
        </SummaryCard>

        <SummaryCard title="Photos" onEdit={() => onJump(3)}>
          {photosSkipped ? (
            <p className="text-sm text-[var(--color-neutral-700)]">
              Skipped — staff will follow up to collect photos directly.
            </p>
          ) : photos.length === 0 ? (
            <p className="text-sm text-[var(--color-neutral-700)]">
              No photos uploaded.
            </p>
          ) : (
            <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {photos.map((p) => (
                <li
                  key={p.id}
                  className="aspect-square overflow-hidden rounded-md border border-[var(--color-neutral-200)] bg-[var(--color-neutral-100)]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.publicUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </li>
              ))}
            </ul>
          )}
        </SummaryCard>

        <SummaryCard title="Contact" onEdit={() => onJump(4)}>
          <Row label="Name" value={contactName ?? "—"} />
          <Row label="Email" value={contactEmail ?? "—"} />
          <Row label="Phone" value={contactPhone ?? "—"} />
          <Row
            label="Preferred"
            value={
              preferredContactMethod
                ? (CONTACT_METHOD_LABELS[preferredContactMethod] ?? "—")
                : "—"
            }
          />
          <Row
            label="Best time"
            value={
              bestTimeToCall
                ? (BEST_TIME_LABELS[bestTimeToCall] ?? "—")
                : "—"
            }
          />
        </SummaryCard>
      </div>

      <p className="mt-8 text-sm italic text-[var(--color-neutral-700)]">
        We&rsquo;ll review and send your quote within 24 hours during business
        days.
      </p>

      <div className="mt-6 rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] bg-white p-4 text-sm text-[var(--color-neutral-700)]">
        Your information is used only for valuation. We don&rsquo;t share it
        with third parties.
      </div>

      <label className="mt-4 flex items-start gap-3 text-sm text-[var(--color-neutral-700)]">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-[var(--color-neutral-300)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
        />
        <span>
          I agree to the terms and to the use of my data for this trade-in
          valuation, in line with the PDPA notice above.
        </span>
      </label>

      {error && (
        <p className="mt-3 text-sm text-[var(--color-error)]">
          {error}
        </p>
      )}

      <div className="sticky bottom-0 -mx-4 mt-10 flex items-center justify-between border-t border-[var(--color-neutral-200)] bg-[var(--color-surface-warm)] px-4 py-4 md:static md:mx-0 md:border-0 md:px-0">
        <BrandButton type="button" variant="ghost-dark" onClick={onBack}>
          Back
        </BrandButton>
        <BrandButton
          type="button"
          size="lg"
          disabled={!consent || submitting}
          onClick={() => void submit()}
        >
          {submitting ? "Submitting…" : "Submit for valuation"}
        </BrandButton>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-neutral-200)] bg-white p-5">
      <header className="flex items-center justify-between">
        <h3 className="text-sm font-medium uppercase tracking-[0.16em] text-[var(--color-neutral-700)]">
          {title}
        </h3>
        <button
          type="button"
          onClick={onEdit}
          className="text-xs text-[var(--color-accent)] hover:underline"
        >
          Edit
        </button>
      </header>
      <div className="mt-4 space-y-2">{children}</div>
    </section>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.ReactElement {
  return (
    <div className="grid grid-cols-3 gap-4 text-sm">
      <dt className="col-span-1 text-[var(--color-neutral-500)]">{label}</dt>
      <dd className="col-span-2 text-[var(--color-graphite)]">{value}</dd>
    </div>
  );
}
