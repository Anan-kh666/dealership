# Vehicles

Every vehicle on the site is a folder in here. The folder holds everything
about that car: its details, prices, trims, colours, gallery, demo stock and
its 3D model.

```
models/
  aurora-suv/            ← folder name = web address (/models/aurora-suv)
    vehicle.json         ← everything about the car
    model.glb            ← the 3D model (exported from Blender)
    aurora-suv.blend     ← optional: your Blender source file
    images/…             ← optional: local photos used in vehicle.json
  _shared/options.json   ← options any car can offer (sunroof, HUD, …)
  _blender/              ← Blender export script
  _schema/               ← generated: autocomplete for vehicle.json
```

Folders starting with `_` aren't vehicles.

## Adding a vehicle

**The quick way:** make a new folder (lowercase, dashes: `nova-gt`) and put a
`.glb` exported from Blender in it. The site creates a starter
`vehicle.json` and adds the car as an **unpublished draft**: hidden from
customers, but you can already see it in 3D at `/models/nova-gt/build`. Fill
in the details, set `"published": true`, and it goes live.

**The full way:** copy an existing folder, rename it, and edit
`vehicle.json`. Your editor autocompletes and checks the fields.

When does the site pick it up?

- **While `pnpm dev` is running:** about a second after you save. No restart.
- **Otherwise:** run `pnpm vehicles:sync`.
- **In production:** run `pnpm vehicles:sync` as a release step, next to
  `pnpm db:migrate:deploy`. The build publishes the 3D files automatically.

Mistakes are reported in the terminal, with the field name. While a vehicle
has an error, the site keeps showing its last good version. Run
`pnpm vehicles:check` to validate everything without changing anything.

**Removing a vehicle:** delete its folder. It's hidden from the site rather
than deleted, because test drives, enquiries and stock still point at it.

## vehicle.json, briefly

| Field | What it is |
| --- | --- |
| `published` | `false` hides the car from customers. |
| `make`, `name`, `year`, `bodyType`, `description` | The basics. `bodyType` is one of `SEDAN SUV HATCHBACK COUPE CONVERTIBLE TRUCK VAN WAGON`. |
| `featured`, `displayOrder` | Homepage line-up and sort order. |
| `highlights`, `seo` | Bullet points on the model page, and the search-engine title and description. |
| `heroImage`, `images[]` | `src` is a `https://` URL or a file in this folder (`images/front.jpg`). The hero defaults to the first image. |
| `colors.exterior[]`, `colors.interior[]` | Name, `hex`, `metallic`, `upcharge` (RM). |
| `trims[]` | Price and specs per trim. `options` lists options by name, `standard: true` meaning included. The starting price is the cheapest trim. |
| `options[]` | Options only this car offers. Shared ones go in `_shared/options.json`. |
| `stock[]` | Demo inventory by VIN. Created once; after that staff manage it in the admin. `pnpm db:seed` resets it. |
| `model3d` | 3D settings (below). Everything is optional. |

## 3D models from Blender

### Exporting

**Easiest:** save your `.blend` inside the vehicle folder, open
`_blender/export_to_site.py` in Blender's Scripting tab and press Run. It
exports `model.glb` next to the `.blend` and tells you about anything worth
renaming.

**By hand:** File → Export → glTF 2.0, then:

- **Format:** glTF Binary (`.glb`). glTF Separate (`.gltf` + `.bin` + textures) also works.
- **Include:** Visible Objects, or Selected Objects.
- **Transform:** +Y Up ✓ (the default).
- **Data → Mesh:** Apply Modifiers ✓.
- **Compression:** either way. Draco is decoded automatically.

Save it into the vehicle folder. Re-exporting over the same file updates
the site.

The site then optimises the model: textures become WebP (max 1024 px; set
`model3d.textureSize` for more), geometry is Meshopt-compressed, and Draco
is decoded, because browsers would need an extra decoder for it. Keep the
`.glb` under about 10 MB after optimisation so phones cope.

### Naming things in Blender

The configurator finds parts by **name**:

| What | Name it | What it enables |
| --- | --- | --- |
| Body paint material | `Paint` (or anything with *paint*, or starting *body*) | Colour picker recolours the car |
| Window material | `Glass` / `Window` / `Windscreen` | Clear, reflective glass you can see the cabin through |
| Seat / upholstery material | contains `seat`, `leather` or `upholstery` | Interior colour picker |
| Wheel rim material | contains `rim` | Darker sport wheels on the top trim |
| Headlight material | `Headlight` | Front detection; lights switch on |
| Tail/brake light material | `Taillight` / `Brakelight` | Rear detection; brake-light flash |
| The four wheel objects | `Wheel_FL` `Wheel_FR` `Wheel_RL` `Wheel_RR` (anything with *wheel*) | Wheels spin as the car drives in |

