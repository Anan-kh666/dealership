import Link from "next/link";
import { Container } from "@dealership/ui/components/container";
import { prisma } from "@dealership/db";
import { SITE } from "@dealership/types";

const COMPANY = [
  { href: "/about", label: "Our story" },
  { href: "/about/team", label: "Team" },
  { href: "/careers", label: "Careers" },
  { href: "/press", label: "Press" },
  { href: "/blog", label: "Journal" },
];
const SERVICES = [
  { href: "/build", label: "Build & price" },
  { href: "/test-drive", label: "Book a test drive" },
  { href: "/financing", label: "Financing" },
  { href: "/trade-in", label: "Trade-in valuation" },
  { href: "/after-sales", label: "After-sales & service" },
];

export async function SiteFooter(): Promise<React.ReactElement> {
  let models: { slug: string; name: string }[] = [];
  try {
    models = await prisma.model.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: "asc" }, { startingPrice: "asc" }],
      select: { slug: true, name: true },
    });
  } catch {
    // Footer renders even if the DB is unreachable; just show no model links.
    models = [];
  }
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[var(--color-graphite)] text-white/80">
      <Container className="pb-10 pt-16 md:pb-12 md:pt-24">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <p
            className="font-[family-name:var(--font-display)] uppercase tracking-[0.18em] text-white"
            style={{ fontSize: "clamp(30px, 8.5vw, 96px)", lineHeight: 1 }}
          >
            {SITE.name}
          </p>
          <Link
            href="/test-drive"
            className="inline-flex items-center gap-2 self-start rounded-full border border-white/30 px-5 py-2.5 text-sm text-white transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] md:self-auto"
          >
            Book a test drive <span aria-hidden>→</span>
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-10 md:grid-cols-4 md:gap-8">
          <FooterColumn title="Vehicles">
            {models.length > 0 ? (
              models.map((m) => (
                <FooterLink key={m.slug} href={`/models/${m.slug}`}>
                  {m.name}
                </FooterLink>
              ))
            ) : (
              <FooterLink href="/models">The lineup</FooterLink>
            )}
            <FooterLink href="/stock">In stock now</FooterLink>
          </FooterColumn>

          <FooterColumn title="Services">
            {SERVICES.map((l) => (
              <FooterLink key={l.href} href={l.href}>
                {l.label}
              </FooterLink>
            ))}
          </FooterColumn>

          <FooterColumn title="Company">
            {COMPANY.map((l) => (
              <FooterLink key={l.href} href={l.href}>
                {l.label}
              </FooterLink>
            ))}
            <FooterLink href="/contact">Contact</FooterLink>
          </FooterColumn>

          <div className="col-span-2 flex flex-col gap-4 md:col-span-1">
            <h3 className="text-sm font-medium uppercase tracking-[0.16em] text-white">Visit</h3>
            <address className="not-italic text-sm leading-relaxed text-white/70">
              {SITE.address.street}
              <br />
              {SITE.address.postcode} {SITE.address.city}, {SITE.address.state}
              <br />
              {SITE.address.country}
            </address>
            <ul className="flex flex-col gap-1 text-sm text-white/70">
              <li>
                <a href={SITE.phone.href} className="hover:text-[var(--color-accent)]">
                  {SITE.phone.display}
                </a>
              </li>
              <li>
                <a href={`mailto:${SITE.email}`} className="hover:text-[var(--color-accent)]">
                  {SITE.email}
                </a>
              </li>
              <li>{SITE.hoursShort}</li>
              <li>
                <a
                  href={SITE.whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[var(--color-accent)]"
                >
                  WhatsApp us →
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-white/10 pt-8 text-xs text-white/50 md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {SITE.legalName} ({SITE.registrationNo}). All rights reserved.
          </p>
          <ul className="flex flex-wrap items-center gap-6">
            <li>
              <Link href="/privacy" className="hover:text-white">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-white">
                Terms
              </Link>
            </li>
            <li>
              <Link href="/account" className="hover:text-white">
                Your account
              </Link>
            </li>
          </ul>
        </div>
      </Container>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-medium uppercase tracking-[0.16em] text-white">{title}</h3>
      <ul className="flex flex-col gap-2 text-sm">{children}</ul>
    </div>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <li>
      <Link href={href} className="text-white/70 transition-colors hover:text-[var(--color-accent)]">
        {children}
      </Link>
    </li>
  );
}
