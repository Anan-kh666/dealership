"use client";

import * as React from "react";
import { BrandButton } from "@dealership/ui/components/brand-button";
import { useTestDriveStore } from "@/stores/test-drive-store";
import { apiFetch } from "@/server/api-client";
import { Calendar } from "../calendar";
import { ymdInKL } from "@/lib/test-drive/slots";

interface AvailabilitySlot {
  minutes: number;
  label: string;
  isoTime: string;
  available: boolean;
}

interface AvailabilityResponse {
  date: string;
  slots: AvailabilitySlot[];
}

export function DateTimeStep({
  headingRef,
}: {
  headingRef: React.RefObject<HTMLHeadingElement | null>;
}): React.ReactElement {
  const scheduledAtIso = useTestDriveStore((s) => s.scheduledAtIso);
  const setSlot = useTestDriveStore((s) => s.setSlot);
  const setStep = useTestDriveStore((s) => s.setStep);

  const initialYmd = scheduledAtIso ? ymdInKL(new Date(scheduledAtIso)) : null;
  const [date, setDate] = React.useState<string | null>(initialYmd);
  const [slots, setSlots] = React.useState<AvailabilitySlot[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    if (!date) {
      setSlots(null);
      return;
    }
    setLoading(true);
    setError(null);
    apiFetch(`/public/test-drives/availability?date=${date}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as AvailabilityResponse;
        if (!cancelled) setSlots(json.slots);
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError("Couldn't load slots — please try again.");
          setSlots([]);
          // eslint-disable-next-line no-console
          console.error(err);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date]);

  function handleSlotPick(slot: AvailabilitySlot): void {
    if (!slot.available) return;
    setSlot(slot.isoTime);
    setStep(3);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="font-[family-name:var(--font-display)] tracking-[-0.02em] outline-none"
          style={{ fontSize: "clamp(28px, 4vw, 40px)", lineHeight: 1.1 }}
        >
          When works for you?
        </h2>
        <p className="text-[var(--color-neutral-600)]">
          Pick a date in the next 30 days, then choose a 30-minute slot.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Calendar
          selected={date}
          onSelect={(d) => {
            setDate(d);
            setSlot(null);
          }}
        />
        <div className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-neutral-500)]">
            Time
          </p>
          {!date ? (
            <p className="rounded-[var(--radius-md)] bg-[var(--color-surface-warm)] p-4 text-sm text-[var(--color-neutral-600)]">
              Select a date to see available times.
            </p>
          ) : loading ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" aria-live="polite">
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-neutral-100)]"
                />
              ))}
            </div>
          ) : error ? (
            <p className="rounded-[var(--radius-md)] border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 p-4 text-sm text-[var(--color-error)]">
              {error}
            </p>
          ) : slots && slots.length > 0 ? (
            <div role="radiogroup" aria-label="Time slots" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {slots.map((s) => {
                const isSelected = s.isoTime === scheduledAtIso;
                return (
                  <button
                    key={s.isoTime}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    aria-disabled={!s.available}
                    disabled={!s.available}
                    onClick={() => handleSlotPick(s)}
                    className={[
                      "h-10 rounded-[var(--radius-md)] border text-sm tabular-nums transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1",
                      s.available
                        ? "border-[var(--color-neutral-200)] bg-card text-[var(--color-graphite)] hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-warm)]"
                        : "cursor-not-allowed border-[var(--color-neutral-200)] bg-[var(--color-neutral-100)] text-[var(--color-neutral-400)] line-through",
                      isSelected ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent-deep)]" : "",
                    ].join(" ")}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="rounded-[var(--radius-md)] bg-[var(--color-surface-warm)] p-4 text-sm text-[var(--color-neutral-600)]">
              No available slots that day. Try another date.
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-[var(--color-neutral-200)] pt-6">
        <BrandButton variant="ghost-dark" size="md" onClick={() => setStep(1)}>
          Back
        </BrandButton>
        <BrandButton
          variant="primary"
          size="md"
          disabled={!scheduledAtIso}
          onClick={() => setStep(3)}
        >
          Next
        </BrandButton>
      </div>
    </div>
  );
}
