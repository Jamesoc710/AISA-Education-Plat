"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { IconTile } from "@/components/ui/icon-tile";

interface AdminCalendarSyncProps {
  lastSyncedAt: string | null;
  eventCount: number;
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

export function AdminCalendarSync({ lastSyncedAt, eventCount }: AdminCalendarSyncProps) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function handleSync() {
    setSyncing(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/sync-schedule", { method: "POST" });
      const json = await res.json();
      if (json.ok) {
        setResult({
          ok: true,
          message: `Synced ${json.fetched} events (${json.removed} removed) in ${json.durationMs}ms`,
        });
        router.refresh();
      } else {
        setResult({ ok: false, message: json.error ?? "Sync failed" });
      }
    } catch (e) {
      setResult({
        ok: false,
        message: e instanceof Error ? e.message : "Sync failed",
      });
    } finally {
      setSyncing(false);
    }
  }

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
      <IconTile icon="calendar" color="indigo" size="sm" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            color: "var(--color-text)",
            marginBottom: "var(--space-1)",
          }}
        >
          TCO Master Calendar
        </div>
        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-3)" }}>
          {eventCount} events ·{" "}
          {lastSyncedAt
            ? `last synced ${relativeTime(lastSyncedAt)}`
            : "never synced"}
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
      <button
        type="button"
        onClick={handleSync}
        disabled={syncing}
        style={{
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
          cursor: syncing ? "not-allowed" : "pointer",
          opacity: syncing ? 0.6 : 1,
        }}
      >
        <Icon name="sparkle" size={14} />
        {syncing ? "Syncing..." : "Sync now"}
      </button>
    </div>
  );
}
