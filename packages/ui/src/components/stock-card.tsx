import * as React from "react";
import { cn } from "../lib/cn";

export type StockBadge = "available" | "in-transit" | "arriving-soon";

const BADGE_LABEL: Record<StockBadge, string> = {
  available: "Available now",
  "in-transit": "In transit",
  "arriving-soon": "Arriving soon",
};

const BADGE_STYLE: Record<StockBadge, string> = {
  available:
    "bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20",
  "in-transit":
    "bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/20",
  "arriving-soon":
    "bg-[var(--color-neutral-100)] text-[var(--color-neutral-700)] border-[var(--color-neutral-200)]",
};

export interface StockCardProps extends React.HTMLAttributes<HTMLAnchorElement> {
  trim: string;
  colorName: string;
  colorHex: string;
  price: string;
  href: string;
  image: React.ReactNode;
  badge: StockBadge;
  linkComponent?: React.ElementType;
}

export const StockCard = React.forwardRef<HTMLAnchorElement, StockCardProps>(
  (
    {
      trim,
      colorName,
      colorHex,
      price,
      href,
      image,
      badge,
      linkComponent,
      className,
      ...rest
    },
    ref,
  ) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Link: any = linkComponent ?? "a";
    return (
      <Link
        ref={ref}
        href={href}
        className={cn(
          "group block overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-neutral-200)] bg-card",
          "shadow-[var(--shadow-1)] transition-[transform,box-shadow] duration-[var(--duration-standard)] ease-[var(--ease-out-soft)]",
          "hover:-translate-y-1 hover:shadow-[var(--shadow-2)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2",
          className,
        )}
        {...rest}
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--color-neutral-100)]">
          <span
            className={cn(
              "absolute left-3 top-3 z-10 inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.08em]",
              BADGE_STYLE[badge],
            )}
          >
            {BADGE_LABEL[badge]}
          </span>
          <div className="absolute inset-0 transition-transform duration-[var(--duration-reveal)] ease-[var(--ease-out-soft)] group-hover:scale-[1.03]">
            {image}
          </div>
        </div>
        <div className="flex flex-col gap-2 p-5">
          <h3 className="font-[family-name:var(--font-display)] text-xl tracking-[-0.02em] text-foreground">
            {trim}
          </h3>
          <div className="flex items-center gap-2 text-sm text-[var(--color-neutral-600)]">
            <span
              aria-hidden
              className="inline-block h-3 w-3 rounded-full border border-black/10"
              style={{ backgroundColor: colorHex }}
            />
            <span>{colorName}</span>
          </div>
          <p className="pt-1 font-[family-name:var(--font-display)] text-lg tabular-nums text-foreground">
            {price}
          </p>
        </div>
      </Link>
    );
  },
);
StockCard.displayName = "StockCard";
