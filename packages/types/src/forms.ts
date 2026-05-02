import { z } from "zod";
import {
  BodyType,
  Drivetrain,
  FuelType,
  StockStatus,
  Transmission,
} from "./enums.js";
import { cuid, decimalString, email, phone } from "./primitives.js";

/**
 * Filters for the inventory and model browsing pages. All fields are optional;
 * an empty object means "no filter applied". Numeric ranges accept decimal
 * strings to round-trip cleanly with Postgres `Decimal` columns.
 */
export const vehicleFiltersSchema = z.object({
  make: z.string().optional(),
  bodyType: BodyType.optional(),
  fuelType: FuelType.optional(),
  transmission: Transmission.optional(),
  drivetrain: Drivetrain.optional(),
  status: StockStatus.optional(),
  minPrice: decimalString.optional(),
  maxPrice: decimalString.optional(),
  yearFrom: z.number().int().optional(),
  yearTo: z.number().int().optional(),
  search: z.string().trim().min(1).optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
});
export type VehicleFilters = z.infer<typeof vehicleFiltersSchema>;

export const testDriveBookingSchema = z.object({
  modelId: cuid.optional(),
  stockUnitId: cuid.optional(),
  guestName: z.string().min(1).max(120),
  guestEmail: email,
  guestPhone: phone,
  drivingLicense: z.string().trim().min(6).max(40),
  scheduledAt: z.coerce.date(),
  notes: z.string().max(500).optional(),
});
export type TestDriveBooking = z.infer<typeof testDriveBookingSchema>;

export const financeApplicationSchema = z.object({
  configurationId: cuid.optional(),
  stockUnitId: cuid.optional(),
  applicantName: z.string().min(1).max(120),
  email,
  phone,
  monthlyIncome: decimalString,
  employmentType: z.string().min(1).max(80),
  loanAmount: decimalString,
  termMonths: z.number().int().min(12).max(108),
  downPayment: decimalString,
  notes: z.string().max(1000).optional(),
});
export type FinanceApplicationInput = z.infer<typeof financeApplicationSchema>;

export const tradeInSubmissionSchema = z.object({
  vin: z.string().length(17).optional(),
  make: z.string().min(1).max(80),
  model: z.string().min(1).max(80),
  year: z.number().int().min(1980).max(new Date().getFullYear() + 1),
  mileage: z.number().int().nonnegative(),
  condition: z.string().min(1).max(80),
  photos: z.array(z.string().url()).max(20).default([]),
  contactName: z.string().min(1).max(120),
  contactEmail: email,
  contactPhone: phone,
});
export type TradeInSubmission = z.infer<typeof tradeInSubmissionSchema>;

export const inquirySchema = z.object({
  modelId: cuid.optional(),
  stockUnitId: cuid.optional(),
  configurationId: cuid.optional(),
  name: z.string().min(1).max(120),
  email,
  phone: phone.optional(),
  message: z.string().min(1).max(2000),
  source: z.string().max(80).optional(),
});
export type InquiryInput = z.infer<typeof inquirySchema>;
