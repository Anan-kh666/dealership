import * as React from "react";
import { cn } from "../lib/cn";

export type ColorSwatchSize = "sm" | "md" | "lg";

const SIZE_CLASS: Record<ColorSwatchSize, string> = {
  sm: "h-5 w-5",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

export interface ColorSwatchProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  hex: string;
  name: string;
  selected?: boolean;
  size?: ColorSwatchSize;
}

export const ColorSwatch = React.forwardRef<HTMLButtonElement, ColorSwatchProps>(
  ({ hex, name, selected = false, size = "md", className, onClick, ...rest }, ref) => {
    const interactive = typeof onClick === "function";
    const Component = (interactive ? "button" : "span") as React.ElementType;
    return (
      <Component
        ref={ref}
        type={interactive ? "button" : undefined}
        aria-label={name}
        aria-pressed={interactive ? selected : undefined}
        title={name}
        onClick={onClick}
        className={cn(
          "relative inline-flex shrink-0 items-center justify-center rounded-full",
          SIZE_CLASS[size],
          interactive
            ? "transition-[box-shadow,transform] duration-[var(--duration-standard)] ease-[var(--ease-out-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 hover:scale-105"
            : "",
          className,
        )}
        {...rest}
      >
        <span
          className={cn(
            "h-full w-full rounded-full border border-black/10 shadow-inner",
          )}
          style={{ backgroundColor: hex }}
        />
        {selected ? (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-[-3px] rounded-full ring-2 ring-[var(--color-accent)]"
          />
        ) : null}
      </Component>
    );
  },
);
ColorSwatch.displayName = "ColorSwatch";
