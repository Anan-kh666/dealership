import "server-only";
import { prisma, StockStatus, type Color } from "@dealership/db";

/**
 * Stock matching for "Find in Stock" on the configurator summary.
 *
 * Similarity score per stock unit:
 *   +3 if same trim
 *   +2 if same exterior colour
 *   +2 if same interior colour
 *   +1 per matched option (Jaccard-style: intersection size)
 *   −0.5 per missing option vs. the user's build
 *   −0.5 per extra option vs. the user's build
 *
 * The trim weight dominates because a different trim usually means a different
 * powertrain entirely, which buyers care about more than colour. Colours are
 * weighted equally between exterior and interior. Options are diff-based to
 * prefer near-identical builds over "more loaded" ones.
 */

export interface UserBuild {
  modelId: string;
  trimId: string;
  exteriorColorId: string;
  interiorColorId: string;
  optionIds: string[];
}

export interface StockMatch {
  id: string;
  slug: string;
  trimName: string;
  totalPrice: string;
  imageUrl: string | null;
  imageAlt: string | null;
  exteriorColor: Pick<Color, "id" | "name" | "hexCode">;
  interiorColor: Pick<Color, "id" | "name" | "hexCode">;
  installedOptionIds: string[];
  /** Differences vs. the user's build, surfaced as readable deltas. */
  deltas: string[];
  score: number;
}

export interface MatchResult {
  exact: StockMatch | null;
  near: StockMatch[];
  /** True when the model has no available stock at all. */
  empty: boolean;
}

export async function findStockMatches(build: UserBuild): Promise<MatchResult> {
  const units = await prisma.stockUnit.findMany({
    where: {
      status: StockStatus.AVAILABLE,
      trim: { modelId: build.modelId },
    },
    include: {
      trim: { select: { id: true, name: true } },
      images: { orderBy: { order: "asc" }, take: 1 },
    },
  });

  if (units.length === 0) {
    return { exact: null, near: [], empty: true };
  }

  const colorIds = new Set<string>();
  for (const u of units) {
    colorIds.add(u.exteriorColorId);
    colorIds.add(u.interiorColorId);
  }
  colorIds.add(build.exteriorColorId);
  colorIds.add(build.interiorColorId);
  const colors = await prisma.color.findMany({
    where: { id: { in: Array.from(colorIds) } },
    select: { id: true, name: true, hexCode: true },
  });
  const colorMap = new Map(colors.map((c) => [c.id, c]));

  const userOpts = new Set(build.optionIds);

  const scored: StockMatch[] = units.map((u) => {
    const installedOptionIds = u.installedOptions;
    const installed = new Set(installedOptionIds);
    let score = 0;
    if (u.trim.id === build.trimId) score += 3;
    if (u.exteriorColorId === build.exteriorColorId) score += 2;
    if (u.interiorColorId === build.interiorColorId) score += 2;
    let intersection = 0;
    for (const id of userOpts) if (installed.has(id)) intersection += 1;
    score += intersection;
    const missing = userOpts.size - intersection;
    const extra = installed.size - intersection;
    score -= 0.5 * missing;
    score -= 0.5 * extra;

    const ext =
      colorMap.get(u.exteriorColorId) ?? {
        id: u.exteriorColorId,
        name: "—",
        hexCode: "#000000",
      };
    const intr =
      colorMap.get(u.interiorColorId) ?? {
        id: u.interiorColorId,
        name: "—",
        hexCode: "#000000",
      };

    const deltas: string[] = [];
    if (u.trim.id !== build.trimId) deltas.push(`Trim: ${u.trim.name}`);
    if (u.exteriorColorId !== build.exteriorColorId) {
      deltas.push(`Exterior: ${ext.name}`);
    }
    if (u.interiorColorId !== build.interiorColorId) {
      deltas.push(`Interior: ${intr.name}`);
    }
    if (missing > 0) deltas.push(`${missing} option${missing > 1 ? "s" : ""} missing`);
    if (extra > 0) deltas.push(`${extra} extra option${extra > 1 ? "s" : ""}`);

    return {
      id: u.id,
      slug: u.slug,
      trimName: u.trim.name,
      totalPrice: u.totalPrice.toString(),
      imageUrl: u.images[0]?.url ?? null,
      imageAlt: u.images[0]?.altText ?? null,
      exteriorColor: ext,
      interiorColor: intr,
      installedOptionIds,
      deltas,
      score,
    };
  });

  scored.sort((a, b) => b.score - a.score);

  const exact = scored.find(
    (m) =>
      m.trimName !== "" &&
      m.deltas.length === 0 &&
      sameSet(new Set(m.installedOptionIds), userOpts) &&
      // Belt-and-suspenders: ensure zero deltas means full equality.
      true,
  );

  // Belt-and-suspenders: ensure exact also matches trim+colours+options exactly.
  const exactStrict = units.find(
    (u) =>
      u.trim.id === build.trimId &&
      u.exteriorColorId === build.exteriorColorId &&
      u.interiorColorId === build.interiorColorId &&
      sameSet(new Set(u.installedOptions), userOpts),
  );

  if (exactStrict) {
    const match = scored.find((m) => m.id === exactStrict.id) ?? null;
    return {
      exact: match,
      near: scored.filter((m) => m.id !== exactStrict.id).slice(0, 5),
      empty: false,
    };
  }

  return {
    exact: exact ?? null,
    near: scored.slice(0, 5),
    empty: false,
  };
}

function sameSet(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}
