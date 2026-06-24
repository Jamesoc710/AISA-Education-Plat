"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { BenchmarkCardData } from "@/lib/benchmarks";

/**
 * Benchmarks list view, "The Standings". A single-column hairline index at
 * --maxw-content (1040px), NOT the Pulse Index two-up grid: reading two
 * non-comparable scores across a row would invite a false league-table read, so
 * one column forces vertical reading and lines the STATUS column down the page.
 *
 * STATUS (a trust tier), not the score, is the hero of each row. There is
 * deliberately NO raw score on a row: a bare number needs a date, a baseline,
 * and a caveat to mean anything, and a row cannot carry all three honestly, so
 * it carries the trust chip and a four-word caveat instead.
 *
 * Wrapped in data-surface="editorial" for the Quizlet blue accent (#4255FF) and
 * Hanken; data-theme="light" comes from the (main) shell. Primitives are copied
 * by value from trends-client per the editorial-surface convention, and the
 * trust styling is exported so benchmark-detail-client shares one source.
 */

/** The trust taxonomy: display word, tile-color pair, and the plain-language
 *  meaning shown large on the detail page. Carried by the WORD first, color
 *  second, never color alone. */
export const TRUST_META: Record<string, { label: string; tile: string; gloss: string }> = {
  live: {
    label: "Live",
    tile: "sage",
    gloss:
      "The leaderboard is current and actively updated, so this ranking reflects roughly where things stand now.",
  },
  near_ceiling: {
    label: "Near ceiling",
    tile: "steel",
    gloss:
      "Top models score so close together that the gaps are inside the measurement noise, so this test no longer tells you which model is better.",
  },
  contested: {
    label: "Contested",
    tile: "gold",
    gloss:
      "The headline numbers are disputed, self-reported, or under revision, so treat the ranking as a claim, not a settled fact.",
  },
  dated: {
    label: "Dated",
    tile: "stone",
    gloss:
      "There is no trustworthy current leaderboard, so the most recent reliable figure is already months old.",
  },
};

/** Canonical trust-axis order for the filter tabs and the list sort. */
export const TRUST_TAB_ORDER = ["live", "near_ceiling", "contested", "dated"] as const;

