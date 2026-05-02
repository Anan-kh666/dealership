import * as React from "react";
import { cn } from "../lib/cn";

/**
 * Mirrors the Prisma StockStatus enum without importing it (keeps this
 * package framework-agnostic and lets the API/web layers pass strings).
 */
export type StockStatusValue = "AVAILABLE" | "RESERVED" | "SOLD" | "IN_TRANSIT";

const STYLE: Record<StockStatusValue, string> = {
  AVAILABLE:
    "bg-[var(--color-accent)]/10 text-[var(--color-accent-deep)] border-[var(--color-accent)]/30",
  IN_TRANSIT:
    "bg-[var(--color-neutral-100)] text-[var(--color-neutral-700)] border-[var(--color-neutral-200)]",
  RESERVED:
    "bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/30",
  SOLD: "bg-[var(--color-neutral-200)] text-[var(--color-neutral-600)] border-[var(--color-neutral-300)]",
};

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StockStatusValue;
  /** Days since arrival; used to compose copy for IN_TRANSIT and to surface a "X days on lot" tag for AVAILABLE > 14d. */
  daysOnLot?: number;
  /** When IN_TRANSIT, how many days until expected delivery. */
  daysUntilDelivery?: number;
}

function label(
  status: StockStatusValue,
  daysUntilDelivery?: number,
): string {
  switch (status) {
    case "AVAILABLE":
      return "Available now";
    case "IN_TRANSIT":
      if (typeof daysUntilDelivery === "number" && daysUntilDelivery > 0) {
        return `Arriving in ${daysUntilDelivery} day${daysUntilDelivery === 1 ? "" : "s"}`;
      }
      return "In transit";
    case "RESERVED":
      return "Reserved";
    case "SOLD":
      return "Sold";
  }
}

export const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, daysOnLot, daysUntilDelivery, className, ...rest }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.08em]",
          STYLE[status],
          className,
        )}
        {...rest}
      >
        {label(status, daysUntilDelivery)}
        {status === "AVAILABLE" && typeof daysOnLot === "number" && daysOnLot > 14 ? (
          <span className="text-[10px] font-normal opacity-75">
            · {daysOnLot}d on lot
          </span>
        ) : null}
      </span>
    );
  },
);
StatusBadge.displayName = "StatusBadge";
