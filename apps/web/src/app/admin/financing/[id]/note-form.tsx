"use client";

import { useActionState } from "react";
import { SubmitButton, TextArea } from "@/components/forms/fields";
import { saveApplicationNote, type NoteFormState } from "../../actions";

export function NoteForm({ id, notes }: { id: string; notes: string }): React.ReactElement {
  const [state, action] = useActionState<NoteFormState, FormData>(saveApplicationNote, {});
  return (
    <form action={action} className="flex flex-col gap-3 p-5">
      <input type="hidden" name="id" value={id} />
      <label htmlFor="notes" className="sr-only">
        Internal notes
      </label>
      <TextArea
        id="notes"
        name="notes"
        defaultValue={notes}
        maxLength={4000}
        placeholder="Bank submissions, calls made, documents outstanding…"
      />
      <div className="flex items-center gap-3">
        <SubmitButton variant="secondary" size="sm" pendingLabel="Saving…">
          Save notes
        </SubmitButton>
        {state.ok ? (
          <span role="status" className="text-xs text-[var(--color-success)]">
            Saved
          </span>
        ) : null}
      </div>
    </form>
  );
}
