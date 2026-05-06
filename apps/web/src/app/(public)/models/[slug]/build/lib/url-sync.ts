import {
  configuratorParamsSchema,
  type ConfiguratorParams,
} from "@dealership/types";

/**
 * Parse a URLSearchParams (or any iterable of [key, value] pairs) into a
 * validated ConfiguratorParams object. Invalid values fall back to defaults
 * silently (with a single console.warn) — never throw, never crash the page.
 */
export function parseConfig(
  search: URLSearchParams | ReadonlyMap<string, string> | Record<string, string | string[] | undefined>,
): ConfiguratorParams {
  const get = (key: string): string | undefined => {
    if (search instanceof URLSearchParams) return search.get(key) ?? undefined;
    if (search instanceof Map) return search.get(key) ?? undefined;
    const v = (search as Record<string, string | string[] | undefined>)[key];
    if (Array.isArray(v)) return v[0];
    return v ?? undefined;
  };

  const raw = {
    trim: get("trim"),
    exterior: get("exterior"),
    interior: get("interior"),
    options: get("options"),
  };

  const parsed = configuratorParamsSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  if (typeof console !== "undefined") {
    // eslint-disable-next-line no-console
    console.warn(
      "[configurator] discarding invalid URL params:",
      parsed.error.flatten().fieldErrors,
    );
  }
  // Drop any field that failed; keep the rest.
  const out: ConfiguratorParams = {};
  for (const key of ["trim", "exterior", "interior"] as const) {
    const v = raw[key];
    if (v && /^c[a-z0-9]{20,}$/i.test(v)) out[key] = v;
  }
  if (raw.options) {
    const ids = raw.options
      .split(",")
      .map((s) => s.trim())
      .filter((s) => /^c[a-z0-9]{20,}$/i.test(s));
    if (ids.length > 0) out.options = ids;
  }
  return out;
}

/**
 * Build a query string from a configurator selection. Empty/undefined fields
 * are dropped so the URL stays tidy. Returns the leading `?` for ergonomic
 * use with router.replace.
 */
export interface BuildQueryInput {
  trim?: string | null;
  exterior?: string | null;
  interior?: string | null;
  options?: readonly string[];
}

export function buildQueryString(input: BuildQueryInput): string {
  const sp = new URLSearchParams();
  if (input.trim) sp.set("trim", input.trim);
  if (input.exterior) sp.set("exterior", input.exterior);
  if (input.interior) sp.set("interior", input.interior);
  if (input.options && input.options.length > 0) {
    sp.set("options", input.options.join(","));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}
