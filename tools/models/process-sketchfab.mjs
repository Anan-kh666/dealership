// Prepares the four Sketchfab vehicles for the configurator.
//
//   node process-sketchfab.mjs <config-name> <input.glb> <output.glb>
//
// Per model (see CONFIGS): renames paint / lamp / rim materials to the
// configurator convention, turns wheels into four separately pivoted nodes
// (Wheel_FL/FR/RL/RR), removes trademark-like textures, re-encodes textures
// as WebP and Meshopt-compresses geometry. Prints the front direction so the
// registry rotation can be set.
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import {
  clearNodeTransform,
  dedup,
  flatten,
  getBounds,
  meshopt,
  prune,
  textureCompress,
  weld,
} from "@gltf-transform/functions";
import { MeshoptEncoder } from "meshoptimizer";
import sharp from "sharp";

const CONFIGS = {
  sedan: {
    rename: { material: "Paint_Body", RedLight: "Taillight", OrangeLight: "Signallight", Metal: "Chrome" },
    head: null, // no dedicated headlight material — front taken as opposite of taillights
    tail: "Taillight",
    // All four wheels are one node; split by quadrant.
    wheels: { split: ["Wheels"] },
    flatten: true,
  },
  concept: {
    rename: { "Material.002": "Paint_Body", "Material.004": "Taillight", Material: "Headlight", "Material.007": "Rim", "MA_tire_003": "Tire" },
    head: "Headlight",
    tail: "Taillight",
    wheels: { nodes: /^Shape_IndexedFaceSet/ },
    flatten: true,
  },
  estate: {
    rename: { grey_car_paint: "Paint_Body", Rear_light_led: "Taillight", Alloy_Wheel: "Rim" },
    head: "Headlight",
    tail: "Taillight",
    wheels: { nodes: /Promotion Car\.00[4-7]$/ },
    flatten: true,
  },
  coupe: {
    rename: { "Glass_-_Red": "Taillight", "Glass_-_Red_-_Rough": "Taillight_Rough" },
    head: null,
    tail: "Taillight",
    // Skinned rig — wheels are bones; keep hierarchy, split paint from the atlas.
    paintAtlas: { material: "car-body", isPaint: (r, g, b) => r > 70 && r > g * 1.8 && r > b * 1.8 },
    blankTextures: ["media"],
    flatten: false,
  },
};

const [name, input, output] = process.argv.slice(2);
const cfg = CONFIGS[name];
if (!cfg) throw new Error(`unknown config ${name}`);

await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  "meshopt.encoder": MeshoptEncoder,
});
const doc = await io.read(input);
const root = doc.getRoot();
const scene = root.listScenes()[0];

// ---------------------------------------------------------------- materials
for (const m of root.listMaterials()) {
  const to = cfg.rename[m.getName()];
  if (to) m.setName(to);
}

// Wheel groups are matched on the original hierarchy (wheel nodes are often
// parents of the actual mesh nodes, which flattening detaches).
const wheelGroups = [];
if (cfg.wheels?.nodes) {
  for (const n of root.listNodes().filter((x) => cfg.wheels.nodes.test(x.getName()))) {
    const meshes = [];
    n.traverse((c) => { if (c.getMesh()) meshes.push(c); });
    if (meshes.length) wheelGroups.push(meshes);
  }
}

// ------------------------------------------------- flatten to world space
if (cfg.flatten) {
  await doc.transform(flatten());
  for (const n of root.listNodes()) if (n.getMesh()) clearNodeTransform(n);
  // Drop now-empty transform nodes left behind by flatten.
  for (const n of root.listNodes()) {
    if (!n.getMesh() && n.listChildren().length === 0 && !n.getSkin()) n.dispose();
  }
}

