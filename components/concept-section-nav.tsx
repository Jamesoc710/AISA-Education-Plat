"use client";

import { forwardRef, useEffect, useRef } from "react";
import Link from "next/link";
import { getSectionInk } from "@/lib/section-icons";

type Sibling = { id: string; name: string; slug: string };

/**
 * Right-rail "More in {section}" nav for concept detail pages.
 * Sticky, lists all sibling concepts in the current section.
 *
 * The section is named in the same ink it has on Browse, and the current
 * concept sits on that section's tint. Link states live in globals.css
 * (.concept-rail-link).
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
  const section = getSectionInk(sectionSlug);
  const currentRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [currentSlug]);

  return (
    <aside
      aria-label="Concept sections"
      style={{
        position: "sticky",
        top: "var(--space-5)",
        alignSelf: "start",
        width: 260,
        flexShrink: 0,
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-3)",
        padding: "16px 14px 12px",
        boxShadow: "var(--shadow-card)",
        ...section.vars,
      }}
    >
      <div style={{ padding: "0 10px 12px" }}>
        <div
          style={{
            fontSize: "var(--text-xs)",
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
            marginTop: "var(--space-1)",
            fontSize: "var(--text-base)",
            fontWeight: 600,
            color: section.ink,
            lineHeight: 1.3,
            letterSpacing: "-0.01em",
          }}
        >
          {sectionName}
        </div>
      </div>

      <div
        style={{
          maxHeight: "calc(100vh - 220px)",
          overflowY: "auto",
          margin: "0 -4px",
        }}
      >
        {siblings.map((s) => {
          const isCurrent = s.slug === currentSlug;
          return (
            <SiblingLink
              key={s.id}
              href={`/concepts/${s.slug}`}
              name={s.name}
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
  { href: string; name: string; current: boolean }
>(function SiblingLink({ href, name, current }, ref) {
  return (
    <Link
      ref={ref}
      href={href}
      className="concept-rail-link"
      aria-current={current ? "page" : undefined}
    >
      {name}
    </Link>
  );
});
