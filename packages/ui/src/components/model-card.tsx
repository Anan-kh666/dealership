import * as React from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "../lib/cn";

export interface ModelCardProps extends React.HTMLAttributes<HTMLAnchorElement> {
  name: string;
  bodyType: string;
  startingPrice: string;
  href: string;
  image: React.ReactNode;
  linkComponent?: React.ElementType;
}

export const ModelCard = React.forwardRef<HTMLAnchorElement, ModelCardProps>(
  (
    {
      name,
      bodyType,
      startingPrice,
      href,
      image,
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
          "group block overflow-hidden rounded-[var(--radius-lg)]",
          "transition-[transform,box-shadow] duration-[var(--duration-standard)] ease-[var(--ease-out-soft)]",
          "hover:-translate-y-1",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2",
          className,
        )}
        {...rest}
      >
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-[var(--color-neutral-100)]">
          <div className="absolute inset-0 transition-transform duration-[var(--duration-reveal)] ease-[var(--ease-out-soft)] group-hover:scale-[1.03]">
            {image}
          </div>
        </div>
        <div className="flex items-end justify-between gap-4 pt-5">
          <div className="flex flex-col gap-1">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-neutral-500)]">
              {bodyType}
            </p>
            <h3 className="font-[family-name:var(--font-display)] text-2xl tracking-[-0.02em] text-foreground">
              {name}
            </h3>
            <p className="font-[family-name:var(--font-sans)] text-sm tabular-nums text-[var(--color-neutral-600)]">
              From {startingPrice}
            </p>
          </div>
          <span
            aria-hidden
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--color-neutral-200)] text-[var(--color-graphite)] transition-transform duration-[var(--duration-standard)] ease-[var(--ease-out-soft)] group-hover:translate-x-1 group-hover:border-[var(--color-accent)] group-hover:text-[var(--color-accent)]"
          >
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </Link>
    );
  },
);
ModelCard.displayName = "ModelCard";
