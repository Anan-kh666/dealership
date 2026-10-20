import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { type Accessor, type Document, Logger, type Node, NodeIO, type Primitive } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import {
  dedup,
  dequantize,
  getBounds,
  meshopt,
  prune,
  textureCompress,
  weld,
} from "@gltf-transform/functions";
import draco3d from "draco3dgltf";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";
import sharp from "sharp";
import type { CarRig } from "@dealership/types";
import type { BlenderAxis, Model3d } from "./schema";

/*
 * 3D pipeline: read a glTF (straight from Blender or anywhere else), work out
 * how it is oriented and rigged, optionally optimise it, and hand back the
 * bytes to publish.
 *
 * Blender's glTF exporter converts Z-up to glTF's Y-up: Blender (x, y, z)
 * becomes glTF (x, z, -y). So a car modelled the Blender way — nose towards
 * -Y, i.e. visible in Front view (numpad 1) — has its nose on glTF +Z.
 */

/** Bump when the processing changes, so cached outputs are rebuilt. */
export const PIPELINE_VERSION = 1;

export const MODEL_EXTENSIONS = [".glb", ".gltf"];
/** 3D formats people commonly drop in that the site can't use directly. */
export const UNSUPPORTED_3D: Record<string, string> = {
  ".blend": "Blender files can't be read directly — in Blender use File → Export → glTF 2.0 (.glb).",
  ".fbx": "FBX isn't supported — import it into Blender and export glTF 2.0 (.glb).",
  ".obj": "OBJ isn't supported — import it into Blender and export glTF 2.0 (.glb).",
  ".usdz": "USDZ isn't supported — export glTF 2.0 (.glb) instead.",
  ".stl": "STL has no materials — export glTF 2.0 (.glb) instead.",
};

/** rotationY (around three.js Y) that turns each Blender nose direction to +X. */
const BLENDER_FORWARD: Record<BlenderAxis, number> = {
  "-Y": Math.PI / 2,
  "+Y": -Math.PI / 2,
  "+X": 0,
  "-X": Math.PI,
};

const HEADLIGHT = /head.?(light|lamp)|^drl\b|daytime/i;
const TAILLIGHT = /(tail|brake|stop|rear).?(light|lamp)/i;
const PAINT = /paint|^body|carpaint/i;
const GLASS = /glass|window|windscreen|windshield/i;
const WHEEL = /wheel/i;
const NOT_WHEEL = /steer|spare|arch|well|house|cover|guard|base|drive|chair|liner/i;

const QUIET = new Logger(Logger.Verbosity.WARN);

let ioPromise: Promise<NodeIO> | null = null;
function getIO(): Promise<NodeIO> {
  ioPromise ??= (async () => {
    await MeshoptDecoder.ready;
    await MeshoptEncoder.ready;
    return new NodeIO()
      .setLogger(QUIET)
      .registerExtensions(ALL_EXTENSIONS)
      .registerDependencies({
      "draco3d.decoder": await draco3d.createDecoderModule(),
      "meshopt.decoder": MeshoptDecoder,
      "meshopt.encoder": MeshoptEncoder,
    });
  })();
  return ioPromise;
}

// ---------------------------------------------------------------- hashing

/** Hash of the 3D file plus every external buffer / texture a .gltf points at. */
export function hashModelInput(file: string, salt: string): string {
  const hash = createHash("sha1").update(`${PIPELINE_VERSION}|${salt}|`);
  hash.update(readFileSync(file));
  if (file.toLowerCase().endsWith(".gltf")) {
    const json = JSON.parse(readFileSync(file, "utf8")) as {
      buffers?: { uri?: string }[];
      images?: { uri?: string }[];
    };
    const uris = [...(json.buffers ?? []), ...(json.images ?? [])]
      .map((r) => r.uri)
      .filter((u): u is string => Boolean(u) && !u!.startsWith("data:"));
    for (const uri of uris) {
      const res = path.join(path.dirname(file), decodeURIComponent(uri));
      hash.update(existsSync(res) ? readFileSync(res) : `missing:${uri}`);
    }
  }
  return hash.digest("hex");
}

