import { z } from "zod";
import { email, mlPhone } from "./primitives.js";

/**
 * Customer-auth schemas. Keep the password rules deliberately mild
 * (8 chars, ≥1 letter, ≥1 number) — anything more aggressive without a
 * password manager nudge tends to push users to weaker workarounds.
 */

const PASSWORD_MIN = 8;
const HAS_LETTER = /[A-Za-z]/;
const HAS_NUMBER = /\d/;

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN, `At least ${PASSWORD_MIN} characters`)
  .max(128, "Too long")
  .refine((v) => HAS_LETTER.test(v), "Must contain a letter")
  .refine((v) => HAS_NUMBER.test(v), "Must contain a number");

export const signUpSchema = z.object({
  email,
  password: passwordSchema,
  name: z.string().trim().min(1).max(120).optional(),
});
export type SignUpInput = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password"),
  callbackUrl: z.string().optional(),
});
export type SignInInput = z.infer<typeof signInSchema>;

export const forgotPasswordSchema = z.object({ email });
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const verifyEmailSchema = z.object({ token: z.string().min(1) });
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const resendVerificationSchema = z.object({ email });
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;

/** Malaysian IC: 12 digits with the canonical XXXXXX-XX-XXXX shape. */
const IC_RE = /^\d{6}-\d{2}-\d{4}$/;
export const malaysianIcStrict = z
  .string()
  .trim()
  .regex(IC_RE, "Format: 900101-14-5678");

export { mlPhone };
