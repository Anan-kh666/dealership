import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  prisma,
  Drivetrain,
  FuelType,
  StockStatus,
  Transmission,
  type StockImage,
  type StockUnit,
  type Trim,
  type Model,
  type Color,
  type Option,
  type OptionOnTrim,
} from "@dealership/db";
import { monthlyPayment } from "@dealership/types";
import { Container } from "@dealership/ui/components/container";
import { Section } from "@dealership/ui/components/section";
import { StockCard } from "@dealership/ui/components/stock-card";
import { StatusBadge } from "@dealership/ui/components/status-badge";
import { ColorSwatch } from "@dealership/ui/components/color-swatch";
import { formatPrice } from "@/lib/format";
import { daysUntil, formatBodyType, formatFuel, statusToCardBadge } from "@/lib/stock/format";
import { StockGallery, type StockGalleryImage } from "@/components/stock/stock-gallery";
import { CtaCluster } from "@/components/stock/cta-cluster";
import { DetailTabs } from "@/components/stock/detail-tabs";
import { FinanceWidget } from "@/components/finance/finance-widget";

export const dynamic = "force-dynamic";

type FullStockUnit = StockUnit & {
  trim: Trim & {
    model: Model;
    options: (OptionOnTrim & { option: Option })[];
  };
  images: StockImage[];
  exteriorColor: Color;
  interiorColor: Color;
};

async function getUnit(slug: string): Promise<FullStockUnit | null> {
  const unit = await prisma.stockUnit.findUnique({
    where: { slug },
    include: {
      trim: {
        include: {
          model: true,
          options: { include: { option: true } },
        },
      },
      images: { orderBy: { order: "asc" } },
    },
  });
  if (!unit) return null;
  const [exterior, interior] = await Promise.all([
    prisma.color.findUnique({ where: { id: unit.exteriorColorId } }),
    prisma.color.findUnique({ where: { id: unit.interiorColorId } }),
  ]);
  if (!exterior || !interior) return null;
  return { ...unit, exteriorColor: exterior, interiorColor: interior };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const unit = await prisma.stockUnit.findUnique({
    where: { slug },
    include: { trim: { include: { model: true } }, images: { orderBy: { order: "asc" }, take: 1 } },
  });
  if (!unit) return { title: "Stock unit not found" };
  const exterior = await prisma.color.findUnique({ where: { id: unit.exteriorColorId } });
  const colorName = exterior?.name ?? "Available";
  const title = `${unit.trim.model.name} ${unit.trim.name} (${colorName}) — Available Now`;
  const price = formatPrice(unit.totalPrice.toString());
  const description = `${unit.trim.model.name} ${unit.trim.name} in ${colorName} at ${price}. Ready for collection in Selangor.`;
  return {
    title,
    description: description.slice(0, 155),
    openGraph: {
      title,
      description,
      images: unit.images[0] ? [{ url: unit.images[0].url }] : [],
    },
  };
}

function shortDrivetrain(d: Drivetrain): string {
  switch (d) {
    case Drivetrain.FWD:
      return "FWD";
    case Drivetrain.RWD:
      return "RWD";
    case Drivetrain.AWD:
      return "AWD";
    case Drivetrain.FOUR_WD:
      return "4WD";
    default:
      return d;
  }
}

function formatTransmission(t: Transmission): string {
  switch (t) {
    case Transmission.AUTOMATIC:
      return "Automatic";
    case Transmission.MANUAL:
      return "Manual";
    case Transmission.CVT:
      return "CVT";
    case Transmission.DCT:
      return "Dual-clutch";
    default:
      return t;
  }
}

