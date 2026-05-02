import Image from "next/image";
import Link from "next/link";
import { Container } from "@dealership/ui/components/container";
import { Section } from "@dealership/ui/components/section";
import { ModelCard } from "@dealership/ui/components/model-card";
import { prisma, BodyType } from "@dealership/db";
import { Reveal } from "@/components/reveal";
import { formatPrice } from "@/lib/format";

function bodyTypeLabel(b: BodyType): string {
  switch (b) {
    case BodyType.SEDAN:
      return "Sedan";
    case BodyType.SUV:
      return "Family SUV";
    case BodyType.HATCHBACK:
      return "Crossover";
    case BodyType.COUPE:
      return "Flagship";
    default:
      return b;
  }
}

export async function Lineup(): Promise<React.ReactElement> {
  const models = await prisma.model.findMany({
    where: { isActive: true },
    orderBy: [{ displayOrder: "asc" }, { startingPrice: "asc" }],
  });

  return (
    <Section spacing="default">
      <Container>
        <Reveal>
          <div className="mb-12 flex flex-col gap-3 md:mb-16 md:max-w-2xl">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-neutral-500)]">
              The lineup
            </p>
            <h2
              className="font-[family-name:var(--font-display)] tracking-[-0.02em]"
              style={{ fontSize: "clamp(36px, 5vw, 56px)", lineHeight: 1.05 }}
            >
              Five vehicles. One standard.
            </h2>
            <p className="max-w-xl text-base text-[var(--color-neutral-600)] md:text-lg">
              Every car we deliver is prepared by the same team, on the same checklist, before it
              leaves the showroom floor. Pick the one that fits the road you actually drive.
            </p>
          </div>
        </Reveal>
      </Container>

      {/* Mobile: horizontal snap-scroll */}
      <div className="md:hidden">
        <ul className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {models.map((m) => (
            <li key={m.id} className="min-w-[80vw] shrink-0 snap-start">
              <ModelCard
                linkComponent={Link}
                href={`/models/${m.slug}`}
                name={m.name}
                bodyType={bodyTypeLabel(m.bodyType)}
                startingPrice={formatPrice(m.startingPrice.toString(), m.currency)}
                image={
                  <Image
                    src={m.heroImage}
                    alt={`${m.name} — ${bodyTypeLabel(m.bodyType).toLowerCase()}`}
                    fill
                    sizes="80vw"
                    className="object-cover"
                  />
                }
              />
            </li>
          ))}
        </ul>
      </div>

      {/* Tablet/desktop: grid */}
      <Container className="hidden md:block">
        <ul className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-3">
          {models.map((m, idx) => (
            <li key={m.id}>
              <Reveal delay={Math.min(idx, 3) * 0.06}>
                <ModelCard
                  linkComponent={Link}
                  href={`/models/${m.slug}`}
                  name={m.name}
                  bodyType={bodyTypeLabel(m.bodyType)}
                  startingPrice={formatPrice(m.startingPrice.toString(), m.currency)}
                  image={
                    <Image
                      src={m.heroImage}
                      alt={`${m.name} — ${bodyTypeLabel(m.bodyType).toLowerCase()}`}
                      fill
                      sizes="(min-width: 1024px) 33vw, 50vw"
                      className="object-cover"
                    />
                  }
                />
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
