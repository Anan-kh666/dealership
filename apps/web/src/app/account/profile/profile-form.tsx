"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Input } from "@dealership/ui/components/input";
import { Label } from "@dealership/ui/components/label";
import { BrandButton } from "@dealership/ui/components/brand-button";
import {
  updateProfileAction,
  type Result,
} from "@/server/actions/account-actions";

export function ProfileForm({
  defaults,
}: {
  defaults: { name: string; phone: string; icNumber: string; image: string };
}): React.ReactElement {
  const [state, action] = useActionState<Result | null, FormData>(
    updateProfileAction,
    null,
  );
  return (
    <form action={action} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={defaults.name} className="mt-2" />
      </div>
      <div>
        <Label htmlFor="phone">Mobile (+60)</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          defaultValue={defaults.phone}
          placeholder="012-3456789"
          className="mt-2"
        />
      </div>
      <div>
        <Label htmlFor="icNumber">IC number</Label>
        <Input
          id="icNumber"
          name="icNumber"
          inputMode="numeric"
          defaultValue={defaults.icNumber}
          placeholder="900101-14-5678"
          className="mt-2"
        />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="image">Avatar URL</Label>
        <Input
          id="image"
          name="image"
          type="url"
          defaultValue={defaults.image}
          placeholder="https://…"
          className="mt-2"
        />
        <p className="mt-1 text-xs text-[var(--color-neutral-600)]">
          Upload via the existing R2 presign endpoint and paste the URL here.
        </p>
      </div>
      {state ? <Banner state={state} /> : null}
      <div className="sm:col-span-2">
        <Submit />
      </div>
    </form>
  );
}

function Banner({ state }: { state: Result }): React.ReactElement {
  if (state.ok) {
    return (
      <p className="text-sm text-[var(--color-neutral-700)] sm:col-span-2">
        Saved.
      </p>
    );
  }
  return (
    <div className="rounded-md bg-[#FBE9E5] px-4 py-3 text-sm text-[var(--color-graphite)] sm:col-span-2">
      {state.error}
    </div>
  );
}

function Submit(): React.ReactElement {
  const { pending } = useFormStatus();
  return (
    <BrandButton type="submit" size="md" disabled={pending}>
      {pending ? "Saving…" : "Save changes"}
    </BrandButton>
  );
}
