"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, User, X } from "lucide-react";
import { cn } from "@dealership/ui/lib/cn";

const NAV = [
  { href: "/models", label: "Models" },
  { href: "/stock", label: "Stock" },
  { href: "/build", label: "Build" },
  { href: "/test-drive", label: "Test Drive" },
  { href: "/contact", label: "Contact" },
] as const;

export function SiteHeader(): React.ReactElement {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = (): void => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
    return undefined;
  }, [mobileOpen]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[height,background-color,box-shadow,border-color] duration-[var(--duration-standard)] ease-[var(--ease-out-soft)]",
        scrolled
          ? "h-16 border-b border-[var(--color-neutral-200)] bg-white shadow-[var(--shadow-1)]"
          : "h-20 border-b border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-full w-full max-w-[1440px] items-center justify-between px-4 md:px-6 lg:px-12">
        <Link
          href="/"
          aria-label="Dealership home"
          className={cn(
            "font-[family-name:var(--font-display)] text-xl",
            "tracking-[var(--tracking-wide-wordmark)] uppercase",
            scrolled ? "text-[var(--color-graphite)]" : "text-white",
          )}
        >
          Dealership
        </Link>

        <nav
          className={cn(
            "hidden items-center gap-8 text-sm md:flex",
            scrolled ? "text-[var(--color-graphite)]" : "text-white",
          )}
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "transition-opacity duration-[var(--duration-standard)]",
                "hover:opacity-70",
              )}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/account"
            aria-label="Account"
            className={cn(
              "ml-2 inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors",
              scrolled
                ? "border-[var(--color-neutral-200)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                : "border-white/40 hover:border-white",
            )}
          >
            <User className="h-4 w-4" />
          </Link>
        </nav>

        <button
          type="button"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
          className={cn(
            "inline-flex h-10 w-10 items-center justify-center rounded-md md:hidden",
            scrolled || mobileOpen ? "text-[var(--color-graphite)]" : "text-white",
          )}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        aria-hidden={!mobileOpen}
        className={cn(
          "fixed inset-y-0 right-0 z-40 w-[85%] max-w-sm bg-white shadow-[var(--shadow-3)]",
          "transition-transform duration-[var(--duration-reveal)] ease-[var(--ease-out-soft)] md:hidden",
          mobileOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <nav className="flex h-full flex-col gap-1 px-6 pt-24 text-[var(--color-graphite)]">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="font-[family-name:var(--font-display)] py-3 text-2xl tracking-[-0.02em] hover:text-[var(--color-accent)]"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/account"
            onClick={() => setMobileOpen(false)}
            className="mt-4 inline-flex items-center gap-2 py-3 text-base text-[var(--color-neutral-600)] hover:text-[var(--color-accent)]"
          >
            <User className="h-4 w-4" /> Account
          </Link>
        </nav>
      </div>
    </header>
  );
}
