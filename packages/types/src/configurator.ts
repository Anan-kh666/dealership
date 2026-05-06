import { z } from "zod";
import { cuid } from "./primitives.js";

/**
 * URL-driven configurator state. Every field is optional in the URL — the
 * client falls back to defaults (cheapest trim, first available colour, etc.)
 * for anything missing or invalid. Validation is best-effort: bad values are
 * dropped silently with a console.warn rather than throwing.
 */
export const configuratorParamsSchema = z
  .object({
    trim: cuid.optional(),
    exterior: cuid.optional(),
    interior: cuid.optional(),
    /** Comma-separated cuid list, e.g. ?options=opt1,opt2. */
    options: z
      .string()
      .optional()
      .transform((v) =>
        v
          ? v
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
      )
      .pipe(z.array(cuid)),
  })
  .partial();

export type ConfiguratorParams = z.infer<typeof configuratorParamsSchema>;

/** Resolved selection used by the page once defaults are filled in. */
export const configuratorSelectionSchema = z.object({
  trimId: cuid,
  exteriorColorId: cuid,
  interiorColorId: cuid,
  optionIds: z.array(cuid),
});
export type ConfiguratorSelection = z.infer<typeof configuratorSelectionSchema>;
