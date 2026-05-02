import Link from "next/link";

export default function NotFound(): React.ReactElement {
  return (
    <section className="mx-auto flex min-h-[50vh] max-w-2xl flex-col items-start justify-center gap-4 px-6">
      <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">404</p>
      <h1 className="font-[family-name:var(--font-fraunces)] text-4xl">Page not found</h1>
      <p className="text-muted-foreground">
        The page you&apos;re looking for has moved or doesn&apos;t exist.
      </p>
      <Link href="/" className="text-sm underline underline-offset-4">
        Back to home
      </Link>
    </section>
  );
}
