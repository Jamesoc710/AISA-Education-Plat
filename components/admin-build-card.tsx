"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { IconTile } from "@/components/ui/icon-tile";
import { StatusTag } from "@/components/ui/status-tag";
import { Button } from "@/components/ui/button";
import { stageMeta } from "@/lib/project-stages";

export interface BuildDraftSummary {
  id: string;
  slug: string;
  title: string;
  blurb: string;
  stage: string;
  author: string | null; // createdBy.name; null for a seeded draft
  createdAt: string;
}

/**
 * Build Board review queue on the admin Overview. Self-serve posts enter as
 * drafts (member-invisible); a moderator approves one here (it goes live and the
 * creator becomes Lead) or denies it (the draft is deleted). Per-project approval
 * also still lives inline on each /build/[slug] page.
 */
export function AdminBuildCard({ drafts }: { drafts: BuildDraftSummary[] }) {
  return (
    <div
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-3)",
        padding: "16px 20px",
        boxShadow: "var(--shadow-card)",
        marginBottom: "var(--space-4)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
        <IconTile icon="hammer" color="indigo" size="sm" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-1)" }}>
            <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)" }}>
              Build Board
            </span>
            <StatusTag tone={drafts.length > 0 ? "accent" : "green"}>
              {drafts.length} pending
            </StatusTag>
          </div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-3)" }}>
            Member posts wait here for review before they appear on the board.
          </div>
        </div>
        <Link
          href="/build"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-2)",
            padding: "8px 14px",
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            color: "var(--color-text)",
            backgroundColor: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-2)",
            textDecoration: "none",
          }}
        >
          <Icon name="arrow-square-out" size={14} />
          Open board
        </Link>
      </div>

      {drafts.length > 0 && (
        <div style={{ marginTop: "var(--space-4)", borderTop: "1px solid var(--color-border-subtle)" }}>
          {drafts.map((d) => (
            <DraftRow key={d.id} draft={d} />
          ))}
        </div>
      )}
    </div>
  );
}

function DraftRow({ draft }: { draft: BuildDraftSummary }) {
  const router = useRouter();
  const [busy, setBusy] = useState<null | "approve" | "deny">(null);
  const [confirmDeny, setConfirmDeny] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function approve() {
    setBusy("approve");
    setError(null);
    try {
      const res = await fetch(`/api/admin/projects/${draft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
      if (!res.ok) {
        const b = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(b.error || "Approve failed");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(null);
    }
  }

  async function deny() {
    setBusy("deny");
    setError(null);
    try {
      const res = await fetch(`/api/admin/projects/${draft.id}`, { method: "DELETE" });
      if (!res.ok) {
        const b = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(b.error || "Deny failed");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(null);
      setConfirmDeny(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "var(--space-4)",
        padding: "var(--space-4) 0",
        borderBottom: "1px solid var(--color-border-subtle)",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-2)", flexWrap: "wrap" }}>
          <Link
            href={`/build/${draft.slug}`}
            style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)", textDecoration: "none" }}
          >
            {draft.title}
          </Link>
          <span
            style={{
              fontSize: "var(--text-xs)",
              fontWeight: 600,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              color: "var(--color-text-3)",
            }}
          >
            {stageMeta(draft.stage).label}
          </span>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-3)" }}>
            by {draft.author ?? "seeded"}
          </span>
        </div>
        <p
          style={{
            margin: "var(--space-1) 0 0",
            fontSize: "var(--text-sm)",
            color: "var(--color-text-2)",
            lineHeight: 1.5,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical" as const,
            overflow: "hidden",
          }}
        >
          {draft.blurb}
        </p>
        {error && (
          <p style={{ margin: "var(--space-2) 0 0", fontSize: "var(--text-xs)", color: "var(--color-incorrect)" }}>
            {error}
          </p>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexShrink: 0 }}>
        {confirmDeny ? (
          <>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-incorrect)", whiteSpace: "nowrap" }}>
              Delete this post?
            </span>
            <Button size="sm" variant="secondary" disabled={busy !== null} onClick={deny}>
              {busy === "deny" ? "Removing..." : "Remove"}
            </Button>
            <Button size="sm" variant="ghost" disabled={busy !== null} onClick={() => setConfirmDeny(false)}>
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="primary" disabled={busy !== null} onClick={approve}>
              {busy === "approve" ? "Approving..." : "Approve"}
            </Button>
            <Button size="sm" variant="ghost" disabled={busy !== null} onClick={() => setConfirmDeny(true)}>
              Deny
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
