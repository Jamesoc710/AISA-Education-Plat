"use client";

import { useState, useEffect, useMemo } from "react";
import { ConceptCard } from "@/components/concept-card";
import { SearchBar } from "@/components/search-bar";
import type { SectionGroup, ConceptData } from "@/lib/types";

const BOOKMARKS_KEY = "aisa-atlas-bookmarks";

const TIERS = [
  { slug: "fundamentals", label: "Fundamentals", color: "#e8b54a" },
  { slug: "intermediate", label: "Intermediate", color: "#6b9bd2" },
  { slug: "advanced", label: "Advanced", color: "#8b8b9e" },
] as const;

type ActiveFilter = "all" | "fundamentals" | "intermediate" | "advanced" | "bookmarked";

export function BrowseClient({ sections }: { sections: SectionGroup[] }) {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());

  // Load bookmarks from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(BOOKMARKS_KEY);
      if (stored) setBookmarks(new Set(JSON.parse(stored)));
    } catch {}
  }, []);

  // Persist bookmarks
  const toggleBookmark = (conceptId: string) => {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(conceptId)) next.delete(conceptId);
      else next.add(conceptId);
      try {
        localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  };

  // All concepts flat for counting
  const allConcepts = useMemo(
    () => sections.flatMap((s) => s.concepts),
    [sections]
  );

  // Filtered sections
  const filteredSections = useMemo(() => {
    const q = query.toLowerCase().trim();

    return sections
      .map((section) => {
        const concepts = section.concepts.filter((c) => {
          // Tier filter
          if (activeFilter === "bookmarked" && !bookmarks.has(c.id)) return false;
          if (
            activeFilter !== "all" &&
            activeFilter !== "bookmarked" &&
            c.tier.slug !== activeFilter
          )
            return false;

          // Search filter
          if (q) {
            const haystack = `${c.name} ${c.subtitle} ${c.section.name}`.toLowerCase();
            if (!haystack.includes(q)) return false;
          }

          return true;
        });

        return { ...section, concepts };
      })
      .filter((s) => s.concepts.length > 0);
  }, [sections, query, activeFilter, bookmarks]);

  const totalVisible = filteredSections.reduce(
    (acc, s) => acc + s.concepts.length,
    0
  );

  const bookmarkCount = allConcepts.filter((c) => bookmarks.has(c.id)).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      {/* ── Top bar ─────────────────────────────────────────── */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "0 24px",
          height: "56px",
          borderBottom: "1px solid var(--color-border)",
          backgroundColor: "var(--color-bg)",
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        {/* Logo / wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginRight: "8px" }}>
          <div
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "6px",
              background: "linear-gradient(135deg, #5e6ad2 0%, #6b9bd2 100%)",
              flexShrink: 0,
            }}
          />
          <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--color-text)", letterSpacing: "-0.01em" }}>
            AISA Atlas
          </span>
        </div>

        {/* Divider */}
        <div style={{ width: "1px", height: "20px", backgroundColor: "var(--color-border)", marginRight: "8px" }} />

        {/* Filter tabs */}
        <nav style={{ display: "flex", alignItems: "center", gap: "2px" }}>
          <FilterTab
            label="All"
            count={allConcepts.length}
            active={activeFilter === "all"}
            onClick={() => setActiveFilter("all")}
          />
          {TIERS.map((t) => (
            <FilterTab
              key={t.slug}
              label={t.label}
              active={activeFilter === t.slug}
              onClick={() => setActiveFilter(t.slug as ActiveFilter)}
              color={t.color}
            />
          ))}
          <FilterTab
            label="Bookmarked"
            count={bookmarkCount}
            active={activeFilter === "bookmarked"}
            onClick={() => setActiveFilter("bookmarked")}
            icon={
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 3a2 2 0 0 0-2 2v16l9-4 9 4V5a2 2 0 0 0-2-2H5z" />
              </svg>
            }
          />
        </nav>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Search */}
        <SearchBar value={query} onChange={setQuery} />

        {/* Result count */}
        {(query || activeFilter !== "all") && (
          <span style={{ fontSize: "12px", color: "var(--color-text-3)", whiteSpace: "nowrap" }}>
            {totalVisible} concept{totalVisible !== 1 ? "s" : ""}
          </span>
        )}
      </header>

      {/* ── Content ─────────────────────────────────────────── */}
      <main
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0 24px 48px",
        }}
      >
        {filteredSections.length === 0 ? (
          <EmptyState query={query} filter={activeFilter} />
        ) : (
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            {filteredSections.map((section) => (
              <SectionGroup
                key={section.id}
                section={section}
                bookmarks={bookmarks}
                onToggleBookmark={toggleBookmark}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// ── Filter Tab ────────────────────────────────────────────────────────────────

function FilterTab({
  label,
  count,
  active,
  onClick,
  color,
  icon,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
  color?: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "5px",
        padding: "4px 10px",
        borderRadius: "6px",
        border: "none",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: active ? 500 : 400,
        backgroundColor: active ? "var(--color-surface-2)" : "transparent",
        color: active ? "var(--color-text)" : "var(--color-text-2)",
        transition: "background-color 0.1s, color 0.1s",
        fontFamily: "inherit",
        lineHeight: 1,
        height: "28px",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--color-surface)";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-2)";
        }
      }}
    >
      {icon && (
        <span style={{ color: active ? "var(--color-text-2)" : "var(--color-text-3)" }}>
          {icon}
        </span>
      )}
      {color && (
        <span
          style={{
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            backgroundColor: color,
            flexShrink: 0,
            opacity: active ? 1 : 0.6,
          }}
        />
      )}
      {label}
      {count !== undefined && count > 0 && (
        <span
          style={{
            fontSize: "11px",
            color: active ? "var(--color-text-3)" : "var(--color-text-3)",
            fontWeight: 400,
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ── Section Group ─────────────────────────────────────────────────────────────

function SectionGroup({
  section,
  bookmarks,
  onToggleBookmark,
}: {
  section: SectionGroup;
  bookmarks: Set<string>;
  onToggleBookmark: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  const tierColor =
    section.tier.slug === "fundamentals"
      ? "var(--color-gold)"
      : section.tier.slug === "intermediate"
      ? "var(--color-blue)"
      : "var(--color-slate)";

  return (
    <div style={{ marginTop: "32px" }}>
      {/* Section header */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          width: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "0 0 12px 0",
          marginBottom: "2px",
          fontFamily: "inherit",
        }}
      >
        {/* Tier dot */}
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: tierColor,
            flexShrink: 0,
          }}
        />

        {/* Section name */}
        <span
          style={{
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--color-text-2)",
            letterSpacing: "0.01em",
          }}
        >
          {section.name}
        </span>

        {/* Count */}
        <span style={{ fontSize: "12px", color: "var(--color-text-3)" }}>
          {section.concepts.length}
        </span>

        {/* Tier badge */}
        <span
          style={{
            fontSize: "11px",
            color: tierColor,
            opacity: 0.7,
            marginLeft: "2px",
          }}
        >
          {section.tier.name}
        </span>

        {/* Chevron */}
        <span
          style={{
            marginLeft: "auto",
            color: "var(--color-text-3)",
            fontSize: "10px",
            transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)",
            transition: "transform 0.15s",
            lineHeight: 1,
          }}
        >
          ▾
        </span>
      </button>

      {/* Divider */}
      <div style={{ height: "1px", backgroundColor: "var(--color-border-subtle)", marginBottom: "16px" }} />

      {/* Concept grid */}
      {!collapsed && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "10px",
          }}
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
      )}
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({ query, filter }: { query: string; filter: ActiveFilter }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "400px",
        gap: "12px",
        color: "var(--color-text-3)",
      }}
    >
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <p style={{ fontSize: "14px", margin: 0 }}>
        {filter === "bookmarked"
          ? "No bookmarks yet — star a concept to save it here"
          : query
          ? `No concepts match "${query}"`
          : "No concepts found"}
      </p>
      {(query || filter !== "all") && (
        <p style={{ fontSize: "12px", margin: 0, color: "var(--color-text-3)" }}>
          Try adjusting your search or filters
        </p>
      )}
    </div>
  );
}
