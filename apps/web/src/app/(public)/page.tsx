export default function HomePage(): React.ReactElement {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-7xl flex-col items-start justify-center gap-6 px-6 py-24">
      <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Coming soon</p>
      <h1 className="font-[family-name:var(--font-fraunces)] text-5xl tracking-tight sm:text-7xl">
        Hello, dealership
      </h1>
      <p className="max-w-xl text-lg text-muted-foreground">
        Foundation scaffold. Pages, configurator, inventory, and finance flows are wired up by the
        next agents.
      </p>
    </section>
  );
}
