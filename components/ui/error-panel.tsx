"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { IconTile } from "@/components/ui/icon-tile";

/**
 * Fallback shown by the route error boundaries. The real error is logged
 * (Vercel captures console.error); members only see that something failed,
 * a way to retry, and a way out.
 */
export function ErrorPanel({
  error,
  retry,
  homeHref = "/browse",
  homeLabel = "Back to Browse",
}: {
  error: Error & { digest?: string };
  retry: () => void;
  homeHref?: string;
  homeLabel?: string;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      role="alert"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "80px var(--pad-page-x) 48px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-3)",
          boxShadow: "var(--shadow-card)",
          padding: "32px 32px 28px",
          textAlign: "center",
        }}
      >
        <div style={{ display: "inline-flex", marginBottom: "var(--space-4)" }}>
          <IconTile icon="warning" color="amber" size="lg" />
        </div>
        <h1
          style={{
            margin: "0 0 8px",
            fontSize: "var(--text-lg)",
            fontWeight: 600,
            color: "var(--color-text)",
            letterSpacing: "-0.015em",
          }}
        >
          Something went wrong
        </h1>
        <p
          style={{
            margin: "0 0 24px",
            fontSize: "var(--text-base)",
            color: "var(--color-text-2)",
            lineHeight: 1.55,
          }}
        >
          This page didn&apos;t load. It&apos;s on our side, not yours. Try again, and if it keeps
          happening let a TCO lead know.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <Button variant="primary" size="md" onClick={() => retry()} fullWidth>
            Try again
          </Button>
          <Link
            href={homeHref}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              height: 36,
              fontSize: "var(--text-sm)",
              fontWeight: 500,
              color: "var(--color-text-2)",
              textDecoration: "none",
            }}
          >
            {homeLabel}
          </Link>
        </div>
        {error.digest && (
          <p style={{ margin: "16px 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-3)" }}>
            Reference: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