// ------------------------------------------------------------- matrix bits

type Mat4 = readonly number[]; // column-major, as glTF stores it
type Vec3 = [number, number, number];

function transformPoint(m: Mat4, [x, y, z]: Vec3): Vec3 {
  return [
    m[0]! * x + m[4]! * y + m[8]! * z + m[12]!,
    m[1]! * x + m[5]! * y + m[9]! * z + m[13]!,
    m[2]! * x + m[6]! * y + m[10]! * z + m[14]!,
  ];
}

/** Inverse of an affine column-major 4×4. */
function invertAffine(m: Mat4): number[] {
  const [a, b, c, d, e, f, g, h, i] = [m[0]!, m[4]!, m[8]!, m[1]!, m[5]!, m[9]!, m[2]!, m[6]!, m[10]!];
  const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  if (Math.abs(det) < 1e-12) throw new Error("Singular transform");
  const r = [
    (e * i - f * h) / det, (c * h - b * i) / det, (b * f - c * e) / det,
    (f * g - d * i) / det, (a * i - c * g) / det, (c * d - a * f) / det,
    (d * h - e * g) / det, (b * g - a * h) / det, (a * e - b * d) / det,
  ] as const;
  const t: Vec3 = [m[12]!, m[13]!, m[14]!];
  const tx = -(r[0] * t[0] + r[1] * t[1] + r[2] * t[2]);
  const ty = -(r[3] * t[0] + r[4] * t[1] + r[5] * t[2]);
  const tz = -(r[6] * t[0] + r[7] * t[1] + r[8] * t[2]);
  // back to column-major
  return [r[0], r[3], r[6], 0, r[1], r[4], r[7], 0, r[2], r[5], r[8], 0, tx, ty, tz, 1];
}

const IDENTITY: Mat4 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

// ------------------------------------------------------------- inspection

