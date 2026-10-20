import "server-only";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { carAssetSchema } from "@dealership/types";
import type { CarAsset } from "@/lib/car-assets";

/** Where `@dealership/vehicles` publishes each vehicle's 3D files. */
const VEHICLES_DIR = path.join(process.cwd(), "public", "vehicles");
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Resolve the 3D asset for a model from `public/vehicles/<slug>/scene.json`
 * (generated from `models/<slug>/vehicle.json`), but only if its .glb is
 * actually present — otherwise the configurator shows the placeholder car
 * instead of making a failed network request.
 *
 * Read per request, so a vehicle added or re-exported while the site runs
 * shows up without a restart.
 */
export function resolveCarAsset(slug: string): CarAsset | null {
  if (!SLUG.test(slug)) return null;
  const dir = path.join(VEHICLES_DIR, slug);

  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(path.join(dir, "scene.json"), "utf8"));
  } catch {
    return null;
  }
  const parsed = carAssetSchema.safeParse(raw);
  if (!parsed.success) {
    console.warn(`[car-assets] Ignoring invalid scene.json for "${slug}"`, parsed.error.issues);
    return null;
  }

  const file = parsed.data.url.split("?")[0] ?? "";
  return existsSync(path.join(process.cwd(), "public", file.replace(/^\/+/, "")))
    ? parsed.data
    : null;
}
