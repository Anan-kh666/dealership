"use client";

import { useState } from "react";
import { Label } from "@dealership/ui/components/label";
import { BrandButton } from "@dealership/ui/components/brand-button";
import { useTradeInStore, type TradeInCondition } from "@/stores/tradeInStore";

const CONDITIONS: {
  value: TradeInCondition;
  label: string;
  bullets: string[];
}[] = [
  {
    value: "EXCELLENT",
    label: "Excellent",
    bullets: [
      "No mechanical issues",
      "Minor cosmetic wear at most",
      "Full service history",
    ],
  },
  {
    value: "GOOD",
    label: "Good",
    bullets: [
      "Runs reliably",
      "Some normal wear",
      "Most service records available",
    ],
  },
  {
    value: "FAIR",
    label: "Fair",
    bullets: [
      "Drivable but needs attention soon",
      "Visible cosmetic wear",
      "Or one mechanical issue",
    ],
  },
  {
    value: "POOR",
    label: "Poor",
    bullets: [
      "Major work needed before resale",
      "Significant cosmetic damage",
      "Or multiple mechanical issues",
    ],
  },
];

function formatMileage(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 6);
  if (!digits) return "";
  return Number(digits).toLocaleString("en-MY");
}

export function StepCondition({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}): React.ReactElement {
  const initialMileage = useTradeInStore((s) => s.mileage);
  const initialCondition = useTradeInStore((s) => s.condition);
  const initialServiceHistory = useTradeInStore((s) => s.serviceHistory);
  const initialServiceLocation = useTradeInStore((s) => s.serviceLocation);
  const initialAccidentHistory = useTradeInStore((s) => s.accidentHistory);
  const initialAccidentNote = useTradeInStore((s) => s.accidentNote);
  const initialModifications = useTradeInStore((s) => s.modifications);
  const initialModificationsNote = useTradeInStore(
    (s) => s.modificationsNote,
  );
  const patch = useTradeInStore((x) => x.patch);

  const [mileageStr, setMileageStr] = useState<string>(
    initialMileage != null ? initialMileage.toLocaleString("en-MY") : "",
  );
  const [condition, setCondition] = useState<TradeInCondition | null>(
    initialCondition,
  );
  const [serviceHistory, setServiceHistory] = useState<boolean | null>(
    initialServiceHistory,
  );
  const [serviceLocation, setServiceLocation] = useState<string>(
    initialServiceLocation ?? "",
  );
  const [accidentHistory, setAccidentHistory] = useState<boolean | null>(
    initialAccidentHistory,
  );
  const [accidentNote, setAccidentNote] = useState<string>(
    initialAccidentNote ?? "",
  );
  const [modifications, setModifications] = useState<boolean | null>(
    initialModifications,
  );
  const [modificationsNote, setModificationsNote] = useState<string>(
    initialModificationsNote ?? "",
  );

  const mileageNumber = Number(mileageStr.replace(/\D/g, ""));
  const isValid =
    mileageStr.length > 0 &&
    mileageNumber >= 0 &&
    mileageNumber <= 999_999 &&
    condition !== null &&
    serviceHistory !== null &&
    accidentHistory !== null &&
    modifications !== null;

  function persist(): void {
    patch({
      mileage: mileageStr ? mileageNumber : null,
      condition,
      serviceHistory,
      serviceLocation: serviceLocation || null,
      accidentHistory,
      accidentNote: accidentNote || null,
      modifications,
      modificationsNote: modificationsNote || null,
    });
  }

  return (
    <div>
      <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-[-0.02em] text-[var(--color-graphite)] md:text-4xl">
        How&rsquo;s it driving?
      </h2>

      <div className="mt-8 max-w-md">
        <Label htmlFor="mileage">Mileage</Label>
        <div className="relative mt-2">
          <input
            id="mileage"
            inputMode="numeric"
            autoComplete="off"
            value={mileageStr}
            onChange={(e) => setMileageStr(formatMileage(e.target.value))}
            className="flex h-10 w-full rounded-md border border-[var(--color-neutral-200)] bg-white px-3 pr-12 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            placeholder="e.g. 84,500"
          />
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-[var(--color-neutral-500)]">
            km
          </span>
        </div>
      </div>

      <fieldset className="mt-10">
        <legend className="text-sm font-medium uppercase tracking-[0.16em] text-[var(--color-neutral-700)]">
          Condition
        </legend>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CONDITIONS.map((c) => {
            const selected = condition === c.value;
            return (
              <label
                key={c.value}
                className={`relative cursor-pointer rounded-[var(--radius-lg)] border bg-white p-5 transition-all ${
                  selected
                    ? "border-[var(--color-accent)] shadow-[var(--shadow-2)]"
                    : "border-[var(--color-neutral-200)] hover:border-[var(--color-neutral-400)]"
                }`}
              >
                <input
                  type="radio"
                  name="condition"
                  value={c.value}
                  checked={selected}
                  onChange={() => setCondition(c.value)}
                  className="sr-only"
                />
                <div className="flex items-start justify-between gap-3">
                  <span className="text-lg font-medium text-[var(--color-graphite)]">
                    {c.label}
                  </span>
                  {selected && (
                    <span
                      aria-hidden
                      className="h-2.5 w-2.5 rounded-full bg-[var(--color-accent)]"
                    />
                  )}
                </div>
                <ul className="mt-3 space-y-1 text-sm text-[var(--color-neutral-600)]">
                  {c.bullets.map((b) => (
                    <li key={b}>· {b}</li>
                  ))}
                </ul>
              </label>
            );
          })}
        </div>
      </fieldset>

      <YesNoBlock
        label="Service history available?"
        value={serviceHistory}
        onChange={setServiceHistory}
        followUp={
          serviceHistory === true ? (
            <div className="mt-3 max-w-md">
              <Label htmlFor="serviceLocation">Where serviced? (optional)</Label>
              <input
                id="serviceLocation"
                value={serviceLocation}
                onChange={(e) => setServiceLocation(e.target.value)}
                maxLength={160}
                className="mt-2 flex h-10 w-full rounded-md border border-[var(--color-neutral-200)] bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              />
            </div>
          ) : null
        }
      />

      <YesNoBlock
        label="Any accident history?"
        value={accidentHistory}
        onChange={setAccidentHistory}
        followUp={
          accidentHistory === true ? (
            <div className="mt-3 max-w-md">
              <Label htmlFor="accidentNote">
                Tell us briefly what happened (optional)
              </Label>
              <textarea
                id="accidentNote"
                value={accidentNote}
                onChange={(e) => setAccidentNote(e.target.value)}
                maxLength={300}
                rows={3}
                className="mt-2 flex w-full rounded-md border border-[var(--color-neutral-200)] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              />
              <p className="mt-1 text-xs text-[var(--color-neutral-500)]">
                {accidentNote.length}/300
              </p>
            </div>
          ) : null
        }
      />

      <YesNoBlock
        label="Any modifications?"
        value={modifications}
        onChange={setModifications}
        followUp={
          modifications === true ? (
            <div className="mt-3 max-w-md">
              <Label htmlFor="modificationsNote">
                What&rsquo;s been changed? (optional)
              </Label>
              <textarea
                id="modificationsNote"
                value={modificationsNote}
                onChange={(e) => setModificationsNote(e.target.value)}
                maxLength={300}
                rows={3}
                className="mt-2 flex w-full rounded-md border border-[var(--color-neutral-200)] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              />
              <p className="mt-1 text-xs text-[var(--color-neutral-500)]">
                {modificationsNote.length}/300
              </p>
            </div>
          ) : null
        }
      />

      <NavRow
        onBack={() => {
          persist();
          onBack();
        }}
        onNext={() => {
          persist();
          onNext();
        }}
        nextDisabled={!isValid}
      />
    </div>
  );
}

