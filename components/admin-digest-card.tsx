"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { IconTile } from "@/components/ui/icon-tile";
import { StatusTag } from "@/components/ui/status-tag";

export interface DigestEditionSummary {
  id: string;
  weekOf: string; // ISO
  status: string; // draft | published
  headline: string;
  itemCount: number;
  generatedAt: string; // ISO
  searchesUsed: number | null;
  durationMs: number | null;
}

interface AdminDigestCardProps {
  edition: DigestEditionSummary | null;
}

function relativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

/** Amber nudge when a draft has sat unreviewed past 48h. */
function DraftAgeHint({ generatedAt }: { generatedAt: string }) {
  const days = Math.floor((Date.now() - new Date(generatedAt).getTime()) / 86400000);
  if (days < 2) return null;
  return (
    <span suppressHydrationWarning style={{ color: "var(--color-gold)", fontWeight: 600 }}>
      {" "}· awaiting review for {days}d
    </span>
  );
}

function weekLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/**
 * "This Week in Tech" controls on the admin Overview, next to the calendar's
 * Sync now card. The cron and "Generate now" both write DRAFTS; an admin
 * reviews (/digest?preview=draft) and publishes from here.
 */
export function AdminDigestCard({ edition }: AdminDigestCardProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<"generate" | "publish" | null>(null);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function handleGenerate() {
    setBusy("generate");
    setResult(null);
    try {
      const res = await fetch("/api/admin/digest", { method: "POST" });
      const json = await res.json();
      if (json.ok) {
        const messages: Record<string, string> = {
          created: `Draft generated: ${json.itemCount} items (${json.searchesUsed} searches)`,
          updated: `Draft regenerated: ${json.itemCount} items (${json.searchesUsed} searches)`,
          cached: "No changes (content matches the existing edition)",
          skipped_published: "Already published. Unpublish first to regenerate",
        };
        setResult({ ok: true, message: messages[json.outcome] ?? json.outcome });
        router.refresh();
      } else {
        setResult({ ok: false, message: json.errors?.[0] ?? json.error ?? "Generation failed" });
      }
    } catch (e) {
      setResult({ ok: false, message: e instanceof Error ? e.message : "Generation failed" });
    } finally {
      setBusy(null);
    }
  }

  async function handlePublishToggle() {
    if (!edition) return;
    const action = edition.status === "published" ? "unpublish" : "publish";
    setBusy("publish");
    setResult(null);
    try {
      const res = await fetch("/api/admin/digest", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: edition.id, action }),
      });
      const json = await res.json();
      if (json.ok) {
        setResult({ ok: true, message: action === "publish" ? "Published" : "Unpublished" });
        router.refresh();
      } else {
        setResult({ ok: false, message: json.error ?? `${action} failed` });
      }
    } catch (e) {
      setResult({ ok: false, message: e instanceof Error ? e.message : `${action} failed` });
    } finally {
      setBusy(null);
    }
  }

  const buttonStyle = (disabled: boolean): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "var(--space-2)",
    padding: "8px 14px",
    fontSize: "var(--text-sm)",
    fontWeight: 600,
    fontFamily: "inherit",
    color: "var(--color-text)",
    backgroundColor: "var(--color-surface-2)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-2)",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    textDecoration: "none",
  });

  return (
    <div
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-3)",
        padding: "16px 20px",
        boxShadow: "var(--shadow-card)",
        marginBottom: "var(--space-4)",
        display: "flex",
        alignItems: "center",
        gap: "var(--space-4)",
      }}
    >
      <IconTile icon="newspaper" color="sky" size="sm" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
            marginBottom: "var(--space-1)",
          }}
        >
          <span
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: 600,
              color: "var(--color-text)",
            }}
          >
            This Week in Tech
          </span>
          {edition && (
            <StatusTag
              tone={edition.status === "published" ? "green" : "blue"}
              style={{ textTransform: "capitalize" }}
            >
              {edition.status}
            </StatusTag>
          )}
        </div>
        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-3)" }}>
          {edition ? (
            <>
              Week of {weekLabel(edition.weekOf)} · {edition.itemCount} items ·{" "}
              {/* relative time drifts between SSR and hydration; keep the client value */}
              <span suppressHydrationWarning>
                generated {relativeTime(edition.generatedAt)}
              </span>
              {edition.searchesUsed != null && edition.durationMs != null && (
                <>
                  {" · "}
                  {edition.searchesUsed} searches · {Math.round(edition.durationMs / 1000)}s
                </>
              )}
              {edition.status === "draft" && (
                <DraftAgeHint generatedAt={edition.generatedAt} />
              )}
            </>
          ) : (
            "No editions yet. Generate the first draft"
          )}
          {result && (
            <span
              style={{
                marginLeft: "var(--space-3)",
                color: result.ok ? "var(--color-correct)" : "var(--color-incorrect)",
                fontWeight: 600,
              }}
            >
              · {result.message}
            </span>
          )}
        </div>
      </div>
      {edition?.status === "draft" && (
        <Link href="/digest?preview=draft" style={buttonStyle(false)}>
          <Icon name="eye" size={14} />
          Review draft
        </Link>
      )}
      {edition && (
        <button
          type="button"
          onClick={handlePublishToggle}
          disabled={busy !== null}
          style={buttonStyle(busy !== null)}
        >
          <Icon name={edition.status === "published" ? "eye-slash" : "check-circle"} size={14} />
          {busy === "publish"
            ? "Working..."
            : edition.status === "published"
              ? "Unpublish"
              : "Publish"}
        </button>
      )}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={busy !== null}
        style={buttonStyle(busy !== null)}
      >
        <Icon name="sparkle" size={14} />
        {busy === "generate" ? "Generating..." : "Generate now"}
      </button>
    </div>
  );
}
