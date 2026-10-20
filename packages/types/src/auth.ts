import { z } from "zod";
import { email, mlPhone } from "./primitives.js";

/** Minimum bar for customer passwords. Matches the test-drive sign-up hint. */
export const password = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(128, "Use 128 characters or fewer");

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password").max(128),
});
export type SignInInput = z.infer<typeof signInSchema>;

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(120),
  email,
  phone: z.union([mlPhone, z.literal("")]).optional(),
  password,
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const profileSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(120),
  phone: z.union([mlPhone, z.literal("")]).optional(),
});
export type ProfileInput = z.infer<typeof profileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: password,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/** Roles allowed into /admin. */
export const STAFF_ROLES = ["STAFF", "MANAGER", "ADMIN"] as const;
