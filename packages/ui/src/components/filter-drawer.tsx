"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "../lib/cn";

/**
 * Mobile-only modal wrapper for the stock filter sidebar. Slides up from the
 * bottom and fills the viewport height. Uses Radix Dialog so focus trap and
 * ESC handling come for free.
 */

export const FilterDrawer = DialogPrimitive.Root;
export const FilterDrawerTrigger = DialogPrimitive.Trigger;
export const FilterDrawerClose = DialogPrimitive.Close;

export const FilterDrawerContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    title?: string;
  }
>(({ className, children, title = "Filters", ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay
      className={cn(
        "fixed inset-0 z-50 bg-black/50",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      )}
    />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 flex h-[92vh] flex-col rounded-t-[var(--radius-xl)] border-t border-[var(--color-neutral-200)] bg-white shadow-[var(--shadow-4)]",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
        "duration-[var(--duration-reveal)]",
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between border-b border-[var(--color-neutral-200)] px-5 py-4">
        <DialogPrimitive.Title className="text-sm font-medium uppercase tracking-[0.16em] text-[var(--color-neutral-700)]">
          {title}
        </DialogPrimitive.Title>
        <DialogPrimitive.Close
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-100)]"
          aria-label="Close filters"
        >
          <X className="h-4 w-4" />
        </DialogPrimitive.Close>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
FilterDrawerContent.displayName = "FilterDrawerContent";
