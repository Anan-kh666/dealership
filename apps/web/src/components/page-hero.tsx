import Image from "next/image";
import { Container } from "@dealership/ui/components/container";

/**
 * Standard top-of-page block for content pages. Clears the fixed header.
 * With `image`, renders a full-bleed photo with the title overlaid.
 */
export function PageHero({
  eyebrow,
  title,
  intro,
  image,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  intro?: React.ReactNode;
  image?: { src: string; alt: string };
  children?: React.ReactNode;
}): React.ReactElement {
  if (image) {
    return (
      <section className="relative isolate flex min-h-[62vh] items-end overflow-hidden pt-20">
        <Image src={image.src} alt={image.alt} fill priority sizes="100vw" className="-z-10 object-cover" />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-t from-black/75 via-black/30 to-black/10"
        />
        <Container className="pb-14 pt-24 md:pb-20">
          <div className="flex max-w-3xl flex-col gap-4 text-white">
            <p className="text-xs uppercase tracking-[0.24em] text-white/75">{eyebrow}</p>
            <h1
              className="font-[family-name:var(--font-display)] tracking-[-0.02em]"
              style={{ fontSize: "clamp(40px, 7vw, 76px)", lineHeight: 1.03 }}
            >
              {title}
            </h1>
            {intro ? <p className="max-w-2xl text-lg text-white/85">{intro}</p> : null}
            {children}
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className="bg-[var(--color-surface-warm)] pb-12 pt-32 md:pb-16 md:pt-40">
      <Container>
        <div className="flex max-w-3xl flex-col gap-4">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-neutral-500)]">
            {eyebrow}
          </p>
          <h1
            className="font-[family-name:var(--font-display)] tracking-[-0.02em]"
            style={{ fontSize: "clamp(40px, 7vw, 72px)", lineHeight: 1.05 }}
          >
            {title}
          </h1>
          {intro ? (
            <p className="max-w-2xl text-base text-[var(--color-neutral-600)] md:text-lg">{intro}</p>
          ) : null}
          {children}
        </div>
      </Container>
    </section>
  );
}
