import { z } from "zod";

/*
 * 3D settings for one vehicle in the configurator.
 *
 * Written by `@dealership/vehicles` (from each `models/<slug>/vehicle.json`)
 * to `apps/web/public/vehicles/<slug>/scene.json`, and read back by the web
 * app. The same shapes are used for the `model3d` section of vehicle.json.
 */

const vec3 = z.tuple([z.number(), z.number(), z.number()]);

/**
 * Names of animatable nodes inside the .glb. Wheel and door nodes need their
 * pivot at the axle / hinge — the vehicles sync re-pivots wheels for you.
 */
export const carRigSchema = z
  .object({
    /** Wheel nodes, spun around the car's lateral axis as it rolls. */
    wheels: z.array(z.string().min(1)).optional(),
    /** Axle direction in the wheels' parent space. Normally omitted (derived). */
    wheelAxis: vec3.optional(),
    /** Child-node name pattern for brake calipers, kept static while wheels spin. */
    calipers: z.string().optional(),
    /** Doors opened on the interior step: hinge axis in parent space + max angle (radians). */
    doors: z
      .array(z.object({ node: z.string().min(1), axis: vec3, angle: z.number() }).strict())
      .optional(),
    /** Material-name patterns (regex) for lights that switch on after the drive-in. */
    headlights: z.string().optional(),
    taillights: z.string().optional(),
  })
  .strict();
export type CarRig = z.infer<typeof carRigSchema>;

export const materialPatternsSchema = z
  .object({
    paint: z.string(),
    interior: z.string(),
    rim: z.string(),
    /** Cabin glazing — replaced with clear, reflective glass. */
    glass: z.string(),
  })
  .strict();
export type MaterialPatterns = z.infer<typeof materialPatternsSchema>;

export const carAssetCreditSchema = z
  .object({
    title: z.string().min(1),
    author: z.string().min(1),
    license: z.string().min(1),
    licenseUrl: z.string().url(),
    sourceUrl: z.string().url(),
    /** CC BY requires saying whether the work was changed. */
    modified: z.boolean(),
  })
  .strict();
export type CarAssetCredit = z.infer<typeof carAssetCreditSchema>;

export const carInteriorSchema = z
  .object({
    rows: z.union([z.literal(1), z.literal(2)]),
    /** Overrides for the cabin box derived from the glass (car-normalised units, nose → +X). */
    cabin: z
      .object({
        x0: z.number(),
        x1: z.number(),
        width: z.number(),
        belt: z.number(),
        roof: z.number(),
      })
      .partial()
      .strict()
      .optional(),
    /** Material-name pattern for original interior meshes to hide. */
    hide: z.string().optional(),
    /** Hide every original mesh that sits entirely inside the cabin volume. */
    replace: z.boolean().optional(),
  })
  .strict();
export type CarInterior = z.infer<typeof carInteriorSchema>;

export const carAssetSchema = z
  .object({
    /** Public URL of the .glb. */
    url: z.string().min(1),
    /** Rotation (radians, around Y) that points the car's nose along +X. */
    rotationY: z.number(),
    /** Length (scene units) the model is scaled to. Default 3.8. */
    length: z.number().positive().optional(),
    /** Material-name patterns (case-insensitive) overriding the defaults. */
    materials: materialPatternsSchema.partial().optional(),
    /** Optional animation rig. Without it the car still drives in and recolours. */
    rig: carRigSchema.optional(),
    /** Fit the generated cabin inside the glass (for models with no / crude interiors). */
    interior: carInteriorSchema.optional(),
    credit: carAssetCreditSchema.optional(),
  })
  .strict();
export type CarAsset = z.infer<typeof carAssetSchema>;
