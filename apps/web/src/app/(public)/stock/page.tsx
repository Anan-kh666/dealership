import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  prisma,
  BodyType,
  FuelType,
  StockStatus,
  type StockUnit,
  type StockImage,
  type Trim,
  type Model,
  type Color,
} from "@dealership/db";
import { monthlyPayment } from "@dealership/types";
import { Container } from "@dealership/ui/components/container";
import { Section } from "@dealership/ui/components/section";
import { StockCard } from "@dealership/ui/components/stock-card";
import { StatusBadge } from "@dealership/ui/components/status-badge";
import { BrandButton } from "@dealership/ui/components/brand-button";
import { formatPrice } from "@/lib/format";
import {
  applyFilters,
  parseFilters,
  PAGE_SIZE,
  sortItems,
  type StockFilters,
} from "@/lib/stock/filter";
import {
  colorSlug,
  daysUntil,
  formatBodyType,
  formatFuel,
  statusToCardBadge,
} from "@/lib/stock/format";
import { FilterSidebar, type FacetCounts } from "@/components/stock/filter-sidebar";
import { SortDropdown } from "@/components/stock/sort-dropdown";
import { LoadMore } from "@/components/stock/load-more";
import { MobileFilterTrigger } from "@/components/stock/mobile-filter-trigger";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Stock — Available Now",
  description:
    "Drive home this weekend. Real units on the lot in Selangor, ready for collection — no waiting list.",
};

type FullStockUnit = StockUnit & {
  trim: Trim & { model: Model };
  images: StockImage[];
  exteriorColor: Color | null;
};

type EnrichedUnit = {
  raw: FullStockUnit;
  id: string;
  modelSlug: string;
  trimName: string;
  bodyType: BodyType;
  fuelType: FuelType;
  exteriorColorName: string;
  totalPrice: number;
  arrivalDateMs: number;
  daysOnLot: number;
};

async function getVisibleStockUnits(): Promise<{
  units: EnrichedUnit[];
  colorByName: Map<string, Color>;
}> {
  const [units, colors] = await Promise.all([
    prisma.stockUnit.findMany({
      where: { status: { in: [StockStatus.AVAILABLE, StockStatus.IN_TRANSIT] } },
      include: {
        trim: { include: { model: true } },
        images: { orderBy: { order: "asc" }, take: 1 },
      },
    }),
    prisma.color.findMany(),
  ]);

  const colorById = new Map(colors.map((c) => [c.id, c] as const));
  const colorByName = new Map(colors.map((c) => [c.name, c] as const));

  const enriched: EnrichedUnit[] = units.map((u) => {
    const exterior = colorById.get(u.exteriorColorId) ?? null;
    return {
      raw: { ...u, exteriorColor: exterior },
      id: u.id,
      modelSlug: u.trim.model.slug,
      trimName: u.trim.name,
      bodyType: u.trim.model.bodyType,
      fuelType: u.trim.fuelType,
      exteriorColorName: exterior?.name ?? "",
      totalPrice: Number(u.totalPrice),
      arrivalDateMs: u.arrivalDate?.getTime() ?? u.createdAt.getTime(),
      daysOnLot: u.daysOnLot,
    };
  });

  return { units: enriched, colorByName };
}

