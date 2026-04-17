"use client";

import { useState } from "react";
import Link from "next/link";
import type { ConceptData } from "@/lib/types";

const TIER_COLORS: Record<string, string> = {
  fundamentals: "#e8b54a",
  intermediate: "#6b9bd2",
  advanced: "#8b8b9e",
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
  const tierColor = TIER_COLORS[concept.tier.slug] ?? TIER_COLORS.fundamentals;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        backgroundColor: hovered ? "var(--color-surface)" : "var(--color-bg)",
        border: `1px solid ${hovered ? "var(--color-border)" : "var(--color-border-subtle)"}`,
        borderRadius: "8px",
        transition: "background-color 0.12s, border-color 0.12s",
      }}
    >
      {/* Bookmark button — absolute so it isn't inside the Link */}
      <div style={{ position: "absolute", top: "12px", right: "12px", zIndex: 1 }}>
        <BookmarkButton
          bookmarked={bookmarked}
          visible={hovered || bookmarked}
          onClick={() => onToggleBookmark(concept.id)}
        />
      </div>

      <Link
        href={`/concepts/${concept.slug}`}
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "10px",
          padding: "14px 16px",
          textDecoration: "none",
          color: "inherit",
        }}
      >
        {/* Tier dot */}
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            backgroundColor: tierColor,
            flexShrink: 0,
            marginTop: "7px",
          }}
        />

        {/* Name + 2-line description */}
        <div style={{ flex: 1, minWidth: 0, paddingRight: "20px" }}>
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
          <p
            style={{
              margin: "4px 0 0 0",
              fontSize: "12px",
              color: "var(--color-text-3)",
              lineHeight: "1.5",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical" as const,
              overflow: "hidden",
            }}
          >
            {concept.subtitle}
          </p>
        </div>
      </Link>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

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
