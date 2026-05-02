import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@dealership/db";

const Body = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email(),
  phone: z
    .string()
    .trim()
    .min(7)
    .max(20)
    .regex(/^\+?[\d\s-]+$/, "must be a valid phone number"),
  message: z.string().trim().max(2000).optional(),
  stockUnitId: z.string().min(1).optional(),
  modelId: z.string().min(1).optional(),
  configurationId: z.string().min(1).optional(),
  source: z.string().trim().min(1).max(80),
});

// Same in-memory rate-limit fallback as the Fastify route. Swap for Redis
// when REDIS_URL is wired up.
const seen = new Map<string, number[]>();
const WINDOW_MS = 60 * 60 * 1000;
const MAX = 5;

function tooMany(ip: string): boolean {
  const now = Date.now();
  const arr = (seen.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (arr.length >= MAX) {
    seen.set(ip, arr);
    return true;
  }
  arr.push(now);
  seen.set(ip, arr);
  return false;
}

export async function POST(req: Request): Promise<Response> {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (tooMany(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const b = parsed.data;

  const inquiry = await prisma.inquiry.create({
    data: {
      name: b.name,
      email: b.email,
      phone: b.phone,
      message: b.message ?? "",
      source: b.source,
      stockUnitId: b.stockUnitId,
      modelId: b.modelId,
      configurationId: b.configurationId,
    },
  });

  return NextResponse.json({ id: inquiry.id }, { status: 201 });
}
