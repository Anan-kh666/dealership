import { z } from "zod";
import { cuid, email, mlPhone } from "./primitives.js";

/**
 * Trade-in valuation submission. The Prisma TradeIn model only persists a
 * subset of these fields directly (vehicle/condition/photos/contact); the
 * extras (service history, accident history, modifications, preferred
 * contact, best time to call, configurationId) are serialized into the
 * `notes` text column as JSON until a future schema change adds dedicated
 * columns. See BUILD_NOTES "Trade-in flow".
 */
export const TRADE_IN_CONDITIONS = ["EXCELLENT", "GOOD", "FAIR", "POOR"] as const;
export const TRADE_IN_CONTACT_METHODS = ["PHONE", "EMAIL", "WHATSAPP"] as const;
export const TRADE_IN_BEST_TIMES = [
  "MORNING",
  "AFTERNOON",
  "EVENING",
  "ANYTIME",
] as const;

const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/;

export const tradeInVin = z
  .string()
  .trim()
  .toUpperCase()
  .regex(VIN_REGEX, "VIN must be 17 characters, no I/O/Q");

export const tradeInVehicleSchema = z
  .object({
    vin: tradeInVin.optional(),
    make: z.string().trim().min(1, "Required").max(80),
    model: z.string().trim().min(1, "Required").max(80),
    year: z.number().int().min(2000).max(new Date().getFullYear()),
    trim: z.string().trim().max(80).optional(),
  })
  .strict();

export const tradeInConditionSchema = z
  .object({
    mileage: z.number().int().min(0).max(999_999),
    condition: z.enum(TRADE_IN_CONDITIONS),
    serviceHistory: z.boolean(),
    serviceLocation: z.string().trim().max(160).optional(),
    accidentHistory: z.boolean(),
    accidentNote: z.string().trim().max(300).optional(),
    modifications: z.boolean(),
    modificationsNote: z.string().trim().max(300).optional(),
  })
  .strict();

export const tradeInContactSchema = z
  .object({
    contactName: z.string().trim().min(1, "Required").max(120),
    contactEmail: email,
    contactPhone: mlPhone,
    preferredContactMethod: z.enum(TRADE_IN_CONTACT_METHODS),
    bestTimeToCall: z.enum(TRADE_IN_BEST_TIMES),
  })
  .strict();

export const tradeInFullSubmissionSchema = z
  .object({
    ...tradeInVehicleSchema.shape,
    ...tradeInConditionSchema.shape,
    ...tradeInContactSchema.shape,
    photos: z.array(z.string().url()).max(10),
    photosSkipped: z.boolean().default(false),
    consent: z.literal(true, {
      errorMap: () => ({ message: "Consent is required" }),
    }),
    configurationId: cuid.optional(),
  })
  .refine((v) => v.photosSkipped || v.photos.length >= 4, {
    message: "Upload at least 4 photos or skip if storage is unavailable",
    path: ["photos"],
  });
export type TradeInFullSubmission = z.infer<typeof tradeInFullSubmissionSchema>;

export const PRESIGN_PURPOSES = ["trade-in", "financing"] as const;
export const PRESIGN_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
] as const;
export const PRESIGN_MAX_BYTES = 10 * 1024 * 1024;

export const presignRequestSchema = z.object({
  purpose: z.enum(PRESIGN_PURPOSES),
  contentType: z.enum(PRESIGN_CONTENT_TYPES),
  fileSize: z.number().int().positive().max(PRESIGN_MAX_BYTES),
});
export type PresignRequest = z.infer<typeof presignRequestSchema>;

export const presignResponseSchema = z.object({
  uploadUrl: z.string().url(),
  publicUrl: z.string().url(),
  key: z.string(),
  expiresIn: z.number().int().positive(),
});
export type PresignResponse = z.infer<typeof presignResponseSchema>;

export const tradeInSubmitResponseSchema = z.object({
  id: cuid,
  reference: z.string(),
});

export const tradeInStatusResponseSchema = z.object({
  reference: z.string(),
  status: z.enum(["SUBMITTED", "REVIEWING", "QUOTED", "ACCEPTED", "REJECTED"]),
  submittedAt: z.string(),
  estimatedValue: z.string().nullable(),
});
