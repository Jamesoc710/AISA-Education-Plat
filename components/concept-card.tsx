"use client";

import { useState } from "react";
import type { ConceptData } from "@/lib/types";

const TIER_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  fundamentals: { color: "#e8b54a", bg: "rgba(232,181,74,0.10)", label: "Fundamentals" },
  intermediate:  { color: "#6b9bd2", bg: "rgba(107,155,210,0.10)", label: "Intermediate" },
  advanced:      { color: "#8b8b9e", bg: "rgba(139,139,158,0.10)", label: "Advanced" },
};

export function ConceptCard({
  concept,
  bookmarked,
  onToggleBookmark,
}: {
  concept: ConceptData;
  bookmarked: boolean;
  onToggleBookmark: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const tier = TIER_STYLES[concept.tier.slug] ?? TIER_STYLES.fundamentals;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        backgroundColor: hovered ? "var(--color-surface)" : "var(--color-bg)",
        border: `1px solid ${hovered ? "var(--color-border)" : "var(--color-border-subtle)"}`,
        borderRadius: "8px",
        padding: "14px 16px 13px",
        cursor: "default",
        transition: "background-color 0.12s, border-color 0.12s",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        minHeight: "120px",
      }}
    >
      {/* ── Top row: tier badge + bookmark ─────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <TierBadge tier={concept.tier.slug} styles={tier} />
        <BookmarkButton
          bookmarked={bookmarked}
          visible={hovered || bookmarked}
          onClick={() => onToggleBookmark(concept.id)}
        />
      </div>

      {/* ── Name ───────────────────────────────────────────── */}
      <h3
        style={{
          margin: 0,
          fontSize: "13.5px",
          fontWeight: 500,
          color: "var(--color-text)",
          lineHeight: "1.35",
          letterSpacing: "-0.01em",
        }}
      >
        {concept.name}
      </h3>

      {/* ── Subtitle ────────────────────────────────────────── */}
      <p
        style={{
          margin: 0,
          fontSize: "12px",
          color: "var(--color-text-2)",
          lineHeight: "1.5",
          flex: 1,
        }}
      >
        {concept.subtitle}
      </p>

      {/* ── Footer: related tags + meta ─────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "auto" }}>
        {/* Related concept tags */}
        {concept.relatedConcepts.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
            {concept.relatedConcepts.slice(0, 4).map((r) => (
              <span
                key={r.slug}
                style={{
                  fontSize: "11px",
                  color: "var(--color-text-3)",
                  backgroundColor: "var(--color-surface-2)",
                  border: "1px solid var(--color-border-subtle)",
                  borderRadius: "4px",
                  padding: "1px 6px",
                  lineHeight: "1.6",
                  whiteSpace: "nowrap",
                }}
              >
                {r.name}
              </span>
            ))}
            {concept.relatedConcepts.length > 4 && (
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--color-text-3)",
                  padding: "1px 4px",
                  lineHeight: "1.6",
                }}
              >
                +{concept.relatedConcepts.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Resource + question counts */}
        <div style={{ display: "flex", gap: "10px" }}>
          {concept.resourceCount > 0 && (
            <MetaPill
              icon={
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              }
              label={`${concept.resourceCount} resource${concept.resourceCount !== 1 ? "s" : ""}`}
            />
          )}
          {concept.questionCount > 0 && (
            <MetaPill
              icon={
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              }
              label={`${concept.questionCount} question${concept.questionCount !== 1 ? "s" : ""}`}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TierBadge({
  tier,
  styles,
}: {
  tier: string;
  styles: { color: string; bg: string; label: string };
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        fontSize: "11px",
        fontWeight: 500,
        color: styles.color,
        backgroundColor: styles.bg,
        borderRadius: "4px",
        padding: "2px 7px",
        letterSpacing: "0.02em",
        lineHeight: 1.5,
      }}
    >
      <span
        style={{
          width: "5px",
          height: "5px",
          borderRadius: "50%",
          backgroundColor: styles.color,
          flexShrink: 0,
        }}
      />
      {styles.label}
    </span>
  );
}

function BookmarkButton({
  bookmarked,
  visible,
  onClick,
}: {
  bookmarked: boolean;
  visible: boolean;
  onClick: () => void;
}) {
  const [btnHovered, setBtnHovered] = useState(false);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onMouseEnter={() => setBtnHovered(true)}
      onMouseLeave={() => setBtnHovered(false)}
      title={bookmarked ? "Remove bookmark" : "Bookmark this concept"}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "24px",
        height: "24px",
        border: "none",
        background: "none",
        cursor: "pointer",
        padding: 0,
        borderRadius: "4px",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.1s",
        color: bookmarked
          ? "#e8b54a"
          : btnHovered
          ? "var(--color-text-2)"
          : "var(--color-text-3)",
      }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  );
}

function MetaPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        fontSize: "11px",
        color: "var(--color-text-3)",
        lineHeight: 1,
      }}
    >
      {icon}
      {label}
    </span>
  );
}
