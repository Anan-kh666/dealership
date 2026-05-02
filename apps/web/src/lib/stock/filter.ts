import { BodyType, FuelType } from "@dealership/db";
import { colorSlug } from "./format";

export type StockSort = "newest" | "price-asc" | "price-desc" | "days-on-lot";

export const SORT_LABELS: Record<StockSort, string> = {
  newest: "Newest arrivals",
  "price-asc": "Price low → high",
  "price-desc": "Price high → low",
  "days-on-lot": "Days on lot",
};

export interface StockFilters {
  models: string[];
  trims: string[];
  bodyTypes: BodyType[];
  fuelTypes: FuelType[];
  colors: string[]; // slugged color names
  priceMin: number | null;
  priceMax: number | null;
  sort: StockSort;
  page: number;
}

export const DEFAULT_PRICE_MIN = 50_000;
export const DEFAULT_PRICE_MAX = 500_000;
export const PRICE_STEP = 5_000;

export const DEFAULT_MONTHLY_MIN = 500;
export const DEFAULT_MONTHLY_MAX = 5_000;

export const PAGE_SIZE = 24;

const VALID_SORTS = new Set<StockSort>([
  "newest",
  "price-asc",
  "price-desc",
  "days-on-lot",
]);

function getAll(
  sp: Record<string, string | string[] | undefined>,
  key: string,
): string[] {
  const v = sp[key];
  if (v === undefined) return [];
  if (Array.isArray(v)) return v.flatMap((x) => x.split(","));
  return v.split(",");
}

function getFirst(
  sp: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const v = sp[key];
  if (Array.isArray(v)) return v[0];
  return v;
}

const isBodyType = (s: string): s is BodyType =>
  Object.values(BodyType).includes(s as BodyType);

const isFuelType = (s: string): s is FuelType =>
  Object.values(FuelType).includes(s as FuelType);

export function parseFilters(
  sp: Record<string, string | string[] | undefined>,
): StockFilters {
  const sortRaw = getFirst(sp, "sort");
  const sort: StockSort = sortRaw && VALID_SORTS.has(sortRaw as StockSort)
    ? (sortRaw as StockSort)
    : "newest";

  const priceMinRaw = getFirst(sp, "priceMin");
  const priceMaxRaw = getFirst(sp, "priceMax");
  const pageRaw = getFirst(sp, "page");

  const priceMin = priceMinRaw ? Number.parseInt(priceMinRaw, 10) : null;
  const priceMax = priceMaxRaw ? Number.parseInt(priceMaxRaw, 10) : null;

  return {
    models: getAll(sp, "model").filter(Boolean),
    trims: getAll(sp, "trim").filter(Boolean),
    bodyTypes: getAll(sp, "bodyType").filter(isBodyType),
    fuelTypes: getAll(sp, "fuelType").filter(isFuelType),
    colors: getAll(sp, "color").filter(Boolean),
    priceMin: Number.isFinite(priceMin) ? priceMin : null,
    priceMax: Number.isFinite(priceMax) ? priceMax : null,
    sort,
    page: pageRaw ? Math.max(1, Number.parseInt(pageRaw, 10) || 1) : 1,
  };
}

export interface FilterableUnit {
  id: string;
  modelSlug: string;
  trimName: string;
  bodyType: BodyType;
  fuelType: FuelType;
  exteriorColorName: string;
  totalPrice: number;
}

export function applyFilters<T extends FilterableUnit>(
  items: T[],
  filters: StockFilters,
): T[] {
  return items.filter((u) => {
    if (filters.models.length && !filters.models.includes(u.modelSlug)) return false;
    if (filters.trims.length && !filters.trims.includes(u.trimName)) return false;
    if (filters.bodyTypes.length && !filters.bodyTypes.includes(u.bodyType)) return false;
    if (filters.fuelTypes.length && !filters.fuelTypes.includes(u.fuelType)) return false;
    if (
      filters.colors.length &&
      !filters.colors.includes(colorSlug(u.exteriorColorName))
    ) {
      return false;
    }
    if (filters.priceMin !== null && u.totalPrice < filters.priceMin) return false;
    if (filters.priceMax !== null && u.totalPrice > filters.priceMax) return false;
    return true;
  });
}

export function sortItems<T extends FilterableUnit & { arrivalDateMs: number; daysOnLot: number }>(
  items: T[],
  sort: StockSort,
): T[] {
  const out = [...items];
  switch (sort) {
    case "price-asc":
      out.sort((a, b) => a.totalPrice - b.totalPrice);
      break;
    case "price-desc":
      out.sort((a, b) => b.totalPrice - a.totalPrice);
      break;
    case "days-on-lot":
      out.sort((a, b) => b.daysOnLot - a.daysOnLot);
      break;
    case "newest":
    default:
      out.sort((a, b) => b.arrivalDateMs - a.arrivalDateMs);
      break;
  }
  return out;
}
