import Link from "next/link";
import { cn } from "@dealership/ui/lib/cn";

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}): React.ReactElement {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-[-0.02em] md:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="text-sm text-[var(--color-neutral-600)]">{description}</p>
        ) : null}
      </div>
      {actions}
    </header>
  );
}

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-[var(--color-neutral-200)] bg-white",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Horizontally scrollable table wrapper with consistent cell styling. */
export function Table({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm [&_td]:px-4 [&_td]:py-3 [&_td]:align-top [&_th]:px-4 [&_th]:py-3 [&_th]:text-xs [&_th]:font-medium [&_th]:uppercase [&_th]:tracking-[0.12em] [&_th]:text-[var(--color-neutral-500)] [&_tbody_tr]:border-t [&_tbody_tr]:border-[var(--color-neutral-200)] [&_tbody_tr:hover]:bg-[var(--color-neutral-50)] [&_thead]:bg-[var(--color-surface-warm)]">
          {children}
        </table>
      </div>
    </Card>
  );
}

export function EmptyRow({
  colSpan,
  children,
}: {
  colSpan: number;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <tr>
      <td colSpan={colSpan} className="!py-12 text-center text-[var(--color-neutral-500)]">
        {children}
      </td>
    </tr>
  );
}

/** Link-based filter tabs (?status=…) so filters survive refresh and sharing. */
export function StatusTabs<T extends string>({
  basePath,
  current,
  options,
  counts,
  query,
}: {
  basePath: string;
  current: T | null;
  options: { value: T; label: string }[];
  counts?: Partial<Record<T | "ALL", number>>;
  /** Extra params to keep on every tab link (e.g. { when: "past" }). */
  query?: Record<string, string>;
}): React.ReactElement {
  const tabs: { value: T | null; label: string; count: number | undefined }[] = [
    { value: null, label: "All", count: counts?.ALL },
    ...options.map((o) => ({ value: o.value, label: o.label, count: counts?.[o.value] })),
  ];
  return (
    <nav aria-label="Filter by status" className="-mx-1 flex flex-wrap gap-1">
      {tabs.map((t) => {
        const active = t.value === current;
        const params = new URLSearchParams(query);
        if (t.value) params.set("status", t.value);
        const qs = params.toString();
        const href = qs ? `${basePath}?${qs}` : basePath;
        return (
          <Link
            key={t.label}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
              active
                ? "border-[var(--color-graphite)] bg-[var(--color-graphite)] text-white"
                : "border-[var(--color-neutral-200)] bg-white text-[var(--color-neutral-700)] hover:border-[var(--color-neutral-300)]",
            )}
          >
            {t.label}
            {typeof t.count === "number" ? (
              <span
                className={cn(
                  "tabular-nums",
                  active ? "text-white/70" : "text-[var(--color-neutral-500)]",
                )}
              >
                {t.count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function Muted({ children }: { children: React.ReactNode }): React.ReactElement {
  return <span className="text-xs text-[var(--color-neutral-500)]">{children}</span>;
}

/** Parse ?status= against an allowed list. */
export function parseStatus<T extends string>(
  raw: string | undefined,
  allowed: readonly T[],
): T | null {
  return raw && (allowed as readonly string[]).includes(raw) ? (raw as T) : null;
}
