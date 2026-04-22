"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { IconTile } from "@/components/ui/icon-tile";
import { Icon } from "@/components/ui/icon";
import { getSectionVisual, getConceptVisual } from "@/lib/section-icons";
import type { SectionGroup, ConceptData } from "@/lib/types";

const BOOKMARKS_KEY = "aisa-atlas-bookmarks";
const EXPANDED_KEY = "aisa-atlas-browse-expanded";

const TIER_COPY: Record<string, { title: string; subtitle: string }> = {
  fundamentals: {
    title: "Fundamentals",
    subtitle:
      "The building blocks. If you can't explain these, you're not ready for projects, site tours, or client conversations.",
  },
  intermediate: {
    title: "Intermediate",
    subtitle:
      "The 'how it works in the real world' layer. What separates a participant from a valuable team member.",
  },
  advanced: {
    title: "Advanced",
    subtitle:
      "The cutting edge and the deep dives. What separates someone who's informed from someone who's a thought leader.",
  },
};

export function BrowseClient({ sections }: { sections: SectionGroup[] }) {
  const searchParams = useSearchParams();
  const query = (searchParams?.get("q") ?? "").trim();
  const filter = searchParams?.get("filter") === "bookmarked" ? "bookmarked" : "all";
  const tierFilter = searchParams?.get("tier") ?? null;

  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [userExpanded, setUserExpanded] = useState<Set<string>>(new Set());

  // Hydrate persisted state
  useEffect(() => {
    try {
      const stored = localStorage.getItem(BOOKMARKS_KEY);
      if (stored) setBookmarks(new Set(JSON.parse(stored)));
    } catch {}
    try {
      const stored = localStorage.getItem(EXPANDED_KEY);
      if (stored) setUserExpanded(new Set(JSON.parse(stored)));
    } catch {}
  }, []);

  const toggleBookmark = (id: string) => {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  };

  const persistExpanded = (next: Set<string>) => {
    try {
      localStorage.setItem(EXPANDED_KEY, JSON.stringify([...next]));
    } catch {}
  };

  const toggleSection = (id: string) => {
    setUserExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      persistExpanded(next);
      return next;
    });
  };

  const expandAll = (ids: string[]) => {
    const next = new Set(ids);
    setUserExpanded(next);
    persistExpanded(next);
  };

  const collapseAll = () => {
    const next = new Set<string>();
    setUserExpanded(next);
    persistExpanded(next);
  };

  // ── Filtering ────────────────────────────────────────────────
  const filteredSections = useMemo(() => {
    const q = query.toLowerCase();

    return sections
      .filter((s) => !tierFilter || s.tier.slug === tierFilter)
      .map((section) => {
        const concepts = section.concepts.filter((c) => {
          if (filter === "bookmarked" && !bookmarks.has(c.id)) return false;
          if (q) {
            const haystack = `${c.name} ${c.subtitle} ${c.section.name}`.toLowerCase();
            if (!haystack.includes(q)) return false;
          }
          return true;
        });
        return { ...section, concepts };
      })
      .filter((s) => s.concepts.length > 0);
  }, [sections, query, filter, tierFilter, bookmarks]);

  const totalVisible = filteredSections.reduce((acc, s) => acc + s.concepts.length, 0);

  // ── Effective expand set ─────────────────────────────────────
  // While searching, auto-expand all matched sections so results are visible.
  const isSearching = query.length > 0;
  const displayExpanded = useMemo(() => {
    if (isSearching) return new Set(filteredSections.map((s) => s.id));
    return userExpanded;
  }, [isSearching, filteredSections, userExpanded]);
  const allCollapsed = displayExpanded.size === 0;

  // ── Page header copy reflects filters ───────────────────────
  const header = (() => {
    if (filter === "bookmarked") {
      return {
        title: "Bookmarked",
        subtitle:
          totalVisible === 0
            ? "Star a concept on any card and it'll show up here."
            : `${totalVisible} concept${totalVisible === 1 ? "" : "s"} you've saved.`,
      };
    }
    if (tierFilter && TIER_COPY[tierFilter]) {
      return {
        title: TIER_COPY[tierFilter].title,
        subtitle: TIER_COPY[tierFilter].subtitle,
      };
    }
    if (query) {
      return {
        title: "Search results",
        subtitle: `${totalVisible} concept${totalVisible === 1 ? "" : "s"} match "${query}"`,
      };
    }
    return {
      title: "Browse",
      subtitle:
        "Explore the curriculum at your own pace. Click any section to see what's inside.",
    };
  })();

  const isFiltered = filter !== "all" || tierFilter !== null;

  return (
    <div style={{ padding: "32px 32px 80px" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>
        {/* ── Page header ─────────────────────────────────────── */}
        <div style={{ marginBottom: "var(--space-6)" }}>
          <h1
            style={{
              margin: 0,
              fontSize: "var(--text-2xl)",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "var(--color-text)",
              lineHeight: 1.15,
            }}
          >
            {header.title}
          </h1>
          <p
            style={{
              margin: "8px 0 0 0",
              fontSize: "var(--text-base)",
              color: "var(--color-text-2)",
              lineHeight: 1.55,
              maxWidth: 680,
            }}
          >
            {header.subtitle}
          </p>

          {isFiltered && (
            <Link
              href="/browse"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--space-2)",
                marginTop: "var(--space-3)",
                fontSize: "var(--text-sm)",
                fontWeight: 500,
                color: "var(--color-text-2)",
                textDecoration: "none",
                transition: "color 120ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--color-text)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--color-text-2)";
              }}
            >
              <Icon name="x" size={12} strokeWidth={2.25} />
              Clear filter
            </Link>
          )}
        </div>

        {/* ── Expand / collapse toolbar ───────────────────────── */}
        {filteredSections.length > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              marginBottom: "var(--space-2)",
              minHeight: 24,
            }}
          >
            <button
              type="button"
              onClick={() =>
                allCollapsed
                  ? expandAll(filteredSections.map((s) => s.id))
                  : collapseAll()
              }
              disabled={isSearching}
              style={{
                background: "none",
                border: "none",
                padding: "4px 8px",
                fontSize: "var(--text-sm)",
                fontFamily: "inherit",
                color: "var(--color-text-2)",
                cursor: isSearching ? "default" : "pointer",
                opacity: isSearching ? 0.4 : 1,
                transition: "color 120ms ease",
              }}
              onMouseEnter={(e) => {
                if (!isSearching) e.currentTarget.style.color = "var(--color-accent)";
              }}
              onMouseLeave={(e) => {
                if (!isSearching) e.currentTarget.style.color = "var(--color-text-2)";
              }}
            >
              {allCollapsed ? "Expand all" : "Collapse all"}
            </button>
          </div>
        )}

        {/* ── Sections / empty state ──────────────────────────── */}
        {filteredSections.length === 0 ? (
          <EmptyState query={query} filter={filter} />
        ) : (
          <div className="browse-sections">
            {filteredSections.map((section) => (
              <SectionRow
                key={section.id}
                section={section}
                bookmarks={bookmarks}
                onToggleBookmark={toggleBookmark}
                expanded={displayExpanded.has(section.id)}
                onToggleExpanded={() => toggleSection(section.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Section Row ──────────────────────────────────────────────────────────────
//
// Tile-as-left-rail layout: a 4px vertical color bar (matching the section's
// tile-fg color) runs down the row's full height. No outer border or card
// fill — the rail + typography carry the grouping.

function SectionRow({
  section,
  bookmarks,
  onToggleBookmark,
  expanded,
  onToggleExpanded,
}: {
  section: SectionGroup;
  bookmarks: Set<string>;
  onToggleBookmark: (id: string) => void;
  expanded: boolean;
  onToggleExpanded: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const visual = getSectionVisual(section.slug);
  const preview = section.concepts.map((c) => c.name).join(" · ");
  const railColor = `var(--tile-${visual.color}-fg)`;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "stretch",
        gap: "var(--space-4)",
      }}
    >
      {/* Left color rail — continuous from header through expanded concepts */}
      <div
        aria-hidden
        style={{
          width: 3,
          flexShrink: 0,
          backgroundColor: railColor,
          borderRadius: 2,
        }}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Clickable section header */}
        <button
          type="button"
          onClick={onToggleExpanded}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          aria-expanded={expanded}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "var(--space-4)",
            width: "100%",
            backgroundColor: "transparent",
            border: "none",
            padding: "8px 4px 8px 0",
            cursor: "pointer",
            fontFamily: "inherit",
            textAlign: "left",
            color: "inherit",
          }}
        >
          <IconTile icon={visual.icon} color={visual.color} size="md" />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "var(--space-3)",
                flexWrap: "wrap",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "var(--text-lg)",
                  fontWeight: 600,
                  color: hovered ? railColor : "var(--color-text)",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.2,
                  transition: "color 140ms ease",
                }}
              >
                {section.name}
              </h2>
              <span
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--color-text-3)",
                  fontWeight: 500,
                }}
              >
                {section.concepts.length} concept{section.concepts.length === 1 ? "" : "s"}
              </span>
            </div>
            {section.description && (
              <p
                style={{
                  margin: "6px 0 0 0",
                  fontSize: "var(--text-sm)",
                  color: "var(--color-text-2)",
                  lineHeight: 1.55,
                }}
              >
                {section.description}
              </p>
            )}
            {preview && !expanded && (
              <p
                style={{
                  margin: "8px 0 0 0",
                  fontSize: "var(--text-sm)",
                  color: "var(--color-text-3)",
                  lineHeight: 1.4,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={preview}
              >
                {preview}
              </p>
            )}
          </div>

          <span
            aria-hidden
            style={{
              display: "flex",
              color: hovered ? railColor : "var(--color-text-3)",
              transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 220ms cubic-bezier(0.2, 0, 0, 1), color 140ms ease",
              marginTop: "var(--space-4)",
              flexShrink: 0,
            }}
          >
            <Icon name="chevron-right" size={16} strokeWidth={2} />
          </span>
        </button>

        {/* Expandable concept list */}
        <div
          style={{
            display: "grid",
            gridTemplateRows: expanded ? "1fr" : "0fr",
            transition: "grid-template-rows 260ms cubic-bezier(0.2, 0, 0, 1)",
          }}
        >
          <div style={{ overflow: "hidden", minHeight: 0 }}>
            <div
              className="browse-grid"
              style={{
                paddingTop: "var(--space-2)",
                opacity: expanded ? 1 : 0,
                transform: expanded ? "translateY(0)" : "translateY(-4px)",
                transition: "opacity 220ms ease-out, transform 220ms ease-out",
                transitionDelay: expanded ? "60ms" : "0ms",
              }}
              inert={!expanded}
            >
              {section.concepts.map((concept) => (
                <ConceptRow
                  key={concept.id}
                  concept={concept}
                  bookmarked={bookmarks.has(concept.id)}
                  onToggleBookmark={onToggleBookmark}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Concept Row (inline editorial, used only inside browse) ─────────────────

function ConceptRow({
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
        borderTop: "1px solid var(--color-border)",
      }}
    >
      <Link
        href={`/concepts/${concept.slug}`}
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "var(--space-3)",
          padding: "12px 40px 12px 4px",
          textDecoration: "none",
          color: "inherit",
        }}
      >
        <IconTile icon={visual.icon} color={visual.color} size="sm" />

        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              margin: 0,
              fontSize: "var(--text-base)",
              fontWeight: 550,
              color: hovered ? "var(--color-accent)" : "var(--color-text)",
              lineHeight: 1.3,
              letterSpacing: "-0.01em",
              transition: "color 140ms ease",
            }}
          >
            {concept.name}
          </h3>
          <p
            style={{
              margin: "4px 0 0 0",
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

      <div
        style={{
          position: "absolute",
          top: 10,
          right: 4,
        }}
      >
        <InlineBookmarkButton
          bookmarked={bookmarked}
          visible={hovered || bookmarked}
          onClick={() => onToggleBookmark(concept.id)}
        />
      </div>
    </div>
  );
}

function InlineBookmarkButton({
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

// ── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ query, filter }: { query: string; filter: "all" | "bookmarked" }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px",
        gap: "var(--space-4)",
        color: "var(--color-text-2)",
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-1)",
        textAlign: "center",
      }}
    >
      <span style={{ color: "var(--color-text-3)" }}>
        <Icon name="search" size={28} strokeWidth={1.5} />
      </span>
      <p style={{ fontSize: "var(--text-base)", margin: 0, fontWeight: 500, color: "var(--color-text)" }}>
        {filter === "bookmarked"
          ? "No bookmarks yet"
          : query
          ? `No concepts match "${query}"`
          : "No concepts found"}
      </p>
      <p style={{ fontSize: "var(--text-sm)", margin: 0, color: "var(--color-text-2)", maxWidth: 380 }}>
        {filter === "bookmarked"
          ? "Star a concept on any card to save it for later."
          : "Try adjusting your search or clearing the filter."}
      </p>
    </div>
  );
}
