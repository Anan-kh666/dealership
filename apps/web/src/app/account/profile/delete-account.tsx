"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@dealership/ui/components/dialog";
import { Input } from "@dealership/ui/components/input";
import { Label } from "@dealership/ui/components/label";
import { BrandButton } from "@dealership/ui/components/brand-button";
import {
  deleteAccountAction,
  type Result,
} from "@/server/actions/account-actions";

export function DeleteAccountSection(): React.ReactElement {
  const [state, action] = useActionState<Result | null, FormData>(
    deleteAccountAction,
    null,
  );

  return (
    <div id="delete">
      <p className="text-sm text-[var(--color-neutral-700)]">
        Permanently delete your account, saved builds, and active sessions.
        Test-drive bookings, financing applications, and trade-in quotes are
        kept anonymised for our records, but unlinked from your account.
      </p>
      <div className="mt-4">
        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              className="text-sm text-[var(--color-neutral-500)] underline underline-offset-2 hover:text-[var(--color-graphite)]"
            >
              Delete account
            </button>
          </DialogTrigger>
          <DialogContent className="bg-white">
            <h3 className="font-[family-name:var(--font-display)] text-2xl tracking-[-0.02em]">
              Delete account
            </h3>
            <p className="text-sm text-[var(--color-neutral-700)]">
              Type <strong>DELETE</strong> to confirm. This can&rsquo;t be
              undone.
            </p>
            <p className="text-xs text-[var(--color-neutral-600)]">
              PDPA note: test-drive bookings, applications, and trade-in
              quotes will be anonymised (not deleted) for our records, but
              unlinked from your account.
            </p>
            <form action={action} className="flex flex-col gap-3">
              <Label htmlFor="confirmation">Confirmation</Label>
              <Input
                id="confirmation"
                name="confirmation"
                placeholder="DELETE"
                autoComplete="off"
                required
              />
              {state && state.ok === false ? (
                <div className="rounded-md bg-[#FBE9E5] px-4 py-2 text-sm text-[var(--color-graphite)]">
                  {state.error}
                </div>
              ) : null}
              <Submit />
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function Submit(): React.ReactElement {
  const { pending } = useFormStatus();
  return (
    <BrandButton
      type="submit"
      size="md"
      variant="secondary"
      disabled={pending}
    >
      {pending ? "Deleting…" : "Permanently delete"}
    </BrandButton>
  );
}
