"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/icon";
import { categoryMeta, momentumLabelMeta, TREND_CATEGORIES } from "@/lib/trend-categories";
import type { TrendCardData } from "@/lib/trends";

/**
 * Trend Tracker list view, "The Pulse Index". A Typewolf-style two-up editorial
 * index: two trends per row, a soft category-tinted number badge, the trend name
 * as the hero (standing in for Typewolf's screenshot), a colored THEMES line in
 * the slot Typewolf uses for "FONTS", and a quiet momentum read (tabular number +
 * dot-on-track gauge + heating glyph). No cards: rows are separated by one crisp
 * 1px rule plus air. The subtree is wrapped in data-surface="editorial" for the
 * Quizlet blue accent (#4255FF) and Hanken Grotesk; data-theme="light" comes from
 * the (main) shell. At <=720px the grid collapses to a single readable column
 * (globals.css .trend-grid), the mobile / no-JS / screen-reader backbone.
 *
 * Type scale is the plan's exact px (section 2a): raw values are intentional for
 * the editorial micro-labels (11px) that have no token, matching the copied
 * SectionEyebrow primitive; --text-xl, --color-*, and --tile-* are the cited tokens.
 */

const INITIAL_VISIBLE = 12; // six rows; the rest append in place via "Show N more"

/** Theme tag -> tile color. Vocabulary locked in the redesign plan, section 3. */
const THEME_TILE: Record<string, string> = {
  Markets: "sage",
  Builders: "indigo",
  Jobs: "honey",
  Consumers: "sky",
  Infrastructure: "steel",
  Science: "cyan",
  Safety: "rose",
  Policy: "stone",
  Geopolitics: "coral",
  Security: "mauve",
  Creators: "lilac",
};

