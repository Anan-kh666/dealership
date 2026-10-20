import { z } from "zod";
import {
  BodyType,
  Drivetrain,
  FuelType,
  ImageType,
  OptionCategory,
  StockStatus,
  Transmission,
  carAssetCreditSchema,
  carInteriorSchema,
  carRigSchema,
  materialPatternsSchema,
} from "@dealership/types";

/*
 * The shape of `models/<slug>/vehicle.json`. A JSON Schema generated from
 * this (models/_schema/vehicle.schema.json) gives editors autocomplete.
 *
 * Objects are `.strict()` so a typo ("horsePower") is reported instead of
 * silently ignored.
 */

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const money = z.number().nonnegative().describe("Ringgit, e.g. 96800");
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit hex colour like #1F2C3A");
const optionalNumber = z.number().positive().nullable().default(null);
const optionalInt = z.number().int().positive().nullable().default(null);

export const optionDefinitionSchema = z
  .object({
    name: z.string().min(1),
    description: z.string().default(""),
    category: OptionCategory,
    price: money,
  })
  .strict();
export type OptionDefinition = z.infer<typeof optionDefinitionSchema>;

/** `models/_shared/options.json` — options any vehicle's trims can reference by name. */
export const optionCatalogSchema = z
  .object({
    $schema: z.string().optional(),
    options: z.array(optionDefinitionSchema),
  })
  .strict();

const imageSchema = z
  .object({
    src: z
      .string()
      .min(1)
      .describe("A https:// URL, or a file path inside this vehicle's folder (e.g. images/front.jpg)"),
    alt: z.string().min(1),
    type: ImageType.default("EXTERIOR"),
  })
  .strict();

const trimSchema = z
  .object({
    name: z.string().min(1),
    price: money,
    engineSize: optionalNumber.describe("Litres; null for EVs"),
    horsepower: optionalInt,
    torque: optionalInt.describe("Nm"),
    transmission: Transmission,
    fuelType: FuelType,
    drivetrain: Drivetrain,
    fuelEconomy: optionalNumber.describe("km/L, or kWh/100km for EVs"),
    zeroToHundred: optionalNumber.describe("Seconds"),
    topSpeed: optionalInt.describe("km/h"),
    seats: z.number().int().min(1).max(15),
    doors: z.number().int().min(1).max(6),
    cargoCapacity: optionalInt.describe("Litres"),
    features: z.array(z.string().min(1)).default([]),
    options: z
      .array(
        z
          .object({
            name: z.string().min(1).describe("An option from _shared/options.json or this file's `options`"),
            standard: z.boolean().default(false),
          })
          .strict(),
      )
      .default([]),
  })
  .strict();

const exteriorColorSchema = z
  .object({
    name: z.string().min(1),
    hex,
    metallic: z.boolean().default(false),
    upcharge: money.default(0),
  })
  .strict();

const interiorColorSchema = z
  .object({
    name: z.string().min(1),
    hex,
    upcharge: money.default(0),
  })
  .strict();

const stockSchema = z
  .object({
    vin: z.string().length(17, "A VIN is 17 characters"),
    trim: z.string().min(1),
    exteriorColor: z.string().min(1),
    interiorColor: z.string().min(1),
    options: z.array(z.string().min(1)).default([]),
    status: StockStatus.default("AVAILABLE"),
    arrivedDaysAgo: z.number().int().nonnegative().optional(),
    expectedInDays: z.number().int().nonnegative().optional(),
  })
  .strict();

/** Blender axis the car's nose points along (Blender's default "front" is -Y). */
export const BlenderAxis = z.enum(["-Y", "+Y", "-X", "+X"]);
export type BlenderAxis = z.infer<typeof BlenderAxis>;

