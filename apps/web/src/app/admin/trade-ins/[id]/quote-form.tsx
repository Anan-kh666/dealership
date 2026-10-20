"use client";

import { useActionState } from "react";
import type { TradeInStatus } from "@dealership/db";
import {
  Field,
  FormAlert,
  NativeSelect,
  SubmitButton,
  TextInput,
} from "@/components/forms/fields";
import { TRADE_IN_STATUS } from "@/lib/status";
import { updateTradeIn, type TradeInFormState } from "../../actions";

export function QuoteForm({
  id,
  status,
  estimatedValue,
}: {
  id: string;
  status: TradeInStatus;
  estimatedValue: string;
}): React.ReactElement {
  const [state, action] = useActionState<TradeInFormState, FormData>(updateTradeIn, {});
  return (
    <form action={action} className="flex flex-col gap-4 p-5">
      <input type="hidden" name="id" value={id} />
      {state.error ? <FormAlert>{state.error}</FormAlert> : null}
      {state.ok ? <FormAlert tone="success">Saved. The customer can see this update.</FormAlert> : null}
      <Field
        label="Valuation (RM)"
        htmlFor="estimatedValue"
        hint="Shown to the customer once the status is “Quote ready”."
      >
        <TextInput
          id="estimatedValue"
          name="estimatedValue"
          inputMode="decimal"
          defaultValue={estimatedValue ? Number(estimatedValue).toFixed(0) : ""}
          placeholder="e.g. 48500"
        />
      </Field>
      <Field label="Status" htmlFor="status">
        <NativeSelect id="status" name="status" defaultValue={status}>
          {(Object.keys(TRADE_IN_STATUS) as TradeInStatus[]).map((s) => (
            <option key={s} value={s}>
              {TRADE_IN_STATUS[s].label}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <SubmitButton variant="primary" size="md" pendingLabel="Saving…">
        Save
      </SubmitButton>
    </form>
  );
}
