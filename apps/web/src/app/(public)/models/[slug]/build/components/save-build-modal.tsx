"use client";

import * as React from "react";
import { useActionState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@dealership/ui/components/dialog";
import { Input } from "@dealership/ui/components/input";
import { Label } from "@dealership/ui/components/label";
import { BrandButton } from "@dealership/ui/components/brand-button";
import {
  saveBuildAction,
  type Result,
} from "@/server/actions/account-actions";

interface SaveBuildModalProps {
  modelSlug: string;
  trim: string;
  exterior: string | null;
  interior: string | null;
  options: string[];
  totalAtSave: number;
  defaultName: string;
}

export function SaveBuildModal({
  modelSlug,
  trim,
  exterior,
  interior,
  options,
  totalAtSave,
  defaultName,
}: SaveBuildModalProps): React.ReactElement {
  const [state, action] = useActionState<Result | null, FormData>(
    saveBuildAction,
    null,
  );
  const [open, setOpen] = React.useState(false);
  const [, start] = useTransition();

  React.useEffect(() => {
    if (state?.ok && open) {
      setTimeout(() => setOpen(false), 800);
    }
  }, [state, open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <BrandButton variant="ghost-dark" size="md" type="button">
          Save this build
        </BrandButton>
      </DialogTrigger>
      <DialogContent className="bg-white">
        <h3 className="font-[family-name:var(--font-display)] text-2xl tracking-[-0.02em]">
          Save this build
        </h3>
        <p className="text-sm text-[var(--color-neutral-700)]">
          Give it a name so you can come back to it later.
        </p>
        <form
          action={(fd: FormData) => {
            fd.set("modelSlug", modelSlug);
            fd.set("trim", trim);
            if (exterior) fd.set("exterior", exterior);
            if (interior) fd.set("interior", interior);
            fd.set("options", JSON.stringify(options));
            fd.set("totalAtSave", String(totalAtSave));
            start(() => action(fd));
          }}
          className="flex flex-col gap-3"
        >
          <Label htmlFor="build-name">Name</Label>
          <Input
            id="build-name"
            name="name"
            defaultValue={defaultName}
            required
            autoFocus
          />
          {state ? (
            state.ok ? (
              <p className="text-sm text-[var(--color-neutral-700)]">Saved.</p>
            ) : (
              <div className="rounded-md bg-[#FBE9E5] px-4 py-2 text-sm text-[var(--color-graphite)]">
                {state.error}
              </div>
            )
          ) : null}
          <BrandButton type="submit" size="md">
            Save build
          </BrandButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
