"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { IconTile } from "@/components/ui/icon-tile";
import { StatusTag } from "@/components/ui/status-tag";

export interface TrendTrackerSummary {
  total: number;
  published: number;
  drafts: number;
  lastSyncedAt: string | null; // ISO
}

function relativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

/**
 * Trend Tracker controls on the admin Overview, beside the digest + calendar
 * cards. Trends seed as drafts (member-invisible); "Publish all" makes every
 * draft live in one click for the initial bootstrap. Per-trend publish /
 * unpublish lives on each trend's own page. Live "Sync now" arrives in Phase 4.
 */
export function AdminTrendsCard({ trends }: { trends: TrendTrackerSummary }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function publishAll() {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/trends", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publishAll" }),
      });
      const json = await res.json();
      if (json.ok) {
        setResult({ ok: true, message: `Published ${json.published} draft${json.published === 1 ? "" : "s"}` });
        router.refresh();
      } else {
        setResult({ ok: false, message: json.error ?? "Publish failed" });
      }
    } catch (e) {
      setResult({ ok: false, message: e instanceof Error ? e.message : "Publish failed" });
    } finally {
      setBusy(false);
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
      <IconTile icon="pulse" color="blue" size="sm" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-1)" }}>
          <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)" }}>
            Trend Tracker
          </span>
          <StatusTag tone={trends.published > 0 ? "green" : "blue"}>
            {trends.published} live
          </StatusTag>
        </div>
        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-3)" }}>
          {trends.total} trend{trends.total === 1 ? "" : "s"} · {trends.drafts} draft
          {trends.drafts === 1 ? "" : "s"}
          {trends.lastSyncedAt && (
            <span suppressHydrationWarning> · synced {relativeTime(trends.lastSyncedAt)}</span>
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
      <Link href="/trends" style={buttonStyle(false)}>
        <Icon name="pulse" size={14} />
        Open tracker
      </Link>
      {trends.drafts > 0 && (
        <button type="button" onClick={publishAll} disabled={busy} style={buttonStyle(busy)}>
          <Icon name="check-circle" size={14} />
          {busy ? "Publishing..." : `Publish all (${trends.drafts})`}
        </button>
      )}
    </div>
  );
}