export function TrendsClient({
  trends,
  isAdmin,
}: {
  trends: TrendCardData[];
  isAdmin: boolean;
}) {
  const [category, setCategory] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [trackerStale, setTrackerStale] = useState(false);

  // Client-only (avoids a Date.now() hydration mismatch): banner when the whole
  // tracker has not refreshed in over 36h, i.e. the cron is behind.
  useEffect(() => {
    if (trends.length === 0) return;
    const newest = Math.max(...trends.map((t) => Date.parse(t.syncedAt)));
    setTrackerStale(Number.isFinite(newest) && Date.now() - newest > 36 * 60 * 60 * 1000);
  }, [trends]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: trends.length };
    for (const t of trends) c[t.category] = (c[t.category] ?? 0) + 1;
    return c;
  }, [trends]);

  // A filter change resets the tail compression to the first six rows.
  useEffect(() => setExpanded(false), [category]);

  const visible = category ? trends.filter((t) => t.category === category) : trends;
  const shown = expanded ? visible : visible.slice(0, INITIAL_VISIBLE);
  const remaining = visible.length - shown.length;
  const draftCount = trends.filter((t) => t.status === "draft").length;

  return (
    <div data-surface="editorial" style={{ backgroundColor: "var(--color-bg)", minHeight: "100%" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "48px 40px 96px" }}>
        {/* ── Header ──────────────────────────────────────────── */}
        <SectionEyebrow>The Pulse</SectionEyebrow>
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(34px, 4vw, 44px)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "var(--color-text)",
            lineHeight: 1.1,
          }}
        >
          Trends
        </h1>
        <p
          style={{
            margin: "12px 0 0",
            fontSize: 16,
            color: "var(--color-text-2)",
            lineHeight: 1.55,
            maxWidth: 680,
          }}
        >
          What is moving across AI, broader tech, and capital markets. Each trend is a
          plain-language brief on what is happening right now and why it matters, with links back
          into the catalog to go deeper.
        </p>
        {isAdmin && draftCount > 0 && (
          <p style={{ margin: "10px 0 0", fontSize: 11, color: "var(--color-text-3)", letterSpacing: "0.04em" }}>
            Admin view: {draftCount} draft{draftCount === 1 ? "" : "s"} below are hidden from members
            until published.
          </p>
        )}

        {trackerStale && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              marginTop: 24,
              borderRadius: "var(--radius-2)",
              backgroundColor: "var(--color-gold-soft)",
              border: "1px solid var(--color-border)",
              fontSize: 13,
              color: "var(--color-text-2)",
            }}
          >
            <span style={{ color: "var(--color-gold)", display: "flex" }}>
              <Icon name="info" size={16} />
            </span>
            These briefs may be behind the latest news. The tracker has not refreshed in over 36 hours.
          </div>
        )}

        {/* ── Category tabs (ghost text, no theme filters) ─────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            flexWrap: "wrap",
            margin: "28px 0 4px",
          }}
        >
          <CategoryTab
            label="All"
            count={counts.All ?? 0}
            active={category === null}
            onClick={() => setCategory(null)}
          />
          {TREND_CATEGORIES.map((c) => (
            <CategoryTab
              key={c}
              label={categoryMeta(c).label}
              count={counts[c] ?? 0}
              active={category === c}
              onClick={() => setCategory(c)}
            />
          ))}
        </div>

        {/* ── The two-up index / empty state ───────────────────── */}
        {visible.length === 0 ? (
          <TrackerEmptyState isAdmin={isAdmin} />
        ) : (
          <>
            <div
              className="trend-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                columnGap: 48,
                rowGap: 0,
                borderTop: "1px solid var(--color-border)",
              }}
            >
              {shown.map((t, i) => (
                <TrendCell key={t.slug} trend={t} index={i} />
              ))}
            </div>

            {remaining > 0 && (
              <div style={{ marginTop: 32, display: "flex", justifyContent: "center" }}>
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  className="editorial-link"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    border: "none",
                    background: "none",
                    padding: 0,
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--color-accent)",
                    fontFamily: "inherit",
                  }}
                >
                  Show {remaining} more
                  <ArrowRight />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Editorial-link sweep (copied by value from home-client/dashboard-client),
          plus the cell-hover title lift, the cell entrance, and the gauge draw-in.
          Reduced motion collapses every animation to instant from first paint. */}
      <style>{`
        [data-surface="editorial"] .editorial-link {
          position: relative;
        }
        [data-surface="editorial"] .editorial-link svg {
          transition: transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        [data-surface="editorial"] .editorial-link:hover svg {
          transform: translateX(3px);
        }
        [data-surface="editorial"] .editorial-link::after {
          content: "";
          position: absolute;
          left: 0;
          right: 18px;
          bottom: -2px;
          height: 1px;
          background-color: currentColor;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        [data-surface="editorial"] .editorial-link:hover::after {
          transform: scaleX(1);
        }

        /* Trend name: text by default, lifts to the accent and sweeps its
           underline when the whole cell is hovered (the cell is the link). */
        [data-surface="editorial"] .trend-cell-name {
          color: var(--color-text);
          transition: color 180ms ease;
        }
        [data-surface="editorial"] .trend-cell:hover .trend-cell-name {
          color: var(--color-accent);
        }
        [data-surface="editorial"] .trend-cell:hover .trend-cell-name::after {
          transform: scaleX(1);
        }

        /* Motion at full strength; gated by prefers-reduced-motion (no JS needed). */
        @keyframes trendCellIn {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes trendGaugeIn {
          from { opacity: 0; transform: translateX(-6px); }
          to   { opacity: 1; transform: none; }
        }
        [data-surface="editorial"] .trend-cell {
          animation-name: trendCellIn;
          animation-duration: 220ms;
          animation-timing-function: cubic-bezier(0.2, 0.8, 0.2, 1);
          animation-fill-mode: both;
          transform-origin: left;
        }
        [data-surface="editorial"] .trend-gauge-dot {
          animation-name: trendGaugeIn;
          animation-duration: 240ms;
          animation-timing-function: cubic-bezier(0.2, 0.8, 0.2, 1);
          animation-fill-mode: both;
        }
        @media (prefers-reduced-motion: reduce) {
          [data-surface="editorial"] .trend-cell,
          [data-surface="editorial"] .trend-gauge-dot {
            animation-name: none;
          }
        }
      `}</style>
    </div>
  );
}

// ── The two-up cell (Typewolf-mapped) ────────────────────────────────────────

