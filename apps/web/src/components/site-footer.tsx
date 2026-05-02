import Link from "next/link";
import { Container } from "@dealership/ui/components/container";
import { prisma } from "@dealership/db";

const ABOUT = [
  { href: "/about", label: "Our Story" },
  { href: "/about/team", label: "Team" },
  { href: "/careers", label: "Careers" },
  { href: "/press", label: "Press" },
];
const SERVICES = [
  { href: "/test-drive", label: "Test Drive" },
  { href: "/financing", label: "Financing" },
  { href: "/trade-in", label: "Trade-in" },
  { href: "/after-sales", label: "After-Sales" },
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
  return (
    <footer className="bg-[var(--color-graphite)] text-white/80">
      <Container className="pb-10 pt-16 md:pb-12 md:pt-24">
        <p
          className="font-[family-name:var(--font-display)] uppercase tracking-[0.18em] text-white"
          style={{ fontSize: "clamp(56px, 7vw, 96px)", lineHeight: 1 }}
        >
          Dealership
        </p>

        <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-4 md:gap-8">
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-medium uppercase tracking-[0.16em] text-white">About</h3>
            <ul className="flex flex-col gap-2 text-sm">
              {ABOUT.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-white/70 transition-colors hover:text-[var(--color-accent)]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-medium uppercase tracking-[0.16em] text-white">Vehicles</h3>
            <ul className="flex flex-col gap-2 text-sm">
              {models.map((m) => (
                <li key={m.slug}>
                  <Link
                    href={`/models/${m.slug}`}
                    className="text-white/70 transition-colors hover:text-[var(--color-accent)]"
                  >
                    {m.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-medium uppercase tracking-[0.16em] text-white">Services</h3>
            <ul className="flex flex-col gap-2 text-sm">
              {SERVICES.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-white/70 transition-colors hover:text-[var(--color-accent)]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-medium uppercase tracking-[0.16em] text-white">Visit</h3>
            <address className="not-italic text-sm leading-relaxed text-white/70">
              Lot 12, Jalan Sultan Ismail
              <br />
              50250 Petaling Jaya, Selangor
              <br />
              Malaysia
            </address>
            <ul className="flex flex-col gap-1 text-sm text-white/70">
              <li>
                <a href="tel:+60378012345" className="hover:text-[var(--color-accent)]">
                  +60 3 7801 2345
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@dealership.my"
                  className="hover:text-[var(--color-accent)]"
                >
                  hello@dealership.my
                </a>
              </li>
              <li>Mon–Sat 9:00–19:00</li>
              <li>
                <a
                  href="https://wa.me/60378012345"
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
          <p>© {new Date().getFullYear()} Dealership Sdn Bhd. All rights reserved.</p>
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
              <span aria-label="Language">EN · MS</span>
            </li>
          </ul>
        </div>
      </Container>
    </footer>
  );
}
