import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@dealership/ui/components/container";
import { Section } from "@dealership/ui/components/section";
import { ModelCard } from "@dealership/ui/components/model-card";
import { BrandButton } from "@dealership/ui/components/brand-button";
import { SpecRow } from "@dealership/ui/components/spec-row";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@dealership/ui/components/accordion";
import {
  prisma,
  BodyType,
  Drivetrain,
  FuelType,
  Transmission,
  type Model,
  type Trim,
  type Option,
  type OptionOnTrim,
  type TrimColor,
  type Color,
  type ModelImage,
} from "@dealership/db";
import { HeroGallery, type GalleryImage } from "@/components/models/hero-gallery";
import { ImageGallery } from "@/components/models/image-gallery";
import { pickHighlightIcon } from "@/lib/highlight-icon";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

type FullTrim = Trim & {
  options: (OptionOnTrim & { option: Option })[];
  trimColors: (TrimColor & { color: Color })[];
};
type FullModel = Model & {
  trims: FullTrim[];
  images: ModelImage[];
};

async function getModel(slug: string): Promise<FullModel | null> {
  const m = await prisma.model.findUnique({
    where: { slug },
    include: {
      trims: {
        orderBy: [{ displayOrder: "asc" }, { price: "asc" }],
        include: {
          options: { include: { option: true } },
          trimColors: { include: { color: true } },
        },
      },
      images: { orderBy: { order: "asc" } },
    },
  });
  return m;
}

function formatBodyType(b: BodyType): string {
  switch (b) {
    case BodyType.SEDAN:
      return "Sedan";
    case BodyType.SUV:
      return "Family SUV";
    case BodyType.HATCHBACK:
      return "Crossover";
    case BodyType.COUPE:
      return "Coupe";
    case BodyType.CONVERTIBLE:
      return "Convertible";
    case BodyType.TRUCK:
      return "Truck";
    case BodyType.VAN:
      return "Van";
    case BodyType.WAGON:
      return "Wagon";
    default:
      return b;
  }
}

function formatFuel(f: FuelType): string {
  switch (f) {
    case FuelType.PETROL:
      return "Petrol";
    case FuelType.DIESEL:
      return "Diesel";
    case FuelType.HYBRID:
      return "Hybrid";
    case FuelType.PLUGIN_HYBRID:
      return "Plug-in Hybrid";
    case FuelType.ELECTRIC:
      return "Electric";
    default:
      return f;
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

function formatDrivetrain(d: Drivetrain): string {
  switch (d) {
    case Drivetrain.FWD:
      return "Front-wheel drive";
    case Drivetrain.RWD:
      return "Rear-wheel drive";
    case Drivetrain.AWD:
      return "All-wheel drive";
    case Drivetrain.FOUR_WD:
      return "4WD";
    default:
      return d;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const model = await prisma.model.findUnique({
    where: { slug },
    select: {
      name: true,
      year: true,
      description: true,
      heroImage: true,
      metaTitle: true,
      metaDescription: true,
    },
  });
  if (!model) return { title: "Model not found" };
  const title = model.metaTitle ?? `${model.year} ${model.name}`;
  const description = (model.metaDescription ?? model.description).slice(0, 155);
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: model.heroImage }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [model.heroImage],
    },
  };
}

