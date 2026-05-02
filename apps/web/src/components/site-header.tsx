import Link from "next/link";

const NAV = [
  { href: "/models", label: "Models" },
  { href: "/stock", label: "Stock" },
  { href: "/build", label: "Build" },
  { href: "/test-drive", label: "Test Drive" },
] as const;

export function SiteHeader(): React.ReactElement {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="font-[family-name:var(--font-fraunces)] text-xl tracking-tight">
          Dealership
        </Link>
        <nav className="flex items-center gap-8 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
