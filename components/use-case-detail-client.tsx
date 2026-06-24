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
  StatusChip,
  usePrefersReducedMotion,
} from "@/components/benchmarks-client";
import {
  Beat,
  FlagChip,
  GoDeeper,
  MicroLabel,
  Prose,
  ScoreStamp,
  WatchOut,
  BackLink,
  monYear,
} from "@/components/benchmark-detail-client";
import type {
  UseCaseDetailData,
  UseCaseHowToChooseView,
  UseCasePickView,
  UseCaseRailAnchor,
  UseCaseYardstickView,
} from "@/lib/use-cases";

/**
 * The use-case "decision walk". A two-column editorial split that mirrors
 * benchmark-detail-client beat for beat (the .trend-detail-split / -rule classes,
 * the .trend-detail-enter fade, data-surface="editorial", --maxw-content), so it
 * inherits the voice for free.
 *
 * Left column is the prose spine: the how-to-choose guidance IS the spine, not a
 * sidebar. Right rail is the honest-picks panel (the analog of LeaderPanel): a
 * board-bound dated stamp, then a hairline-separated PickStamp column where each
 * pick is a claim welded to its receipt, never a podium and never a vs-N delta.
 *
 * Honest-picks-only is structural here: a pick AUTHORS only its label, the cited
 * (slug, rank(s)), and a caveat; the model / score / date / flags come straight
 * from the exported ScoreStamp atom resolved against the board's leaders, so the
 * flattering half (the name) is physically un-screenshot-able without the
 * qualifying half (the caveat is part of the welded block).
 */
export function UseCaseDetailClient({
  useCase,
  isAdmin,
}: {
  useCase: UseCaseDetailData;
  isAdmin: boolean;
}) {
  const reduced = usePrefersReducedMotion();

  return (
    <div data-surface="editorial" style={{ backgroundColor: "var(--color-bg)", minHeight: "100%" }}>
      <div
        className="trend-detail-enter"
        style={{ maxWidth: "var(--maxw-content)", margin: "0 auto", padding: "40px 40px 96px" }}
      >
        <div
          className="trend-detail-split"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.5fr) 1px minmax(0, 1fr)",
            columnGap: 48,
          }}
        >
          {/* ── LEFT: the decision walk ─────────────────────────── */}
          <div style={{ minWidth: 0 }}>
            <BackLink href="/benchmarks" label="Back to tasks" />

            {/* USE CASE kicker + draft chip */}
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
                Use case
              </span>
              {useCase.status === "draft" && <DraftChip />}
            </div>

            {/* Name + one bold task lead */}
            <h1
              style={{
                margin: 0,
                fontSize: "clamp(30px, 3.4vw, 40px)",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                lineHeight: 1.12,
                color: "var(--color-text)",
              }}
            >
              {useCase.name}
            </h1>
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
              {useCase.taskLead}
            </p>

            {/* BOTTOM LINE: a 3px left-border callout, not a tinted box */}
            <BottomLineCallout text={useCase.bottomLine} />

            {/* BEAT 1: the tests that matter (named before any leader) */}
            <HairRule top={36} bottom={28} />
            <Beat title="The tests that matter">
              <Prose>{useCase.evidenceLine}</Prose>
              <YardstickList yardsticks={useCase.yardsticks} />
            </Beat>

            {/* BEAT 2: how to choose (the spine) */}
            <HairRule top={32} bottom={28} />
            <Beat title="How to choose">
              <HowToChoose
                branches={useCase.howToChoose}
                honestEmpty={useCase.honestEmpty}
                judgeCriteria={useCase.judgeCriteria}
              />
            </Beat>

            {/* BEAT 3: what to watch (the one structural recolor) */}
            <HairRule top={32} bottom={28} />
            <WatchOut text={useCase.watchOut} url={useCase.watchOutUrl} />

            {useCase.relatedConcepts.length > 0 && (
              <>
                <HairRule top={32} bottom={28} />
                <GoDeeper concepts={useCase.relatedConcepts} />
              </>
            )}
          </div>

          {/* The 1px vertical rule (hidden when the split collapses) */}
          <div className="trend-detail-rule" aria-hidden style={{ backgroundColor: "var(--color-border)" }} />

          {/* ── RIGHT: the honest-picks panel ───────────────────── */}
          <div style={{ minWidth: 0 }}>
            <PicksRail useCase={useCase} />
          </div>
        </div>

        {isAdmin && <UseCaseModeration useCase={useCase} />}
      </div>

      <style>{`
        [data-surface="editorial"] .trend-detail-enter {
          animation: ucDetailFade 260ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }
        @keyframes ucDetailFade { from { opacity: 0; } to { opacity: 1; } }
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
          [data-surface="editorial"] .trend-detail-enter { animation-name: ${reduced ? "none" : "ucDetailFade"}; }
        }
      `}</style>
    </div>
  );
}

