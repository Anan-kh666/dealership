"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

/**
 * Two-step inline confirm instead of window.confirm(), which blocks the page
 * and can't be styled.
 */
export function CancelButton(): React.ReactElement {
  const [confirming, setConfirming] = useState(false);
  const { pending } = useFormStatus();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-sm text-[var(--color-error)] underline-offset-4 hover:underline"
      >
        Cancel
      </button>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <span className="text-[var(--color-neutral-700)]">Cancel this booking?</span>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[var(--color-error)] px-3 py-1 text-xs font-medium text-white disabled:opacity-60"
      >
        {pending ? "Cancelling…" : "Yes, cancel"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="text-xs text-[var(--color-neutral-600)] underline-offset-4 hover:underline"
      >
        Keep it
      </button>
    </span>
  );
}
