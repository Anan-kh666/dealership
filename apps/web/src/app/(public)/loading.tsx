/** Shown while a public page's server data loads (e.g. stock filters). */
export default function PublicLoading(): React.ReactElement {
  return (
    <div role="status" aria-label="Loading" className="pb-24 pt-32 md:pt-40">
      <div className="mx-auto w-full max-w-[1440px] px-4 md:px-6 lg:px-12">
        <div className="flex max-w-2xl flex-col gap-4">
          <div className="h-3 w-24 animate-pulse rounded bg-[var(--color-neutral-200)]" />
          <div className="h-12 w-4/5 animate-pulse rounded bg-[var(--color-neutral-200)]" />
          <div className="h-4 w-3/5 animate-pulse rounded bg-[var(--color-neutral-100)]" />
        </div>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <div className="aspect-[4/3] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-neutral-100)]" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-[var(--color-neutral-100)]" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-[var(--color-neutral-100)]" />
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
