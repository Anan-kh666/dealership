import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma, BodyType, FuelType, Prisma } from "@dealership/db";
import { Container } from "@dealership/ui/components/container";
import { Section } from "@dealership/ui/components/section";
import { ModelCard } from "@dealership/ui/components/model-card";
import { BrandButton } from "@dealership/ui/components/brand-button";
import { FilterChips } from "@/components/models/filter-chips";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Models",
  description:
    "Five new vehicles, one standard. Compare sedans, SUVs, hybrids and EVs from RM 96,800.",
};

type SearchParams = Promise<{
  bodyType?: string;
  fuelType?: string;
}>;

const isBodyType = (v: string): v is BodyType =>
  Object.values(BodyType).includes(v as BodyType);

const isFuelType = (v: string): v is FuelType =>
  Object.values(FuelType).includes(v as FuelType);

export default async function ModelsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<React.ReactElement> {
  const sp = await searchParams;
  const where: Prisma.ModelWhereInput = { isActive: true };
  if (sp.bodyType && isBodyType(sp.bodyType)) {
    where.bodyType = sp.bodyType;
  }
  if (sp.fuelType && isFuelType(sp.fuelType)) {
    where.trims = { some: { fuelType: sp.fuelType } };
  }

  const models = await prisma.model.findMany({
    where,
    orderBy: [{ displayOrder: "asc" }, { startingPrice: "asc" }],
  });

  return (
    <>
      {/* Top padding to clear the fixed header */}
      <Section variant="warm" spacing="tight" className="pt-32 md:pt-40">
        <Container>
          <div className="flex flex-col gap-3 md:max-w-2xl">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-neutral-500)]">
              The lineup
            </p>
            <h1
              className="font-[family-name:var(--font-display)] tracking-[-0.02em]"
              style={{ fontSize: "clamp(40px, 7vw, 72px)", lineHeight: 1.05 }}
            >
              Choose how you drive.
            </h1>
            <p className="max-w-[540px] text-base text-[var(--color-neutral-600)] md:text-lg">
              Five vehicles built for the way Malaysia actually drives — daily traffic in
              the Klang Valley, weekend climbs to Genting, the long road to Penang.
            </p>
          </div>
          <div className="mt-10">
            <FilterChips />
          </div>
        </Container>
      </Section>

      <Section spacing="default">
        <Container>
          <p className="mb-6 text-sm text-[var(--color-neutral-600)]">
            Showing {models.length} of {models.length} models
          </p>
          {models.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-24 text-center">
              <p
                className="font-[family-name:var(--font-display)] tracking-[-0.02em]"
                style={{ fontSize: "clamp(24px, 3vw, 32px)" }}
              >
                Nothing matches that combination.
              </p>
              <Link
                href="/models"
                className="text-sm text-[var(--color-accent)] underline-offset-4 hover:underline"
              >
                Reset filters
              </Link>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
              {models.map((m) => (
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
                        alt={`${m.name} — ${formatBodyType(m.bodyType).toLowerCase()}`}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                        className="object-cover"
                      />
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </Container>
      </Section>

      <Section variant="warm" spacing="default">
        <Container>
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex max-w-xl flex-col gap-2">
              <h2
                className="font-[family-name:var(--font-display)] tracking-[-0.02em]"
                style={{ fontSize: "clamp(28px, 4vw, 40px)", lineHeight: 1.1 }}
              >
                Not sure which is right?
              </h2>
              <p className="text-base text-[var(--color-neutral-600)]">
                Book a test drive or speak to someone who knows the lineup well. No
                pressure, no upsell scripts.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <BrandButton asChild variant="primary" size="lg">
                <Link href="/test-drive">Book a Test Drive</Link>
              </BrandButton>
              <BrandButton asChild variant="ghost-dark" size="lg">
                <Link href="/contact">Talk to us</Link>
              </BrandButton>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
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
