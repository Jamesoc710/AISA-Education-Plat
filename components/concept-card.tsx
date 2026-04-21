"use client";

import { useState } from "react";
import Link from "next/link";
import type { ConceptData } from "@/lib/types";
import { IconTile } from "@/components/ui/icon-tile";
import { Icon } from "@/components/ui/icon";
import { getConceptVisual } from "@/lib/section-icons";

/**
 * Single concept card (light theme).
 *
 * Compact rounded card: section-colored icon tile + name + 2-line subtitle.
 * Bookmark icon top-right, visible on hover or when already bookmarked.
 * Whole card is the click target; bookmark button stops propagation.
 */
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
  const visual = getConceptVisual(concept.slug, concept.section.slug);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        backgroundColor: hovered ? "var(--color-surface-2)" : "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-1)",
        transition: "background-color 140ms ease",
      }}
    >
      {/* Bookmark button — absolute, outside the Link */}
      <div style={{ position: "absolute", top: "var(--space-3)", right: "var(--space-3)", zIndex: 1 }}>
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
          gap: "var(--space-3)",
          padding: "16px 18px",
          textDecoration: "none",
          color: "inherit",
        }}
      >
        <IconTile icon={visual.icon} color={visual.color} size="sm" />

        <div style={{ flex: 1, minWidth: 0, paddingRight: "var(--space-5)" }}>
          <h3
            style={{
              margin: 0,
              fontSize: "var(--text-base)",
              fontWeight: 550,
              color: "var(--color-text)",
              lineHeight: 1.3,
              letterSpacing: "-0.01em",
            }}
          >
            {concept.name}
          </h3>
          <p
            style={{
              margin: "5px 0 0 0",
              fontSize: "var(--text-sm)",
              color: "var(--color-text-2)",
              lineHeight: 1.5,
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

function BookmarkButton({
  bookmarked,
  visible,
  onClick,
}: {
  bookmarked: boolean;
  visible: boolean;
  onClick: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onClick();
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={bookmarked ? "Remove bookmark" : "Bookmark this concept"}
      aria-label={bookmarked ? "Remove bookmark" : "Bookmark this concept"}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 26,
        height: 26,
        border: "none",
        background: hov ? "var(--color-surface-2)" : "transparent",
        cursor: "pointer",
        padding: 0,
        borderRadius: "var(--radius-1)",
        opacity: visible ? 1 : 0,
        transition: "opacity 120ms ease, background-color 120ms ease",
        color: bookmarked
          ? "var(--color-gold)"
          : hov
          ? "var(--color-text)"
          : "var(--color-text-3)",
      }}
    >
      <Icon
        name={bookmarked ? "bookmark-filled" : "bookmark"}
        size={14}
        strokeWidth={1.85}
      />
    </button>
  );
}
