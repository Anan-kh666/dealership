// Prepares Khronos "Car Concept" (CC BY 4.0) for the configurator:
//  - removes Khronos logos (licence excludes them)
//  - gives the licence plate a neutral plate texture
//  - drops KHR_materials_variants + unused variant materials
//  - renames the paint/interior materials to the configurator convention
//  - meshopt-compresses geometry, keeps WebP textures
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, meshopt, prune, weld } from "@gltf-transform/functions";
import { MeshoptEncoder } from "meshoptimizer";
import sharp from "sharp";

const [, , input, output] = process.argv;

await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  "meshopt.encoder": MeshoptEncoder,
});
const doc = await io.read(input);
const root = doc.getRoot();

// 1. Logo texture → solid black (it is only ever used as an emissive / plate map).
const logo = root.listTextures().find((t) => (t.getURI() || "").includes("Khronos_C"));
if (!logo) throw new Error("Khronos_C texture not found");
const black = await sharp({ create: { width: 8, height: 8, channels: 3, background: "#000000" } })
  .webp({ lossless: true })
  .toBuffer();
logo.setImage(new Uint8Array(black)).setURI("Black.webp").setMimeType("image/webp");

// 2. Licence plate: its own neutral plate (Malaysian style: white on black).
const plateSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="128">
  <rect width="512" height="128" fill="#111"/>
  <rect x="6" y="6" width="500" height="116" rx="10" fill="none" stroke="#e8e8e8" stroke-width="5"/>
  <text x="256" y="86" font-family="Helvetica, Arial, sans-serif" font-size="64" font-weight="700"
        fill="#f2f2f2" text-anchor="middle" letter-spacing="10">DLR 2026</text></svg>`;
const plate = await sharp(Buffer.from(plateSvg)).webp({ quality: 90 }).toBuffer();
const plateTex = doc.createTexture("Plate").setImage(new Uint8Array(plate)).setMimeType("image/webp").setURI("Plate.webp");
const license = root.listMaterials().find((m) => m.getName() === "License");
if (license) license.setBaseColorTexture(plateTex);

// 3. Drop material variants — the configurator recolours paint itself.
const variants = doc.getRoot().listExtensionsUsed().find((e) => e.extensionName === "KHR_materials_variants");
variants?.dispose();

// 4. Configurator naming convention.
const RENAME = {
  "Paint 1 Carmine": "Paint_Body_Primary",
  "Paint 2 Carmine": "Paint_Body_Secondary",
  "Interior 3 Carmine": "Interior_Accent",
};
for (const m of root.listMaterials()) {
  const to = RENAME[m.getName()];
  if (to) m.setName(to);
}

await doc.transform(prune(), dedup(), weld(), meshopt({ encoder: MeshoptEncoder, level: "medium" }), prune());

await io.write(output, doc);
console.log(
  "materials:",
  root.listMaterials().map((m) => m.getName() || "(unnamed)").join(", "),
);
