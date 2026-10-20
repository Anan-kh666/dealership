import Image from "next/image";
import Link from "next/link";
import { prisma, StockStatus } from "@dealership/db";
import { Container } from "@dealership/ui/components/container";
import { Section } from "@dealership/ui/components/section";
import { StockCard } from "@dealership/ui/components/stock-card";
import { Reveal } from "@/components/reveal";
import { formatPrice } from "@/lib/format";
import { statusToCardBadge } from "@/lib/stock/format";

interface Card {
  id: string;
  slug: string;
  title: string;
  colorName: string;
  colorHex: string;
  price: string;
  status: StockStatus;
  image: { url: string; alt: string } | null;
}

async function loadAvailable(): Promise<Card[]> {
  try {
    const units = await prisma.stockUnit.findMany({
      where: { status: { in: [StockStatus.AVAILABLE, StockStatus.IN_TRANSIT] } },
      // Ready-to-collect first, then the freshest arrivals.
      orderBy: [{ status: "asc" }, { arrivalDate: { sort: "desc", nulls: "last" } }],
      take: 8,
      include: {
        trim: { include: { model: { select: { name: true } } } },
        images: { orderBy: { order: "asc" }, take: 1 },
      },
    });
    const colors = await prisma.color.findMany({
      where: { id: { in: Array.from(new Set(units.map((u) => u.exteriorColorId))) } },
    });
    const colorById = new Map(colors.map((c) => [c.id, c] as const));
    return units.map((u) => {
      const color = colorById.get(u.exteriorColorId);
      const title = `${u.trim.model.name} ${u.trim.name}`;
      const img = u.images[0];
      return {
        id: u.id,
        slug: u.slug,
        title,
        colorName: color?.name ?? "—",
        colorHex: color?.hexCode ?? "#cccccc",
        price: formatPrice(u.totalPrice.toString()),
        status: u.status,
        image: img ? { url: img.url, alt: img.altText ?? title } : null,
      };
    });
  } catch {
    return [];
  }
}

export async function AvailableNow(): Promise<React.ReactElement | null> {
  const cards = await loadAvailable();
  if (cards.length === 0) return null;

  return (
    <Section spacing="default">
      <Container>
        <Reveal>
          <div className="mb-10 flex flex-col gap-3 md:mb-14 md:flex-row md:items-end md:justify-between md:gap-8">
            <div className="flex max-w-2xl flex-col gap-3">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-neutral-500)]">
                Available now
              </p>
              <h2
                className="font-[family-name:var(--font-display)] tracking-[-0.02em]"
                style={{ fontSize: "clamp(32px, 4.5vw, 48px)", lineHeight: 1.05 }}
              >
                Drive home this weekend.
              </h2>
              <p className="text-base text-[var(--color-neutral-600)] md:text-lg">
                A small handful of units, ready for collection from our PJ showroom. Specs locked,
                paperwork prepared, no waiting list.
              </p>
            </div>
            <Link
              href="/stock"
              className="inline-flex items-center gap-2 self-start text-sm font-medium text-[var(--color-graphite)] hover:text-[var(--color-accent)] md:self-auto"
            >
              View all stock
              <span aria-hidden>→</span>
            </Link>
          </div>
        </Reveal>
      </Container>

      <div className="relative">
        <ul
          aria-label="Vehicles available now"
          className="flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-4 md:scroll-px-6 md:gap-6 md:px-6 lg:scroll-px-12 lg:px-12 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {cards.map((s) => (
            <li
              key={s.id}
              className="min-w-[78vw] shrink-0 snap-start sm:min-w-[48%] lg:min-w-[calc((100%-72px)/4)]"
            >
              <StockCard
                linkComponent={Link}
                href={`/stock/${s.slug}`}
                trim={s.title}
                colorName={s.colorName}
                colorHex={s.colorHex}
                price={s.price}
                badge={statusToCardBadge(s.status)}
                image={
                  s.image ? (
                    <Image
                      src={s.image.url}
                      alt={s.image.alt}
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 78vw"
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
      </div>
    </Section>
  );
}
