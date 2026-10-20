"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarClock, Car, Home, Landmark, Settings } from "lucide-react";
import { cn } from "@dealership/ui/lib/cn";

const ITEMS = [
  { href: "/account", label: "Overview", icon: Home },
  { href: "/account/test-drives", label: "Test drives", icon: CalendarClock },
  { href: "/account/financing", label: "Financing", icon: Landmark },
  { href: "/account/trade-ins", label: "Trade-ins", icon: Car },
  { href: "/account/settings", label: "Settings", icon: Settings },
] as const;

export function AccountNav(): React.ReactElement {
  const pathname = usePathname();
  return (
    <nav aria-label="Account">
      <ul className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/account" ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-[var(--radius-md)] px-4 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-white font-medium text-[var(--color-graphite)] shadow-[var(--shadow-1)]"
                    : "text-[var(--color-neutral-600)] hover:bg-white/60 hover:text-[var(--color-graphite)]",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
