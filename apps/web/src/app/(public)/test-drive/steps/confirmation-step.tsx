"use client";

import * as React from "react";
import { BrandButton } from "@dealership/ui/components/brand-button";
import { useTestDriveStore } from "@/stores/test-drive-store";
import { apiFetch } from "@/server/api-client";
import { formatKlDate, formatSlotLabel, ymdInKL } from "@/lib/test-drive/slots";
import { normaliseMyPhone } from "@/lib/test-drive/phone";
import { toZonedTime } from "date-fns-tz";
import { KL_TZ } from "@/lib/test-drive/slots";
import type { SuccessPayload } from "../test-drive-flow";

interface CreateResponse {
  id: string;
  reference: string;
  scheduledAt: string;
  status: string;
}

export function ConfirmationStep({
  headingRef,
  onSuccess,
}: {
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  onSuccess: (p: SuccessPayload) => void;
}): React.ReactElement {
  const vehicle = useTestDriveStore((s) => s.vehicle);
  const scheduledAtIso = useTestDriveStore((s) => s.scheduledAtIso);
  const details = useTestDriveStore((s) => s.details);
  const consent = useTestDriveStore((s) => s.consent);
  const setConsent = useTestDriveStore((s) => s.setConsent);
  const setStep = useTestDriveStore((s) => s.setStep);
  const reset = useTestDriveStore((s) => s.reset);

  const [submitting, setSubmitting] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  if (!vehicle || !scheduledAtIso) {
    return (
      <div>
        <p>We&rsquo;re missing some details. Please go back and complete the earlier steps.</p>
        <BrandButton variant="primary" size="md" onClick={() => setStep(1)}>
          Start over
        </BrandButton>
      </div>
    );
  }

  const scheduledAt = new Date(scheduledAtIso);
  const klMinutes = (() => {
    const z = toZonedTime(scheduledAt, KL_TZ);
    return z.getHours() * 60 + z.getMinutes();
  })();
  const formattedDate = formatKlDate(scheduledAt);
  const formattedTime = formatSlotLabel(klMinutes);
  const vehicleLabel = vehicle.trimLabel
    ? `${vehicle.label} ${vehicle.trimLabel}`
    : vehicle.label;

  async function handleSubmit(): Promise<void> {
    setSubmitting(true);
    setServerError(null);
    try {
      const res = await apiFetch("/public/test-drives", {
        method: "POST",
        body: JSON.stringify({
          modelId: vehicle && vehicle.kind === "model" ? vehicle.modelId : undefined,
          stockUnitId:
            vehicle && vehicle.kind === "stockUnit" ? vehicle.stockUnitId : undefined,
          guestName: details.guestName.trim(),
          guestEmail: details.guestEmail.trim(),
          guestPhone: normaliseMyPhone(details.guestPhone) ?? details.guestPhone.trim(),
          drivingLicense: details.drivingLicense.trim(),
          scheduledAt: scheduledAtIso,
          notes: details.notes ? details.notes.trim() : undefined,
        }),
      });
      if (res.status === 409) {
        const body = (await res.json().catch(() => null)) as {
          message?: string;
        } | null;
        setServerError(
          body?.message ??
            "That slot was just taken — please pick another time.",
        );
        // Bump back to Step 2 with the same date preselected.
        useTestDriveStore.getState().setSlot(null);
        setStep(2);
        return;
      }
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          message?: string;
        } | null;
        setServerError(body?.message ?? "Couldn't submit your booking.");
        return;
      }
      const payload = (await res.json()) as CreateResponse;
      const success: SuccessPayload = {
        id: payload.id,
        reference: payload.reference,
        scheduledAt: payload.scheduledAt,
        vehicleLabel,
        guestName: details.guestName.trim(),
        guestEmail: details.guestEmail.trim(),
      };
      // Persist into the parent flow before clearing the store.
      onSuccess(success);
      reset();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setServerError("Couldn't reach the server — please try again.");
    } finally {
      setSubmitting(false);
    }
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
          Almost there
        </h2>
        <p className="text-[var(--color-neutral-600)]">
          Review the details and confirm your booking.
        </p>
      </div>

      <dl className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] bg-[var(--color-surface-warm)] p-5 text-sm">
        <Row
          label="Vehicle"
          value={vehicleLabel}
          onEdit={() => {
            useTestDriveStore.getState().clearVehicle();
          }}
        />
        <Row
          label="Date & time"
          value={`${formattedDate} · ${formattedTime}`}
          onEdit={() => setStep(2)}
        />
        <Row label="Name" value={details.guestName} onEdit={() => setStep(3)} />
        <Row
          label="Contact"
          value={`${details.guestEmail} · ${details.guestPhone}`}
          onEdit={() => setStep(3)}
        />
        <Row
          label="Driving license"
          value={details.drivingLicense}
          onEdit={() => setStep(3)}
        />
        {details.notes ? (
          <Row label="Notes" value={details.notes} onEdit={() => setStep(3)} />
        ) : null}
      </dl>

      <label className="flex items-start gap-3 text-sm text-[var(--color-neutral-700)]">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 h-4 w-4"
        />
        <span>
          I agree to the <a href="#" className="underline">Privacy Policy</a> and
          consent to the dealership processing my personal data for the purpose
          of arranging this test drive.
        </span>
      </label>

      {serverError ? (
        <p
          role="alert"
          className="rounded-[var(--radius-md)] border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 p-3 text-sm text-[var(--color-error)]"
        >
          {serverError}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3 border-t border-[var(--color-neutral-200)] pt-6">
        <BrandButton variant="ghost-dark" size="md" onClick={() => setStep(3)}>
          Back
        </BrandButton>
        <BrandButton
          variant="primary"
          size="lg"
          onClick={handleSubmit}
          disabled={!consent || submitting}
        >
          {submitting ? "Confirming…" : "Confirm booking"}
        </BrandButton>
      </div>

      <p className="text-xs text-[var(--color-neutral-500)]">
        Your booked slot ({ymdInKL(scheduledAt)}) is held in REQUESTED status &mdash;
        we&rsquo;ll confirm via email shortly.
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit: () => void;
}): React.ReactElement {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--color-neutral-200)]/60 pb-3 last:border-b-0 last:pb-0">
      <div className="flex flex-col gap-0.5">
        <dt className="text-xs uppercase tracking-[0.16em] text-[var(--color-neutral-500)]">
          {label}
        </dt>
        <dd className="text-[var(--color-graphite)]">{value}</dd>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="shrink-0 text-xs uppercase tracking-[0.16em] text-[var(--color-accent-deep)] underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
      >
        Edit
      </button>
    </div>
  );
}
