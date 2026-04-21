"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/icon";

type Sibling = { name: string; slug: string } | null;

/**
 * Bottom prev/next pager for concept detail pages.
 * Two bordered cards in a row; either side can be empty (placeholder).
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
      <PagerCard direction="prev" item={prev} />
      <PagerCard direction="next" item={next} />
    </div>
  );
}

function PagerCard({
  direction,
  item,
}: {
  direction: "prev" | "next";
  item: Sibling;
}) {
  if (!item) {
    return (
      <div
        aria-hidden
        style={{
          minHeight: 64,
          borderRadius: "var(--radius-3)",
          border: "1px dashed var(--color-border-subtle)",
          opacity: 0,
        }}
      />
    );
  }
  const align = direction === "prev" ? "flex-start" : "flex-end";
  const label = direction === "prev" ? "Previous" : "Next";
  const iconName = direction === "prev" ? "chevron-right" : "chevron-right";
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
        textAlign: direction === "prev" ? "left" : "right",
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
            <Icon name={iconName} size={12} strokeWidth={2} />
          </span>
        )}
        {label}
        {direction === "next" && <Icon name={iconName} size={12} strokeWidth={2} />}
      </span>
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
