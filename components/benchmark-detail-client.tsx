"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  ArrowRight,
  DraftChip,
  HairRule,
  SectionEyebrow,
  StatusChip,
  TRUST_META,
  splitLead,
  usePrefersReducedMotion,
} from "@/components/benchmarks-client";
import type {
  BenchmarkDetailData,
  BenchmarkLeaderView,
  BenchmarkRelatedConcept,
} from "@/lib/benchmarks";

/**
 * Benchmark brief detail page. A two-column editorial split (prose left, leader
 * rail right) under data-surface="editorial". The left column opens with the
 * STATUS word large as the page tone-setter, then the name, one bold lead
 * sentence, and four beats in fixed order (WHAT IT MEASURES, WHY YOU SHOULD CARE,
 * HOW SCORING WORKS, WHAT TO WATCH). WHY YOU SHOULD CARE is placed second so a
 * bailing reader still gets the payoff; WHAT TO WATCH is the one structural
 * recolor on the surface (gold eyebrow + a 3px gold bar).
 *
 * The right rail is the leader panel: a dated stamp on its own hairline, the
 * welded ScoreStamp atom per row (model + verbatim score + dated source, never
 * separated), inline SELF-REPORTED / DISPUTED chips, tied-rank and near-tie
 * handling, an honest-empty state with a single dated anchor where no
 * trustworthy current board exists, and a static date-vs-date board-behind line.
 *
 * Reuses the .trend-detail-split / .trend-detail-rule classes (collapse to one
 * column and hide the rule at <=720px). Motion is gated by usePrefersReducedMotion.
 */
export function BenchmarkDetailClient({
  benchmark,
  isAdmin,
}: {
  benchmark: BenchmarkDetailData;
  isAdmin: boolean;
}) {
  const reduced = usePrefersReducedMotion();
  const meta = TRUST_META[benchmark.trust] ?? { label: benchmark.trust, tile: "stone", gloss: "" };
  const [lead, measuresRest] = splitLead(benchmark.whatItMeasures);

  const stateTag = benchmark.nearTie
    ? "near tie"
    : benchmark.needsRecheck
      ? "under review"
      : null;

  return (
    <div data-surface="editorial" style={{ backgroundColor: "var(--color-bg)", minHeight: "100%" }}>
      <div className="trend-detail-enter" style={{ maxWidth: "var(--maxw-content)", margin: "0 auto", padding: "40px 40px 96px" }}>
        <div
          className="trend-detail-split"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.5fr) 1px minmax(0, 1fr)",
            columnGap: 48,
          }}
        >
          {/* ── LEFT: the brief ─────────────────────────────────── */}
          <div style={{ minWidth: 0 }}>
            <BackLink />

            {/* Domain kicker + draft chip */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 24, marginBottom: 14 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--color-text-3)",
                }}
              >
                {benchmark.domain}
              </span>
              {benchmark.status === "draft" && <DraftChip />}
            </div>

            {/* STATUS word large (tone-setter) + its plain-language meaning */}
            <div
              className="bench-detail-headline"
              style={{ animationName: reduced ? "none" : undefined }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
                <span
                  style={{
                    fontSize: "clamp(22px, 2.4vw, 28px)",
                    fontWeight: 600,
                    letterSpacing: "0.01em",
                    textTransform: "uppercase",
                    color: `var(--tile-${meta.tile}-fg)`,
                  }}
                >
                  {meta.label}
                </span>
                {stateTag && (
                  <span style={{ fontSize: 13, color: "var(--color-text-3)" }}>({stateTag})</span>
                )}
              </div>
              <p style={{ margin: "8px 0 0", fontSize: 15, lineHeight: 1.55, color: "var(--color-text-2)", maxWidth: 640 }}>
                {meta.gloss}
              </p>
            </div>

            {/* Name */}
            <h1
              style={{
                margin: "24px 0 0",
                fontSize: "clamp(30px, 3.4vw, 40px)",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                lineHeight: 1.12,
                color: "var(--color-text)",
              }}
            >
              {benchmark.name}
            </h1>

            {/* One bold lead sentence (bus-stop definition) */}
            <p
              style={{
                margin: "18px 0 0",
                fontSize: 19,
                fontWeight: 500,
                color: "var(--color-text)",
                lineHeight: 1.5,
                maxWidth: 660,
              }}
            >
              {lead}
            </p>

            {/* The four beats */}
            <HairRule top={36} bottom={28} />
            <Beat title="What it measures">
              {measuresRest && <Prose>{measuresRest}</Prose>}
              {benchmark.exampleTask && <ExampleTask text={benchmark.exampleTask} />}
            </Beat>

            <HairRule top={32} bottom={28} />
            <Beat title="Why you should care">
              <Prose>{benchmark.whyCare}</Prose>
            </Beat>

            <HairRule top={32} bottom={28} />
            <Beat title="How scoring works">
              <Prose>{benchmark.scoring}</Prose>
              {benchmark.calibration && (
                <div style={{ marginTop: 18 }}>
                  <MicroLabel>How to read the numbers</MicroLabel>
                  <Prose>{benchmark.calibration}</Prose>
                </div>
              )}
            </Beat>

            <HairRule top={32} bottom={28} />
            <WatchOut text={benchmark.watchOut} url={benchmark.watchOutUrl} />

            {benchmark.relatedConcepts.length > 0 && (
              <>
                <HairRule top={32} bottom={28} />
                <GoDeeper concepts={benchmark.relatedConcepts} />
              </>
            )}
          </div>

          {/* The 1px vertical rule (hidden when the split collapses) */}
          <div className="trend-detail-rule" aria-hidden style={{ backgroundColor: "var(--color-border)" }} />

          {/* ── RIGHT: the leader panel ─────────────────────────── */}
          <div style={{ minWidth: 0 }}>
            <LeaderPanel benchmark={benchmark} />
          </div>
        </div>

        {isAdmin && <BenchmarkModeration benchmark={benchmark} />}
      </div>

      <style>{`
        @keyframes benchHeadlineIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: none; }
        }
        [data-surface="editorial"] .trend-detail-enter {
          animation: benchDetailFade 260ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }
        @keyframes benchDetailFade { from { opacity: 0; } to { opacity: 1; } }
        [data-surface="editorial"] .bench-detail-headline {
          animation: benchHeadlineIn 320ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }
        [data-surface="editorial"] .editorial-link { position: relative; }
        [data-surface="editorial"] .editorial-link svg {
          transition: transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        [data-surface="editorial"] .editorial-link:hover svg { transform: translateX(3px); }
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
        [data-surface="editorial"] .editorial-link:hover::after { transform: scaleX(1); }
        @media (prefers-reduced-motion: reduce) {
          [data-surface="editorial"] .bench-detail-headline { animation-name: none; }
        }
      `}</style>
    </div>
  );
}

