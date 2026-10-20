import { cn } from "@dealership/ui/lib/cn";

/**
 * Typographic styles for long-form copy (articles, policies). Styles plain
 * child elements so pages can write ordinary JSX.
 */
export function Prose({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <div
      className={cn(
        "max-w-[68ch] text-[17px] leading-[1.75] text-[var(--color-neutral-700)]",
        "[&_p]:my-5",
        "[&_h2]:mb-4 [&_h2]:mt-12 [&_h2]:font-[family-name:var(--font-display)] [&_h2]:text-[28px] [&_h2]:leading-tight [&_h2]:tracking-[-0.02em] [&_h2]:text-[var(--color-graphite)]",
        "[&_h3]:mb-3 [&_h3]:mt-8 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-[var(--color-graphite)]",
        "[&_ul]:my-5 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1.5 [&_li]:pl-1",
        "[&_a]:text-[var(--color-accent-deep)] [&_a]:underline [&_a]:underline-offset-4",
        "[&_strong]:font-semibold [&_strong]:text-[var(--color-graphite)]",
        "[&_blockquote]:my-10 [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--color-accent)] [&_blockquote]:pl-6 [&_blockquote]:font-[family-name:var(--font-display)] [&_blockquote]:text-[26px] [&_blockquote]:leading-snug [&_blockquote]:tracking-[-0.01em] [&_blockquote]:text-[var(--color-graphite)]",
        "[&>*:first-child]:mt-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
