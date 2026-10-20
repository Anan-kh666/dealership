import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { carAssetSchema, type CarAsset } from "@dealership/types";
import { isRemote, type LoadedVehicle } from "./discover";
import { PUBLIC_DIR, PUBLIC_URL } from "./paths";
import {
  type Detected,
  PIPELINE_VERSION,
  hashModelInput,
  materialWarnings,
  mergeRig,
  processModel,
  resolveRotation,
} from "./scene";

type OkVehicle = Extract<LoadedVehicle, { ok: true }>;

/** Generic car photo for drafts that have no images yet (verified Unsplash ID). */
export const FALLBACK_HERO =
  "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1600&q=85&auto=format&fit=crop";

interface BuildInfo {
  version: number;
  hash: string;
  detected: Detected;
  repivoted: string[];
  bytes: number;
}

export interface Published {
  asset: CarAsset | null;
  /** Public URL for an image `src` from vehicle.json. */
  imageUrl: (src: string) => string;
  heroImage: string;
  notes: string[];
  warnings: string[];
}

function writeAtomic(file: string, data: string | Uint8Array): void {
  const tmp = `${file}.tmp-${process.pid}`;
  writeFileSync(tmp, data);
  renameSync(tmp, file);
}

function readBuildInfo(file: string): BuildInfo | null {
  try {
    const info = JSON.parse(readFileSync(file, "utf8")) as BuildInfo;
    return info.version === PIPELINE_VERSION ? info : null;
  } catch {
    return null;
  }
}

function mb(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Publish one vehicle's 3D file and local images to apps/web/public/vehicles/<slug>/. */
export async function publishVehicle(v: OkVehicle, opts: { force?: boolean } = {}): Promise<Published> {
  const { slug, dir, vehicle } = v;
  const cfg = vehicle.model3d;
  const out = path.join(PUBLIC_DIR, slug);
  mkdirSync(out, { recursive: true });
  const keep = new Set<string>();
  const notes: string[] = [];
  const warnings: string[] = [];

  // ---------------------------------------------------------------- images
  const urlFor = new Map<string, string>();
  const localSrcs = [vehicle.heroImage, ...vehicle.images.map((i) => i.src)].filter(
    (s): s is string => Boolean(s) && !isRemote(s!),
  );
  for (const src of new Set(localSrcs)) {
    const rel = path.relative(dir, path.resolve(dir, src)).split(path.sep).join("/");
    const target = path.join(out, "images", rel);
    const from = path.join(dir, rel);
    const fresh =
      existsSync(target) &&
      statSync(target).size === statSync(from).size &&
      statSync(target).mtimeMs >= statSync(from).mtimeMs;
    if (!fresh) {
      mkdirSync(path.dirname(target), { recursive: true });
      copyFileSync(from, target);
    }
    keep.add(path.join("images", rel));
    urlFor.set(src, `${PUBLIC_URL}/${slug}/images/${rel.split("/").map(encodeURIComponent).join("/")}`);
  }
  const imageUrl = (src: string): string => (isRemote(src) ? src : (urlFor.get(src) ?? src));
  const heroSrc = vehicle.heroImage ?? vehicle.images[0]?.src;
  const heroImage = heroSrc ? imageUrl(heroSrc) : FALLBACK_HERO;

  // -------------------------------------------------------------- 3D model
  let asset: CarAsset | null = null;
  if (v.modelFile) {
    const glb = path.join(out, "model.glb");
    const infoFile = path.join(out, ".build.json");
    const salt = JSON.stringify({ o: cfg.optimize, t: cfg.textureSize, w: cfg.rig?.wheels ?? null });
    const hash = hashModelInput(v.modelFile, salt);

    let info = opts.force ? null : readBuildInfo(infoFile);
    if (!info || info.hash !== hash || !existsSync(glb)) {
      const started = Date.now();
      const result = await processModel(v.modelFile, {
        optimize: cfg.optimize,
        textureSize: cfg.textureSize,
        wheels: cfg.rig?.wheels,
      });
      writeAtomic(glb, result.bytes);
      info = {
        version: PIPELINE_VERSION,
        hash,
        detected: result.detected,
        repivoted: result.repivoted,
        bytes: result.bytes.byteLength,
      };
      writeAtomic(infoFile, JSON.stringify(info, null, 2));
      const inSize = statSync(v.modelFile).size;
      notes.push(
        `3D: ${path.basename(v.modelFile)} ${mb(inSize)} → ${mb(info.bytes)}` +
          ` (${info.detected.triangles.toLocaleString()} triangles, ${((Date.now() - started) / 1000).toFixed(1)}s)`,
      );
      if (result.repivoted.length) notes.push(`3D: centred the pivot of ${result.repivoted.join(", ")}`);
    }
    keep.add("model.glb").add(".build.json").add("scene.json");

    const rotation = resolveRotation(cfg, info.detected);
    if (rotation.warning) warnings.push(rotation.warning);
    warnings.push(...materialWarnings(info.detected, cfg));
    if (info.bytes > 12 * 1024 * 1024) {
      warnings.push(`The 3D file is ${mb(info.bytes)} — phones will struggle. Lower textureSize or decimate in Blender.`);
    }

    const candidate = {
      url: `${PUBLIC_URL}/${slug}/model.glb?v=${hash.slice(0, 10)}`,
      rotationY: Number(rotation.rotationY.toFixed(6)),
      length: cfg.length,
      materials: cfg.materials,
      rig: mergeRig(info.detected, cfg.rig),
      interior: cfg.interior,
      credit: cfg.credit,
    };
    asset = carAssetSchema.parse(JSON.parse(JSON.stringify(candidate)));
    const sceneFile = path.join(out, "scene.json");
    const json = `${JSON.stringify(asset, null, 2)}\n`;
    if (!existsSync(sceneFile) || readFileSync(sceneFile, "utf8") !== json) writeAtomic(sceneFile, json);
    notes.push(`3D: facing from ${rotation.source}; wheels ${asset.rig?.wheels?.length ? "rigged" : "static"}`);
  }

  removeStale(out, keep);
  return { asset, imageUrl, heroImage, notes, warnings };
}

/** Delete files in a published folder that no longer come from the vehicle folder. */
function removeStale(root: string, keep: Set<string>, rel = ""): void {
  const dir = path.join(root, rel);
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const child = path.join(rel, entry.name);
    if (entry.isDirectory()) {
      removeStale(root, keep, child);
      if (readdirSync(path.join(root, child)).length === 0) rmSync(path.join(root, child), { recursive: true });
    } else if (!keep.has(child)) {
      rmSync(path.join(root, child));
    }
  }
}

/** Remove published folders for vehicles that no longer exist. */
export function prunePublished(slugs: Set<string>): string[] {
  if (!existsSync(PUBLIC_DIR)) return [];
  const removed: string[] = [];
  for (const entry of readdirSync(PUBLIC_DIR, { withFileTypes: true })) {
    if (entry.isDirectory() && !slugs.has(entry.name)) {
      rmSync(path.join(PUBLIC_DIR, entry.name), { recursive: true, force: true });
      removed.push(entry.name);
    }
  }
  return removed;
}
