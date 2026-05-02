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
}>;

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
          <TestDriveFlow prefill={prefill} models={models} stockUnits={stock} />
        </Container>
      </Section>
    </>
  );
}
