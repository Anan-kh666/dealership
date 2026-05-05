import { z } from "zod";
import { cuid, email, mlPhone } from "./primitives.js";

/**
 * Malaysian car-loan financing application. Mirrors the multi-step flow at
 * /financing/apply: vehicle → loan terms → personal → employment → documents
 * → review → submit. Each step has its own schema so the form components can
 * validate field-by-field; the full submission schema is the union the API
 * route accepts.
 */

export const FINANCING_TENURE_YEARS = [5, 7, 9] as const;
export type FinancingTenureYears = (typeof FINANCING_TENURE_YEARS)[number];

/** Bounds shown on the calculator UI. */
export const FINANCING_RATE_MIN = 2.0;
export const FINANCING_RATE_MAX = 4.5;
export const FINANCING_RATE_STEP = 0.1;
export const FINANCING_RATE_DEFAULT = 2.5;

export const FINANCING_DOWN_MIN_PCT = 10;
export const FINANCING_DOWN_MAX_PCT = 50;
export const FINANCING_DOWN_STEP_PCT = 5;
export const FINANCING_DOWN_DEFAULT_PCT = 10;

export const FINANCING_TENURE_DEFAULT_YEARS: FinancingTenureYears = 9;

export const EMPLOYMENT_TYPES = [
  "PERMANENT",
  "CONTRACT",
  "SELF_EMPLOYED",
  "RETIRED",
  "OTHER",
] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const NATIONALITIES = ["MALAYSIAN", "PERMANENT_RESIDENT", "FOREIGNER"] as const;
export type Nationality = (typeof NATIONALITIES)[number];

export const MARITAL_STATUSES = ["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"] as const;
export type MaritalStatus = (typeof MARITAL_STATUSES)[number];

/** Malaysian states + federal territories. Stored as the dropdown value. */
export const MALAYSIAN_STATES = [
  "Johor",
  "Kedah",
  "Kelantan",
  "Melaka",
  "Negeri Sembilan",
  "Pahang",
  "Perak",
  "Perlis",
  "Pulau Pinang",
  "Sabah",
  "Sarawak",
  "Selangor",
  "Terengganu",
  "W.P. Kuala Lumpur",
  "W.P. Labuan",
  "W.P. Putrajaya",
] as const;
export type MalaysianState = (typeof MALAYSIAN_STATES)[number];

const IC_REGEX = /^\d{6}-?\d{2}-?\d{4}$/;
/** Malaysian IC: 12 digits, optional dashes (XXXXXX-XX-XXXX). Stored normalised without dashes. */
export const malaysianIc = z
  .string()
  .trim()
  .regex(IC_REGEX, "Enter a valid Malaysian IC (12 digits, e.g. 900101-14-5678)")
  .transform((v) => v.replace(/-/g, ""));

export const malaysianPostcode = z
  .string()
  .trim()
  .regex(/^\d{5}$/, "Postcode must be 5 digits");

export const financingDocumentSchema = z.object({
  url: z.string().url(),
  label: z.string().min(1).max(80),
});
export type FinancingDocument = z.infer<typeof financingDocumentSchema>;

export const financingVehicleSchema = z
  .object({
    /** Optional pre-selected stock unit. */
    stockUnitId: cuid.optional(),
    /** Optional configuration (Build & Price). */
    configurationId: cuid.optional(),
    /** Free-text label shown back to the user (e.g. "2025 Model X Premium"). */
    vehicleLabel: z.string().trim().max(160).optional(),
    /** Vehicle price in MYR. Required even when no stock unit is preselected. */
    vehiclePrice: z.number().positive().max(10_000_000),
  })
  .strict();

export const financingLoanSchema = z
  .object({
    downPaymentPercent: z
      .number()
      .min(FINANCING_DOWN_MIN_PCT)
      .max(FINANCING_DOWN_MAX_PCT),
    tenureYears: z.union([z.literal(5), z.literal(7), z.literal(9)]),
    interestRatePercent: z
      .number()
      .min(FINANCING_RATE_MIN)
      .max(FINANCING_RATE_MAX),
  })
  .strict();

