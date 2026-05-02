import Image from "next/image";
import Link from "next/link";
import { Container } from "@dealership/ui/components/container";
import { Section } from "@dealership/ui/components/section";
import { StockCard } from "@dealership/ui/components/stock-card";
import { Reveal } from "@/components/reveal";
import { inStock } from "@/data/placeholders";

export function AvailableNow(): React.ReactElement {
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
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 md:gap-6 md:px-6 lg:gap-6 lg:px-12 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {inStock.map((s) => (
            <li
              key={s.slug}
              className="min-w-[78vw] shrink-0 snap-start sm:min-w-[48%] lg:min-w-[calc((100%-72px)/4)]"
            >
              <StockCard
                linkComponent={Link}
                href={`/stock/${s.slug}`}
                trim={s.trim}
                colorName={s.colorName}
                colorHex={s.colorHex}
                price={s.price}
                badge={s.badge}
                image={
                  <Image
                    src={s.image}
                    alt={s.alt}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 78vw"
                    className="object-cover"
                  />
                }
              />
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
