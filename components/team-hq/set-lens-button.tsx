"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * "Set as your active lens" for a content-bearing team. Reuses POST /api/track,
 * which sets the tco-track cookie that silently scopes browse, quiz, and home.
 * Setting the lens is NOT joining: it never writes membership.
 */
export function SetLensButton({
  trackSlug,
  isActive,
}: {
  trackSlug: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (isActive) {
    return (
      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-3)" }}>
        Your active lens
      </span>
    );
  }

  const setLens = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: trackSlug }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={setLens}
      disabled={busy}
      style={{
        border: "none",
        background: "none",
        padding: 0,
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: "var(--text-sm)",
        fontWeight: 500,
        color: "var(--color-text-2)",
        textDecoration: "underline",
      }}
    >
      Set as your active lens
    </button>
  );
}
