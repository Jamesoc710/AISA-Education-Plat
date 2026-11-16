"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { FilterTabs, type FilterTabItem } from "@/components/ui/filter-tabs";
import { ArrowRight } from "@/components/ui/editorial";
import { getSectionInk } from "@/lib/section-icons";
import type { TrackSummary } from "@/lib/track";
import type { SectionGroup, ConceptData } from "@/lib/types";

type TierGroup = {
  slug: string;
  name: string;
  sections: SectionGroup[];
  conceptCount: number;
};

// Sections arrive ordered by tier, so first-seen order is curriculum order.
function groupByTier(sections: SectionGroup[]): TierGroup[] {
  const groups: TierGroup[] = [];
  for (const section of sections) {
    let group = groups.find((g) => g.slug === section.tier.slug);
    if (!group) {
      group = { slug: section.tier.slug, name: section.tier.name, sections: [], conceptCount: 0 };
      groups.push(group);
    }
    group.sections.push(section);
    group.conceptCount += section.concepts.length;
  }
  return groups;
}

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

export function BrowseClient({
  sections,
  tracks = [],
  activeTrackSlug = "ai",
}: {
  sections: SectionGroup[];
  tracks?: TrackSummary[];
  activeTrackSlug?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = (searchParams?.get("q") ?? "").trim();
  const tierFilter = searchParams?.get("tier") ?? null;

  const activeTrack = tracks.find((t) => t.slug === activeTrackSlug) ?? null;
  // A track with no authored content yet (e.g. Capital Markets pre-seed).
  const trackIsEmpty = sections.length === 0;

  const allTiers = useMemo(() => groupByTier(sections), [sections]);
  const hasTiers = allTiers.length > 1;

  // ── Filtering ────────────────────────────────────────────────
  const visibleTiers = useMemo(() => {
    const q = query.toLowerCase();
    const filtered = sections
      .filter((s) => !tierFilter || s.tier.slug === tierFilter)
      .map((section) => ({
        ...section,
        concepts: section.concepts.filter(
          (c) => !q || `${c.name} ${c.subtitle} ${c.section.name}`.toLowerCase().includes(q),
        ),
      }))
      .filter((s) => s.concepts.length > 0);
    return groupByTier(filtered);
  }, [sections, query, tierFilter]);

  const totalVisible = visibleTiers.reduce((acc, t) => acc + t.conceptCount, 0);

  // ── Tier tabs ────────────────────────────────────────────────
  // Hidden while searching: a search runs across every tier.
  const tabs: FilterTabItem<string>[] = [
    { key: "all", label: "All", count: allTiers.reduce((acc, t) => acc + t.conceptCount, 0) },
    ...allTiers.map((t) => ({ key: t.slug, label: t.name, count: t.conceptCount })),
  ];
  const showTierTabs = hasTiers && !query;

  // The filter only narrows data already on the page, so it rewrites the URL in
  // place instead of asking the server for the same page again. Next keeps
  // useSearchParams in sync with replaceState.
  const setTier = (key: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (key === "all") params.delete("tier");
    else params.set("tier", key);
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  };

  return (
    <div data-surface="editorial" style={{ backgroundColor: "var(--color-bg)", minHeight: "100%" }}>
      <div
        style={{
          maxWidth: 1160,
          margin: "0 auto",
          padding: "var(--pad-page-y) var(--pad-wide-x) 96px",
        }}
      >
        {/* ── Track switcher ──────────────────────────────────── */}
        {tracks.length > 1 && (
          <TrackSwitcher
            tracks={tracks}
            activeSlug={activeTrackSlug}
            onSwitch={(slug) => {
              if (slug === activeTrackSlug) return;
              void fetch("/api/track", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slug }),
              }).then(() => router.refresh());
            }}
          />
        )}

        {/* ── Page header ─────────────────────────────────────── */}
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(40px, 5vw, 56px)",
            fontWeight: 600,
            letterSpacing: "-0.03em",
            lineHeight: 1.02,
            color: "var(--color-text)",
          }}
        >
          {query ? "Search results" : "Browse"}
        </h1>
        {query && (
          <p
            style={{
              margin: "14px 0 0",
              fontSize: "var(--text-md)",
              lineHeight: 1.55,
              color: "var(--color-text)",
            }}
          >
            {plural(totalVisible, "concept")} match{totalVisible === 1 ? "es" : ""} &ldquo;{query}&rdquo;
          </p>
        )}

        {showTierTabs && (
          <FilterTabs<string>
            tabs={tabs}
            active={tierFilter ?? "all"}
            onChange={setTier}
            style={{ marginTop: "var(--space-6)", flexWrap: "wrap" }}
          />
        )}

        {/* ── Index / empty states ────────────────────────────── */}
        {trackIsEmpty ? (
          <div style={{ marginTop: "var(--space-6)" }}>
            <TrackEmptyState track={activeTrack} />
          </div>
        ) : visibleTiers.length === 0 ? (
          <div style={{ marginTop: "var(--space-6)" }}>
            <EmptyState query={query} />
          </div>
        ) : (
          visibleTiers.map((tier, i) => (
            <TierBlock key={tier.slug} tier={tier} showHeading={hasTiers} first={i === 0} />
          ))
        )}
      </div>
    </div>
  );
}

