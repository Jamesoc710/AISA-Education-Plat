"use client";

import { forwardRef, useEffect, useRef } from "react";
import Link from "next/link";
import { IconTile } from "@/components/ui/icon-tile";
import { getSectionVisual } from "@/lib/section-icons";

type Sibling = { id: string; name: string; slug: string };

/**
 * Right-rail "More in {section}" nav for concept detail pages.
 * Sticky, lists all sibling concepts in the current section.
 * Current concept is highlighted with the indigo accent bar.
 */
export function ConceptSectionNav({
  sectionName,
  sectionSlug,
  siblings,
  currentSlug,
}: {
  sectionName: string;
  sectionSlug: string;
  siblings: Sibling[];
  currentSlug: string;
}) {
  const visual = getSectionVisual(sectionSlug);
  const currentRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [currentSlug]);

  return (
    <aside
      style={{
        position: "sticky",
        top: 24,
        alignSelf: "start",
        width: 260,
        flexShrink: 0,
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 12,
        padding: "16px 14px 12px",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 4px 12px" }}>
        <IconTile icon={visual.icon} color={visual.color} size="sm" />
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: "var(--color-text-3)",
              lineHeight: 1.2,
            }}
          >
            More in
          </div>
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 600,
              color: "var(--color-text)",
              lineHeight: 1.3,
              letterSpacing: "-0.01em",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {sectionName}
          </div>
        </div>
      </div>

      <div
        style={{
          maxHeight: "calc(100vh - 220px)",
          overflowY: "auto",
          margin: "0 -4px",
        }}
      >
        {siblings.map((s, idx) => {
          const isCurrent = s.slug === currentSlug;
          return (
            <SiblingLink
              key={s.id}
              href={`/concepts/${s.slug}`}
              name={s.name}
              index={idx + 1}
              current={isCurrent}
              ref={isCurrent ? currentRef : undefined}
            />
          );
        })}
      </div>
    </aside>
  );
}

const SiblingLink = forwardRef<
  HTMLAnchorElement,
  { href: string; name: string; index: number; current: boolean }
>(function SiblingLink({ href, name, index, current }, ref) {
  return (
    <Link
      ref={ref}
      href={href}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 10px 8px 12px",
        margin: "1px 4px",
        borderRadius: 8,
        fontSize: 13,
        fontWeight: current ? 550 : 450,
        color: current ? "var(--color-accent-on-soft)" : "var(--color-text-2)",
        backgroundColor: current ? "var(--color-accent-soft)" : "transparent",
        textDecoration: "none",
        transition: "background-color 100ms ease, color 100ms ease",
      }}
      onMouseEnter={(e) => {
        if (!current) {
          e.currentTarget.style.backgroundColor = "var(--color-surface-2)";
          e.currentTarget.style.color = "var(--color-text)";
        }
      }}
      onMouseLeave={(e) => {
        if (!current) {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.color = "var(--color-text-2)";
        }
      }}
    >
      {current && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            top: 8,
            bottom: 8,
            width: 2,
            borderRadius: 1,
            backgroundColor: "var(--color-accent)",
          }}
        />
      )}
      <span
        aria-hidden
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: current ? "var(--color-accent)" : "var(--color-text-3)",
          minWidth: 16,
          flexShrink: 0,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {String(index).padStart(2, "0")}
      </span>
      <span
        style={{
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          lineHeight: 1.35,
        }}
      >
        {name}
      </span>
    </Link>
  );
});
