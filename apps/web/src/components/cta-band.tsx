import Link from "next/link";
import { BrandButton } from "@dealership/ui/components/brand-button";
import { Container } from "@dealership/ui/components/container";
import { Section } from "@dealership/ui/components/section";

/** Closing call-to-action strip used at the bottom of content pages. */
export function CtaBand({
  title,
  body,
  primary,
  secondary,
}: {
  title: string;
  body?: string;
  primary: { href: string; label: string };
  secondary?: { href: string; label: string };
}): React.ReactElement {
  return (
    <Section variant="dark" spacing="default">
      <Container>
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex max-w-xl flex-col gap-2">
            <h2
              className="font-[family-name:var(--font-display)] tracking-[-0.02em]"
              style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 1.1 }}
            >
              {title}
            </h2>
            {body ? <p className="text-base text-white/75">{body}</p> : null}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <BrandButton asChild variant="primary" size="lg">
              <Link href={primary.href}>{primary.label}</Link>
            </BrandButton>
            {secondary ? (
              <BrandButton asChild variant="hero-only" size="lg">
                <Link href={secondary.href}>{secondary.label}</Link>
              </BrandButton>
            ) : null}
          </div>
        </div>
      </Container>
    </Section>
  );
}