// ── Tier ─────────────────────────────────────────────────────────────────────
//
// One chapter of the index: a ruled heading, then its sections. The heading
// sticks to the top of the scroll area for as long as its tier is on screen,
// so a long page always says which tier you are in. A track with a single tier
// skips the heading and keeps only the rule.

function TierBlock({
  tier,
  showHeading,
  first,
}: {
  tier: TierGroup;
  showHeading: boolean;
  first: boolean;
}) {
  return (
    <section style={{ marginTop: first ? "24px" : "40px" }}>
      {showHeading ? (
        // Bleeds 12px each side so it also covers a hovered row passing beneath.
        <div className="browse-tier-head">
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "var(--space-1) var(--space-5)",
              paddingBottom: "var(--space-4)",
              borderBottom: "1px solid var(--color-text)",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "var(--text-3xl)",
                fontWeight: 600,
                letterSpacing: "-0.025em",
                lineHeight: 1.1,
                color: "var(--color-text)",
              }}
            >
              {tier.name}
            </h2>
            <span
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: 500,
                color: "var(--color-text)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {plural(tier.sections.length, "section")} · {plural(tier.conceptCount, "concept")}
            </span>
          </div>
        </div>
      ) : (
        <div aria-hidden style={{ marginTop: "var(--space-4)", borderBottom: "1px solid var(--color-text)" }} />
      )}

      {tier.sections.map((section) => (
        <SectionRow key={section.id} section={section} />
      ))}
    </section>
  );
}

// ── Section Row ──────────────────────────────────────────────────────────────
//
// Section identity on the left, every concept in it on the right. Nothing to
// expand: the page is the index. Size and rules separate the three levels
// (large ruled tier heading, section in the left column, concepts as rows).
//
// Colour means "which section". Each section has one ink from the palette in
// lib/section-icons.ts (warm in Fundamentals, cool in Intermediate, muted in
// Advanced): its name and count are set in it, and its concepts pick it up on
// hover. The ink and its pale tint are handed to globals.css as variables.
// The concept page and the quiz pickers name sections in the same ink.

