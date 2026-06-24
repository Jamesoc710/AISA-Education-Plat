"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { IconTile } from "@/components/ui/icon-tile";
import { StatusTag } from "@/components/ui/status-tag";

export interface BenchmarkAdminSummary {
  total: number;
  published: number;
  drafts: number;
}

/**
 * Benchmarks ("The Standings") controls on the admin Overview, beside the
 * digest, calendar, and trend cards. Benchmarks seed as drafts
 * (member-invisible); "Publish all" makes every draft live in one click for the
 * initial bootstrap. Per-benchmark publish / unpublish lives on each benchmark's
 * own page. Live "Sync now" is deferred to PR2 (the weekly leader cron).
 */
export function AdminBenchmarksCard({ benchmarks }: { benchmarks: BenchmarkAdminSummary }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function publishAll() {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/benchmarks", {
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
      <IconTile icon="ranking" color="indigo" size="sm" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-1)" }}>
          <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)" }}>
            Benchmarks
          </span>
          <StatusTag tone={benchmarks.published > 0 ? "green" : "blue"}>
            {benchmarks.published} live
          </StatusTag>
        </div>
        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-3)" }}>
          {benchmarks.total} benchmark{benchmarks.total === 1 ? "" : "s"} · {benchmarks.drafts} draft
          {benchmarks.drafts === 1 ? "" : "s"}
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
      <Link href="/benchmarks" style={buttonStyle(false)}>
        <Icon name="ranking" size={14} />
        Open standings
      </Link>
      {benchmarks.drafts > 0 && (
        <button type="button" onClick={publishAll} disabled={busy} style={buttonStyle(busy)}>
          <Icon name="check-circle" size={14} />
          {busy ? "Publishing..." : `Publish all (${benchmarks.drafts})`}
        </button>
      )}
    </div>
  );
}
