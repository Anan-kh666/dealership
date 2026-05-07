"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, Menu, User, X } from "lucide-react";
import { cn } from "@dealership/ui/lib/cn";

const NAV = [
  { href: "/models", label: "Models" },
  { href: "/stock", label: "Stock" },
  { href: "/build", label: "Build" },
  { href: "/test-drive", label: "Test Drive" },
  { href: "/financing", label: "Financing" },
  { href: "/contact", label: "Contact" },
] as const;

interface HeaderUser {
  name: string | null;
  email: string | null;
}

export function SiteHeaderClient({
  user,
}: {
  user: HeaderUser | null;
}): React.ReactElement {
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
          {user ? (
            <UserMenu user={user} scrolled={scrolled} />
          ) : (
            <SignInTopRight scrolled={scrolled} />
          )}
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
          {user ? (
            <>
              <Link
                href="/account"
                onClick={() => setMobileOpen(false)}
                className="mt-4 inline-flex items-center gap-2 py-3 text-base text-[var(--color-neutral-600)] hover:text-[var(--color-accent)]"
              >
                <User className="h-4 w-4" /> Account
              </Link>
              <form method="POST" action="/sign-out">
                <button
                  type="submit"
                  className="py-3 text-left text-base text-[var(--color-neutral-600)] hover:text-[var(--color-accent)]"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/sign-in"
              onClick={() => setMobileOpen(false)}
              className="mt-4 inline-flex items-center gap-2 py-3 text-base text-[var(--color-neutral-600)] hover:text-[var(--color-accent)]"
            >
              <User className="h-4 w-4" /> Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

function SignInTopRight({ scrolled }: { scrolled: boolean }): React.ReactElement {
  return (
    <Link
      href="/sign-in"
      className={cn(
        "ml-2 inline-flex h-9 items-center gap-2 rounded-full border px-4 text-sm transition-colors",
        scrolled
          ? "border-[var(--color-neutral-200)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          : "border-white/40 hover:border-white",
      )}
    >
      Sign in
    </Link>
  );
}

function UserMenu({
  user,
  scrolled,
}: {
  user: HeaderUser;
  scrolled: boolean;
}): React.ReactElement {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent): void => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const label = user.name ?? user.email ?? "Account";

  return (
    <div ref={ref} className="relative ml-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-full border px-4 text-sm transition-colors",
          scrolled
            ? "border-[var(--color-neutral-200)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            : "border-white/40 hover:border-white",
        )}
      >
        <span className="max-w-[140px] truncate">{label}</span>
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
      {open ? (
        <div className="absolute right-0 mt-2 w-44 rounded-md border border-[var(--color-neutral-200)] bg-white py-1 text-sm text-[var(--color-graphite)] shadow-[var(--shadow-2)]">
          <Link
            href="/account"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 hover:bg-[var(--color-surface-warm)]"
          >
            Account
          </Link>
          <form method="POST" action="/sign-out">
            <button
              type="submit"
              className="block w-full px-3 py-2 text-left hover:bg-[var(--color-surface-warm)]"
            >
              Sign out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
