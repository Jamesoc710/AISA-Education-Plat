"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/icon";

type Sibling = { name: string; slug: string } | null;

/**
 * Bottom prev/next pager for concept detail pages.
 * Two slots in a row — a link card when a sibling exists, a muted
 * "Beginning / End of section" placeholder when not.
 */
export function ConceptPager({
  prev,
  next,
}: {
  prev: Sibling;
  next: Sibling;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "var(--space-3)",
        marginTop: "var(--space-7)",
      }}
    >
      <PagerSlot direction="prev" item={prev} />
      <PagerSlot direction="next" item={next} />
    </div>
  );
}

function PagerSlot({
  direction,
  item,
}: {
  direction: "prev" | "next";
  item: Sibling;
}) {
  const align = direction === "prev" ? "flex-start" : "flex-end";
  const textAlign = direction === "prev" ? "left" : "right";
  const label = direction === "prev" ? "Previous" : "Next";
  const terminal =
    direction === "prev" ? "Beginning of section" : "End of section";

  if (!item) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: align,
          justifyContent: "center",
          gap: "var(--space-1)",
          padding: "14px 18px",
          borderRadius: "var(--radius-3)",
          border: "1px dashed var(--color-border)",
          color: "var(--color-text-3)",
          textAlign,
          minHeight: 64,
        }}
      >
        <DirectionLabel direction={direction} label={label} />
        <span
          style={{
            fontSize: "var(--text-sm)",
            fontWeight: 500,
            color: "var(--color-text-3)",
            fontStyle: "italic",
          }}
        >
          {terminal}
        </span>
      </div>
    );
  }

  return (
    <Link
      href={`/concepts/${item.slug}`}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: align,
        gap: "var(--space-1)",
        padding: "14px 18px",
        borderRadius: "var(--radius-3)",
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-card)",
        textDecoration: "none",
        color: "inherit",
        transition: "box-shadow 160ms ease, transform 160ms ease, border-color 160ms ease",
        textAlign,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-card-hover)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-card)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <DirectionLabel direction={direction} label={label} />
      <span
        style={{
          fontSize: "var(--text-base)",
          fontWeight: 550,
          color: "var(--color-text)",
          lineHeight: 1.35,
          letterSpacing: "-0.01em",
        }}
      >
        {item.name}
      </span>
    </Link>
  );
}

function DirectionLabel({
  direction,
  label,
}: {
  direction: "prev" | "next";
  label: string;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-2)",
        fontSize: "var(--text-xs)",
        fontWeight: 600,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: "var(--color-text-3)",
      }}
    >
      {direction === "prev" && (
        <span style={{ display: "inline-flex", transform: "rotate(180deg)" }}>
          <Icon name="chevron-right" size={12} strokeWidth={2} />
        </span>
      )}
      {label}
      {direction === "next" && (
        <Icon name="chevron-right" size={12} strokeWidth={2} />
      )}
    </span>
  );
}
