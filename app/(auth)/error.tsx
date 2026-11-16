"use client";

import { ErrorPanel } from "@/components/ui/error-panel";

export default function AuthError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <ErrorPanel error={error} retry={retry} homeHref="/login" homeLabel="Back to sign in" />;
}
