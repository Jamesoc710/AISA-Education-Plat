"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

const MAX_ROLE_LEN = 60;

/**
 * Accept (with an inline role) / Decline controls for one pending join request.
 * Shared by the project detail moderation panel and the board-wide stale-requests
 * view. On success it refreshes the server component so the request moves out of
 * the pending state and, for an accept, the member appears on the team.
 */
export function RequestControls({
  projectId,
  interestId,
}: {
  projectId: string;
  interestId: string;
}) {
  const router = useRouter();
  const [role, setRole] = useState("Contributor");
  const [busy, setBusy] = useState<null | "accept" | "decline">(null);
  const [error, setError] = useState<string | null>(null);

  async function act(kind: "accept" | "decline") {
    setBusy(kind);
    setError(null);
    try {
      const res = await fetch(`/api/build/projects/${projectId}/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          kind === "accept" ? { interestId, role: role.trim() || "Contributor" } : { interestId },
        ),
      });
      if (!res.ok) {
        const b = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(b.error || "Action failed");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(null);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", marginTop: "var(--space-3)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
        <input
          value={role}
          onChange={(e) => setRole(e.target.value)}
          aria-label="Role on the team"
          maxLength={MAX_ROLE_LEN}
          placeholder="Role"
          disabled={busy !== null}
          style={{
            width: 130,
            padding: "6px 10px",
            fontSize: "var(--text-sm)",
            fontFamily: "inherit",
            color: "var(--color-text)",
            backgroundColor: "var(--color-bg)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-2)",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        <Button onClick={() => act("accept")} disabled={busy !== null} leftIcon={<Icon name="check-circle" size={14} />}>
          {busy === "accept" ? "Adding..." : "Accept"}
        </Button>
        <Button variant="ghost" onClick={() => act("decline")} disabled={busy !== null}>
          {busy === "decline" ? "Declining..." : "Decline"}
        </Button>
      </div>
      {error && (
        <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-incorrect)" }}>{error}</p>
      )}
    </div>
  );
}

/** Quiet status chip for a join request (pending / accepted / declined). */
export function RequestStatusChip({ status }: { status: string }) {
  const meta =
    status === "accepted"
      ? { label: "Accepted", fg: "var(--color-correct)", bg: "var(--color-correct-dim)" }
      : status === "declined"
        ? { label: "Declined", fg: "var(--color-text-3)", bg: "var(--color-surface-3)" }
        : { label: "Pending", fg: "var(--color-gold)", bg: "var(--color-gold-soft)" };
  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: "var(--text-xs)",
        fontWeight: 600,
        color: meta.fg,
        backgroundColor: meta.bg,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        whiteSpace: "nowrap",
      }}
    >
      {meta.label}
    </span>
  );
}
