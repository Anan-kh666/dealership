"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { cuid } from "@dealership/types";
import { findStockMatches, type MatchResult } from "./lib/stock-match";

const matchInputSchema = z.object({
  modelId: cuid,
  trimId: cuid,
  exteriorColorId: cuid,
  interiorColorId: cuid,
  optionIds: z.array(cuid).max(50),
});

export type MatchInput = z.infer<typeof matchInputSchema>;

/**
 * Look up stock units for the configured build. If exactly one matches, the
 * server redirects straight to that unit's stock page; otherwise the result
 * is returned for the client to render near-matches.
 */
export async function findStockAction(
  raw: MatchInput,
): Promise<MatchResult> {
  const parsed = matchInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { exact: null, near: [], empty: false };
  }
  const result = await findStockMatches(parsed.data);
  if (result.exact) {
    redirect(`/stock/${result.exact.slug}`);
  }
  return result;
}
