import Link from "next/link";
import { BrandButton } from "@dealership/ui/components/brand-button";
import { cn } from "@dealership/ui/lib/cn";

export function Panel({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <section
      className={cn(
        "rounded-[var(--radius-lg)] border border-[var(--color-neutral-200)] bg-white",
        className,
      )}
    >
      {title ? (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--color-neutral-200)] px-6 py-5">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-xl tracking-[-0.02em]">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm text-[var(--color-neutral-600)]">{description}</p>
            ) : null}
          </div>
          {action}
        </header>
      ) : null}
      {children}
    </section>
  );
}

export function EmptyState({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta?: { href: string; label: string };
}): React.ReactElement {
  return (
    <div className="flex flex-col items-start gap-3 px-6 py-10">
      <p className="font-[family-name:var(--font-display)] text-lg tracking-[-0.02em]">{title}</p>
      <p className="max-w-md text-sm text-[var(--color-neutral-600)]">{body}</p>
      {cta ? (
        <BrandButton asChild variant="primary" size="sm" className="mt-2">
          <Link href={cta.href}>{cta.label}</Link>
        </BrandButton>
      ) : null}
    </div>
  );
}

/** One row in an account list: primary text left, meta + status right. */
export function Row({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <li className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      {children}
    </li>
  );
}

export function List({ children }: { children: React.ReactNode }): React.ReactElement {
  return <ul className="divide-y divide-[var(--color-neutral-200)]">{children}</ul>;
}