function SectionRow({ section }: { section: SectionGroup }) {
  return (
    // The id lets the concept page link straight back to this section.
    <div id={section.slug} className="browse-section" style={getSectionInk(section.slug).vars}>
      <div style={{ minWidth: 0 }}>
        <h3
          className="browse-section-name"
          style={{
            margin: 0,
            fontSize: "var(--text-lg)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            lineHeight: 1.25,
          }}
        >
          {section.name}
        </h3>
        {section.description && (
          <p
            style={{
              margin: "6px 0 0",
              fontSize: "var(--text-sm)",
              lineHeight: 1.5,
              color: "var(--color-text-2)",
            }}
          >
            {section.description}
          </p>
        )}
        <div
          className="browse-section-count"
          style={{
            marginTop: "var(--space-3)",
            fontSize: "var(--text-xs)",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {plural(section.concepts.length, "concept")}
        </div>
      </div>

      <div className="browse-concepts">
        {section.concepts.map((concept) => (
          <ConceptRow key={concept.id} concept={concept} />
        ))}
      </div>
    </div>
  );
}

// ── Concept Row ──────────────────────────────────────────────────────────────

function ConceptRow({ concept }: { concept: ConceptData }) {
  return (
    <Link href={`/concepts/${concept.slug}`} className="browse-concept">
      <span style={{ flex: 1, minWidth: 0 }}>
        <span className="browse-concept-name">{concept.name}</span>
        <span className="browse-concept-sub">{concept.subtitle}</span>
      </span>
      <span className="browse-concept-arrow" aria-hidden>
        <ArrowRight />
      </span>
    </Link>
  );
}

// ── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ query }: { query: string }) {
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
        {query ? `No concepts match "${query}"` : "No concepts found"}
      </p>
      <p style={{ fontSize: "var(--text-sm)", margin: 0, color: "var(--color-text-2)", maxWidth: 380 }}>
        Try adjusting your search or clearing the filter.
      </p>
    </div>
  );
}

// ── Track Switcher ───────────────────────────────────────────────────────────
// A row of pills, one per track. The active pill is filled with that track's
// own accent color so the surface visibly "feels" like the track you're in.

function TrackSwitcher({
  tracks,
  activeSlug,
  onSwitch,
}: {
  tracks: TrackSummary[];
  activeSlug: string;
  onSwitch: (slug: string) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Team"
      style={{
        display: "flex",
        gap: "var(--space-2)",
        flexWrap: "wrap",
        marginBottom: "var(--space-5)",
      }}
    >
      {tracks.map((t) => {
        const active = t.slug === activeSlug;
        return (
          <button
            key={t.slug}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSwitch(t.slug)}
            onMouseEnter={(e) => {
              if (!active) {
                e.currentTarget.style.backgroundColor = "var(--color-surface-2)";
                e.currentTarget.style.color = "var(--color-text)";
              }
            }}
            onMouseLeave={(e) => {
              if (!active) {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--color-text-2)";
              }
            }}
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              fontSize: "var(--text-sm)",
              fontWeight: 600,
              fontFamily: "inherit",
              cursor: active ? "default" : "pointer",
              border: `1px solid ${active ? t.accentColor : "var(--color-border)"}`,
              backgroundColor: active ? t.accentColor : "transparent",
              color: active ? "#fff" : "var(--color-text-2)",
              transition: "background-color 120ms ease, color 120ms ease, border-color 120ms ease",
            }}
          >
            {t.name}
          </button>
        );
      })}
    </div>
  );
}

// ── Track Empty State ────────────────────────────────────────────────────────
// Shown when a track has no authored content yet (e.g. Capital Markets pre-seed).

function TrackEmptyState({ track }: { track: TrackSummary | null }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px",
        gap: "var(--space-4)",
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-1)",
        textAlign: "center",
      }}
    >
      <span style={{ color: track?.accentColor ?? "var(--color-text-3)" }}>
        <Icon name="book-open" size={28} strokeWidth={1.5} />
      </span>
      <p style={{ fontSize: "var(--text-base)", margin: 0, fontWeight: 600, color: "var(--color-text)" }}>
        {track ? `No lessons in ${track.name} yet` : "No lessons here yet"}
      </p>
      <p style={{ fontSize: "var(--text-sm)", margin: 0, color: "var(--color-text-2)", maxWidth: 400, lineHeight: 1.55 }}>
        This track doesn&apos;t have lessons yet. Switch to Artificial Intelligence above to keep
        exploring.
      </p>
    </div>
  );
}