// ---------------------------------------------------------- geometry helpers
function triangleGroups(prim, keyOf) {
  const pos = prim.getAttribute("POSITION");
  const idx = prim.getIndices();
  const count = idx ? idx.getCount() : pos.getCount();
  const get = (i) => (idx ? idx.getScalar(i) : i);
  const groups = new Map();
  const a = [], b = [], c = [];
  for (let t = 0; t < count; t += 3) {
    const i0 = get(t), i1 = get(t + 1), i2 = get(t + 2);
    pos.getElement(i0, a); pos.getElement(i1, b); pos.getElement(i2, c);
    const key = keyOf([(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3], [i0, i1, i2]);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(i0, i1, i2);
  }
  return groups;
}

/** New primitive with its own copies of every attribute, compacted to `indices`. */
function subPrimitive(prim, indices) {
  const used = [...new Set(indices)].sort((x, y) => x - y);
  const remap = new Map(used.map((v, i) => [v, i]));
  const out = doc.createPrimitive().setMaterial(prim.getMaterial()).setMode(prim.getMode());
  for (const sem of prim.listSemantics()) {
    const src = prim.getAttribute(sem);
    const size = src.getElementSize();
    const Arr = src.getArray().constructor;
    const arr = new Arr(used.length * size);
    const el = [];
    used.forEach((v, i) => { src.getElement(v, el); arr.set(el, i * size); });
    out.setAttribute(sem, doc.createAccessor().setType(src.getType()).setArray(arr).setNormalized(src.getNormalized()).setBuffer(src.getBuffer()));
  }
  const IdxArr = used.length > 65535 ? Uint32Array : Uint16Array;
  out.setIndices(doc.createAccessor().setType("SCALAR").setArray(IdxArr.from(indices.map((v) => remap.get(v)))).setBuffer(prim.getAttribute("POSITION").getBuffer()));
  return out;
}

function translatePrimitive(prim, [dx, dy, dz]) {
  const pos = prim.getAttribute("POSITION");
  const el = [];
  for (let i = 0; i < pos.getCount(); i++) {
    pos.getElement(i, el);
    pos.setElement(i, [el[0] - dx, el[1] - dy, el[2] - dz]);
  }
}

function boundsOfPrims(prims) {
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  const el = [];
  for (const p of prims) {
    const pos = p.getAttribute("POSITION");
    for (let i = 0; i < pos.getCount(); i++) {
      pos.getElement(i, el);
      for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], el[k]); max[k] = Math.max(max[k], el[k]); }
    }
  }
  return { min, max, center: min.map((v, k) => (v + max[k]) / 2) };
}

function materialCentroid(matName) {
  const prims = root.listMeshes().flatMap((m) => m.listPrimitives()).filter((p) => p.getMaterial()?.getName() === matName);
  if (!prims.length) return null;
  // World-space only when flattened; good enough for the coupe too (rig root is upright).
  return boundsOfPrims(prims).center;
}

// --------------------------------------------------------------- the car frame
const sceneBounds = getBounds(scene);
const size = sceneBounds.max.map((v, k) => v - sceneBounds.min[k]);
const lengthAxis = size[0] > size[2] ? 0 : 2; // X or Z
const lateralAxis = lengthAxis === 0 ? 2 : 0;
const mid = sceneBounds.min.map((v, k) => (v + sceneBounds.max[k]) / 2);

let frontSign;
const head = cfg.head && materialCentroid(cfg.head);
const tail = cfg.tail && materialCentroid(cfg.tail);
if (head && tail) frontSign = Math.sign(head[lengthAxis] - tail[lengthAxis]);
else if (tail) frontSign = -Math.sign(tail[lengthAxis] - mid[lengthAxis]);
else if (head) frontSign = Math.sign(head[lengthAxis] - mid[lengthAxis]);

// rotationY that maps the nose direction onto +X (three.js: rotY(θ) maps +X→(cos,0,-sin), +Z→(sin,0,cos)).
let rotationY = 0;
if (lengthAxis === 0) rotationY = frontSign > 0 ? 0 : Math.PI;
else rotationY = frontSign > 0 ? Math.PI / 2 : -Math.PI / 2;

// ------------------------------------------------------------------- wheels
const wheelName = (center) => {
  const front = Math.sign(center[lengthAxis] - mid[lengthAxis]) === frontSign;
  // Left/right relative to the car: right = forward × up.
  const fwd = [0, 0, 0]; fwd[lengthAxis] = frontSign;
  const right = [fwd[1] * 0 - fwd[2] * 1, fwd[2] * 0 - fwd[0] * 0, fwd[0] * 1 - fwd[1] * 0]; // fwd × (0,1,0)
  const side = (center[0] - mid[0]) * right[0] + (center[2] - mid[2]) * right[2] > 0 ? "R" : "L";
  return `Wheel_${front ? "F" : "R"}${side}`;
};

function makeWheelNode(prims) {
  const b = boundsOfPrims(prims);
  for (const p of prims) translatePrimitive(p, b.center);
  const mesh = doc.createMesh();
  prims.forEach((p) => mesh.addPrimitive(p));
  const node = doc.createNode(wheelName(b.center)).setMesh(mesh).setTranslation(b.center);
  scene.addChild(node);
  return node;
}

