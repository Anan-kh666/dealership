"use server";

import { AuthError } from "next-auth";
import { hash } from "bcryptjs";
import { Prisma, prisma } from "@dealership/db";
import { mlPhone, registerSchema, signInSchema } from "@dealership/types";
import { signIn, signOut } from "@/server/auth";
import { isStaffRole } from "@/server/auth.config";
import { safeCallbackUrl } from "@/server/session";

const isAdminPath = (p: string): boolean => p === "/admin" || p.startsWith("/admin/");

export interface AuthFormState {
  error?: string;
  fieldErrors?: Partial<Record<string, string>>;
  /** Echoed back so the form keeps what the user typed after an error. */
  values?: Record<string, string>;
}

function fieldErrorsFrom(err: { issues: { path: (string | number)[]; message: string }[] }): Partial<
  Record<string, string>
> {
  const out: Partial<Record<string, string>> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

export async function signInAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const values = {
    email: String(formData.get("email") ?? ""),
  };
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error), values };
  }

  // Choose the destination before signing in, so a customer who followed a
  // link to /admin lands on their account rather than bouncing off the
  // staff-only area.
  let target = safeCallbackUrl(formData.get("callbackUrl"));
  if (isAdminPath(target)) {
    const row = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { role: true },
    });
    if (!isStaffRole(row?.role)) target = "/account";
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: target,
    });
    return {};
  } catch (err) {
    // A successful sign-in throws Next's redirect sentinel — let it through.
    if (err instanceof AuthError) {
      return {
        error:
          err.type === "CredentialsSignin"
            ? "That email and password don't match an account."
            : "We couldn't sign you in right now. Please try again.",
        values,
      };
    }
    throw err;
  }
}

export async function registerAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const values = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
  };
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? "",
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error), values };
  }
  if (formData.get("terms") !== "on") {
    return { fieldErrors: { terms: "Please accept the terms to continue." }, values };
  }

  const created = await createCustomerAccount(parsed.data);
  if (!created.ok) {
    return {
      fieldErrors: { email: "An account with this email already exists. Try signing in." },
      values,
    };
  }

  try {
    // New accounts are always customers — never send them to /admin.
    const target = safeCallbackUrl(formData.get("callbackUrl"));
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: isAdminPath(target) ? "/account" : target,
    });
    return {};
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Your account was created, but we couldn't sign you in. Please sign in." };
    }
    throw err;
  }
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}

/**
 * Shared by `/register` and the opt-in checkbox at the end of the test-drive
 * flow. Returns `ok: false` when the email is already registered rather than
 * throwing, so callers can phrase the message for their context.
 */
async function createCustomerAccount(input: {
  name: string;
  email: string;
  phone?: string | undefined;
  password: string;
}): Promise<{ ok: true } | { ok: false; reason: "exists" }> {
  try {
    await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone ? input.phone : null,
        passwordHash: await hash(input.password, 12),
        role: "CUSTOMER",
      },
    });
    return { ok: true };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, reason: "exists" };
    }
    throw err;
  }
}

export interface BookingAccountResult {
  status: "created" | "exists" | "invalid";
}

/**
 * Called after a successful test-drive booking when the customer ticked
 * "Create an account". Creates the account and signs them in without a
 * redirect, so the success screen can stay in place.
 */
export async function createAccountFromBookingAction(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
}): Promise<BookingAccountResult> {
  // Bookings accept landlines; accounts only store mobiles. Drop a phone
  // that isn't a valid mobile rather than refusing the account.
  const phone = mlPhone.safeParse(input.phone).success ? input.phone : "";
  const parsed = registerSchema.safeParse({ ...input, phone });
  if (!parsed.success) return { status: "invalid" };

  const created = await createCustomerAccount(parsed.data);
  if (!created.ok) return { status: "exists" };

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch {
    // Account exists either way; the customer can sign in manually.
  }
  return { status: "created" };
}