// ── Left column pieces ────────────────────────────────────────────────────────

/** Strip a trailing parenthetical: "BFCL (Berkeley Function Calling)" -> "BFCL". */
function shortName(name: string): string {
  return name.split(" (")[0].trim();
}

/** The benchlm signature, made honest: a 3px left bar (not a tinted box) carrying
 *  the trust-gated, single-board-dated bottom line. */
function BottomLineCallout({ text }: { text: string }) {
  return (
    <div style={{ marginTop: 26, paddingLeft: 18, borderLeft: "3px solid var(--color-text)" }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--color-text-3)",
          marginBottom: 8,
        }}
      >
        Bottom line
      </div>
      <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: "var(--color-text)", maxWidth: 640 }}>{text}</p>
    </div>
  );
}

function YardstickList({ yardsticks }: { yardsticks: UseCaseYardstickView[] }) {
  if (yardsticks.length === 0) return null;
  return (
    <div style={{ marginTop: 20 }}>
      {yardsticks.map((y) => (
        <div
          key={y.benchmarkSlug}
          style={{
            display: "flex",
            gap: 12,
            padding: "14px 0",
            borderBottom: "1px solid var(--color-border-subtle)",
          }}
        >
          <div style={{ flexShrink: 0, marginTop: 2 }}>
            <StatusChip trust={y.trust} size="sm" />
          </div>
          <div style={{ minWidth: 0 }}>
            <Link
              href={`/benchmarks/${y.benchmarkSlug}`}
              className="editorial-link"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 15,
                fontWeight: 600,
                color: "var(--color-text)",
                textDecoration: "none",
              }}
            >
              {y.name}
              <ArrowRight />
            </Link>
            <p style={{ margin: "6px 0 0", fontSize: 14, lineHeight: 1.55, color: "var(--color-text-2)" }}>
              {y.trustGloss}
            </p>
            {y.crossTags.length > 0 && (
              <p style={{ margin: "5px 0 0", fontSize: 12, color: "var(--color-text-3)", fontStyle: "italic" }}>
                Also central to {y.crossTags.join(", ")}.
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function HowToChoose({
  branches,
  honestEmpty,
  judgeCriteria,
}: {
  branches: UseCaseHowToChooseView[];
  honestEmpty: boolean;
  judgeCriteria: string[];
}) {
  return (
    <div>
      {honestEmpty && (
        <Prose>
          No board here measures this cleanly, so we are not naming a winner. Judge it yourself on
          these things.
        </Prose>
      )}

      <div style={{ marginTop: honestEmpty ? 18 : 6, display: "flex", flexDirection: "column", gap: 18 }}>
        {branches.map((b, i) => (
          <div key={i} style={{ maxWidth: 660 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text)" }}>{b.goal}</div>
            <p style={{ margin: "6px 0 0", fontSize: 14, lineHeight: 1.6, color: "var(--color-text-2)" }}>
              {b.guidance}
            </p>
            {b.noCleanAnswer && b.reason ? (
              <p style={{ margin: "6px 0 0", fontSize: 13, lineHeight: 1.55, color: "var(--color-gold)" }}>
                No clean answer yet: {b.reason}
              </p>
            ) : (
              b.benchmarkName &&
              b.benchmarkSlug && (
                <Link
                  href={`/benchmarks/${b.benchmarkSlug}`}
                  className="editorial-link"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    marginTop: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--color-accent)",
                    textDecoration: "none",
                  }}
                >
                  {b.benchmarkName}
                  <ArrowRight />
                </Link>
              )
            )}
          </div>
        ))}
      </div>

      {judgeCriteria.length > 0 && (
        <ol style={{ margin: "20px 0 0", paddingLeft: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          {judgeCriteria.map((c, i) => (
            <li key={i} style={{ fontSize: 15, lineHeight: 1.6, color: "var(--color-text-2)", maxWidth: 620 }}>
              {c}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

// ── Right rail: the honest-picks panel ────────────────────────────────────────

function PicksRail({ useCase }: { useCase: UseCaseDetailData }) {
  return (
    <div style={{ position: "relative" }}>
      {useCase.bottomLineAnchor && <RailAnchorHeader anchor={useCase.bottomLineAnchor} />}

      {useCase.honestEmpty ? (
        <HonestEmptyRail datedAnchor={useCase.datedAnchor} gapReason={useCase.gapReason} />
      ) : (
        <div>
          {useCase.picks.map((p, i) => (
            <PickStamp key={i} pick={p} />
          ))}
        </div>
      )}

      <RailFooter backing={useCase.backing} honestEmpty={useCase.honestEmpty} />
    </div>
  );
}

/** A board-bound dated stamp: the bottom-line board's name + its OWN date, never
 *  a "top model is X" line and never a max-across-picks reduction. */
function RailAnchorHeader({ anchor }: { anchor: UseCaseRailAnchor }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <Link
          href={`/benchmarks/${anchor.slug}`}
          className="editorial-link"
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--color-text-2)",
            textDecoration: "none",
          }}
        >
          {anchor.name}
        </Link>
        <StatusChip trust={anchor.trust} size="sm" />
      </div>
      <div
        style={{
          margin: "8px 0 0",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--color-text-3)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {anchor.asOfDate ? `As of ${monYear(anchor.asOfDate)}` : "No public board date"}
      </div>
      <div aria-hidden style={{ height: 1, backgroundColor: "var(--color-border)", margin: "14px 0 0" }} />
    </div>
  );
}

/** One honest pick: a claim welded to its receipt. The verb bridge connects the
 *  claim to exactly one board; each cited rank renders its own welded ScoreStamp
 *  (model + verbatim score + date + source); the caveat is part of the block. */
function PickStamp({ pick }: { pick: UseCasePickView }) {
  return (
    <div style={{ padding: "20px 0", borderBottom: "1px solid var(--color-border-subtle)" }}>
      {/* Line A: trust-gated chip + the claim */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <StatusChip trust={pick.trust} size="sm" />
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)", lineHeight: 1.35 }}>
          {pick.label}
        </span>
      </div>

      {/* Honest-empty pick: no model name, ever. */}
      {pick.empty ? (
        <p style={{ margin: "10px 0 0", fontSize: 13, lineHeight: 1.6, color: "var(--color-text-2)" }}>
          No board here names a leader cleanly.
        </p>
      ) : (
        <>
          {/* The verb bridge: "{verb} {board} ->" plus the SCAFFOLD word when needed */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", margin: "10px 0 4px" }}>
            <Link
              href={`/benchmarks/${pick.benchmarkSlug}`}
              className="editorial-link"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 13,
                fontWeight: 600,
                color: "var(--color-accent)",
                textDecoration: "none",
              }}
            >
              {pick.verb} {shortName(pick.benchmarkName)}
              <ArrowRight />
            </Link>
            {pick.scaffold && <FlagChip label="Scaffold" tile="gold" />}
          </div>

          {/* One welded ScoreStamp per cited rank (co-leaders weld every tied rank) */}
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 14 }}>
            {pick.stamps.map((s, i) => (
              <ScoreStamp key={i} leader={s} />
            ))}
          </div>
        </>
      )}

      {/* The mandatory what-was-tested clause for a scaffold (the word carries it) */}
      {pick.whatWasTested && (
        <CaveatBlock label="What was actually tested" text={pick.whatWasTested} />
      )}

      {/* The required caveat: the qualifying half, welded to the pick */}
      <CaveatBlock label={pick.coLeaders ? "Near-tie" : "Caveat"} text={pick.caveat} />
    </div>
  );
}

/** A gold-hued caveat line: a 2px gold bar + a gold eyebrow, lighter than the
 *  WATCH OUT beat but unmistakably a caution. Never separable from its pick. */
function CaveatBlock({ label, text }: { label: string; text: string }) {
  return (
    <div style={{ marginTop: 12, paddingLeft: 12, borderLeft: "2px solid var(--color-gold)" }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--color-gold)",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <p style={{ margin: 0, fontSize: 12, lineHeight: 1.55, color: "var(--color-text-2)" }}>{text}</p>
    </div>
  );
}

/** The honest-empty rail: lead with what IS known (the dated anchor), then name
 *  the gap and why it exists. The judge-it-yourself criteria live in the spine. */
function HonestEmptyRail({
  datedAnchor,
  gapReason,
}: {
  datedAnchor: string | null;
  gapReason: string | null;
}) {
  return (
    <div style={{ paddingTop: 18 }}>
      {datedAnchor && (
        <div>
          <MicroLabel>What is known</MicroLabel>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "var(--color-text-2)" }}>{datedAnchor}</p>
        </div>
      )}
      {gapReason && (
        <div style={{ marginTop: 16 }}>
          <MicroLabel>Why there is no leader</MicroLabel>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "var(--color-text-2)" }}>{gapReason}</p>
        </div>
      )}
    </div>
  );
}

function RailFooter({
  backing,
  honestEmpty,
}: {
  backing: { slug: string; name: string; trust: string }[];
  honestEmpty: boolean;
}) {
  return (
    <div
      style={{
        marginTop: 18,
        paddingTop: 16,
        borderTop: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {backing.length > 0 && (
        <div>
          <MicroLabel>{backing.length === 1 ? "Backing board" : "Backing boards"}</MicroLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 14px" }}>
            {backing.map((b) => (
              <Link
                key={b.slug}
                href={`/benchmarks/${b.slug}`}
                className="editorial-link"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--color-text-2)",
                  textDecoration: "none",
                }}
              >
                {shortName(b.name)}
                <StatusChip trust={b.trust} size="sm" />
              </Link>
            ))}
          </div>
        </div>
      )}
      {honestEmpty && (
        <div style={{ fontSize: 11, color: "var(--color-text-3)", lineHeight: 1.5 }}>
          No live board for this task.
        </div>
      )}
      <Link
        href="/benchmarks"
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
        Browse all 22 benchmarks
        <ArrowRight />
      </Link>
    </div>
  );
}

// ── Admin moderation (per-use-case publish gate; ADMIN only) ──────────────────

function UseCaseModeration({ useCase }: { useCase: UseCaseDetailData }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const published = useCase.status === "published";

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/use-cases", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: useCase.slug, action: published ? "unpublish" : "publish" }),
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

  const pickCount = useCase.picks.filter((p) => !p.empty).length;

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
            {useCase.honestEmpty ? "Honest-empty" : `${pickCount} honest pick${pickCount === 1 ? "" : "s"}`}.{" "}
            {useCase.backing.length} backing board{useCase.backing.length === 1 ? "" : "s"}.
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
