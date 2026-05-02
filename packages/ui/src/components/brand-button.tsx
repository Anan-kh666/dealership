import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

const brandButtonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium",
    "rounded-[var(--radius-md)]",
    "transition-[background-color,color,border-color,transform,box-shadow]",
    "duration-[var(--duration-standard)] ease-[var(--ease-out-soft)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-deep)]",
        secondary:
          "bg-[var(--color-graphite)] text-white hover:bg-[var(--color-neutral-800)]",
        "ghost-light":
          "border border-white/60 bg-transparent text-white hover:bg-white/10",
        "ghost-dark":
          "border border-[var(--color-graphite)]/30 bg-transparent text-[var(--color-graphite)] hover:bg-[var(--color-graphite)]/5",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-6 text-[15px]",
        lg: "h-14 px-8 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface BrandButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof brandButtonVariants> {
  asChild?: boolean;
}

export const BrandButton = React.forwardRef<HTMLButtonElement, BrandButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(brandButtonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
BrandButton.displayName = "BrandButton";

export { brandButtonVariants };
