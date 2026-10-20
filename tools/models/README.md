# Model processing scripts

One-off scripts that turned the original third-party 3D assets into the
`model.glb` files now in `models/<slug>/`. New models — e.g. Blender
exports — don't need these: drop them into `models/<slug>/` and the vehicles
sync optimises them (see `models/README.md`). They aren't part of the app build, so their
dependencies aren't in the workspace — install them in a scratch folder:

```bash
mkdir /tmp/model-tools && cd /tmp/model-tools
npm i @gltf-transform/core@4 @gltf-transform/extensions@4 @gltf-transform/functions@4 meshoptimizer@0.22 sharp@0.34
cp <repo>/tools/models/process-carconcept.mjs .
node process-carconcept.mjs path/to/CarConcept.gltf <repo>/models/lumen-ev/model.glb
```

`process-carconcept.mjs` expects the **glTF-WEBP** variant of the Khronos
"Car Concept" sample (the GLB variant needs KTX2/Basis decoding). For a new
model, the usual recipe is the same: strip any logos, rename paint/interior/rim
materials to the convention in `models/README.md`, then
`prune → dedup → weld → meshopt`.

`process-sketchfab.mjs <sedan|concept|estate|coupe> in.glb out.glb` prepares
the four Sketchfab models (originals: see `models/README.md`).
It prints the detected front direction (`rotationY`) for `model3d.rotationY` —
check it visually: rigged models report lamp positions in bone space, which
is why the coupe's value was flipped by hand.
