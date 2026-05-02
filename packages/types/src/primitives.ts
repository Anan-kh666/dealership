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

/**
 * Stricter Malaysian mobile-phone validation. Accepts inputs that, after
 * stripping spaces/dashes, normalize to a valid Malaysian mobile number:
 *
 * - `01X` followed by 7 or 8 digits (local form)
 * - `+601X` or `601X` followed by 7 or 8 digits (international form)
 */
export const mlPhone = z
  .string()
  .trim()
  .transform((s) => s.replace(/[\s-]/g, ""))
  .pipe(
    z
      .string()
      .regex(
        /^(\+?60|0)1[0-9]\d{7,8}$/,
        "must be a valid Malaysian mobile number",
      ),
  );
