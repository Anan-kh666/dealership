/**
 * 3D model types and material-naming defaults for the configurator.
 *
 * Each vehicle's 3D settings live in `models/<slug>/vehicle.json` (section
 * `model3d`) at the repo root. `@dealership/vehicles` optimises the 3D file
 * and publishes it, with its settings, to `public/vehicles/<slug>/` — read
 * server-side by `server/car-assets.ts`. Vehicles without a 3D file fall
 * back to the built-in stylised placeholder.
 */

import type { MaterialPatterns } from "@dealership/types";

export type {
  CarAsset,
  CarAssetCredit,
  CarRig,
  MaterialPatterns,
} from "@dealership/types";

/** Default naming convention (see models/README.md). */
export const DEFAULT_MATERIAL_PATTERNS: MaterialPatterns = {
  paint: "paint|^body|carpaint",
  interior: "interior_accent|seat|leather|upholster",
  rim: "rim",
  // Lamp lenses and black frit bands also say "glass" — excluded in code.
  glass: "glass|window|windscreen|windshield",
};

/** Material names that look like glass but are lamp lenses or trim. */
export const NOT_CABIN_GLASS = /red|lens|light|lamp|bump|ridg|edge|frit|mirror/i;
