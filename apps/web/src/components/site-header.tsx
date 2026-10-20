"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Menu, User, X } from "lucide-react";
import { cn } from "@dealership/ui/lib/cn";
import { SITE } from "@dealership/types";

const NAV = [
  { href: "/models", label: "Models" },
  { href: "/stock", label: "Stock" },
  { href: "/build", label: "Build" },
  { href: "/test-drive", label: "Test Drive" },
  { href: "/financing", label: "Financing" },
  { href: "/trade-in", label: "Trade-in" },
  { href: "/contact", label: "Contact" },
] as const;

/** Routes that open with a full-bleed dark hero the header can float over. */
const OVERLAY_ROUTES = new Set(["/"]);

export interface HeaderUser {
  name: string | null;
  isStaff: boolean;
}

function initials(name: string | null): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "")).toUpperCase();
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/build") return pathname === "/build" || /^\/models\/[^/]+\/build/.test(pathname);
  if (href === "/models") return pathname === "/models" || /^\/models\/[^/]+$/.test(pathname);
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader({ user }: { user: HeaderUser | null }): React.ReactElement {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const overlay = OVERLAY_ROUTES.has(pathname);
  const solid = scrolled || !overlay || mobileOpen;

  useEffect(() => {
    const onScroll = (): void => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  const accountHref = user ? "/account" : "/sign-in";

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[height,background-color,box-shadow,border-color] duration-[var(--duration-standard)] ease-[var(--ease-out-soft)]",
        solid
          ? "border-b border-[var(--color-neutral-200)] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85"
          : "border-b border-transparent bg-transparent",
        scrolled ? "h-16 shadow-[var(--shadow-1)]" : "h-20",
      )}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:shadow-[var(--shadow-2)]"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-full w-full max-w-[1440px] items-center justify-between px-4 md:px-6 lg:px-12">
        <Link
          href="/"
          aria-label={`${SITE.name} home`}
          className={cn(
            "relative z-50 font-[family-name:var(--font-display)] text-xl",
            "tracking-[var(--tracking-wide-wordmark)] uppercase",
            solid ? "text-[var(--color-graphite)]" : "text-white",
          )}
        >
          {SITE.name}
        </Link>

        <nav
          aria-label="Main"
          className={cn(
            "hidden items-center gap-7 text-sm lg:flex",
            solid ? "text-[var(--color-graphite)]" : "text-white",
          )}
        >
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative py-1 transition-opacity duration-[var(--duration-standard)] hover:opacity-70",
                  "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:transition-transform after:duration-[var(--duration-standard)]",
                  solid ? "after:bg-[var(--color-accent)]" : "after:bg-white",
                  active ? "after:scale-x-100" : "after:scale-x-0",
                )}
              >
                {item.label}
              </Link>
            );
          })}
          {user?.isStaff ? (
            <Link
              href="/admin"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                solid
                  ? "border-[var(--color-neutral-200)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent-deep)]"
                  : "border-white/40 hover:border-white",
              )}
            >
              <LayoutDashboard className="h-3.5 w-3.5" aria-hidden />
              Admin
            </Link>
          ) : null}
          <Link
            href={accountHref}
            aria-label={user ? "Your account" : "Sign in"}
            title={user ? (user.name ?? "Your account") : "Sign in"}
            className={cn(
              "inline-flex h-9 min-w-9 items-center justify-center rounded-full border px-2 text-xs font-semibold transition-colors",
              solid
                ? "border-[var(--color-neutral-200)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent-deep)]"
                : "border-white/40 hover:border-white",
              user && "bg-[var(--color-graphite)] text-white hover:text-white",
            )}
          >
            {user && initials(user.name) ? initials(user.name) : <User className="h-4 w-4" />}
          </Link>
        </nav>

        <button
          type="button"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
          onClick={() => setMobileOpen((v) => !v)}
          className={cn(
            "relative z-50 inline-flex h-10 w-10 items-center justify-center rounded-md lg:hidden",
            solid ? "text-[var(--color-graphite)]" : "text-white",
          )}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      <div
        aria-hidden
        onClick={() => setMobileOpen(false)}
        className={cn(
          "fixed inset-0 z-30 bg-black/30 transition-opacity duration-[var(--duration-standard)] lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <div
        id="mobile-nav"
        aria-hidden={!mobileOpen}
        inert={!mobileOpen}
        className={cn(
          "fixed inset-y-0 right-0 z-40 flex w-[85%] max-w-sm flex-col bg-white shadow-[var(--shadow-3)]",
          "transition-transform duration-[var(--duration-reveal)] ease-[var(--ease-out-soft)] lg:hidden",
          mobileOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <nav aria-label="Mobile" className="flex flex-1 flex-col gap-1 overflow-y-auto px-6 pt-24 text-[var(--color-graphite)]">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              aria-current={isActive(pathname, item.href) ? "page" : undefined}
              className={cn(
                "py-3 font-[family-name:var(--font-display)] text-2xl tracking-[-0.02em] hover:text-[var(--color-accent)]",
                isActive(pathname, item.href) && "text-[var(--color-accent-deep)]",
              )}
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-4 flex flex-col gap-1 border-t border-[var(--color-neutral-200)] pt-4">
            <Link
              href={accountHref}
              onClick={() => setMobileOpen(false)}
              className="inline-flex items-center gap-2 py-3 text-base text-[var(--color-neutral-700)] hover:text-[var(--color-accent)]"
            >
              <User className="h-4 w-4" /> {user ? "Your account" : "Sign in"}
            </Link>
            {user?.isStaff ? (
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center gap-2 py-3 text-base text-[var(--color-neutral-700)] hover:text-[var(--color-accent)]"
              >
                <LayoutDashboard className="h-4 w-4" /> Admin
              </Link>
            ) : null}
          </div>
        </nav>
        <div className="border-t border-[var(--color-neutral-200)] px-6 py-5 text-sm text-[var(--color-neutral-600)]">
          <a href={SITE.phone.href} className="block hover:text-[var(--color-accent)]">
            {SITE.phone.display}
          </a>
          <a
            href={SITE.whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-1 block hover:text-[var(--color-accent)]"
          >
            WhatsApp us →
          </a>
        </div>
      </div>
    </header>
  );
}