export default async function ModelDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<React.ReactElement> {
  const { slug } = await params;
  const model = await getModel(slug);
  if (!model) notFound();

  const galleryImages: GalleryImage[] = model.images.map((i) => ({
    id: i.id,
    url: i.url,
    alt: i.altText ?? model.name,
    type: i.type,
  }));

  // Hero gallery picks 4-6 EXTERIOR images by default. The "extra" pool
  // for the bottom image grid is everything else.
  const heroPool = galleryImages.slice(0, Math.min(6, galleryImages.length));
  const heroIds = new Set(heroPool.map((i) => i.id));
  const gridImages = galleryImages.filter((i) => !heroIds.has(i.id));

  const flagshipTrim = [...model.trims].reduce<FullTrim | null>((acc, t) => {
    if (!acc) return t;
    return Number(t.price) > Number(acc.price) ? t : acc;
  }, null);

  // Quick facts come from the entry trim (lowest price) — buyers care about
  // the starting point.
  const entryTrim = model.trims[0];

  const similar = await prisma.model.findMany({
    where: {
      isActive: true,
      slug: { not: model.slug },
      bodyType: model.bodyType,
    },
    orderBy: { displayOrder: "asc" },
    take: 3,
  });
  if (similar.length < 3) {
    const fillCount = 3 - similar.length;
    const have = new Set([model.slug, ...similar.map((s) => s.slug)]);
    const filler = await prisma.model.findMany({
      where: { isActive: true, slug: { notIn: Array.from(have) } },
      orderBy: { startingPrice: "asc" },
      take: fillCount,
    });
    similar.push(...filler);
  }

  const startingPrice = formatPrice(model.startingPrice.toString(), model.currency);

  return (
    <>
      {/* Hero gallery (client island) — top padding clears fixed header */}
      <section className="pt-20">
        <HeroGallery images={heroPool} modelName={model.name} />
      </section>

      {/* Title block */}
      <Section spacing="default">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1fr_auto] lg:gap-16">
            <div className="flex flex-col gap-5">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-neutral-500)]">
                {formatBodyType(model.bodyType).toUpperCase()}
              </p>
              <h1
                className="font-[family-name:var(--font-display)] tracking-[-0.02em]"
                style={{ fontSize: "clamp(40px, 7vw, 72px)", lineHeight: 1.05 }}
              >
                {model.year} {model.name}
              </h1>
              <p className="max-w-xl text-base text-[var(--color-neutral-600)] md:text-lg">
                {model.description}
              </p>
              <div className="mt-2 flex flex-col gap-1">
                <p
                  className="font-[family-name:var(--font-display)] tracking-[-0.02em]"
                  style={{ fontSize: "32px", lineHeight: 1.1 }}
                >
                  From {startingPrice}
                </p>
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-neutral-500)]">
                  OTR Selangor estimate
                </p>
              </div>
              <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                <BrandButton asChild variant="primary" size="lg">
                  <Link href={`/models/${model.slug}/build`}>Build Yours</Link>
                </BrandButton>
                <BrandButton asChild variant="ghost-dark" size="lg">
                  <Link href={`/stock?model=${model.slug}`}>Find In Stock</Link>
                </BrandButton>
              </div>
            </div>

            {/* Quick facts */}
            {entryTrim ? (
              <div className="grid grid-cols-2 gap-3 self-start lg:w-72">
                <QuickFact label="Drivetrain" value={shortDrivetrain(entryTrim.drivetrain)} />
                <QuickFact label="Fuel" value={formatFuel(entryTrim.fuelType)} />
                <QuickFact label="Seats" value={String(entryTrim.seats)} />
                {entryTrim.cargoCapacity ? (
                  <QuickFact
                    label="Cargo"
                    value={`${entryTrim.cargoCapacity} L`}
                  />
                ) : null}
              </div>
            ) : null}
          </div>
        </Container>
      </Section>

      {/* Highlights */}
      {model.highlights.length > 0 ? (
        <Section variant="warm" spacing="tight">
          <Container>
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {model.highlights.slice(0, 4).map((h) => {
                const Icon = pickHighlightIcon(h);
                return (
                  <li
                    key={h}
                    className="flex flex-col gap-3 rounded-[var(--radius-lg)] bg-white p-6 shadow-[var(--shadow-1)]"
                  >
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-warm)] text-[var(--color-accent)]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <p
                      className="font-[family-name:var(--font-display)] tracking-[-0.02em]"
                      style={{ fontSize: "20px", lineHeight: 1.25 }}
                    >
                      {h}
                    </p>
                  </li>
                );
              })}
            </ul>
          </Container>
        </Section>
      ) : null}

      {/* Trim comparison */}
      <Section spacing="default">
        <Container>
          <div className="mb-12 flex flex-col gap-3 md:max-w-2xl">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-neutral-500)]">
              Configurations
            </p>
            <h2
              className="font-[family-name:var(--font-display)] tracking-[-0.02em]"
              style={{ fontSize: "clamp(32px, 5vw, 56px)", lineHeight: 1.05 }}
            >
              Pick the spec that fits how you actually drive.
            </h2>
            <p className="max-w-xl text-base text-[var(--color-neutral-600)]">
              Each trim is configured complete — no hidden &ldquo;essential&rdquo; packs.
              Standard features stay standard.
            </p>
          </div>

          {/* Mobile: horizontal scroll-snap */}
          <ul className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 md:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {model.trims.map((t) => (
              <li
                key={t.id}
                className="min-w-[85vw] shrink-0 snap-start"
              >
                <TrimColumn
                  trim={t}
                  isFlagship={flagshipTrim?.id === t.id && model.trims.length > 1}
                  modelSlug={model.slug}
                  currency={model.currency}
                />
              </li>
            ))}
          </ul>

          {/* Desktop: side-by-side */}
          <ul
            className={`hidden gap-6 md:grid md:grid-cols-${Math.min(model.trims.length, 3)}`}
            style={{
              gridTemplateColumns: `repeat(${Math.min(model.trims.length, 3)}, minmax(0, 1fr))`,
            }}
          >
            {model.trims.map((t) => (
              <li key={t.id}>
                <TrimColumn
                  trim={t}
                  isFlagship={flagshipTrim?.id === t.id && model.trims.length > 1}
                  modelSlug={model.slug}
                  currency={model.currency}
                />
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* Specs accordion */}
      {flagshipTrim ? (
        <Section variant="warm" spacing="default">
          <Container>
            <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
              <div className="flex flex-col gap-3">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-neutral-500)]">
                  Full specifications
                </p>
                <h2
                  className="font-[family-name:var(--font-display)] tracking-[-0.02em]"
                  style={{ fontSize: "clamp(28px, 4vw, 40px)", lineHeight: 1.1 }}
                >
                  Everything, plainly.
                </h2>
                {model.trims.length > 1 ? (
                  <p className="text-sm text-[var(--color-neutral-600)]">
                    Showing {flagshipTrim.name} unless noted.
                  </p>
                ) : null}
              </div>
              <SpecsAccordion model={model} flagship={flagshipTrim} />
            </div>
          </Container>
        </Section>
      ) : null}

      {/* Bottom image gallery */}
      {gridImages.length > 0 ? (
        <Section spacing="default">
          <Container>
            <div className="mb-8 flex flex-col gap-3 md:max-w-2xl">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-neutral-500)]">
                Gallery
              </p>
              <h2
                className="font-[family-name:var(--font-display)] tracking-[-0.02em]"
                style={{ fontSize: "clamp(28px, 4vw, 40px)", lineHeight: 1.1 }}
              >
                More of the {model.name}.
              </h2>
            </div>
            <ImageGallery images={gridImages.map((i) => ({ id: i.id, url: i.url, alt: i.alt }))} />
          </Container>
        </Section>
      ) : null}

      {/* CTA banner */}
      <Section variant="warm" spacing="default">
        <Container>
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <h2
              className="font-[family-name:var(--font-display)] tracking-[-0.02em]"
              style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 1.1 }}
            >
              Ready to drive the {model.name}?
            </h2>
            <div className="flex flex-col gap-3 sm:flex-row">
              <BrandButton asChild variant="primary" size="lg">
                <Link href="/test-drive">Schedule Test Drive</Link>
              </BrandButton>
              <BrandButton asChild variant="ghost-dark" size="lg">
                <Link href={`/models/${model.slug}/build`}>Build Yours</Link>
              </BrandButton>
            </div>
          </div>
        </Container>
      </Section>

      {/* Similar models */}
      {similar.length > 0 ? (
        <Section spacing="default">
          <Container>
            <div className="mb-12 flex flex-col gap-3 md:max-w-2xl">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-neutral-500)]">
                Compare
              </p>
              <h2
                className="font-[family-name:var(--font-display)] tracking-[-0.02em]"
                style={{ fontSize: "clamp(28px, 4vw, 40px)", lineHeight: 1.1 }}
              >
                You might also consider
              </h2>
            </div>
            <ul className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
              {similar.map((m) => (
                <li key={m.id}>
                  <ModelCard
                    linkComponent={Link}
                    href={`/models/${m.slug}`}
                    name={m.name}
                    bodyType={formatBodyType(m.bodyType)}
                    startingPrice={formatPrice(m.startingPrice.toString(), m.currency)}
                    image={
                      <Image
                        src={m.heroImage}
                        alt={m.name}
                        fill
                        sizes="(min-width: 1024px) 33vw, 50vw"
                        className="object-cover"
                      />
                    }
                  />
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      <JsonLd model={model} />
    </>
  );
}

// ---- Subcomponents ----

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

function QuickFact({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.ReactElement {
  return (
    <div className="flex flex-col gap-1 rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] bg-[var(--color-surface-warm)] p-4">
      <span className="text-xs uppercase tracking-[0.16em] text-[var(--color-neutral-500)]">
        {label}
      </span>
      <span className="font-[family-name:var(--font-display)] text-xl tracking-[-0.02em]">
        {value}
      </span>
    </div>
  );
}

function TrimColumn({
  trim,
  isFlagship,
  modelSlug,
  currency,
}: {
  trim: FullTrim;
  isFlagship: boolean;
  modelSlug: string;
  currency: string;
}): React.ReactElement {
  const features = trim.features;
  const visible = features.slice(0, 5);
  const more = Math.max(0, features.length - 5);
  return (
    <div
      className={
        "flex h-full flex-col gap-5 rounded-[var(--radius-lg)] border bg-white p-6 shadow-[var(--shadow-1)] " +
        (isFlagship
          ? "border-[var(--color-accent)]"
          : "border-[var(--color-neutral-200)]")
      }
    >
      <div className="flex flex-col gap-1">
        <h3
          className="font-[family-name:var(--font-display)] tracking-[-0.02em]"
          style={{ fontSize: "28px", lineHeight: 1.1 }}
        >
          {trim.name}
        </h3>
        <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-neutral-500)]">
          {isFlagship ? "Flagship" : "Trim"}
        </p>
      </div>
      <div className="flex items-baseline gap-2">
        <span
          className="font-[family-name:var(--font-display)] tracking-[-0.02em]"
          style={{ fontSize: "24px" }}
        >
          {formatPrice(trim.price.toString(), currency)}
        </span>
        <span className="text-xs uppercase tracking-[0.16em] text-[var(--color-neutral-500)]">
          from
        </span>
      </div>

      <div className="flex flex-col">
        {trim.engineSize ? (
          <SpecRow label="Engine" value={`${trim.engineSize}L ${formatFuel(trim.fuelType)}`} />
        ) : (
          <SpecRow label="Powertrain" value={formatFuel(trim.fuelType)} />
        )}
        {trim.horsepower ? (
          <SpecRow label="Power" value={`${trim.horsepower} hp`} />
        ) : null}
        {trim.zeroToHundred ? (
          <SpecRow label="0–100 km/h" value={`${trim.zeroToHundred.toFixed(1)} s`} />
        ) : null}
        {trim.fuelEconomy ? (
          <SpecRow
            label={trim.fuelType === FuelType.ELECTRIC ? "Energy" : "Fuel economy"}
            value={
              trim.fuelType === FuelType.ELECTRIC
                ? `${trim.fuelEconomy} km/kWh`
                : `${trim.fuelEconomy} km/L`
            }
          />
        ) : null}
        <SpecRow label="Drivetrain" value={shortDrivetrain(trim.drivetrain)} />
        <SpecRow label="Seats" value={String(trim.seats)} />
      </div>

      {visible.length > 0 ? (
        <div className="flex flex-col gap-2 pt-2">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-neutral-500)]">
            Standard
          </p>
          <ul className="flex flex-col gap-1.5 text-sm text-[var(--color-neutral-700)]">
            {visible.map((f) => (
              <li key={f}>· {f}</li>
            ))}
            {more > 0 ? (
              <li className="text-[var(--color-neutral-500)]">+ {more} more</li>
            ) : null}
          </ul>
        </div>
      ) : null}

      <div className="mt-auto pt-4">
        <BrandButton asChild variant="primary" size="md" className="w-full">
          <Link href={`/models/${modelSlug}/build?trim=${trim.id}`}>Build this</Link>
        </BrandButton>
      </div>
    </div>
  );
}