export interface Detected {
  /** From headlight/taillight positions, when both or one was found. */
  rotationY: number | null;
  lengthAxis: "X" | "Z";
  wheels: string[];
  headlights: string | null;
  taillights: string | null;
  materials: string[];
  triangles: number;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Exact-match pattern for a set of material names. */
function namesPattern(names: string[]): string | null {
  const unique = [...new Set(names)];
  return unique.length ? `^(?:${unique.map(escapeRegex).join("|")})$` : null;
}

function primitiveBox(prim: Primitive): { min: Vec3; max: Vec3 } | null {
  const pos = prim.getAttribute("POSITION");
  if (!pos || pos.getCount() === 0) return null;
  const min: Vec3 = [Infinity, Infinity, Infinity];
  const max: Vec3 = [-Infinity, -Infinity, -Infinity];
  const el: number[] = [];
  for (let i = 0; i < pos.getCount(); i++) {
    pos.getElement(i, el);
    for (let k = 0; k < 3; k++) {
      min[k] = Math.min(min[k]!, el[k]!);
      max[k] = Math.max(max[k]!, el[k]!);
    }
  }
  return { min, max };
}

/** World-space centre of everything drawn with the given materials. */
function materialCentre(doc: Document, names: Set<string>): Vec3 | null {
  const min: Vec3 = [Infinity, Infinity, Infinity];
  const max: Vec3 = [-Infinity, -Infinity, -Infinity];
  let found = false;
  for (const node of doc.getRoot().listNodes()) {
    const mesh = node.getMesh();
    if (!mesh) continue;
    // Skinned vertices live in skeleton space, which is ~world for cars.
    const world = node.getSkin() ? IDENTITY : node.getWorldMatrix();
    for (const prim of mesh.listPrimitives()) {
      if (!names.has(prim.getMaterial()?.getName() ?? "")) continue;
      const box = primitiveBox(prim);
      if (!box) continue;
      for (const corner of corners(box.min, box.max)) {
        const p = transformPoint(world, corner);
        for (let k = 0; k < 3; k++) {
          min[k] = Math.min(min[k]!, p[k]!);
          max[k] = Math.max(max[k]!, p[k]!);
        }
      }
      found = true;
    }
  }
  return found ? [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2] : null;
}

function corners(a: Vec3, b: Vec3): Vec3[] {
  const out: Vec3[] = [];
  for (const x of [a[0], b[0]]) for (const y of [a[1], b[1]]) for (const z of [a[2], b[2]]) out.push([x, y, z]);
  return out;
}

function hasGeometry(node: Node): boolean {
  let found = false;
  node.traverse((n) => {
    if (n.getMesh()) found = true;
  });
  return found;
}

/**
 * Four wheel nodes, by name. Takes the outermost nodes called "…wheel…"
 * (not steering / spare wheels); a group holding all four ("Wheels") is
 * opened up into its children.
 */
function findWheels(doc: Document): string[] {
  const isCandidate = (n: Node): boolean =>
    WHEEL.test(n.getName()) && !NOT_WHEEL.test(n.getName()) && hasGeometry(n);
  const outermost = (nodes: Node[], within: Node | null): Node[] =>
    nodes.filter((n) => {
      for (let p = n.getParentNode(); p && p !== within; p = p.getParentNode()) {
        if (isCandidate(p)) return false;
      }
      return true;
    });

  const all = doc.getRoot().listNodes().filter(isCandidate);
  let picked = outermost(all, null);
  // Open up groups that contain several wheels.
  for (let pass = 0; pass < 3; pass++) {
    const next: Node[] = [];
    for (const n of picked) {
      const inner = outermost(
        all.filter((c) => c !== n && isAncestor(n, c)),
        n,
      );
      next.push(...(inner.length >= 2 ? inner : [n]));
    }
    picked = next;
  }
  return picked.length === 4 ? picked.map((n) => n.getName()) : [];
}

function isAncestor(a: Node, b: Node): boolean {
  for (let p = b.getParentNode(); p; p = p.getParentNode()) if (p === a) return true;
  return false;
}

export function inspect(doc: Document): Detected {
  const root = doc.getRoot();
  const materials = root.listMaterials().map((m) => m.getName());
  const scene = root.getDefaultScene() ?? root.listScenes()[0];
  if (!scene) throw new Error("The file has no scene.");
  const bounds = getBounds(scene);
  const size = bounds.max.map((v, k) => v - bounds.min[k]!);
  const lengthAxis = size[0]! >= size[2]! ? 0 : 2;
  const mid = bounds.min.map((v, k) => (v + bounds.max[k]!) / 2);

  const headNames = materials.filter((m) => HEADLIGHT.test(m));
  const tailNames = materials.filter((m) => TAILLIGHT.test(m));
  const head = materialCentre(doc, new Set(headNames));
  const tail = materialCentre(doc, new Set(tailNames));

  let frontSign = 0;
  if (head && tail) frontSign = Math.sign(head[lengthAxis]! - tail[lengthAxis]!);
  else if (head) frontSign = Math.sign(head[lengthAxis]! - mid[lengthAxis]!);
  else if (tail) frontSign = -Math.sign(tail[lengthAxis]! - mid[lengthAxis]!);

  let rotationY: number | null = null;
  if (frontSign !== 0) {
    rotationY = lengthAxis === 0 ? (frontSign > 0 ? 0 : Math.PI) : frontSign > 0 ? Math.PI / 2 : -Math.PI / 2;
  }

  let triangles = 0;
  for (const mesh of root.listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const count = prim.getIndices()?.getCount() ?? prim.getAttribute("POSITION")?.getCount() ?? 0;
      if (prim.getMode() === 4) triangles += count / 3;
    }
  }