export const model3dSchema = z
  .object({
    file: z
      .string()
      .optional()
      .describe("3D file in this folder (.glb or .gltf). Default: the only .glb/.gltf here"),
    forward: BlenderAxis.optional().describe(
      "Blender axis the nose points along. Default: detected from headlight/taillight materials, else -Y",
    ),
    rotationY: z.number().optional().describe("Advanced: exact rotation (radians) instead of `forward`"),
    length: z.number().positive().optional().describe("Display length in scene units (~0.85 × metres)"),
    optimize: z
      .boolean()
      .default(true)
      .describe("Compress geometry and textures. Turn off for files that are already optimised"),
    textureSize: z.number().int().min(256).max(4096).default(1024),
    materials: materialPatternsSchema.partial().optional(),
    rig: carRigSchema.optional(),
    interior: carInteriorSchema.optional(),
    credit: carAssetCreditSchema.optional(),
  })
  .strict();
export type Model3d = z.infer<typeof model3dSchema>;

export const vehicleSchema = z
  .object({
    $schema: z.string().optional(),
    published: z
      .boolean()
      .default(true)
      .describe("false keeps it off the public site (it can still be previewed at /models/<slug>/build)"),
    make: z.string().min(1),
    name: z.string().min(1),
    year: z.number().int().min(1990).max(2100),
    bodyType: BodyType,
    description: z.string().min(1),
    featured: z.boolean().default(false),
    displayOrder: z.number().int().default(100),
    highlights: z.array(z.string().min(1)).default([]),
    seo: z
      .object({ title: z.string().min(1).optional(), description: z.string().min(1).optional() })
      .strict()
      .default({}),
    heroImage: z.string().min(1).optional().describe("Default: the first image"),
    images: z.array(imageSchema).default([]),
    colors: z
      .object({
        exterior: z.array(exteriorColorSchema).min(1),
        interior: z.array(interiorColorSchema).min(1),
      })
      .strict(),
    options: z
      .array(optionDefinitionSchema)
      .default([])
      .describe("Options only this vehicle offers (shared ones live in _shared/options.json)"),
    trims: z.array(trimSchema).min(1),
    stock: z
      .array(stockSchema)
      .default([])
      .describe("Demo inventory. Created once; later changes are made in the admin"),
    model3d: model3dSchema.default({}),
  })
  .strict()
  .superRefine((v, ctx) => {
    const dupes = (names: string[], where: (string | number)[]): void => {
      const seen = new Set<string>();
      names.forEach((n, i) => {
        if (seen.has(n)) ctx.addIssue({ code: "custom", path: [...where, i], message: `Duplicate name "${n}"` });
        seen.add(n);
      });
    };
    dupes(v.trims.map((t) => t.name), ["trims"]);
    dupes(v.colors.exterior.map((c) => c.name), ["colors", "exterior"]);
    dupes(v.colors.interior.map((c) => c.name), ["colors", "interior"]);
    dupes(v.stock.map((s) => s.vin), ["stock"]);

    const trims = new Set(v.trims.map((t) => t.name));
    const ext = new Set(v.colors.exterior.map((c) => c.name));
    const int = new Set(v.colors.interior.map((c) => c.name));
    v.stock.forEach((s, i) => {
      if (!trims.has(s.trim)) ctx.addIssue({ code: "custom", path: ["stock", i, "trim"], message: `No trim named "${s.trim}"` });
      if (!ext.has(s.exteriorColor))
        ctx.addIssue({ code: "custom", path: ["stock", i, "exteriorColor"], message: `No exterior colour named "${s.exteriorColor}"` });
      if (!int.has(s.interiorColor))
        ctx.addIssue({ code: "custom", path: ["stock", i, "interiorColor"], message: `No interior colour named "${s.interiorColor}"` });
    });
  });

export type Vehicle = z.infer<typeof vehicleSchema>;
export type VehicleInput = z.input<typeof vehicleSchema>;

/** Readable one-line-per-problem summary of a Zod error. */
export function formatIssues(error: z.ZodError): string[] {
  return error.issues.map((i) => `${i.path.length ? i.path.join(".") : "(root)"}: ${i.message}`);
}