// ── Left-column pieces ────────────────────────────────────────────────────────

export function BackLink() {
  return (
    <Link
      href="/benchmarks"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontSize: 13,
        color: "var(--color-text-3)",
        textDecoration: "none",
        transition: "color 100ms ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text-2)")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-3)")}
    >
      <Icon name="arrow-left" size={13} />
      Benchmarks
    </Link>
  );
}

export function Beat({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <SectionEyebrow>{title}</SectionEyebrow>
      {children}
    </section>
  );
}

export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ margin: "0 0 0", fontSize: 15, lineHeight: 1.7, color: "var(--color-text-2)", maxWidth: 660 }}>
      {children}
    </p>
  );
}

export function MicroLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--color-text-3)",
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

export function ExampleTask({ text }: { text: string }) {
  return (
    <div
      style={{
        marginTop: 18,
        paddingLeft: 16,
        borderLeft: "2px solid var(--color-border)",
        maxWidth: 660,
      }}
    >
      <MicroLabel>Example task</MicroLabel>
      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65, color: "var(--color-text-2)" }}>{text}</p>
    </div>
  );
}

/** The one structural recolor on the surface: gold eyebrow + a 3px gold bar. */
export function WatchOut({ text, url }: { text: string; url: string | null }) {
  return (
    <section>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--color-gold)",
          marginBottom: 10,
        }}
      >
        What to watch
      </div>
      <div aria-hidden style={{ height: 3, width: "100%", backgroundColor: "var(--color-gold)", marginBottom: 18 }} />
      <Prose>{text}</Prose>
      {url && (
        <div style={{ marginTop: 14 }}>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="editorial-link"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 14,
              fontWeight: 600,
              color: "var(--color-accent)",
              textDecoration: "none",
            }}
          >
            Read more at {domainOf(url)}
            <Icon name="arrow-square-out" size={13} />
          </a>
        </div>
      )}
    </section>
  );
}