  return {
    rotationY,
    lengthAxis: lengthAxis === 0 ? "X" : "Z",
    wheels: findWheels(doc),
    headlights: namesPattern(headNames),
    taillights: namesPattern(tailNames),
    materials,
    triangles: Math.round(triangles),
  };
}

// ----------------------------------------------------------- wheel pivots

/**
 * Wheels spin around their node's origin. Blender keeps an object's origin
 * wherever it was, which is often not the hub — move each wheel's origin to
 * the centre of its geometry without moving anything visually.
 * Returns the names of the wheels that were moved.
 */
function centreWheelPivots(doc: Document, wheelNames: string[]): string[] {
  const root = doc.getRoot();
  const joints = new Set(root.listSkins().flatMap((s) => s.listJoints()));
  const moved: string[] = [];

  for (const name of wheelNames) {
    const node = root.listNodes().find((n) => n.getName() === name);
    if (!node || joints.has(node) || node.getSkin()) continue;

    const box = getBounds(node);
    const centre: Vec3 = [
      (box.min[0] + box.max[0]) / 2,
      (box.min[1] + box.max[1]) / 2,
      (box.min[2] + box.max[2]) / 2,
    ];
    const world = node.getWorldMatrix();
    const pivot: Vec3 = [world[12], world[13], world[14]];
    const diameter = Math.max(box.max[0] - box.min[0], box.max[1] - box.min[1], box.max[2] - box.min[2]);
    if (Math.hypot(centre[0] - pivot[0], centre[1] - pivot[1], centre[2] - pivot[2]) < diameter * 0.01) continue;

    // The geometry centre in the wheel's own space, and in its parent's.
    const local = transformPoint(invertAffine(world), centre);
    const parent = node.getParentNode();
    const inParent = parent ? transformPoint(invertAffine(parent.getWorldMatrix()), centre) : centre;

    // Give this wheel its own copy of the vertex positions (Blender's linked
    // duplicates share one mesh between all four wheels).
    const mesh = node.getMesh();
    if (mesh) {
      const copy = doc.createMesh(mesh.getName());
      const cloned = new Map<Accessor, Accessor>();
      for (const prim of mesh.listPrimitives()) {
        const p = prim.clone();
        const pos = prim.getAttribute("POSITION");
        if (pos) {
          let c = cloned.get(pos);
          if (!c) {
            c = pos.clone();
            const el: number[] = [];
            for (let i = 0; i < c.getCount(); i++) {
              c.getElement(i, el);
              c.setElement(i, [el[0]! - local[0], el[1]! - local[1], el[2]! - local[2]]);
            }
            cloned.set(pos, c);
          }
          p.setAttribute("POSITION", c);
        }
        copy.addPrimitive(p);
      }
      node.setMesh(copy);
    }
    for (const child of node.listChildren()) {
      const t = child.getTranslation();
      child.setTranslation([t[0] - local[0], t[1] - local[1], t[2] - local[2]]);
    }
    node.setTranslation(inParent);
    moved.push(name);
  }
  return moved;
}

// ---------------------------------------------------------------- process

export interface ProcessResult {
  bytes: Uint8Array;
  detected: Detected;
  /** Wheels whose pivot was moved to the hub. */
  repivoted: string[];
}

/**
 * Read a .glb/.gltf and return publishable .glb bytes plus what was found in
 * it. With `optimize`, textures become WebP (≤ textureSize) and geometry is
 * Meshopt-compressed — Draco input is decoded, because the site ships no
 * Draco decoder.
 */