function YesNoBlock({
  label,
  value,
  onChange,
  followUp,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
  followUp?: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="mt-8">
      <p className="text-sm font-medium text-[var(--color-graphite)]">{label}</p>
      <div className="mt-2 inline-flex rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] bg-white p-1">
        {[
          { v: true, label: "Yes" },
          { v: false, label: "No" },
        ].map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => onChange(opt.v)}
            className={`rounded-[calc(var(--radius-md)-2px)] px-4 py-1.5 text-sm transition-colors ${
              value === opt.v
                ? "bg-[var(--color-graphite)] text-white"
                : "text-[var(--color-neutral-700)]"
            }`}
            aria-pressed={value === opt.v}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {followUp}
    </div>
  );
}

function NavRow({
  onBack,
  onNext,
  nextDisabled,
}: {
  onBack: () => void;
  onNext: () => void;
  nextDisabled: boolean;
}): React.ReactElement {
  return (
    <div className="sticky bottom-0 -mx-4 mt-12 flex items-center justify-between border-t border-[var(--color-neutral-200)] bg-[var(--color-surface-warm)] px-4 py-4 md:static md:mx-0 md:border-0 md:px-0">
      <BrandButton type="button" variant="ghost-dark" onClick={onBack}>
        Back
      </BrandButton>
      <BrandButton type="button" disabled={nextDisabled} onClick={onNext} size="lg">
        Next
      </BrandButton>
    </div>
  );
}