function TrendCell({ trend, index }: { trend: TrendCardData; index: number }) {
  const cat = categoryMeta(trend.category);
  const dir = directionMeta(trend.direction);
  const reduced = usePrefersReducedMotion();
  const badgeNum = String(index + 1).padStart(2, "0");
  // Capped 18ms stagger; the gauge draw is gated the same way (see <style>).
  const staggerMs = Math.min(index, 11) * 18;

  return (
    <div
      className="trend-cell"
      style={{
        position: "relative",
        padding: "28px 0",
        borderBottom: "1px solid var(--color-border)",
        animationName: reduced ? "none" : undefined,
        animationDelay: reduced ? undefined : `${staggerMs}ms`,
      }}
    >
      {/* Full-cell click target. aria-label carries the name; the visible heading
          below is decorative-but-readable structure (mirrors the prior card). */}
      <Link
        href={`/trends/${trend.slug}`}
        aria-label={trend.name}
        style={{ position: "absolute", inset: 0 }}
      />

      {/* Number badge + category kicker */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <span
          aria-hidden
          style={{
            width: 28,
            height: 28,
            flexShrink: 0,
            borderRadius: 999,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: `var(--tile-${cat.tileColor}-bg)`,
            color: `var(--tile-${cat.tileColor}-fg)`,
            fontSize: 13,
            fontWeight: 600,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {badgeNum}
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: `var(--tile-${cat.tileColor}-fg)`,
          }}
        >
          {cat.label}
        </span>
        {trend.status === "draft" && <DraftChip />}
      </div>

      {/* Trend name, the hero */}
      <h2 style={{ margin: 0 }}>
        <span
          className="editorial-link trend-cell-name"
          style={{
            display: "inline-block",
            maxWidth: "100%",
            fontSize: "var(--text-xl)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
          }}
        >
          {trend.name}
        </span>
      </h2>

      {/* Preview (one or two lines of whatsHappening) */}
      <p
        style={{
          margin: "10px 0 0",
          fontSize: 14,
          color: "var(--color-text-2)",
          lineHeight: 1.55,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical" as const,
          overflow: "hidden",
        }}
      >
        {trend.whatsHappening}
      </p>

      {/* THEMES line (Typewolf's "FONTS" slot) */}
      {trend.themes.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <ThemeTags themes={trend.themes} />
        </div>
      )}

      {/* Quiet momentum read: number, dot-on-track gauge, heating glyph, concepts */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 16 }}>
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--color-text)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {trend.momentum}
        </span>
        <MomentumGauge value={trend.momentum} reduced={reduced} />
        <span style={{ display: "inline-flex", color: dir.color }} title={dir.label} aria-label={dir.label}>
          <Icon name={dir.icon} size={14} />
        </span>
        {trend.conceptCount > 0 && (
          <span style={{ fontSize: 12, color: "var(--color-text-2)" }}>
            {trend.conceptCount} concept{trend.conceptCount === 1 ? "" : "s"}
          </span>
        )}
      </div>
    </div>
  );
}

/** Dot-on-track momentum gauge. Dot x = normalize(momentum, 65, 95); the value is
 *  always rendered at its true position (no-JS accurate), then eased in on mount. */
function MomentumGauge({ value, reduced }: { value: number; reduced: boolean }) {
  const TRACK = 72;
  const DOT = 7;
  const leftPx = normalize(value, 65, 95) * (TRACK - DOT);
  return (
    <span
      aria-hidden
      style={{ position: "relative", display: "inline-block", width: TRACK, height: DOT, flexShrink: 0 }}
    >
      <span
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: (DOT - 1) / 2,
          height: 1,
          backgroundColor: "var(--color-border)",
        }}
      />
      <span
        className="trend-gauge-dot"
        style={{
          position: "absolute",
          left: leftPx,
          top: 0,
          width: DOT,
          height: DOT,
          borderRadius: 999,
          backgroundColor: "var(--color-accent)",
          animationName: reduced ? "none" : undefined,
        }}
      />
    </span>
  );
}

// ── Shared facet + utilities (re-used by the detail page) ────────────────────

