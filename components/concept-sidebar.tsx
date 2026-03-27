"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { SidebarSection } from "@/lib/concepts";

const TIER_COLOR: Record<string, string> = {
  fundamentals: "var(--color-gold)",
  intermediate:  "var(--color-blue)",
  advanced:      "var(--color-slate)",
};

export function ConceptSidebar({
  sections,
  currentSlug,
  open,
  onClose,
}: {
  sections: SidebarSection[];
  currentSlug: string;
  open: boolean;
  onClose: () => void;
}) {
  // Find which section the current concept is in
  const currentSection = sections.find((s) =>
    s.concepts.some((c) => c.slug === currentSlug)
  );

  // Expand current section by default; everything else collapsed
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(currentSection ? [currentSection.id] : [])
  );

  // When navigating to a new concept, auto-expand its section
  useEffect(() => {
    if (currentSection) {
      setExpanded((prev) => new Set([...prev, currentSection.id]));
    }
  }, [currentSection?.id]);

  // Scroll current item into view
  const currentRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [currentSlug]);

  const toggleSection = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const sidebar = (
    <aside
      style={{
        width: "268px",
        flexShrink: 0,
        height: "100vh",
        overflowY: "auto",
        borderRight: "1px solid var(--color-border)",
        backgroundColor: "var(--color-bg)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "0 16px",
          height: "56px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          borderBottom: "1px solid var(--color-border)",
          flexShrink: 0,
        }}
      >
        <Link
          href="/browse"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            textDecoration: "none",
          }}
        >
          <img
            src="/assets/aisa-logo.png"
            alt="AISA"
            style={{ width: "24px", height: "24px", flexShrink: 0 }}
          />
          <span
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--color-text)",
              letterSpacing: "-0.01em",
            }}
          >
            AISA Atlas
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "8px 0 24px" }}>
        {sections.map((section) => {
          const isExpanded = expanded.has(section.id);
          const tierColor = TIER_COLOR[section.tier.slug] ?? "var(--color-text-3)";

          return (
            <div key={section.id}>
              {/* Section header button */}
              <button
                onClick={() => toggleSection(section.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  padding: "5px 16px 5px 14px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  gap: "6px",
                  marginTop: "4px",
                }}
              >
                {/* Chevron */}
                <span
                  style={{
                    fontSize: "9px",
                    color: "var(--color-text-3)",
                    transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)",
                    transition: "transform 0.15s",
                    lineHeight: 1,
                    flexShrink: 0,
                    width: "10px",
                  }}
                >
                  ▾
                </span>

                {/* Tier dot */}
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    backgroundColor: tierColor,
                    flexShrink: 0,
                  }}
                />

                {/* Section name */}
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "var(--color-text-2)",
                    letterSpacing: "0.01em",
                    flex: 1,
                    textAlign: "left",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {section.name}
                </span>

                {/* Count */}
                <span style={{ fontSize: "11px", color: "var(--color-text-3)" }}>
                  {section.concepts.length}
                </span>
              </button>

              {/* Concept links */}
              {isExpanded && (
                <div>
                  {section.concepts.map((concept) => {
                    const isCurrent = concept.slug === currentSlug;
                    return (
                      <Link
                        key={concept.id}
                        href={`/concepts/${concept.slug}`}
                        ref={isCurrent ? currentRef : undefined}
                        onClick={onClose}
                        style={{
                          display: "block",
                          padding: "5px 16px 5px 30px",
                          fontSize: "13px",
                          color: isCurrent ? "var(--color-text)" : "var(--color-text-2)",
                          backgroundColor: isCurrent ? "var(--color-surface-2)" : "transparent",
                          textDecoration: "none",
                          borderRadius: "4px",
                          margin: "0 6px",
                          lineHeight: "1.4",
                          position: "relative",
                          fontWeight: isCurrent ? 500 : 400,
                          transition: "background-color 0.1s, color 0.1s",
                        }}
                        onMouseEnter={(e) => {
                          if (!isCurrent)
                            (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                              "var(--color-surface)";
                        }}
                        onMouseLeave={(e) => {
                          if (!isCurrent)
                            (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                              "transparent";
                        }}
                      >
                        {/* Active indicator bar */}
                        {isCurrent && (
                          <span
                            style={{
                              position: "absolute",
                              left: "0",
                              top: "50%",
                              transform: "translateY(-50%)",
                              width: "2px",
                              height: "14px",
                              backgroundColor: "var(--color-accent)",
                              borderRadius: "1px",
                            }}
                          />
                        )}
                        {concept.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );

  // Desktop: always visible. Mobile/tablet: slide-over drawer.
  return (
    <>
      {/* Desktop sidebar */}
      <div className="concept-sidebar-desktop">{sidebar}</div>

      {/* Mobile/tablet drawer */}
      <div
        className="concept-sidebar-mobile"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 40,
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.22s ease",
        }}
      >
        {sidebar}
      </div>
    </>
  );
}
