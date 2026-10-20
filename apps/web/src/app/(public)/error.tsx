"use client";

import { ErrorPanel } from "@/components/error-panel";

/** Page-level boundary — renders inside the public layout, so the header stays. */
export default function PublicError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  return <ErrorPanel {...props} />;
}
