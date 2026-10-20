import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { MODELS_DIR, SHARED_DIR, isVehicleFolderName } from "./paths";
import { MODEL_EXTENSIONS, UNSUPPORTED_3D } from "./scene";
import {
  SLUG_PATTERN,
  formatIssues,
  optionCatalogSchema,
  vehicleSchema,
  type OptionDefinition,
  type Vehicle,
  type VehicleInput,
} from "./schema";

export type LoadedVehicle =
  | {
      ok: true;
      slug: string;
      dir: string;
      vehicle: Vehicle;
      /** Absolute path of the 3D file, if the folder has one. */
      modelFile: string | null;
      warnings: string[];
      /** vehicle.json was just generated from a lone 3D file. */
      drafted: boolean;
    }
  | { ok: false; slug: string; dir: string; errors: string[]; warnings: string[] };

/** Folder names under models/ that hold vehicles. */
export function listVehicleSlugs(): string[] {
  if (!existsSync(MODELS_DIR)) return [];
  return readdirSync(MODELS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && isVehicleFolderName(d.name))
    .map((d) => d.name)
    .sort();
}

export function loadOptionCatalog(): OptionDefinition[] {
  const file = path.join(SHARED_DIR, "options.json");
  if (!existsSync(file)) return [];
  const parsed = optionCatalogSchema.safeParse(readJson(file));
  if (!parsed.success) {
    throw new Error(`models/_shared/options.json is invalid:\n  ${formatIssues(parsed.error).join("\n  ")}`);
  }
  return parsed.data.options;
}

function readJson(file: string): unknown {
  const text = readFileSync(file, "utf8");
  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const at = /position (\d+)/.exec(msg);
    if (at) {
      const line = text.slice(0, Number(at[1])).split("\n").length;
      throw new Error(`${path.basename(file)} is not valid JSON (line ${line}): ${msg}`);
    }
    throw new Error(`${path.basename(file)} is not valid JSON: ${msg}`);
  }
}

/** 3D files at the top of a vehicle folder, plus warnings about unusable ones. */
function scanModelFiles(dir: string): { models: string[]; warnings: string[] } {
  const models: string[] = [];
  const warnings: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (MODEL_EXTENSIONS.includes(ext)) models.push(entry.name);
    else if (UNSUPPORTED_3D[ext]) warnings.push(`${entry.name}: ${UNSUPPORTED_3D[ext]}`);
  }
  // A .blend kept next to its exported .glb is just the source file.
  return { models: models.sort(), warnings: models.length ? [] : warnings };
}

function pickModelFile(dir: string, configured: string | undefined, found: string[]): string | null {
  if (configured) {
    const file = path.resolve(dir, configured);
    if (!file.startsWith(dir + path.sep)) throw new Error(`model3d.file must be inside the vehicle folder`);
    if (!existsSync(file)) throw new Error(`model3d.file "${configured}" doesn't exist`);
    return file;
  }
  if (found.length === 0) return null;
  if (found.length === 1) return path.join(dir, found[0]!);
  const preferred = found.find((f) => /^model\.(glb|gltf)$/i.test(f));
  if (preferred) return path.join(dir, preferred);
  throw new Error(
    `Several 3D files here (${found.join(", ")}). Keep one, name it model.glb, or set "model3d.file".`,
  );
}

export function loadVehicle(slug: string): LoadedVehicle {
  const dir = path.join(MODELS_DIR, slug);
  const warnings: string[] = [];
  if (!SLUG_PATTERN.test(slug)) {
    return {
      ok: false,
      slug,
      dir,
      warnings,
      errors: [`Folder name "${slug}" becomes the web address — use lowercase letters, digits and dashes (e.g. "aurora-suv").`],
    };
  }

  try {
    const scan = scanModelFiles(dir);
    warnings.push(...scan.warnings);

    const jsonFile = path.join(dir, "vehicle.json");
    let drafted = false;
    if (!existsSync(jsonFile)) {
      if (scan.models.length === 0) {
        return {
          ok: false,
          slug,
          dir,
          warnings,
          errors: ["Empty folder — add a vehicle.json and/or a .glb exported from Blender."],
        };
      }
      writeDraft(jsonFile, slug, scan.models[0]!);
      drafted = true;
    }

    const parsed = vehicleSchema.safeParse(readJson(jsonFile));
    if (!parsed.success) return { ok: false, slug, dir, warnings, errors: formatIssues(parsed.error) };
    const vehicle = parsed.data;

    const modelFile = pickModelFile(dir, vehicle.model3d.file, scan.models);
    for (const img of vehicle.images) {
      if (isRemote(img.src)) continue;
      const file = path.resolve(dir, img.src);
      if (!file.startsWith(dir + path.sep) || !existsSync(file) || !statSync(file).isFile()) {
        throw new Error(`Image "${img.src}" not found in the vehicle folder`);
      }
    }
    if (vehicle.heroImage && !isRemote(vehicle.heroImage) && !existsSync(path.resolve(dir, vehicle.heroImage))) {
      throw new Error(`heroImage "${vehicle.heroImage}" not found in the vehicle folder`);
    }
    return { ok: true, slug, dir, vehicle, modelFile, warnings, drafted };
  } catch (error) {
    return { ok: false, slug, dir, warnings, errors: [error instanceof Error ? error.message : String(error)] };
  }
}

export function isRemote(src: string): boolean {
  return /^https?:\/\//i.test(src);
}

function titleCase(slug: string): string {
  return slug
    .split("-")
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/**
 * A 3D file was dropped into a new folder with no vehicle.json: write a
 * starter one so the car can be previewed straight away. It's unpublished,
 * because the prices and specs are placeholders.
 */
function writeDraft(file: string, slug: string, modelFile: string): void {
  const name = titleCase(slug);
  const draft: VehicleInput = {
    $schema: "../_schema/vehicle.schema.json",
    published: false,
    make: name.split(" ")[0] ?? name,
    name,
    year: new Date().getFullYear(),
    bodyType: "SEDAN",
    description: `Draft created from ${modelFile}. Fill in the details, then set "published" to true.`,
    highlights: [],
    images: [],
    colors: {
      exterior: [
        { name: "Pearl White", hex: "#EEEAE1", metallic: false, upcharge: 0 },
        { name: "Graphite Metallic", hex: "#2A2A2A", metallic: true, upcharge: 1500 },
        { name: "Deep Marine", hex: "#1F2C3A", metallic: true, upcharge: 1500 },
      ],
      interior: [
        { name: "Charcoal", hex: "#262626", upcharge: 0 },
        { name: "Caramel", hex: "#7B5430", upcharge: 0 },
      ],
    },
    trims: [
      {
        name: "Standard",
        price: 0,
        engineSize: null,
        horsepower: null,
        torque: null,
        transmission: "AUTOMATIC",
        fuelType: "PETROL",
        drivetrain: "FWD",
        seats: 5,
        doors: 4,
        features: [],
        options: [],
      },
    ],
    stock: [],
    model3d: { file: modelFile },
  };
  writeFileSync(file, `${JSON.stringify(draft, null, 2)}\n`);
}
