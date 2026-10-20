import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Repo root — the folder holding pnpm-workspace.yaml. */
function findRepoRoot(): string {
  let dir = path.dirname(fileURLToPath(import.meta.url));
  for (;;) {
    if (existsSync(path.join(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error("Could not find the repo root (pnpm-workspace.yaml).");
    dir = parent;
  }
}

export const REPO_ROOT = findRepoRoot();

/** One sub-folder per vehicle. Folders starting with `_` or `.` aren't vehicles. */
export const MODELS_DIR = path.join(REPO_ROOT, "models");
export const SHARED_DIR = path.join(MODELS_DIR, "_shared");
export const SCHEMA_DIR = path.join(MODELS_DIR, "_schema");

/** Generated, git-ignored output served by the web app at `/vehicles/<slug>/…`. */
export const PUBLIC_DIR = path.join(REPO_ROOT, "apps", "web", "public", "vehicles");
export const PUBLIC_URL = "/vehicles";

export function isVehicleFolderName(name: string): boolean {
  return !name.startsWith("_") && !name.startsWith(".");
}