export function GoDeeper({ concepts }: { concepts: BenchmarkRelatedConcept[] }) {
  return (
    <section>
      <SectionEyebrow>To go deeper</SectionEyebrow>
      <p style={{ margin: "0 0 14px", fontSize: 15, lineHeight: 1.6, color: "var(--color-text-2)", maxWidth: 660 }}>
        The benchmark creates the need to know. The catalog explains the ideas behind it:
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 22px" }}>
        {concepts.map((c, i) =>
          c.slug ? (
            <Link
              key={i}
              href={`/concepts/${c.slug}`}
              className="editorial-link"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 15,
                fontWeight: 600,
                color: "var(--color-accent)",
                textDecoration: "none",
              }}
            >
              {c.label}
              <ArrowRight />
            </Link>
          ) : (
            <span key={i} style={{ fontSize: 15, color: "var(--color-text-3)" }}>
              {c.label}
            </span>
          ),
        )}
      </div>
    </section>
  );
}

// ── Right rail: the leader panel ──────────────────────────────────────────────

function LeaderPanel({ benchmark }: { benchmark: BenchmarkDetailData }) {
  const { leaders, honestEmpty } = benchmark;
  const newestAsOf = leaders.reduce<string>((acc, l) => (l.asOfDate > acc ? l.asOfDate : acc), "");
  const stampLabel = honestEmpty || !newestAsOf ? "Leaders" : `Leaders as of ${monYear(newestAsOf)}`;

  // Tied ranks (same rank integer, e.g. HLE's two rank-1 rows) get a shared badge.
  const rankCounts = leaders.reduce<Record<number, number>>((acc, l) => {
    acc[l.rank] = (acc[l.rank] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--color-text-3)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {stampLabel}
      </div>
      <div aria-hidden style={{ height: 1, backgroundColor: "var(--color-border)", margin: "12px 0 0" }} />

      {honestEmpty ? (
        <HonestEmpty datedAnchor={benchmark.datedAnchor} />
      ) : (
        <>
          <div>
            {leaders.map((l, i) => (
              <LeaderRow key={i} leader={l} tied={(rankCounts[l.rank] ?? 0) > 1} />
            ))}
          </div>
          {benchmark.nearTie && (
            <p
              style={{
                margin: "16px 0 0",
                paddingTop: 14,
                borderTop: "1px solid var(--color-border)",
                fontSize: 12,
                lineHeight: 1.5,
                color: "var(--color-text-3)",
              }}
            >
              The top ranks are a statistical tie. Read this as a cluster, not a clean number one.
            </p>
          )}
        </>
      )}

      <PanelFooter benchmark={benchmark} />
    </div>
  );
}

function LeaderRow({ leader, tied }: { leader: BenchmarkLeaderView; tied: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 14,
        padding: "18px 0",
        borderBottom: "1px solid var(--color-border-subtle)",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flexShrink: 0 }}>
        <span
          aria-hidden
          style={{
            width: 26,
            height: 26,
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
          {leader.rank}
        </span>
        {tied && (
          <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-3)" }}>
            tied
          </span>
        )}
      </div>
      <ScoreStamp leader={leader} />
    </div>
  );
}

/** The welded ScoreStamp atom: three stacked lines that never separate, plus
 *  inline trust chips. The score is kept verbatim; only the date is normalized. */
export function ScoreStamp({ leader }: { leader: BenchmarkLeaderView }) {
  return (
    <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
      {/* line 1: model + lab */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text)", lineHeight: 1.3 }}>
          {leader.model}
        </span>
        {leader.lab && <span style={{ fontSize: 12, color: "var(--color-text-2)" }}>{leader.lab}</span>}
      </div>

      {/* inline trust flags, never on hover */}
      {(leader.selfReported || leader.disputed) && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {leader.selfReported && <FlagChip label="Self-reported" tile="steel" />}
          {leader.disputed && <FlagChip label="Disputed" tile="gold" />}
        </div>
      )}

      {/* line 2: verbatim score + baseline gloss */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text)", fontVariantNumeric: "tabular-nums", lineHeight: 1.35 }}>
          {leader.score}
        </span>
        {leader.baselineGloss && (
          <span style={{ fontSize: 12, color: "var(--color-text-2)", lineHeight: 1.4 }}>
            {leader.baselineGloss}
          </span>
        )}
      </div>

      {/* line 3: normalized as-of label + source */}
      <div style={{ fontSize: 11, color: "var(--color-text-3)" }} title={leader.asOfDate || undefined}>
        {monYear(leader.asOfDate)}
        {leader.sourceUrl && (
          <>
            <span style={{ margin: "0 6px" }}>·</span>
            <a
              href={leader.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--color-text-3)", textDecoration: "underline", textUnderlineOffset: 2 }}
            >
              {domainOf(leader.sourceUrl)}
            </a>
          </>
        )}
      </div>
    </div>
  );
}

