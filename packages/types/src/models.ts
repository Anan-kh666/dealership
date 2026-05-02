import { z } from "zod";
import {
  AppStatus,
  BodyType,
  ColorType,
  Drivetrain,
  FuelType,
  ImageType,
  InquiryStatus,
  OptionCategory,
  Role,
  StockStatus,
  TestDriveStatus,
  TradeInStatus,
  Transmission,
} from "./enums.js";
import { cuid, decimalString, email, isoDateTime, phone, url } from "./primitives.js";

export const ModelSchema = z.object({
  id: cuid,
  slug: z.string().min(1),
  make: z.string().min(1),
  name: z.string().min(1),
  year: z.number().int(),
  bodyType: BodyType,
  description: z.string(),
  startingPrice: decimalString,
  currency: z.string().default("MYR"),
  heroImage: url,
  brochureUrl: url.nullable().optional(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  displayOrder: z.number().int(),
  highlights: z.array(z.string()),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});
export type Model = z.infer<typeof ModelSchema>;

export const TrimSchema = z.object({
  id: cuid,
  modelId: cuid,
  name: z.string().min(1),
  price: decimalString,
  engineSize: z.number().nullable().optional(),
  horsepower: z.number().int().nullable().optional(),
  torque: z.number().int().nullable().optional(),
  transmission: Transmission,
  fuelType: FuelType,
  drivetrain: Drivetrain,
  fuelEconomy: z.number().nullable().optional(),
  zeroToHundred: z.number().nullable().optional(),
  topSpeed: z.number().int().nullable().optional(),
  seats: z.number().int(),
  doors: z.number().int(),
  cargoCapacity: z.number().int().nullable().optional(),
  features: z.array(z.string()),
  displayOrder: z.number().int(),
});
export type Trim = z.infer<typeof TrimSchema>;

export const OptionSchema = z.object({
  id: cuid,
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  category: OptionCategory,
  price: decimalString,
  image: url.nullable().optional(),
});
export type Option = z.infer<typeof OptionSchema>;

export const ColorSchema = z.object({
  id: cuid,
  name: z.string().min(1),
  hexCode: z.string().regex(/^#[0-9a-fA-F]{6}$/, "expected hex like #aabbcc"),
  type: ColorType,
  isMetallic: z.boolean(),
});
export type Color = z.infer<typeof ColorSchema>;

export const ModelImageSchema = z.object({
  id: cuid,
  modelId: cuid,
  url,
  altText: z.string().nullable().optional(),
  type: ImageType,
  order: z.number().int(),
});
export type ModelImage = z.infer<typeof ModelImageSchema>;

export const ConfigurationSchema = z.object({
  id: cuid,
  shareCode: z.string().min(1),
  trimId: cuid,
  exteriorColorId: cuid,
  interiorColorId: cuid,
  selectedOptions: z.array(cuid),
  totalPrice: decimalString,
  userId: cuid.nullable().optional(),
  guestEmail: email.nullable().optional(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});
export type Configuration = z.infer<typeof ConfigurationSchema>;

export const StockUnitSchema = z.object({
  id: cuid,
  vin: z.string().length(17),
  slug: z.string().min(1),
  trimId: cuid,
  exteriorColorId: cuid,
  interiorColorId: cuid,
  installedOptions: z.array(cuid),
  totalPrice: decimalString,
  status: StockStatus,
  arrivalDate: isoDateTime.nullable().optional(),
  expectedDelivery: isoDateTime.nullable().optional(),
  daysOnLot: z.number().int(),
  views: z.number().int(),
  reservedById: cuid.nullable().optional(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});
export type StockUnit = z.infer<typeof StockUnitSchema>;

export const UserSchema = z.object({
  id: cuid,
  email,
  phone: phone.nullable().optional(),
  name: z.string().min(1),
  role: Role,
  createdAt: isoDateTime,
});
export type User = z.infer<typeof UserSchema>;

export const TestDriveSchema = z.object({
  id: cuid,
  modelId: cuid.nullable().optional(),
  stockUnitId: cuid.nullable().optional(),
  userId: cuid.nullable().optional(),
  guestName: z.string().nullable().optional(),
  guestEmail: email.nullable().optional(),
  guestPhone: phone.nullable().optional(),
  scheduledAt: isoDateTime,
  status: TestDriveStatus,
  notes: z.string().nullable().optional(),
  createdAt: isoDateTime,
});
export type TestDrive = z.infer<typeof TestDriveSchema>;

export const FinanceApplicationSchema = z.object({
  id: cuid,
  configurationId: cuid.nullable().optional(),
  stockUnitId: cuid.nullable().optional(),
  userId: cuid.nullable().optional(),
  applicantName: z.string().min(1),
  email,
  phone,
  monthlyIncome: decimalString,
  employmentType: z.string().min(1),
  loanAmount: decimalString,
  termMonths: z.number().int(),
  downPayment: decimalString,
  status: AppStatus,
  notes: z.string().nullable().optional(),
  createdAt: isoDateTime,
});
export type FinanceApplication = z.infer<typeof FinanceApplicationSchema>;

export const TradeInSchema = z.object({
  id: cuid,
  userId: cuid.nullable().optional(),
  vin: z.string().nullable().optional(),
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int(),
  mileage: z.number().int().nonnegative(),
  condition: z.string().min(1),
  photos: z.array(url),
  estimatedValue: decimalString.nullable().optional(),
  status: TradeInStatus,
  notes: z.string().nullable().optional(),
  contactName: z.string().min(1),
  contactEmail: email,
  contactPhone: phone,
  createdAt: isoDateTime,
});
export type TradeIn = z.infer<typeof TradeInSchema>;

export const InquirySchema = z.object({
  id: cuid,
  modelId: cuid.nullable().optional(),
  stockUnitId: cuid.nullable().optional(),
  configurationId: cuid.nullable().optional(),
  name: z.string().min(1),
  email,
  phone: phone.nullable().optional(),
  message: z.string().min(1),
  source: z.string().nullable().optional(),
  status: InquiryStatus,
  createdAt: isoDateTime,
});
export type Inquiry = z.infer<typeof InquirySchema>;

export const BlogPostSchema = z.object({
  id: cuid,
  slug: z.string().min(1),
  title: z.string().min(1),
  excerpt: z.string(),
  content: z.string(),
  coverImage: url,
  authorName: z.string().min(1),
  publishedAt: isoDateTime.nullable().optional(),
  tags: z.array(z.string()),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});
export type BlogPost = z.infer<typeof BlogPostSchema>;
