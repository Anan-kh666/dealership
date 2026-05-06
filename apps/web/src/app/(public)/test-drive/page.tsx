import type { Metadata } from "next";
import { prisma, StockStatus } from "@dealership/db";
import { Container } from "@dealership/ui/components/container";
import { Section } from "@dealership/ui/components/section";
import {
  TestDriveFlow,
  type ModelOption,
  type PrefilledVehicle,
  type StockOption,
} from "./test-drive-flow";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Schedule a test drive",
  description:
    "Book a test drive in our Petaling Jaya showroom. Pick a vehicle, a time slot, and we'll have it ready when you arrive.",
};

type SearchParams = Promise<{
  modelId?: string;
  stockUnitId?: string;
  slug?: string;
  /** URL-encoded configurator querystring from /models/[slug]/build, e.g. "trim=...&exterior=...". */
  config?: string;
}>;

/**
 * Build a human-readable spec summary from the configurator querystring so it
 * can be pre-filled into the test-drive notes field. Returns null if the
 * config is missing/unreadable — the caller should fall back to the empty
 * default. Lives on the page to keep the flow component pure.
 */
async function buildConfigNotes(
  config: string | undefined,
  modelSlug: string | undefined,
  modelIdHint: string | undefined,
): Promise<string | null> {
  if (!config) return null;
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(config);
  } catch {
    return null;
  }
  const trimId = params.get("trim");
  const exteriorId = params.get("exterior");
  const interiorId = params.get("interior");
  const optionIds = (params.get("options") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!trimId) return null;

  const trim = await prisma.trim.findUnique({
    where: { id: trimId },
    include: { model: true },
  });
  if (!trim) return null;
  // If a model hint is supplied, ensure the trim belongs to it — silently
  // discard mismatches so a stale link can't pre-fill a different car's spec.
  if (modelSlug && trim.model.slug !== modelSlug) return null;
  if (modelIdHint && trim.model.id !== modelIdHint) return null;

  const colorIds = [exteriorId, interiorId].filter(
    (id): id is string => typeof id === "string" && id.length > 0,
  );
  const [colors, options] = await Promise.all([
    colorIds.length > 0
      ? prisma.color.findMany({ where: { id: { in: colorIds } } })
      : Promise.resolve([]),
    optionIds.length > 0
      ? prisma.option.findMany({ where: { id: { in: optionIds } } })
      : Promise.resolve([]),
  ]);
  const colorMap = new Map(colors.map((c) => [c.id, c]));
  const exterior = exteriorId ? colorMap.get(exteriorId) : undefined;
  const interior = interiorId ? colorMap.get(interiorId) : undefined;

  const lines: string[] = [`Spec: ${trim.model.name} ${trim.name}`];
  if (exterior) lines.push(`Exterior: ${exterior.name}`);
  if (interior) lines.push(`Interior: ${interior.name}`);
  if (options.length > 0) {
    lines.push(`Options: ${options.map((o) => o.name).join(", ")}`);
  }
  return lines.join(" · ");
}

async function loadPrefill(sp: Awaited<SearchParams>): Promise<PrefilledVehicle | null> {
  if (sp.stockUnitId) {
    const unit = await prisma.stockUnit.findUnique({
      where: { id: sp.stockUnitId },
      include: { trim: { include: { model: true } } },
    });
    if (unit) {
      return {
        kind: "stockUnit",
        stockUnitId: unit.id,
        modelId: unit.trim.model.id,
        label: unit.trim.model.name,
        trimLabel: unit.trim.name,
      };
    }
  }
  if (sp.modelId) {
    const model = await prisma.model.findUnique({ where: { id: sp.modelId } });
    if (model) {
      return { kind: "model", modelId: model.id, label: model.name };
    }
  }
  if (sp.slug) {
    const model = await prisma.model.findUnique({ where: { slug: sp.slug } });
    if (model) {
      return { kind: "model", modelId: model.id, label: model.name };
    }
  }
  return null;
}

async function loadModels(): Promise<ModelOption[]> {
  const models = await prisma.model.findMany({
    where: { isActive: true },
    orderBy: [{ isFeatured: "desc" }, { displayOrder: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      bodyType: true,
      heroImage: true,
      startingPrice: true,
      isFeatured: true,
    },
  });
  return models.map((m) => ({
    id: m.id,
    slug: m.slug,
    name: m.name,
    bodyType: m.bodyType,
    heroImage: m.heroImage,
    startingPrice: m.startingPrice.toString(),
    isFeatured: m.isFeatured,
  }));
}

async function loadStockUnits(): Promise<StockOption[]> {
  const units = await prisma.stockUnit.findMany({
    where: { status: StockStatus.AVAILABLE },
    orderBy: { createdAt: "desc" },
    take: 12,
    include: {
      trim: { include: { model: { select: { id: true, name: true, slug: true } } } },
      images: { orderBy: { order: "asc" }, take: 1 },
    },
  });
  return units.map((u) => ({
    id: u.id,
    slug: u.slug,
    modelId: u.trim.model.id,
    modelName: u.trim.model.name,
    trimName: u.trim.name,
    totalPrice: u.totalPrice.toString(),
    image: u.images[0]?.url ?? null,
  }));
}

export default async function TestDrivePage({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<React.ReactElement> {
  const sp = await searchParams;
  const [prefill, models, stock] = await Promise.all([
    loadPrefill(sp),
    loadModels(),
    loadStockUnits(),
  ]);
  const configNotes = await buildConfigNotes(
    sp.config,
    sp.slug,
    prefill?.kind === "model"
      ? prefill.modelId
      : prefill?.kind === "stockUnit"
        ? prefill.modelId
        : undefined,
  );

  return (
    <>
      <Section variant="warm" spacing="tight" className="pt-32 md:pt-40">
        <Container>
          <div className="flex flex-col gap-3 md:max-w-2xl">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-neutral-500)]">
              Book your visit
            </p>
            <h1
              className="font-[family-name:var(--font-display)] tracking-[-0.02em]"
              style={{ fontSize: "clamp(36px, 6vw, 56px)", lineHeight: 1.05 }}
            >
              Schedule a test drive
            </h1>
            <p className="text-base text-[var(--color-neutral-600)] md:text-lg">
              Petaling Jaya showroom · 9 AM to 6 PM, Monday to Saturday.
            </p>
          </div>
        </Container>
      </Section>
      <Section spacing="default">
        <Container>
          <TestDriveFlow
            prefill={prefill}
            models={models}
            stockUnits={stock}
            configNotes={configNotes}
          />
        </Container>
      </Section>
    </>
  );
}
