"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { DropView } from "@/lib/team-data";

/**
 * One Brilliant-style bordered row on The Drop. Shared by the in-module 3-item
 * view and the full board. Member rows carry the poster monogram and a single
 * "good find" reaction; system "radar" rows carry a Radar tag and no reaction
 * (the reaction is per-drop only and is never aggregated per person).
 */
export function DropRow({
  drop,
  teamSlug,
  isLoggedIn,
}: {
  drop: DropView;
  teamSlug: string;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [count, setCount] = useState(drop.reactionCount);
  const [reacted, setReacted] = useState(drop.reacted);
  const [removed, setRemoved] = useState(false);
  const [busy, setBusy] = useState(false);

  const toggleReaction = async () => {
    if (busy) return;
    if (!isLoggedIn) {
      window.location.href = `/login?redirect=/teams/${teamSlug}`;
      return;
    }
    const prevReacted = reacted;
    const prevCount = count;
    setReacted(!prevReacted);
    setCount(prevCount + (prevReacted ? -1 : 1));
    setBusy(true);
    try {
      const res = await fetch(
        `/api/teams/${teamSlug}/drops/${drop.id}/react`,
        { method: "POST" },
      );
      if (!res.ok) throw new Error();
      const j = (await res.json()) as { reacted?: boolean; count?: number };
      setReacted(!!j.reacted);
      if (typeof j.count === "number") setCount(j.count);
    } catch {
      setReacted(prevReacted);
      setCount(prevCount);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/teams/${teamSlug}/drops/${drop.id}/remove`,
        { method: "POST" },
      );
      if (res.ok) {
        setRemoved(true);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  if (removed) return null;

  return (
    <article
      className="team-card"
      style={{
        position: "relative",
        display: "flex",
        gap: "var(--space-4)",
        alignItems: "flex-start",
        padding: "16px 18px",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-3)",
        backgroundColor: "var(--color-surface)",
      }}
    >
      {/* Full-card click target; the reaction and remove controls sit above it */}
      {drop.external ? (
        <a
          href={drop.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={drop.title}
          style={{ position: "absolute", inset: 0, zIndex: 0 }}
        />
      ) : (
        <Link
          href={drop.url}
          aria-label={drop.title}
          style={{ position: "absolute", inset: 0, zIndex: 0 }}
        />
      )}

      {/* Leading: monogram (member) or a Radar tag (system) */}
      {drop.kind === "member" ? (
        <span
          aria-hidden
          style={{
            width: 38,
            height: 38,
            flexShrink: 0,
            borderRadius: 999,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "var(--color-surface-2)",
            color: "var(--color-text-2)",
            fontSize: "var(--text-sm)",
            fontWeight: 600,
          }}
        >
          {initialsOf(drop.authorName)}
        </span>
      ) : (
        <span
          style={{
            flexShrink: 0,
            marginTop: "2px",
            fontSize: "var(--text-xs)",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--color-text-3)",
            border: "1px solid var(--color-border)",
            borderRadius: 999,
            padding: "3px 9px",
            whiteSpace: "nowrap",
          }}
        >
          Radar
        </span>
      )}

      {/* Main: headline link, the take, and the meta line */}
      <div style={{ minWidth: 0, flex: 1 }}>
        <span className="team-card-title" style={titleStyle}>
          {drop.title}
        </span>
        <p
          style={{
            margin: "6px 0 0",
            fontSize: "var(--text-base)",
            color: "var(--color-text-2)",
            lineHeight: 1.5,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical" as const,
            overflow: "hidden",
          }}
        >
          {drop.note}
        </p>
        <div
          style={{
            marginTop: "var(--space-3)",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            flexWrap: "wrap",
            fontSize: "var(--text-xs)",
            color: "var(--color-text-3)",
          }}
        >
          <span>{drop.sourceLabel}</span>
          {drop.authorName && (
            <>
              <Sep />
              <span>{drop.authorName}</span>
            </>
          )}
          <Sep />
          <span>{drop.timeLabel}</span>
          {drop.canRemove && (
            <>
              <Sep />
              <button
                type="button"
                onClick={remove}
                disabled={busy}
                style={{
                  position: "relative",
                  zIndex: 1,
                  border: "none",
                  background: "none",
                  padding: 0,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: "var(--text-xs)",
                  color: "var(--color-text-3)",
                  textDecoration: "underline",
                }}
              >
                Remove
              </button>
            </>
          )}
        </div>
      </div>

      {/* Trailing: the single "good find" reaction (member rows only) */}
      {drop.kind === "member" && (
        <button
          type="button"
          onClick={toggleReaction}
          disabled={busy}
          aria-pressed={reacted}
          title="Good find"
          style={{
            position: "relative",
            zIndex: 1,
            flexShrink: 0,
            alignSelf: "flex-start",
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-2)",
            padding: "6px 12px",
            borderRadius: 999,
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            whiteSpace: "nowrap",
            border: `1px solid ${reacted ? "var(--color-accent)" : "var(--color-border)"}`,
            backgroundColor: reacted ? "var(--color-accent-dim)" : "transparent",
            color: reacted ? "var(--color-accent)" : "var(--color-text-2)",
            transition: "color 120ms ease, border-color 120ms ease, background-color 120ms ease",
          }}
        >
          Good find{count > 0 ? ` ${count}` : ""}
        </button>
      )}
    </article>
  );
}

const titleStyle = {
  display: "inline-block",
  maxWidth: "100%",
  fontSize: "18px",
  fontWeight: 600,
  letterSpacing: "-0.01em",
  lineHeight: 1.3,
  color: "var(--color-text)",
} as const;

function Sep() {
  return <span aria-hidden style={{ color: "var(--color-text-3)" }}>·</span>;
}

function initialsOf(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase();
}
