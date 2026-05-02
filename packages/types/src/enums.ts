import { z } from "zod";

export const BodyType = z.enum([
  "SEDAN",
  "SUV",
  "HATCHBACK",
  "COUPE",
  "CONVERTIBLE",
  "TRUCK",
  "VAN",
  "WAGON",
]);
export type BodyType = z.infer<typeof BodyType>;

export const Transmission = z.enum(["AUTOMATIC", "MANUAL", "CVT", "DCT"]);
export type Transmission = z.infer<typeof Transmission>;

export const FuelType = z.enum(["PETROL", "DIESEL", "HYBRID", "PLUGIN_HYBRID", "ELECTRIC"]);
export type FuelType = z.infer<typeof FuelType>;

export const Drivetrain = z.enum(["FWD", "RWD", "AWD", "FOUR_WD"]);
export type Drivetrain = z.infer<typeof Drivetrain>;

export const OptionCategory = z.enum([
  "SAFETY",
  "COMFORT",
  "TECH",
  "PERFORMANCE",
  "EXTERIOR",
  "INTERIOR",
]);
export type OptionCategory = z.infer<typeof OptionCategory>;

export const ColorType = z.enum(["EXTERIOR", "INTERIOR"]);
export type ColorType = z.infer<typeof ColorType>;

export const ImageType = z.enum(["EXTERIOR", "INTERIOR", "DETAIL", "LIFESTYLE"]);
export type ImageType = z.infer<typeof ImageType>;

export const StockStatus = z.enum(["AVAILABLE", "RESERVED", "SOLD", "IN_TRANSIT"]);
export type StockStatus = z.infer<typeof StockStatus>;

export const Role = z.enum(["CUSTOMER", "STAFF", "MANAGER", "ADMIN"]);
export type Role = z.infer<typeof Role>;

export const TestDriveStatus = z.enum([
  "REQUESTED",
  "CONFIRMED",
  "COMPLETED",
  "CANCELED",
  "NO_SHOW",
]);
export type TestDriveStatus = z.infer<typeof TestDriveStatus>;

export const AppStatus = z.enum([
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "WITHDRAWN",
]);
export type AppStatus = z.infer<typeof AppStatus>;

export const TradeInStatus = z.enum([
  "SUBMITTED",
  "REVIEWING",
  "QUOTED",
  "ACCEPTED",
  "REJECTED",
]);
export type TradeInStatus = z.infer<typeof TradeInStatus>;

export const InquiryStatus = z.enum(["NEW", "CONTACTED", "IN_PROGRESS", "CLOSED"]);
export type InquiryStatus = z.infer<typeof InquiryStatus>;