if (cfg.wheels?.split) {
  for (const srcName of cfg.wheels.split) {
    const src = root.listNodes().find((n) => n.getName() === srcName || n.getName().startsWith(`${srcName}_`) && n.getMesh());
    const nodes = root.listNodes().filter((n) => n.getMesh() && (n.getName() === srcName || n.getName().startsWith(`${srcName}_`)));
    const byQuadrant = new Map();
    for (const n of nodes) {
      for (const prim of n.getMesh().listPrimitives()) {
        const groups = triangleGroups(prim, (c) => `${Math.sign(c[lengthAxis] - mid[lengthAxis])}${Math.sign(c[lateralAxis] - mid[lateralAxis])}`);
        for (const [q, idx] of groups) {
          if (!byQuadrant.has(q)) byQuadrant.set(q, []);
          byQuadrant.get(q).push(subPrimitive(prim, idx));
        }
      }
      n.dispose();
    }
    void src;
    for (const prims of byQuadrant.values()) makeWheelNode(prims);
  }
}
for (const group of wheelGroups) {
  const prims = group.flatMap((n) => n.getMesh().listPrimitives().map((p) => {
    const idx = p.getIndices();
    return subPrimitive(p, idx ? Array.from(idx.getArray()) : [...Array(p.getAttribute("POSITION").getCount()).keys()]);
  }));
  makeWheelNode(prims);
  group.forEach((n) => n.dispose());
}

// ------------------------------------------------ paint split from an atlas
if (cfg.paintAtlas) {
  const mat = root.listMaterials().find((m) => m.getName() === cfg.paintAtlas.material);
  const tex = mat.getBaseColorTexture();
  const { data, info } = await sharp(Buffer.from(tex.getImage())).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const sample = (u, v) => {
    const x = Math.min(info.width - 1, Math.max(0, Math.floor((u - Math.floor(u)) * info.width)));
    const y = Math.min(info.height - 1, Math.max(0, Math.floor((v - Math.floor(v)) * info.height)));
    const o = (y * info.width + x) * 3;
    return [data[o], data[o + 1], data[o + 2]];
  };
  // Paint material: same maps, but a near-white base so colour factor drives the hue.
  const paint = mat.clone().setName("Paint_Body");
  const lum = [];
  for (let i = 0; i < data.length; i += 3) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    if (cfg.paintAtlas.isPaint(r, g, b)) lum.push(0.2126 * r + 0.7152 * g + 0.0722 * b);
  }
  const ref = lum.sort((x, y) => x - y)[Math.floor(lum.length * 0.6)] || 1;
  const white = Buffer.alloc(info.width * info.height * 3);
  for (let i = 0; i < data.length; i += 3) {
    const l = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    const v = Math.max(0, Math.min(255, Math.round((l / ref) * 235)));
    white[i] = white[i + 1] = white[i + 2] = v;
  }
  const whitePng = await sharp(white, { raw: { width: info.width, height: info.height, channels: 3 } }).png().toBuffer();
  paint.setBaseColorTexture(doc.createTexture("PaintBase").setImage(new Uint8Array(whitePng)).setMimeType("image/png"));
  paint.setBaseColorFactor([1, 1, 1, 1]);

  let moved = 0;
  for (const mesh of root.listMeshes()) {
    for (const prim of [...mesh.listPrimitives()]) {
      if (prim.getMaterial() !== mat) continue;
      const uv = prim.getAttribute("TEXCOORD_0");
      const groups = triangleGroups(prim, (_c, [i0, i1, i2]) => {
        const a = uv.getElement(i0, []), b = uv.getElement(i1, []), c = uv.getElement(i2, []);
        const [r, g, bb] = sample((a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3);
        return cfg.paintAtlas.isPaint(r, g, bb) ? "paint" : "trim";
      });
      if (!groups.has("paint")) continue;
      // Keep skinning attributes intact by re-using the primitive for one group.
      const paintPrim = subPrimitive(prim, groups.get("paint")).setMaterial(paint);
      mesh.addPrimitive(paintPrim);
      if (groups.has("trim")) mesh.addPrimitive(subPrimitive(prim, groups.get("trim")));
      mesh.removePrimitive(prim);
      moved += groups.get("paint").length / 3;
    }
  }
  console.log(`paint split: ${moved} triangles moved to Paint_Body`);
}

// ------------------------------------------------ remove trademark-like images
for (const matName of cfg.blankTextures ?? []) {
  const m = root.listMaterials().find((x) => x.getName() === matName);
  if (!m) continue;
  const screen = await sharp({ create: { width: 256, height: 128, channels: 3, background: "#0b0d10" } }).png().toBuffer();
  m.setBaseColorTexture(doc.createTexture("BlankScreen").setImage(new Uint8Array(screen)).setMimeType("image/png"));
  console.log(`blanked texture on ${matName}`);
}

// --------------------------------------------------------------- optimise
await doc.transform(
  prune(),
  dedup(),
  weld(),
  textureCompress({ encoder: sharp, targetFormat: "webp", resize: [1024, 1024], quality: 82 }),
  meshopt({ encoder: MeshoptEncoder, level: "medium" }),
  prune(),
);
await io.write(output, doc);

const wheels = root.listNodes().filter((n) => /^Wheel_/.test(n.getName())).map((n) => n.getName());
console.log(JSON.stringify({ name, lengthAxis: "XYZ"[lengthAxis], frontSign, rotationY: +rotationY.toFixed(4), wheels, materials: root.listMaterials().map((m) => m.getName()) }));
