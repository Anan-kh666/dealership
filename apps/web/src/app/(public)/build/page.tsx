import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { prisma } from "@dealership/db";
import { Container } from "@dealership/ui/components/container";
import { Section } from "@dealership/ui/components/section";
import { BrandButton } from "@dealership/ui/components/brand-button";
import { formatPrice } from "@/lib/format";
import { formatBodyType, formatFuel } from "@/lib/stock/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Build & price",
  description:
    "Choose a model to configure — trim, paint, interior and options — and see the on-the-road price update as you go.",
};

async function loadModels() {
  try {
    return await prisma.model.findMany({
      where: { isActive: true, trims: { some: {} } },
      orderBy: [{ displayOrder: "asc" }, { startingPrice: "asc" }],
      include: {
        trims: { select: { fuelType: true }, orderBy: { price: "asc" } },
        _count: { select: { trims: true } },
      },
    });
  } catch {
    return [];
  }
}

export default async function BuildIndexPage(): Promise<React.ReactElement> {
  const models = await loadModels();

  return (
    <>
      <Section variant="warm" spacing="tight" className="pt-32 md:pt-40">
        <Container>
          <div className="flex flex-col gap-3 md:max-w-2xl">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-neutral-500)]">
              Build &amp; price
            </p>
            <h1
              className="font-[family-name:var(--font-display)] tracking-[-0.02em]"
              style={{ fontSize: "clamp(40px, 7vw, 72px)", lineHeight: 1.05 }}
            >
              Start with the car. Make it yours.
            </h1>
            <p className="max-w-[560px] text-base text-[var(--color-neutral-600)] md:text-lg">
              Pick a model to configure. Choose the trim, paint, interior and options — the price
              updates as you go, and we&rsquo;ll check our stock for a matching car when
              you&rsquo;re done.
            </p>
          </div>
        </Container>
      </Section>

      <Section spacing="default">
        <Container>
          {models.length === 0 ? (
            <p className="py-16 text-center text-[var(--color-neutral-600)]">
              The configurator is being updated. Please check back shortly.
            </p>
          ) : (
            <ul className="flex flex-col gap-6">
              {models.map((m, i) => {
                const fuels = Array.from(new Set(m.trims.map((t) => formatFuel(t.fuelType))));
                return (
                  <li key={m.id}>
                    <Link
                      href={`/models/${m.slug}/build`}
                      className="group grid overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-neutral-200)] bg-white transition-[box-shadow,border-color] duration-[var(--duration-standard)] hover:border-[var(--color-neutral-300)] hover:shadow-[var(--shadow-3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 md:grid-cols-[1.1fr_1fr]"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden bg-[var(--color-neutral-100)] md:aspect-auto md:min-h-[300px]">
                        <Image
                          src={m.heroImage}
                          alt={`${m.year} ${m.name}`}
                          fill
                          priority={i < 2}
                          sizes="(min-width: 768px) 55vw, 100vw"
                          className="object-cover transition-transform duration-[var(--duration-reveal)] ease-[var(--ease-out-soft)] group-hover:scale-[1.03]"
                        />
                      </div>
                      <div className="flex flex-col justify-between gap-8 p-6 md:p-10">
                        <div className="flex flex-col gap-3">
                          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-neutral-500)]">
                            {formatBodyType(m.bodyType)} · {fuels.join(" / ")}
                          </p>
                          <h2
                            className="font-[family-name:var(--font-display)] tracking-[-0.02em]"
                            style={{ fontSize: "clamp(28px, 3.5vw, 40px)", lineHeight: 1.05 }}
                          >
                            {m.year} {m.name}
                          </h2>
                          <p className="line-clamp-3 text-[15px] text-[var(--color-neutral-600)]">
                            {m.description}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-end justify-between gap-4">
                          <div>
                            <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-neutral-500)]">
                              From
                            </p>
                            <p className="font-[family-name:var(--font-display)] text-2xl tracking-[-0.02em] tabular-nums">
                              {formatPrice(m.startingPrice.toString(), m.currency)}
                            </p>
                            <p className="text-xs text-[var(--color-neutral-500)]">
                              {m._count.trims} trim{m._count.trims === 1 ? "" : "s"} available
                            </p>
                          </div>
                          <span className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-accent)] px-6 text-[15px] font-medium text-white transition-colors group-hover:bg-[var(--color-accent-deep)]">
                            Configure
                            <ArrowRight className="h-4 w-4" aria-hidden />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
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
                Rather drive one today?
              </h2>
              <p className="text-base text-[var(--color-neutral-600)]">
                Units on our lot are prepared, registered and ready to collect — no factory wait.
              </p>
            </div>
            <BrandButton asChild variant="secondary" size="lg">
              <Link href="/stock">Browse cars in stock</Link>
            </BrandButton>
          </div>
        </Container>
      </Section>
    </>
  );
}
