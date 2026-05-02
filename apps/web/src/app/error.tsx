"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto flex min-h-[50vh] max-w-2xl flex-col items-start justify-center gap-4 px-6">
      <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Error</p>
      <h1 className="font-[family-name:var(--font-fraunces)] text-4xl">Something went wrong</h1>
      <p className="text-muted-foreground">
        An unexpected error occurred. Try again, or head back to the home page.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
      >
        Try again
      </button>
    </section>
  );
}