/** The THEMES line: a grey micro-label then one or two colored, uppercase tags. */
export function ThemeTags({ themes }: { themes: string[] }) {
  if (themes.length === 0) return null;
  return (
    <span style={{ display: "inline-flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--color-text-3)",
        }}
      >
        Themes
      </span>
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {themes.map((t, i) => (
          <span key={t}>
            <span style={{ color: `var(--tile-${THEME_TILE[t] ?? "stone"}-fg)` }}>{t}</span>
            {i < themes.length - 1 && <span style={{ color: "var(--color-text-3)" }}>, </span>}
          </span>
        ))}
      </span>
    </span>
  );
}

/** Clamp value to [lo, hi] then map to 0..1. Drives the gauge dot + the ThinBar. */
export function normalize(value: number, lo: number, hi: number): number {
  if (hi <= lo) return 0;
  return Math.max(0, Math.min(1, (value - lo) / (hi - lo)));
}

/** matchMedia hook; SSR-safe (false until mounted), with listener cleanup. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduced;
}

export function directionMeta(direction: string): { label: string; icon: IconName; color: string } {
  return direction === "cooling"
    ? { label: "Cooling", icon: "trend-down", color: "var(--tile-steel-fg)" }
    : { label: "Heating", icon: "trending-up", color: "var(--color-gold)" };
}

// ── Detail-page chips (kept; the detail client imports these) ────────────────

/** Momentum-stage pill (emerging -> cooling), tile-colored. */
export function MomentumChip({ label }: { label: string }) {
  const meta = momentumLabelMeta(label);
  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: "var(--text-xs)",
        fontWeight: 600,
        color: `var(--tile-${meta.tileColor}-fg)`,
        backgroundColor: `var(--tile-${meta.tileColor}-bg)`,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        whiteSpace: "nowrap",
      }}
    >
      {meta.label}
    </span>
  );
}

/** Category dot + label. */
export function CategoryBadge({ category }: { category: string }) {
  const cat = categoryMeta(category);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: "var(--text-xs)",
        fontWeight: 600,
        color: "var(--color-text-3)",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}
    >
      <span
        aria-hidden
        style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: `var(--tile-${cat.tileColor}-fg)` }}
      />
      {cat.label}
    </span>
  );
}

export function DraftChip() {
  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: "var(--text-xs)",
        fontWeight: 600,
        color: "var(--color-gold)",
        backgroundColor: "var(--color-gold-soft)",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}
    >
      Draft
    </span>
  );
}

// ── Category tab (ghost text, 2px accent sweep when active or hovered) ────────

function CategoryTab({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "baseline",
        gap: 6,
        border: "none",
        background: "none",
        padding: "4px 0",
        cursor: "pointer",
        fontSize: 14,
        fontWeight: 600,
        fontFamily: "inherit",
        color: active ? "var(--color-accent)" : "var(--color-text-2)",
        transition: "color 160ms ease",
      }}
    >
      {label}
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: active ? "var(--color-accent)" : "var(--color-text-3)",
        }}
      >
        {count}
      </span>
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: -2,
          height: 2,
          backgroundColor: "var(--color-accent)",
          transform: `scaleX(${active || hov ? 1 : 0})`,
          transformOrigin: "left",
          transition: "transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
      />
    </button>
  );
}

// ── Copied editorial primitives (inlined; not exported from home/dashboard) ───

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "var(--color-text-3)",
        marginBottom: 16,
      }}
    >
      {children}
    </div>
  );
}

function ArrowRight() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────────

function TrackerEmptyState({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px",
        gap: 16,
        marginTop: 40,
        textAlign: "center",
      }}
    >
      <span style={{ color: "var(--color-text-3)" }}>
        <Icon name="pulse" size={28} />
      </span>
      <p style={{ fontSize: 16, margin: 0, fontWeight: 600, color: "var(--color-text)" }}>
        No trends to show yet
      </p>
      <p style={{ fontSize: 14, margin: 0, color: "var(--color-text-2)", maxWidth: 400, lineHeight: 1.55 }}>
        {isAdmin
          ? "Seed trends with scripts/seed-trends.ts, then publish them from the admin Trends card to make them visible to members."
          : "The trend tracker is being prepared. Check back shortly."}
      </p>
    </div>
  );
}