export async function processModel(
  file: string,
  opts: { optimize: boolean; textureSize: number; wheels?: string[] },
): Promise<ProcessResult> {
  const io = await getIO();
  const doc = await io.read(file);
  doc.setLogger(QUIET);
  const detected = inspect(doc);

  if (!opts.optimize) {
    const isGlb = file.toLowerCase().endsWith(".glb");
    const usesDraco = doc
      .getRoot()
      .listExtensionsUsed()
      .some((e) => e.extensionName === "KHR_draco_mesh_compression");
    if (isGlb && !usesDraco) {
      return { bytes: new Uint8Array(readFileSync(file)), detected, repivoted: [] };
    }
    // .gltf needs packing into one .glb, and Draco needs decoding, either way.
  }

  // The site has no Draco decoder: keep the decoded geometry, drop the extension.
  for (const ext of doc.getRoot().listExtensionsUsed()) {
    if (ext.extensionName === "KHR_draco_mesh_compression") ext.dispose();
  }

  let repivoted: string[] = [];
  if (opts.optimize) {
    await doc.transform(dequantize());
    repivoted = centreWheelPivots(doc, opts.wheels ?? detected.wheels);
    await doc.transform(
      prune(),
      dedup(),
      weld(),
      textureCompress({
        encoder: sharp,
        targetFormat: "webp",
        resize: [opts.textureSize, opts.textureSize],
        quality: 82,
      }),
      meshopt({ encoder: MeshoptEncoder, level: "medium" }),
      prune(),
    );
  }

  const bytes = await io.writeBinary(doc);
  return { bytes, detected, repivoted };
}

// ---------------------------------------------------------- orientation

export function resolveRotation(
  cfg: Pick<Model3d, "rotationY" | "forward">,
  detected: Pick<Detected, "rotationY" | "lengthAxis">,
): { rotationY: number; source: string; warning?: string } {
  if (cfg.rotationY !== undefined) return { rotationY: cfg.rotationY, source: "model3d.rotationY" };
  if (cfg.forward) return { rotationY: BLENDER_FORWARD[cfg.forward], source: `model3d.forward (${cfg.forward})` };
  if (detected.rotationY !== null) return { rotationY: detected.rotationY, source: "headlight/taillight positions" };
  if (detected.lengthAxis === "Z") {
    return { rotationY: BLENDER_FORWARD["-Y"], source: "Blender default (nose towards -Y)" };
  }
  return {
    rotationY: BLENDER_FORWARD["+X"],
    source: "guess",
    warning:
      'Couldn\'t tell which end is the front (no headlight/taillight materials). If the car faces backwards, set "model3d.forward" to "-X".',
  };
}

/** Rig to publish: what was detected, with anything set in vehicle.json on top. */
export function mergeRig(detected: Detected, override: CarRig | undefined): CarRig | undefined {
  const rig: CarRig = {
    ...(detected.wheels.length ? { wheels: detected.wheels } : {}),
    ...(detected.headlights ? { headlights: detected.headlights } : {}),
    ...(detected.taillights ? { taillights: detected.taillights } : {}),
    ...override,
  };
  return Object.keys(rig).length ? rig : undefined;
}

/** Notes for whoever exported the file — what will and won't work. */
export function materialWarnings(detected: Detected, cfg: Model3d): string[] {
  const out: string[] = [];
  const paint = cfg.materials?.paint ? new RegExp(cfg.materials.paint, "i") : PAINT;
  const glass = cfg.materials?.glass ? new RegExp(cfg.materials.glass, "i") : GLASS;
  if (!detected.materials.some((m) => paint.test(m))) {
    out.push(
      `No body-paint material, so the colour picker won't recolour the car. Name the body material "Paint" in Blender (materials found: ${detected.materials.slice(0, 12).join(", ") || "none"}).`,
    );
  }
  if (!detected.materials.some((m) => glass.test(m))) {
    out.push('No window material ("Glass" / "Window") — windows will render as exported.');
  }
  if (!cfg.rig?.wheels && detected.wheels.length === 0) {
    out.push("Wheels won't spin: name the four wheel objects Wheel_FL, Wheel_FR, Wheel_RL, Wheel_RR in Blender.");
  }
  return out;
}
