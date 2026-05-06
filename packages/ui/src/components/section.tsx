import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

const sectionVariants = cva("w-full", {
  variants: {
    variant: {
      default: "bg-background text-foreground",
      warm: "bg-[var(--color-surface-warm)] text-foreground",
      dark: "bg-[var(--color-graphite)] text-[var(--color-surface)]",
    },
    spacing: {
      tight: "py-12 md:py-16",
      default: "py-16 md:py-24",
      loose: "py-24 md:py-32",
    },
  },
  defaultVariants: { variant: "default", spacing: "default" },
});

export interface SectionProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof sectionVariants> {
  as?: "section" | "div" | "article";
}

export const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ className, variant, spacing, as = "section", ...props }, ref) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Tag: any = as;
    return (
      <Tag
        ref={ref}
        className={cn(sectionVariants({ variant, spacing, className }))}
        {...props}
      />
    );
  },
);
Section.displayName = "Section";
