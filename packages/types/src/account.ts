import { z } from "zod";
import { email, mlPhone } from "./primitives.js";
import { malaysianIcStrict } from "./auth.js";

export const profileUpdateSchema = z.object({
  name: z.string().trim().max(120).optional().or(z.literal("")),
  phone: mlPhone.optional().or(z.literal("")),
  icNumber: malaysianIcStrict.optional().or(z.literal("")),
  image: z.string().url().optional().or(z.literal("")),
});
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export const emailChangeSchema = z.object({ email });
export type EmailChangeInput = z.infer<typeof emailChangeSchema>;

export const buildSaveSchema = z.object({
  name: z.string().trim().min(1, "Name your build").max(80),
  modelSlug: z.string().min(1).max(120),
  trim: z.string().min(1).max(120),
  exterior: z.string().max(120).optional(),
  interior: z.string().max(120).optional(),
  options: z.array(z.string()).max(64).default([]),
  totalAtSave: z.number().nonnegative().max(10_000_000),
});
export type BuildSaveInput = z.infer<typeof buildSaveSchema>;

export const deleteAccountSchema = z.object({
  confirmation: z.literal("DELETE", {
    errorMap: () => ({ message: 'Type "DELETE" to confirm' }),
  }),
});
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
