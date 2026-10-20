import Link from "next/link";
import { BrandButton } from "@dealership/ui/components/brand-button";
import { Container } from "@dealership/ui/components/container";
import { SiteChrome } from "@/components/site-chrome";

export default function NotFound(): React.ReactElement {
  return (
    <SiteChrome>
      <section className="bg-[var(--color-surface-warm)] pb-24 pt-40 md:pb-32 md:pt-48">
        <Container>
          <div className="flex max-w-2xl flex-col items-start gap-5">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-neutral-500)]">
              Error 404
            </p>
            <h1
              className="font-[family-name:var(--font-display)] tracking-[-0.02em]"
              style={{ fontSize: "clamp(40px, 7vw, 72px)", lineHeight: 1.05 }}
            >
              This road doesn&rsquo;t go anywhere.
            </h1>
            <p className="max-w-lg text-base text-[var(--color-neutral-600)] md:text-lg">
              The page you were looking for has moved, sold, or never existed. Try one of these
              instead.
            </p>
            <div className="flex flex-col gap-3 pt-4 sm:flex-row">
              <BrandButton asChild variant="primary" size="lg">
                <Link href="/models">Explore the lineup</Link>
              </BrandButton>
              <BrandButton asChild variant="ghost-dark" size="lg">
                <Link href="/stock">See cars in stock</Link>
              </BrandButton>
            </div>
          </div>
        </Container>
      </section>
    </SiteChrome>
  );
}