export function BenchmarksClient({
  benchmarks,
  isAdmin,
}: {
  benchmarks: BenchmarkCardData[];
  isAdmin: boolean;
}) {
  const [trust, setTrust] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: benchmarks.length };
    for (const b of benchmarks) c[b.trust] = (c[b.trust] ?? 0) + 1;
    return c;
  }, [benchmarks]);

  const visible = trust ? benchmarks.filter((b) => b.trust === trust) : benchmarks;
  const draftCount = benchmarks.filter((b) => b.status === "draft").length;

  return (
    <div data-surface="editorial" style={{ backgroundColor: "var(--color-bg)", minHeight: "100%" }}>
      <div style={{ maxWidth: "var(--maxw-content)", margin: "0 auto", padding: "48px 40px 96px" }}>
        {/* ── Header ──────────────────────────────────────────── */}
        <SectionEyebrow>State of the models</SectionEyebrow>
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
          Benchmarks
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
          The tests labs use to claim progress. Most are saturated, contested, or already out of
          date, so what matters is not the number but whether you can trust it. Here is the honest
          picture, with dates.
        </p>
        {isAdmin && draftCount > 0 && (
          <p style={{ margin: "10px 0 0", fontSize: 11, color: "var(--color-text-3)", letterSpacing: "0.04em" }}>
            Admin view: {draftCount} draft{draftCount === 1 ? "" : "s"} below are hidden from members
            until published.
          </p>
        )}

        {/* ── Trust-axis filter tabs (ghost text, live counts) ─── */}
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
            active={trust === null}
            onClick={() => setTrust(null)}
          />
          {TRUST_TAB_ORDER.filter((t) => (counts[t] ?? 0) > 0).map((t) => (
            <CategoryTab
              key={t}
              label={TRUST_META[t].label}
              count={counts[t] ?? 0}
              active={trust === t}
              onClick={() => setTrust(t)}
            />
          ))}
        </div>

        {/* ── The single-column index / empty state ────────────── */}
        {visible.length === 0 ? (
          <BenchmarksEmptyState isAdmin={isAdmin} />
        ) : (
          <div style={{ borderTop: "1px solid var(--color-border)" }}>
            {visible.map((b, i) => (
              <BenchmarkRow key={b.slug} benchmark={b} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* Editorial-link sweep (copied by value from trends-client), the row name
          lift on cell hover, and the row entrance. Reduced motion collapses the
          entrance to instant from first paint. */}
      <style>{`
        [data-surface="editorial"] .editorial-link {
          position: relative;
        }
        [data-surface="editorial"] .editorial-link::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
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

        /* The benchmark name: text by default, lifts to the accent and sweeps its
           underline when the whole row is hovered (the row is the link). */
        [data-surface="editorial"] .bench-name {
          color: var(--color-text);
          transition: color 180ms ease;
        }
        [data-surface="editorial"] .bench-row:hover .bench-name {
          color: var(--color-accent);
        }
        [data-surface="editorial"] .bench-row:hover .bench-name::after {
          transform: scaleX(1);
        }

        @keyframes benchCellIn {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: none; }
        }
        [data-surface="editorial"] .bench-row {
          animation-name: benchCellIn;
          animation-duration: 220ms;
          animation-timing-function: cubic-bezier(0.2, 0.8, 0.2, 1);
          animation-fill-mode: both;
          transform-origin: left;
        }
        @media (prefers-reduced-motion: reduce) {
          [data-surface="editorial"] .bench-row { animation-name: none; }
        }

        /* Mobile: drop the fixed STATUS column under the text. !important is
           required to beat the inline grid-template-columns (same reason
           .trend-detail-split uses it). */
        @media (max-width: 600px) {
          [data-surface="editorial"] .bench-row {
            grid-template-columns: 36px minmax(0, 1fr) !important;
            row-gap: 12px;
          }
          [data-surface="editorial"] .bench-status {
            grid-column: 2 / -1 !important;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}

// ── The single-column row ─────────────────────────────────────────────────────

function BenchmarkRow({ benchmark, index }: { benchmark: BenchmarkCardData; index: number }) {
  const reduced = usePrefersReducedMotion();
  const badgeNum = String(index + 1).padStart(2, "0");
  const staggerMs = Math.min(index, 11) * 18; // capped 18ms stagger
  const summary = splitLead(benchmark.whatItMeasures)[0];

  return (
    <div
      className="bench-row"
      style={{
        position: "relative",
        display: "grid",
        gridTemplateColumns: "36px minmax(0, 1fr) 172px",
        columnGap: 20,
        alignItems: "start",
        padding: "26px 0",
        borderBottom: "1px solid var(--color-border)",
        animationName: reduced ? "none" : undefined,
        animationDelay: reduced ? undefined : `${staggerMs}ms`,
      }}
    >
      {/* Full-row click target. aria-label carries the name. */}
      <Link
        href={`/benchmarks/${benchmark.slug}`}
        aria-label={benchmark.name}
        style={{ position: "absolute", inset: 0 }}
      />

      {/* Ordinal badge (position only, never rank quality) */}
      <span
        aria-hidden
        style={{
          width: 28,
          height: 28,
          marginTop: 4,
          flexShrink: 0,
          borderRadius: 999,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--tile-indigo-bg)",
          color: "var(--tile-indigo-fg)",
          fontSize: 12,
          fontWeight: 600,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {badgeNum}
      </span>

      {/* Name (hero) + one-line definition + DOMAIN . scoreType strip */}
      <div style={{ minWidth: 0 }}>
        <h2 style={{ margin: 0 }}>
          <span
            className="editorial-link bench-name"
            style={{
              display: "inline-block",
              maxWidth: "100%",
              fontSize: "var(--text-xl)",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
            }}
          >
            {benchmark.name}
          </span>
        </h2>
        <p
          style={{
            margin: "8px 0 0",
            fontSize: 14,
            color: "var(--color-text-2)",
            lineHeight: 1.5,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {summary}
        </p>
        <div
          style={{
            marginTop: 10,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--color-text-3)",
          }}
        >
          {benchmark.domain}
          <span style={{ margin: "0 8px", color: "var(--color-border)" }}>·</span>
          {benchmark.scoreType}
        </div>
      </div>

      {/* STATUS chip + the single most important caveat in four words */}
      <div
        className="bench-status"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 8,
          marginTop: 2,
        }}
      >
        {benchmark.status === "draft" && <DraftChip />}
        <StatusChip trust={benchmark.trust} />
        <div style={{ fontSize: 11, color: "var(--color-text-2)", lineHeight: 1.4 }}>
          {benchmark.caveat}
        </div>
      </div>
    </div>
  );
}

// ── Shared primitives (exported; the detail client reuses these) ──────────────

/** The trust chip: the trust word, tinted by its -bg/-fg tile pair as a unit. */
export function StatusChip({ trust, size = "md" }: { trust: string; size?: "sm" | "md" }) {
  const meta = TRUST_META[trust] ?? { label: trust, tile: "stone", gloss: "" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: size === "sm" ? "2px 8px" : "3px 10px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        color: `var(--tile-${meta.tile}-fg)`,
        backgroundColor: `var(--tile-${meta.tile}-bg)`,
      }}
    >
      {meta.label}
    </span>
  );
}

/** Split a passage into [first sentence, remainder]. The first sentence is the
 *  bus-stop lead (shown on the list row and bold on the detail page); the rest
 *  fills the WHAT IT MEASURES beat. Lookahead on an uppercase start avoids
 *  splitting on decimals (91.16), abbreviations, or "e.g." */
export function splitLead(text: string): [string, string] {
  const m = text.match(/^([\s\S]+?[.!?])\s+(?=[A-Z])([\s\S]*)$/);
  if (m) return [m[1].trim(), m[2].trim()];
  return [text.trim(), ""];
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

export function SectionEyebrow({ children }: { children: React.ReactNode }) {
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

export function HairRule({ top = 32, bottom = 32 }: { top?: number; bottom?: number }) {
  return (
    <div
      aria-hidden
      style={{ height: 1, backgroundColor: "var(--color-border)", margin: `${top}px 0 ${bottom}px` }}
    />
  );
}

export function ArrowRight() {
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
      <span style={{ fontSize: 13, fontWeight: 600, color: active ? "var(--color-accent)" : "var(--color-text-3)" }}>
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

// ── Empty state ──────────────────────────────────────────────────────────────

function BenchmarksEmptyState({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px",
        gap: 12,
        marginTop: 40,
        textAlign: "center",
      }}
    >
      <p style={{ fontSize: 16, margin: 0, fontWeight: 600, color: "var(--color-text)" }}>
        No benchmarks to show
      </p>
      <p style={{ fontSize: 14, margin: 0, color: "var(--color-text-2)", maxWidth: 400, lineHeight: 1.55 }}>
        {isAdmin
          ? "Seed benchmarks with scripts/seed-benchmarks.ts, then publish them from the admin Benchmarks card to make them visible to members."
          : "The standings are being prepared. Check back shortly."}
      </p>
    </div>
  );
}