export default async function StockDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<React.ReactElement> {
  const { slug } = await params;
  const unit = await getUnit(slug);
  if (!unit) notFound();

  const trimDisplay = `${unit.trim.model.name} ${unit.trim.name}`;
  const price = formatPrice(unit.totalPrice.toString());
  const monthly = Math.round(monthlyPayment({ totalPrice: Number(unit.totalPrice) }));

  const galleryImages: StockGalleryImage[] = unit.images.map((i) => ({
    id: i.id,
    url: i.url,
    alt: i.altText ?? trimDisplay,
  }));

  // Similar units: same trim → same model other trims → same body type. Exclude current.
  const similar = await loadSimilar(unit);

  // Specs flattening
  const specs: { label: string; value: string }[] = [];
  if (unit.trim.engineSize) specs.push({ label: "Engine", value: `${unit.trim.engineSize}L` });
  specs.push({ label: "Fuel type", value: formatFuel(unit.trim.fuelType) });
  if (unit.trim.horsepower) specs.push({ label: "Power", value: `${unit.trim.horsepower} hp` });
  if (unit.trim.torque) specs.push({ label: "Torque", value: `${unit.trim.torque} Nm` });
  specs.push({ label: "Transmission", value: formatTransmission(unit.trim.transmission) });
  specs.push({ label: "Drivetrain", value: shortDrivetrain(unit.trim.drivetrain) });
  if (unit.trim.zeroToHundred)
    specs.push({ label: "0–100 km/h", value: `${unit.trim.zeroToHundred.toFixed(1)} s` });
  if (unit.trim.topSpeed) specs.push({ label: "Top speed", value: `${unit.trim.topSpeed} km/h` });
  if (unit.trim.fuelEconomy) {
    specs.push({
      label: unit.trim.fuelType === FuelType.ELECTRIC ? "Efficiency" : "Fuel economy",
      value:
        unit.trim.fuelType === FuelType.ELECTRIC
          ? `${unit.trim.fuelEconomy} km/kWh`
          : `${unit.trim.fuelEconomy} km/L`,
    });
  }
  specs.push({ label: "Seats", value: String(unit.trim.seats) });
  specs.push({ label: "Doors", value: String(unit.trim.doors) });
  if (unit.trim.cargoCapacity)
    specs.push({ label: "Cargo", value: `${unit.trim.cargoCapacity} L` });
  specs.push({ label: "VIN", value: unit.vin });
  specs.push({ label: "Exterior", value: unit.exteriorColor.name });
  specs.push({ label: "Interior", value: unit.interiorColor.name });

  const installedOptionNames = unit.trim.options
    .filter((o) => unit.installedOptions.includes(o.optionId))
    .map((o) => o.option.name);

  const includedCopy = `Five-year unlimited-mileage factory warranty (battery: 8 years on EV models).
Three-year complimentary service plan covering scheduled maintenance, lubricants, and labour.
First-year road tax and comprehensive insurance included with collection.
Delivery and registration handled in-house — your unit is plate-ready before you sign.
After-sales: priority service booking at our authorised centres in Petaling Jaya, Penang, and Johor Bahru.`;

  return (
    <>
      {/* Gallery */}
      <section className="pt-20">
        <StockGallery images={galleryImages} />
      </section>

      {/* Quick facts row */}
      <Section spacing="tight">
        <Container>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <QuickTile label="Color">
              <span className="flex items-center gap-2">
                <ColorSwatch hex={unit.exteriorColor.hexCode} name={unit.exteriorColor.name} size="sm" />
                <span className="text-sm">{unit.exteriorColor.name}</span>
              </span>
            </QuickTile>
            <QuickTile label="Trim">{unit.trim.name}</QuickTile>
            <QuickTile label="Year">{String(unit.trim.model.year)}</QuickTile>
            <QuickTile label="Days on lot">
              {unit.daysOnLot > 0 ? `${unit.daysOnLot} d` : "—"}
            </QuickTile>
            <QuickTile label="Status">
              <StatusBadge
                status={unit.status}
                daysOnLot={unit.daysOnLot}
                daysUntilDelivery={daysUntil(unit.expectedDelivery)}
              />
            </QuickTile>
          </div>
        </Container>
      </Section>

      {/* Title + price + CTAs */}
      <Section spacing="default">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1fr_auto] lg:gap-16">
            <div className="flex flex-col gap-5">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-neutral-500)]">
                {formatBodyType(unit.trim.model.bodyType).toUpperCase()} · VIN {unit.vin}
              </p>
              <h1
                className="font-[family-name:var(--font-display)] tracking-[-0.02em]"
                style={{ fontSize: "clamp(40px, 6vw, 56px)", lineHeight: 1.05 }}
              >
                {trimDisplay}
              </h1>
              <div className="flex flex-col gap-1">
                <p
                  className="font-[family-name:var(--font-display)] tracking-[-0.02em] tabular-nums"
                  style={{ fontSize: "40px", lineHeight: 1.1 }}
                >
                  {price}
                </p>
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-neutral-500)]">
                  OTR Selangor estimate
                </p>
                <Link
                  href={`/financing?stockUnitId=${unit.id}`}
                  className="text-sm text-[var(--color-accent)] underline-offset-4 hover:underline"
                >
                  Est. RM {monthly.toLocaleString("en-MY")}/mo →
                </Link>
              </div>
              <CtaCluster
                stockUnitId={unit.id}
                stickyTitle={trimDisplay}
                price={price}
                trimDisplayName={trimDisplay}
                exteriorColorName={unit.exteriorColor.name}
              />
            </div>
          </div>
        </Container>
      </Section>

      {/* Tabs */}
      <Section variant="warm" spacing="default">
        <Container>
          <DetailTabs
            description={unit.trim.model.description}
            features={unit.trim.features}
            installedOptions={installedOptionNames}
            specs={specs}
            includedCopy={includedCopy}
          />
        </Container>
      </Section>

      {/* Finance widget */}
      <Section spacing="default">
        <Container>
          <FinanceWidget
            vehiclePrice={Number(unit.totalPrice)}
            vehicleId={unit.id}
            variant="card"
          />
        </Container>
      </Section>

      {/* Trust strip */}
      <Section variant="warm" spacing="tight">
        <Container>
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              "Authorised Dealer",
              "Factory Warranty",
              "Road Tax + Insurance Yr 1",
              "After-Sales Service",
            ].map((t) => (
              <li
                key={t}
                className="rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] bg-white px-4 py-3 text-center text-sm text-[var(--color-neutral-700)]"
              >
                {t}
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* Similar units */}
      {similar.length > 0 ? (
        <Section spacing="default">
          <Container>
            <div className="mb-8 flex flex-col gap-2">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-neutral-500)]">
                Also on the lot
              </p>
              <h2
                className="font-[family-name:var(--font-display)] tracking-[-0.02em]"
                style={{ fontSize: "clamp(28px, 4vw, 40px)", lineHeight: 1.1 }}
              >
                Similar in-stock units
              </h2>
            </div>
            <ul className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((s) => (
                <li key={s.id}>
                  <StockCard
                    href={`/stock/${s.slug}`}
                    linkComponent={Link}
                    trim={`${s.trim.model.name} ${s.trim.name}`}
                    colorName={s.exteriorColor?.name ?? "Color"}
                    colorHex={s.exteriorColor?.hexCode ?? "#cccccc"}
                    price={formatPrice(s.totalPrice.toString())}
                    badge={statusToCardBadge(s.status)}
                    image={
                      s.images[0] ? (
                        <Image
                          src={s.images[0].url}
                          alt={s.images[0].altText ?? s.trim.name}
                          fill
                          sizes="(min-width: 1024px) 30vw, 50vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-[var(--color-neutral-100)]" />
                      )
                    }
                  />
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      {/* Footer spacer so the sticky mobile CTA bar doesn't overlap content */}
      <div className="h-20 md:hidden" />

      <JsonLd unit={unit} />
    </>
  );
}

function QuickTile({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex flex-col gap-1 rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] bg-[var(--color-surface-warm)] p-3">
      <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-neutral-500)]">
        {label}
      </span>
      <div className="text-sm">{children}</div>
    </div>
  );
}

