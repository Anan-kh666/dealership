"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma, prisma } from "@dealership/db";
import {
  AppStatus,
  InquiryStatus,
  StockStatus,
  TestDriveStatus,
  TradeInStatus,
} from "@dealership/types";
import { requireStaff } from "@/server/session";

/**
 * Staff mutations. Every action re-checks the role (middleware is only the
 * first gate) and validates its input — never trust the posted form.
 */

const id = z.string().min(1).max(64);

function refresh(...paths: string[]): void {
  revalidatePath("/admin", "layout");
  for (const p of paths) revalidatePath(p);
}

export async function setTestDriveStatus(formData: FormData): Promise<void> {
  await requireStaff();
  const parsed = z
    .object({ id, status: TestDriveStatus })
    .safeParse({ id: formData.get("id"), status: formData.get("status") });
  if (!parsed.success) return;
  await prisma.testDrive.update({
    where: { id: parsed.data.id },
    data: { status: parsed.data.status },
  });
  refresh("/account/test-drives");
}

export async function setApplicationStatus(formData: FormData): Promise<void> {
  await requireStaff();
  const parsed = z
    .object({ id, status: AppStatus })
    .safeParse({ id: formData.get("id"), status: formData.get("status") });
  if (!parsed.success) return;
  await prisma.financeApplication.update({
    where: { id: parsed.data.id },
    data: { status: parsed.data.status },
  });
  refresh(`/admin/financing/${parsed.data.id}`);
}

export async function setInquiryStatus(formData: FormData): Promise<void> {
  await requireStaff();
  const parsed = z
    .object({ id, status: InquiryStatus })
    .safeParse({ id: formData.get("id"), status: formData.get("status") });
  if (!parsed.success) return;
  await prisma.inquiry.update({
    where: { id: parsed.data.id },
    data: { status: parsed.data.status },
  });
  refresh();
}

export async function setStockStatus(formData: FormData): Promise<void> {
  await requireStaff();
  const parsed = z
    .object({ id, status: StockStatus })
    .safeParse({ id: formData.get("id"), status: formData.get("status") });
  if (!parsed.success) return;
  await prisma.stockUnit.update({
    where: { id: parsed.data.id },
    data: { status: parsed.data.status },
  });
  // Public stock pages read this directly.
  revalidatePath("/stock", "layout");
  revalidatePath("/", "page");
  refresh();
}

export interface TradeInFormState {
  ok?: boolean;
  error?: string;
}

/** Status + optional quote in one go — quoting is the common case. */
export async function updateTradeIn(
  _prev: TradeInFormState,
  formData: FormData,
): Promise<TradeInFormState> {
  await requireStaff();
  const parsed = z
    .object({
      id,
      status: TradeInStatus,
      estimatedValue: z
        .string()
        .trim()
        .transform((v) => v.replace(/[,\s]|RM/gi, ""))
        .pipe(z.union([z.literal(""), z.string().regex(/^\d+(\.\d{1,2})?$/)])),
    })
    .safeParse({
      id: formData.get("id"),
      status: formData.get("status"),
      estimatedValue: formData.get("estimatedValue") ?? "",
    });
  if (!parsed.success) return { error: "Enter the valuation as a number, e.g. 48500." };

  const { status, estimatedValue } = parsed.data;
  if (status === "QUOTED" && !estimatedValue) {
    return { error: "Add a valuation before marking the trade-in as quoted." };
  }
  await prisma.tradeIn.update({
    where: { id: parsed.data.id },
    data: {
      status,
      estimatedValue: estimatedValue ? new Prisma.Decimal(estimatedValue) : null,
    },
  });
  refresh(`/admin/trade-ins/${parsed.data.id}`, "/account/trade-ins");
  return { ok: true };
}

export interface NoteFormState {
  ok?: boolean;
}

/** Internal staff notes on a financing application. */
export async function saveApplicationNote(
  _prev: NoteFormState,
  formData: FormData,
): Promise<NoteFormState> {
  await requireStaff();
  const parsed = z
    .object({ id, notes: z.string().max(4000) })
    .safeParse({ id: formData.get("id"), notes: formData.get("notes") ?? "" });
  if (!parsed.success) return {};
  await prisma.financeApplication.update({
    where: { id: parsed.data.id },
    data: { notes: parsed.data.notes.trim() || null },
  });
  refresh(`/admin/financing/${parsed.data.id}`);
  return { ok: true };
}