export const financingPersonalSchema = z
  .object({
    fullName: z.string().trim().min(1, "Required").max(120),
    icNumber: malaysianIc,
    dateOfBirth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
    nationality: z.enum(NATIONALITIES),
    maritalStatus: z.enum(MARITAL_STATUSES),
    mobile: mlPhone,
    email,
    addressStreet: z.string().trim().min(1, "Required").max(200),
    addressCity: z.string().trim().min(1, "Required").max(80),
    addressState: z.enum(MALAYSIAN_STATES),
    addressPostcode: malaysianPostcode,
  })
  .strict();

export const financingEmploymentSchema = z
  .object({
    employmentType: z.enum(EMPLOYMENT_TYPES),
    employerName: z.string().trim().min(1, "Required").max(160),
    position: z.string().trim().min(1, "Required").max(120),
    monthlyGrossIncome: z.number().nonnegative().max(10_000_000),
    monthlyCommitments: z.number().nonnegative().max(10_000_000).optional(),
    yearsEmployed: z.number().nonnegative().max(70),
  })
  .strict();

export const financingDocumentsSchema = z
  .object({
    icFrontUrl: z.string().url().optional(),
    icBackUrl: z.string().url().optional(),
    payslipUrls: z.array(z.string().url()).max(3).default([]),
    bankStatementUrls: z.array(z.string().url()).max(3).default([]),
    documentsSkipped: z.boolean().default(false),
  })
  .strict();

export const financingApplicationSubmissionSchema = z
  .object({
    ...financingVehicleSchema.shape,
    ...financingLoanSchema.shape,
    ...financingPersonalSchema.shape,
    ...financingEmploymentSchema.shape,
    ...financingDocumentsSchema.shape,
    consent: z.literal(true, {
      errorMap: () => ({ message: "Consent is required to submit" }),
    }),
  })
  .strict();
export type FinancingApplicationSubmission = z.infer<
  typeof financingApplicationSubmissionSchema
>;

export const financingSubmitResponseSchema = z.object({
  id: cuid,
  reference: z.string(),
});
export type FinancingSubmitResponse = z.infer<typeof financingSubmitResponseSchema>;

/**
 * Rough monthly payment using the same flat-rate convention as Malaysian car
 * loans: total interest = principal × annualRate × years; monthly = (principal
 * + total interest) / (years × 12). This is what banks actually quote here,
 * not the reducing-balance formula in `monthlyPayment` from finance.ts —
 * which uses APR amortisation and is kept around for the legacy widget.
 */
export interface MalaysianLoanInput {
  vehiclePrice: number;
  downPaymentPercent: number;
  tenureYears: number;
  interestRatePercent: number;
}

export interface MalaysianLoanResult {
  principal: number;
  totalInterest: number;
  totalPayable: number;
  monthlyPayment: number;
  downPaymentAmount: number;
}

export function calculateMalaysianLoan({
  vehiclePrice,
  downPaymentPercent,
  tenureYears,
  interestRatePercent,
}: MalaysianLoanInput): MalaysianLoanResult {
  if (
    !Number.isFinite(vehiclePrice) ||
    vehiclePrice <= 0 ||
    !Number.isFinite(downPaymentPercent) ||
    !Number.isFinite(tenureYears) ||
    tenureYears <= 0 ||
    !Number.isFinite(interestRatePercent) ||
    interestRatePercent < 0
  ) {
    return {
      principal: 0,
      totalInterest: 0,
      totalPayable: 0,
      monthlyPayment: 0,
      downPaymentAmount: 0,
    };
  }
  const downPaymentAmount = vehiclePrice * (downPaymentPercent / 100);
  const principal = vehiclePrice - downPaymentAmount;
  const totalInterest = principal * (interestRatePercent / 100) * tenureYears;
  const totalPayable = principal + totalInterest;
  const monthlyPayment = totalPayable / (tenureYears * 12);
  return {
    principal,
    totalInterest,
    totalPayable,
    monthlyPayment,
    downPaymentAmount,
  };
}
