"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarClock,
  Car,
  Gauge,
  Landmark,
  MessageSquare,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@dealership/ui/lib/cn";

export interface AdminNavCounts {
  testDrives: number;
  financing: number;
  tradeIns: number;
  inquiries: number;
}

const ITEMS: { href: string; label: string; icon: LucideIcon; count?: keyof AdminNavCounts }[] = [
  { href: "/admin", label: "Overview", icon: Gauge },
  { href: "/admin/test-drives", label: "Test drives", icon: CalendarClock, count: "testDrives" },
  { href: "/admin/financing", label: "Financing", icon: Landmark, count: "financing" },
  { href: "/admin/trade-ins", label: "Trade-ins", icon: Car, count: "tradeIns" },
  { href: "/admin/inquiries", label: "Enquiries", icon: MessageSquare, count: "inquiries" },
  { href: "/admin/inventory", label: "Inventory", icon: Warehouse },
];

export function AdminNav({ counts }: { counts: AdminNavCounts }): React.ReactElement {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="px-3 pb-3 lg:pb-0">
      <ul className="flex gap-1 overflow-x-auto lg:flex-col [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {ITEMS.map(({ href, label, icon: Icon, count }) => {
          const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
          const n = count ? counts[count] : 0;
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-[var(--color-graphite)] text-white"
                    : "text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-100)]",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                <span className="flex-1">{label}</span>
                {n > 0 ? (
                  <span
                    aria-label={`${n} awaiting action`}
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums",
                      active ? "bg-white/20 text-white" : "bg-[var(--color-accent)] text-white",
                    )}
                  >
                    {n}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