Blender's `.001` suffixes are fine. A steering wheel isn't mistaken for a
road wheel. Wheel origins don't need to be at the hub, because the site
re-centres them. A "Wheels" parent holding all four is fine too.

### Which way is the front?

Model the car the usual Blender way, with the nose towards **−Y** (it faces
you in Front view, numpad 1). If headlight or taillight materials are named
as above, the front is detected automatically whichever way it points.
Otherwise set it yourself:

```json
"model3d": { "forward": "+X" }
```

`forward` is the Blender axis the nose points along: `-Y`, `+Y`, `-X` or `+X`.

### All model3d settings

| Setting | Default | Meaning |
| --- | --- | --- |
| `file` | the only `.glb`/`.gltf` in the folder | Which 3D file to use |
| `forward` | detected, else `-Y` | Blender axis the nose points along |
| `rotationY` | — | Exact rotation in radians (advanced; overrides `forward`) |
| `length` | 3.8 | Display length, about 0.85 × the real length in metres. Keeps the line-up in proportion |
| `optimize` | `true` | `false` publishes the file untouched, for already-optimised files |
| `textureSize` | 1024 | Maximum texture size in pixels |
| `materials` | naming above | Regex overrides, e.g. `{ "paint": "^CarBody$" }` |
| `rig` | detected | `wheels`, `headlights`, `taillights`, `calipers` (static while wheels spin), `doors` (open on the interior step: node, hinge `axis`, `angle`) |
| `interior` | — | `{ "rows": 2, "replace": true }` fits a generated cabin when the model's own is crude or missing |
| `credit` | — | Required for CC BY models: title, author, license, licenseUrl, sourceUrl, modified. Shown under the 3D view |

Without a 3D file, the configurator shows a stylised placeholder car.

### Licences

Only use models you made or that allow commercial use, and remove any real
brand logos. The current files:

| Folder | Source | Licence |
| --- | --- | --- |
| `meridian-1-5` | ["Generic Sedan Car"](https://sketchfab.com/3d-models/generic-sedan-car-d43114aa25b144f0a11c564d74aaac1b) by assetfactory | Sketchfab Standard |
| `aurora-suv` | ["Concept car"](https://sketchfab.com/3d-models/concept-car-a4a27b16a57240fa818da3c6750d9cca) by LagzDesign | CC BY 4.0 |
| `halcyon-cx` | ["SHC MC Free Promotion Car"](https://sketchfab.com/3d-models/shc-mc-free-promotion-car-cfaabdec76a74b68a48ba5657b6d9aee) by denniswoo1993 | CC BY 4.0 |
| `continental-gt-2026` | ["Generic Sport Coupé Car"](https://sketchfab.com/3d-models/generic-sport-coupe-car-820a13c4831c41959ce75e6c2014e882) by MMC Works | CC BY 4.0 |
| `lumen-ev` | "Car Concept" by Eric Chadwick, © 2024 Darmstadt Graphics Group, [Khronos glTF Sample Assets](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept) | CC BY 4.0 |

These five were prepared with `tools/models/` before this folder existed.
They're already optimised (`"optimize": false`) and keep their exact
rotations and rigs.

## Under the hood

`packages/vehicles` (`@dealership/vehicles`) does the work:

1. Reads each folder and validates `vehicle.json` (`src/schema.ts`).
2. Processes the 3D file (`src/scene.ts`) and publishes it, with local
   images, to `apps/web/public/vehicles/<slug>/`. That folder is generated
   and git-ignored. Unchanged files are cached.
3. Writes the catalogue to Postgres (`src/database.ts`), matching by slug,
   trim name, option name, colour name and VIN, so saved builds and leads
   stay linked.

| Command | Does |
| --- | --- |
| `pnpm dev` | Includes the watcher (`@dealership/vehicles dev`) |
| `pnpm vehicles:sync` | Everything, once |
| `pnpm vehicles:check` | Validate only (also runs in CI) |
| `pnpm db:seed` | Journal + accounts, then vehicles, resetting demo stock |
| `pnpm --filter @dealership/vehicles build` | 3D files and images only, no database (runs before the web build) |
