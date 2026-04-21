"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ConceptCard } from "@/components/concept-card";
import { IconTile } from "@/components/ui/icon-tile";
import { Icon } from "@/components/ui/icon";
import { getSectionVisual } from "@/lib/section-icons";
import type { SectionGroup } from "@/lib/types";

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
        <div style={{ marginBottom: 28 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 30,
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
              fontSize: 14.5,
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
                gap: 5,
                marginTop: 12,
                fontSize: 12.5,
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
              marginBottom: 8,
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
                fontSize: 12.5,
                fontFamily: "inherit",
                color: "var(--color-text-2)",
                cursor: isSearching ? "default" : "pointer",
                opacity: isSearching ? 0.4 : 1,
                transition: "color 120ms ease",
              }}
              onMouseEnter={(e) => {
                if (!isSearching) e.currentTarget.style.color = "var(--color-text)";
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

  return (
    <div>
      {/* Clickable section card */}
      <button
        type="button"
        onClick={onToggleExpanded}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-expanded={expanded}
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 14,
          width: "100%",
          backgroundColor: hovered ? "var(--color-surface-2)" : "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 4,
          padding: "16px 18px",
          cursor: "pointer",
          fontFamily: "inherit",
          textAlign: "left",
          color: "inherit",
          transition: "background-color 140ms ease",
        }}
      >
        <IconTile icon={visual.icon} color={visual.color} size="md" />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 600,
                color: "var(--color-text)",
                letterSpacing: "-0.015em",
                lineHeight: 1.25,
              }}
            >
              {section.name}
            </h2>
            <span
              style={{
                fontSize: 12.5,
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
                fontSize: 13.5,
                color: "var(--color-text-2)",
                lineHeight: 1.55,
              }}
            >
              {section.description}
            </p>
          )}
          {preview && (
            <p
              style={{
                margin: "8px 0 0 0",
                fontSize: 12.5,
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
            color: "var(--color-text-3)",
            transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 220ms cubic-bezier(0.2, 0, 0, 1)",
            marginTop: 14,
            flexShrink: 0,
          }}
        >
          <Icon name="chevron-right" size={16} strokeWidth={2} />
        </span>
      </button>

      {/* Expandable concept grid */}
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
              paddingTop: 14,
              opacity: expanded ? 1 : 0,
              transform: expanded ? "translateY(0)" : "translateY(-4px)",
              transition: "opacity 220ms ease-out, transform 220ms ease-out",
              transitionDelay: expanded ? "60ms" : "0ms",
            }}
            aria-hidden={!expanded}
          >
            {section.concepts.map((concept) => (
              <ConceptCard
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
        gap: 14,
        color: "var(--color-text-2)",
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 4,
        textAlign: "center",
      }}
    >
      <span style={{ color: "var(--color-text-3)" }}>
        <Icon name="search" size={28} strokeWidth={1.5} />
      </span>
      <p style={{ fontSize: 14.5, margin: 0, fontWeight: 500, color: "var(--color-text)" }}>
        {filter === "bookmarked"
          ? "No bookmarks yet"
          : query
          ? `No concepts match "${query}"`
          : "No concepts found"}
      </p>
      <p style={{ fontSize: 13, margin: 0, color: "var(--color-text-2)", maxWidth: 380 }}>
        {filter === "bookmarked"
          ? "Star a concept on any card to save it for later."
          : "Try adjusting your search or clearing the filter."}
      </p>
    </div>
  );
}
