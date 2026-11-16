"use client";

import { ErrorPanel } from "@/components/ui/error-panel";

// Renders inside the (main) shell, so the nav stays usable.
export default function MainError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <ErrorPanel error={error} retry={retry} />;
}