type SimilarUnit = StockUnit & {
  trim: Trim & { model: Model };
  images: StockImage[];
  exteriorColor: Color | null;
};

async function loadSimilar(unit: FullStockUnit): Promise<SimilarUnit[]> {
  const status = {
    in: [StockStatus.AVAILABLE, StockStatus.IN_TRANSIT],
  };
  const include = {
    trim: { include: { model: true } },
    images: { orderBy: { order: "asc" as const }, take: 1 },
  };

  type Raw = Awaited<ReturnType<typeof prisma.stockUnit.findMany>>[number] & {
    trim: Trim & { model: Model };
    images: StockImage[];
  };

  const sameTrim = (await prisma.stockUnit.findMany({
    where: { status, NOT: { id: unit.id }, trimId: unit.trimId },
    take: 3,
    include,
  })) as Raw[];

  let results: Raw[] = [...sameTrim];

  if (results.length < 3) {
    const sameModel = (await prisma.stockUnit.findMany({
      where: {
        status,
        NOT: { id: unit.id },
        trim: { modelId: unit.trim.modelId },
        id: { notIn: results.map((r) => r.id) },
      },
      take: 3 - results.length,
      include,
    })) as Raw[];
    results = [...results, ...sameModel];
  }
  if (results.length < 3) {
    const sameBody = (await prisma.stockUnit.findMany({
      where: {
        status,
        NOT: { id: unit.id },
        trim: { model: { bodyType: unit.trim.model.bodyType } },
        id: { notIn: results.map((r) => r.id) },
      },
      take: 3 - results.length,
      include,
    })) as Raw[];
    results = [...results, ...sameBody];
  }

  if (results.length === 0) return [];

  const colorIds = Array.from(new Set(results.map((r) => r.exteriorColorId)));
  const colors = await prisma.color.findMany({ where: { id: { in: colorIds } } });
  const colorById = new Map(colors.map((c) => [c.id, c] as const));
  return results.map((r) => ({ ...r, exteriorColor: colorById.get(r.exteriorColorId) ?? null }));
}

function JsonLd({ unit }: { unit: FullStockUnit }): React.ReactElement {
  const availability =
    unit.status === StockStatus.AVAILABLE
      ? "https://schema.org/InStock"
      : unit.status === StockStatus.IN_TRANSIT
        ? "https://schema.org/PreOrder"
        : unit.status === StockStatus.RESERVED
          ? "https://schema.org/LimitedAvailability"
          : "https://schema.org/SoldOut";

  const data = {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: `${unit.trim.model.year} ${unit.trim.model.name} ${unit.trim.name}`,
    vehicleIdentificationNumber: unit.vin,
    manufacturer: { "@type": "Organization", name: unit.trim.model.make },
    modelDate: String(unit.trim.model.year),
    bodyType: formatBodyType(unit.trim.model.bodyType),
    color: unit.exteriorColor.name,
    fuelType: formatFuel(unit.trim.fuelType),
    itemCondition: "https://schema.org/NewCondition",
    image: unit.images[0]?.url,
    description: unit.trim.model.description,
    offers: {
      "@type": "Offer",
      price: Number(unit.totalPrice),
      priceCurrency: unit.trim.model.currency,
      availability,
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "AutoDealer", name: "Dealership" },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