function buildFacets(
  all: EnrichedUnit[],
  filters: StockFilters,
  colorByName: Map<string, Color>,
): FacetCounts {
  // For each facet, count items matching all OTHER filters (so users can
  // see what choosing this option would yield).
  const without = (key: keyof StockFilters): EnrichedUnit[] => {
    const copy: StockFilters = { ...filters, [key]: [] } as StockFilters;
    return applyFilters(all, copy);
  };

  // Models
  const modelMap = new Map<string, { slug: string; name: string; count: number }>();
  for (const u of without("models")) {
    const ex = modelMap.get(u.modelSlug);
    if (ex) ex.count += 1;
    else
      modelMap.set(u.modelSlug, {
        slug: u.modelSlug,
        name: u.raw.trim.model.name,
        count: 1,
      });
  }

  // Trims (only show trims belonging to the selected models, or all trims with stock if none selected)
  const trimMap = new Map<string, { name: string; count: number }>();
  for (const u of without("trims")) {
    if (filters.models.length > 0 && !filters.models.includes(u.modelSlug)) continue;
    const ex = trimMap.get(u.trimName);
    if (ex) ex.count += 1;
    else trimMap.set(u.trimName, { name: u.trimName, count: 1 });
  }

  // Body types
  const ALL_BODY_TYPES: BodyType[] = [
    BodyType.SEDAN,
    BodyType.SUV,
    BodyType.HATCHBACK,
    BodyType.COUPE,
    BodyType.WAGON,
  ];
  const bodyCounts = new Map<BodyType, number>();
  for (const u of without("bodyTypes")) {
    bodyCounts.set(u.bodyType, (bodyCounts.get(u.bodyType) ?? 0) + 1);
  }
  const bodyTypes = ALL_BODY_TYPES.filter((bt) => bodyCounts.has(bt) || true).map(
    (bt) => ({ value: bt, label: formatBodyType(bt), count: bodyCounts.get(bt) ?? 0 }),
  );

  // Fuel types
  const ALL_FUEL: FuelType[] = [
    FuelType.PETROL,
    FuelType.HYBRID,
    FuelType.PLUGIN_HYBRID,
    FuelType.ELECTRIC,
  ];
  const fuelCounts = new Map<FuelType, number>();
  for (const u of without("fuelTypes")) {
    fuelCounts.set(u.fuelType, (fuelCounts.get(u.fuelType) ?? 0) + 1);
  }
  const fuelTypes = ALL_FUEL.map((ft) => ({
    value: ft,
    label: formatFuel(ft),
    count: fuelCounts.get(ft) ?? 0,
  }));

  // Colors
  const colorCounts = new Map<string, number>();
  for (const u of without("colors")) {
    if (!u.exteriorColorName) continue;
    colorCounts.set(u.exteriorColorName, (colorCounts.get(u.exteriorColorName) ?? 0) + 1);
  }
  const colors = Array.from(colorCounts.entries())
    .map(([name, count]) => {
      const c = colorByName.get(name);
      return {
        slug: colorSlug(name),
        name,
        hex: c?.hexCode ?? "#cccccc",
        count,
      };
    })
    .sort((a, b) => b.count - a.count);

  return {
    models: Array.from(modelMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
    trims: Array.from(trimMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
    bodyTypes: bodyTypes.filter((b) => b.count > 0 || true), // keep all visible
    fuelTypes,
    colors,
  };
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function StockPage({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<React.ReactElement> {
  const sp = await searchParams;
  const filters = parseFilters(sp);

  const { units, colorByName } = await getVisibleStockUnits();
  const facets = buildFacets(units, filters, colorByName);

  const filtered = applyFilters(units, filters);
  const sorted = sortItems(filtered, filters.sort);

  const visibleCount = Math.min(sorted.length, filters.page * PAGE_SIZE);
  const paged = sorted.slice(0, visibleCount);
  const remaining = sorted.length - visibleCount;

  return (
    <>
      {/* Hero */}
      <Section variant="warm" spacing="tight" className="pt-32 md:pt-40">
        <Container>
          <div className="flex flex-col gap-3 md:max-w-2xl">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-neutral-500)]">
              Available now
            </p>
            <h1
              className="font-[family-name:var(--font-display)] tracking-[-0.02em]"
              style={{ fontSize: "clamp(40px, 7vw, 72px)", lineHeight: 1.05 }}
            >
              Drive home this weekend.
            </h1>
            <p className="max-w-[540px] text-base text-[var(--color-neutral-600)] md:text-lg">
              Every unit below is on the lot in Selangor or already on the boat — paid
              for, road-tax-ready, and yours to take home without joining a six-month
              waiting list.
            </p>
          </div>
        </Container>
      </Section>

      {/* Layout: sidebar + content */}
      <Section spacing="default">
        <Container>
          <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[280px_1fr] lg:gap-8">
            {/* Desktop sidebar */}
            <aside className="hidden lg:block">
              <FilterSidebar facets={facets} totalAvailable={units.length} />
            </aside>

            <div className="flex flex-col gap-6">
              {/* Results header */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <p className="text-sm text-[var(--color-neutral-700)] tabular-nums">
                    {sorted.length} result{sorted.length === 1 ? "" : "s"}
                  </p>
                  <div className="lg:hidden">
                    <MobileFilterTrigger
                      facets={facets}
                      totalAvailable={units.length}
                    />
                  </div>
                </div>
                <SortDropdown />
              </div>

              {/* Grid or empty state */}
              {paged.length === 0 ? (
                <EmptyState />
              ) : (
                <ul className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                  {paged.map((u) => (
                    <li key={u.id}>
                      <StockCardWithMeta unit={u.raw} />
                    </li>
                  ))}
                </ul>
              )}

              {remaining > 0 ? (
                <LoadMore
                  nextPage={filters.page + 1}
                  remaining={Math.min(remaining, PAGE_SIZE)}
                />
              ) : null}
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}

function StockCardWithMeta({ unit }: { unit: FullStockUnit }): React.ReactElement {
  const price = formatPrice(unit.totalPrice.toString());
  const monthly = Math.round(monthlyPayment({ totalPrice: Number(unit.totalPrice) }));
  const colorName = unit.exteriorColor?.name ?? "Color";
  const colorHex = unit.exteriorColor?.hexCode ?? "#cccccc";
  const img = unit.images[0];
  const trimDisplay = `${unit.trim.model.name} ${unit.trim.name}`;

  return (
    <article className="flex flex-col gap-2">
      <StockCard
        href={`/stock/${unit.slug}`}
        linkComponent={Link}
        trim={trimDisplay}
        colorName={colorName}
        colorHex={colorHex}
        price={price}
        badge={statusToCardBadge(unit.status)}
        image={
          img ? (
            <Image
              src={img.url}
              alt={img.altText ?? trimDisplay}
              fill
              sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full bg-[var(--color-neutral-100)]" />
          )
        }
      />
      <div className="flex items-center justify-between gap-2 px-1 text-xs text-[var(--color-neutral-600)]">
        <span className="tabular-nums">Est. RM {monthly.toLocaleString("en-MY")}/mo</span>
        <StatusBadge
          status={unit.status}
          daysOnLot={unit.daysOnLot}
          daysUntilDelivery={daysUntil(unit.expectedDelivery)}
        />
      </div>
    </article>
  );
}

function EmptyState(): React.ReactElement {
  return (
    <div className="flex flex-col items-center gap-4 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-neutral-200)] bg-[var(--color-surface-warm)] p-12 text-center">
      <p
        className="font-[family-name:var(--font-display)] tracking-[-0.02em]"
        style={{ fontSize: "clamp(24px, 3vw, 32px)" }}
      >
        No matching units in stock right now.
      </p>
      <p className="max-w-md text-sm text-[var(--color-neutral-600)]">
        Build yours from scratch and we&rsquo;ll keep you posted when a matching unit
        lands — usually 6–12 weeks for factory orders.
      </p>
      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <BrandButton asChild variant="primary" size="md">
          <Link href="/build">Build yours</Link>
        </BrandButton>
        <BrandButton asChild variant="ghost-dark" size="md">
          <Link href="/test-drive">Book a test drive</Link>
        </BrandButton>
      </div>
    </div>
  );
}