function SpecsAccordion({
  model,
  flagship,
}: {
  model: FullModel;
  flagship: FullTrim;
}): React.ReactElement {
  const groups: { id: string; label: string; rows: { label: string; value: string }[] }[] = [];

  // Engine & Performance
  const ep: { label: string; value: string }[] = [];
  if (flagship.engineSize) ep.push({ label: "Engine", value: `${flagship.engineSize}L` });
  ep.push({ label: "Fuel type", value: formatFuel(flagship.fuelType) });
  if (flagship.horsepower) ep.push({ label: "Power", value: `${flagship.horsepower} hp` });
  if (flagship.torque) ep.push({ label: "Torque", value: `${flagship.torque} Nm` });
  ep.push({ label: "Transmission", value: formatTransmission(flagship.transmission) });
  ep.push({ label: "Drivetrain", value: formatDrivetrain(flagship.drivetrain) });
  if (flagship.zeroToHundred) ep.push({ label: "0–100 km/h", value: `${flagship.zeroToHundred.toFixed(1)} s` });
  if (flagship.topSpeed) ep.push({ label: "Top speed", value: `${flagship.topSpeed} km/h` });
  if (flagship.fuelEconomy) {
    ep.push({
      label: flagship.fuelType === FuelType.ELECTRIC ? "Efficiency" : "Fuel economy",
      value:
        flagship.fuelType === FuelType.ELECTRIC
          ? `${flagship.fuelEconomy} km/kWh`
          : `${flagship.fuelEconomy} km/L`,
    });
  }
  if (ep.length > 0) groups.push({ id: "engine", label: "Engine & Performance", rows: ep });

  // Dimensions & Capacity
  const dim: { label: string; value: string }[] = [];
  dim.push({ label: "Seats", value: String(flagship.seats) });
  dim.push({ label: "Doors", value: String(flagship.doors) });
  if (flagship.cargoCapacity) dim.push({ label: "Cargo", value: `${flagship.cargoCapacity} L` });
  if (dim.length > 0) groups.push({ id: "dimensions", label: "Dimensions & Capacity", rows: dim });

  // Safety / Tech & Comfort split by category
  const standardOpts = flagship.options.filter((o) => o.isStandard).map((o) => o.option);
  const safetyOpts = standardOpts.filter((o) => o.category === "SAFETY");
  if (safetyOpts.length > 0) {
    groups.push({
      id: "safety",
      label: "Safety & Driver Assist",
      rows: safetyOpts.map((o) => ({ label: o.name, value: "Standard" })),
    });
  }
  const techComfort = standardOpts.filter(
    (o) => o.category === "TECH" || o.category === "COMFORT" || o.category === "INTERIOR",
  );
  if (techComfort.length > 0) {
    groups.push({
      id: "tech",
      label: "Technology & Comfort",
      rows: techComfort.map((o) => ({ label: o.name, value: "Standard" })),
    });
  }

  if (groups.length === 0) {
    return (
      <p className="text-sm text-[var(--color-neutral-600)]">
        Full specs coming soon.
      </p>
    );
  }

  return (
    <Accordion type="multiple" defaultValue={[]} className="w-full">
      {groups.map((g) => (
        <AccordionItem key={g.id} value={g.id}>
          <AccordionTrigger>{g.label}</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col">
              {g.rows.map((r) => (
                <SpecRow key={r.label} label={r.label} value={r.value} />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

function JsonLd({ model }: { model: FullModel }): React.ReactElement {
  const offers = model.trims.map((t) => ({
    "@type": "Offer",
    name: t.name,
    price: Number(t.price),
    priceCurrency: model.currency,
    availability: "https://schema.org/InStock",
  }));
  const data = {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: `${model.year} ${model.name}`,
    manufacturer: { "@type": "Organization", name: model.make },
    modelDate: String(model.year),
    vehicleConfiguration: model.trims.map((t) => t.name).join(", "),
    fuelType: model.trims[0] ? formatFuel(model.trims[0].fuelType) : undefined,
    bodyType: formatBodyType(model.bodyType),
    image: model.heroImage,
    description: model.description,
    offers,
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
