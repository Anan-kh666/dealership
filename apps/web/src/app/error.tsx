"use client";

import { ErrorPanel } from "@/components/error-panel";

/** Last-resort boundary (renders inside the root layout only). */
export default function RootError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  return (
    <main id="main" className="flex-1">
      <ErrorPanel {...props} />
    </main>
  );
}
