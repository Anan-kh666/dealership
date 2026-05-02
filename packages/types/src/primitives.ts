import { z } from "zod";

/** Decimal columns flow over the wire as strings to preserve precision. */
export const decimalString = z
  .string()
  .regex(/^\d+(\.\d+)?$/, "must be a non-negative numeric string")
  .brand<"Decimal">();
export type DecimalString = z.infer<typeof decimalString>;

export const cuid = z.string().cuid();
export const isoDateTime = z.string().datetime();
export const url = z.string().url();
export const email = z.string().trim().toLowerCase().email();

/** Permissive Malaysia-friendly phone validation; tighten later if needed. */
export const phone = z
  .string()
  .trim()
  .min(7)
  .max(20)
  .regex(/^\+?[\d\s-]+$/, "must be a valid phone number");