export function HonestEmpty({ datedAnchor }: { datedAnchor: string | null }) {
  return (
    <div style={{ paddingTop: 18 }}>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "var(--color-text-2)" }}>
        No reliable current leaderboard. The most cited figure is a dated anchor:
      </p>
      {datedAnchor && (
        <div style={{ marginTop: 14, paddingLeft: 14, borderLeft: "2px solid var(--color-border)" }}>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "var(--color-text-2)" }}>{datedAnchor}</p>
        </div>
      )}
    </div>
  );
}

function PanelFooter({ benchmark }: { benchmark: BenchmarkDetailData }) {
  const { boardLastUpdated, boardBehind, honestEmpty, needsRecheck, leaderboardUrl } = benchmark;

  let boardLine: string | null = null;
  if (!honestEmpty) {
    boardLine = boardLastUpdated
      ? `Board last updated ${monYear(boardLastUpdated)}${boardBehind ? ", may be behind" : ""}.`
      : "Board shows no public last-updated date.";
  }

  return (
    <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-3)" }}>
          Status
        </span>
        <StatusChip trust={benchmark.trust} size="sm" />
      </div>

      {boardLine && (
        <div style={{ fontSize: 11, color: "var(--color-text-3)", lineHeight: 1.5 }}>{boardLine}</div>
      )}

      {needsRecheck && (
        <div style={{ fontSize: 11, color: "var(--color-text-3)", lineHeight: 1.5 }}>
          Scores are pre-correction while the maintainer reviews the benchmark.
        </div>
      )}

      {leaderboardUrl && (
        <a
          href={leaderboardUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="editorial-link"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            fontWeight: 600,
            color: "var(--color-accent)",
            textDecoration: "none",
            alignSelf: "flex-start",
          }}
        >
          {honestEmpty ? "View the board" : "View the leaderboard"}
          <Icon name="arrow-square-out" size={12} />
        </a>
      )}
    </div>
  );
}

export function FlagChip({ label, tile }: { label: string; tile: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "1px 7px",
        borderRadius: 999,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        color: `var(--tile-${tile}-fg)`,
        backgroundColor: `var(--tile-${tile}-bg)`,
      }}
    >
      {label}
    </span>
  );
}

// ── Admin moderation (per-benchmark publish gate; ADMIN only) ─────────────────

function BenchmarkModeration({ benchmark }: { benchmark: BenchmarkDetailData }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const published = benchmark.status === "published";

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/benchmarks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: benchmark.slug, action: published ? "unpublish" : "publish" }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || "Update failed");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section style={{ marginTop: 48 }}>
      <h2
        style={{
          margin: "0 0 16px 0",
          paddingTop: 20,
          borderTop: "1px solid var(--color-border-subtle)",
          fontSize: "var(--text-xs)",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--color-text-3)",
        }}
      >
        Moderation
      </h2>
      <div
        style={{
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-2)",
          padding: "var(--space-4) var(--space-5)",
          backgroundColor: "var(--color-surface)",
          display: "flex",
          alignItems: "center",
          gap: "var(--space-4)",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)" }}>
            {published ? "Live for members" : "Draft, hidden from members"}
          </div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-3)", marginTop: 2 }}>
            Trust tier {TRUST_META[benchmark.trust]?.label ?? benchmark.trust}. {benchmark.domain}.
          </div>
        </div>
        <Button variant={published ? "secondary" : "primary"} disabled={busy} onClick={toggle}>
          {busy ? "Saving..." : published ? "Unpublish" : "Publish"}
        </Button>
        {error && (
          <p style={{ margin: 0, width: "100%", fontSize: "var(--text-sm)", color: "var(--color-incorrect)" }}>
            {error}
          </p>
        )}
      </div>
    </section>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "source";
  }
}

/** ISO date -> "MON YYYY" (UTC, uppercased). Empty in, empty out. */
export function monYear(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d
    .toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" })
    .toUpperCase();
}
