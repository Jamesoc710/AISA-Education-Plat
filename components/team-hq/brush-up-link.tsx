"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "@/components/ui/editorial";

/**
 * The Refresher CTA. Practice surfaces (flashcards, quiz) scope by the active
 * lens cookie rather than a URL param, so to land on THIS team's deck we set the
 * team's track as the lens first, then navigate. Reuses POST /api/track.
 */
export function BrushUpLink({ trackSlug }: { trackSlug: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const go = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: trackSlug }),
      });
      router.push("/flashcards");
    } catch {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={go}
      disabled={busy}
      className="editorial-link"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-2)",
        border: "none",
        background: "none",
        padding: 0,
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: "var(--text-base)",
        fontWeight: 600,
        color: "var(--color-accent)",
      }}
    >
      Brush up with flashcards
      <ArrowRight />
    </button>
  );
}
