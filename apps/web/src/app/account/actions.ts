"use server";

import { revalidatePath } from "next/cache";
import { compare, hash } from "bcryptjs";
import { prisma } from "@dealership/db";
import { changePasswordSchema, profileSchema } from "@dealership/types";
import { requireUser } from "@/server/session";

export interface AccountFormState {
  ok?: boolean;
  message?: string;
  fieldErrors?: Partial<Record<string, string>>;
}

function firstErrors(issues: { path: (string | number)[]; message: string }[]) {
  const out: Partial<Record<string, string>> = {};
  for (const i of issues) out[String(i.path[0] ?? "form")] ??= i.message;
  return out;
}

export async function updateProfileAction(
  _prev: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const user = await requireUser("/account/settings");
  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") ?? "",
  });
  if (!parsed.success) return { fieldErrors: firstErrors(parsed.error.issues) };

  await prisma.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name, phone: parsed.data.phone ? parsed.data.phone : null },
  });
  revalidatePath("/account", "layout");
  return { ok: true, message: "Your details have been saved." };
}

export async function changePasswordAction(
  _prev: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const user = await requireUser("/account/settings");
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { fieldErrors: firstErrors(parsed.error.issues) };

  const row = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  if (!row?.passwordHash || !(await compare(parsed.data.currentPassword, row.passwordHash))) {
    return { fieldErrors: { currentPassword: "That's not your current password." } };
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hash(parsed.data.newPassword, 12) },
  });
  return { ok: true, message: "Password updated." };
}

/** Customers can cancel their own upcoming bookings. */
export async function cancelTestDriveAction(formData: FormData): Promise<void> {
  const user = await requireUser("/account/test-drives");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const email = (user.email ?? "").toLowerCase();
  await prisma.testDrive.updateMany({
    where: {
      id,
      status: { in: ["REQUESTED", "CONFIRMED"] },
      scheduledAt: { gt: new Date() },
      OR: [{ userId: user.id }, ...(email ? [{ guestEmail: email }] : [])],
    },
    data: { status: "CANCELED" },
  });
  revalidatePath("/account", "layout");
}
