"use client";

import Link from "next/link";
import {
  ArrowRight,
  DraftChip,
  HairRule,
  SectionEyebrow,
  usePrefersReducedMotion,
} from "@/components/benchmarks-client";
import type { UseCaseCardData } from "@/lib/use-cases";

/**
 * The use-case explorer, "By Task". The default door at /benchmarks: a single
 * column of hairline rows, one per task, cloned from the PR1 BenchmarkRow grammar
 * so it inherits the <=600px collapse and the capped benchCellIn stagger for free.
 *
 * Honest-picks-only is enforced at the architecture level here: a row shows only
 * the task name, a one-line audienceLine, and an EVIDENCE STRIP naming the backing
 * boards (their trust tags are omitted on the index to keep it uncongested; the
 * per-board trust lives one click in). No model name and no score ever appears on
 * this surface. Column three is a NEUTRAL "See the boards" affordance, never a
 * count-derived "most boards live" verdict. Rows
 * split into two groups by the AUTHORED honestEmpty flag (never a computed live
 * tally): honest-empty tasks sit last under a hairline and an 11px label.
 *
 * The bench-row <style> is copied by value from benchmarks-client (the editorial
 * convention) so the row reuses .bench-row / .bench-name / .bench-status and the
 * mobile regrid. Only one mode mounts at a time, so the duplicate selectors never
 * collide with the PR1 list.
 */
export function UseCaseExplorerClient({
  useCases,
  onShowStandings,
}: {
  useCases: UseCaseCardData[];
  onShowStandings: () => void;
}) {
  const answerable = useCases.filter((u) => u.group === "answerable");
  const sparse = useCases.filter((u) => u.group === "sparse");
  const draftCount = useCases.filter((u) => u.status === "draft").length;

  return (
    <div data-surface="editorial" style={{ backgroundColor: "var(--color-bg)", minHeight: "100%" }}>
      <div style={{ maxWidth: "var(--maxw-content)", margin: "0 auto", padding: "20px 40px 96px" }}>
        {/* ── Header: eyebrow + browse-all, the interrogative h1, the intro ── */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <SectionEyebrow>Pick a model</SectionEyebrow>
          <button
            type="button"
            onClick={onShowStandings}
            className="editorial-link"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              border: "none",
              background: "none",
              padding: 0,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "inherit",
              color: "var(--color-accent)",
            }}
          >
            Browse all 22 benchmarks
            <ArrowRight />
          </button>
        </div>
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
          What are you trying to do?
        </h1>
        <p style={{ margin: "12px 0 0", fontSize: 16, color: "var(--color-text-2)", lineHeight: 1.55, maxWidth: 680 }}>
          Start from your task. Each one names the two to three tests that measure it, says how far to
          trust each, and gives one honest pick or says plainly when no one can.
        </p>
        {draftCount > 0 && (
          <p style={{ margin: "10px 0 0", fontSize: 11, color: "var(--color-text-3)", letterSpacing: "0.04em" }}>
            Admin view: {draftCount} draft{draftCount === 1 ? "" : "s"} below are hidden from members
            until published.
          </p>
        )}

        {/* ── Answerable group ─────────────────────────────────── */}
        {answerable.length > 0 && (
          <div style={{ borderTop: "1px solid var(--color-border)", marginTop: 28 }}>
            {answerable.map((u, i) => (
              <UseCaseRow key={u.slug} useCase={u} index={i} />
            ))}
          </div>
        )}

        {/* ── Honest-empty group (authored flag, never a live tally) ── */}
        {sparse.length > 0 && (
          <>
            <HairRule top={40} bottom={0} />
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--color-text-3)",
                margin: "18px 0 0",
              }}
            >
              Tasks no benchmark measures cleanly yet
            </div>
            <div style={{ borderTop: "1px solid var(--color-border)", marginTop: 16 }}>
              {sparse.map((u, i) => (
                <UseCaseRow key={u.slug} useCase={u} index={answerable.length + i} />
              ))}
            </div>
          </>
        )}

        {useCases.length === 0 && <ExplorerEmptyState />}
      </div>

      {/* The row vocabulary, copied by value from benchmarks-client so the explorer
          inherits the editorial-link sweep, the name lift on row hover, the capped
          entrance, the reduced-motion opt-out, and the <=600px regrid. */}
      <style>{`
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

        [data-surface="editorial"] .bench-name {
          color: var(--color-text);
          transition: color 180ms ease;
          /* The whole row is the link; let clicks on the title fall through to
             the absolute overlay instead of being swallowed by editorial-link's
             position:relative. Hover effects are row-triggered, so unaffected. */
          pointer-events: none;
        }
        [data-surface="editorial"] .bench-row:hover .bench-name { color: var(--color-accent); }
        [data-surface="editorial"] .bench-row:hover .bench-name::after { transform: scaleX(1); }

        /* Col-3 affordance: muted by default, lifts to the accent on row hover and
           nudges its arrow, so it reads as "go" without ever being a trust verdict. */
        [data-surface="editorial"] .uc-affordance { color: var(--color-text-3); transition: color 180ms ease; }
        [data-surface="editorial"] .bench-row:hover .uc-affordance { color: var(--color-accent); }
        [data-surface="editorial"] .bench-row:hover .uc-affordance svg { transform: translateX(3px); }
        [data-surface="editorial"] .uc-affordance svg { transition: transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1); }

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

// ── The single-column use-case row (clones the BenchmarkRow grammar) ──────────

/** Strip a trailing parenthetical so the evidence strip stays light: "BFCL
 *  (Berkeley Function Calling)" -> "BFCL", "MMLU-Pro" -> "MMLU-Pro". */
function shortName(name: string): string {
  return name.split(" (")[0].trim();
}

function UseCaseRow({ useCase, index }: { useCase: UseCaseCardData; index: number }) {
  const reduced = usePrefersReducedMotion();
  const badgeNum = String(index + 1).padStart(2, "0");
  const staggerMs = Math.min(index, 11) * 18; // capped 18ms stagger, same as PR1

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
      {/* Full-row click target -> the decision walk. aria-label carries the name. */}
      <Link
        href={`/benchmarks/use/${useCase.slug}`}
        aria-label={useCase.name}
        style={{ position: "absolute", inset: 0 }}
      />

      {/* Position glyph (never a rank) */}
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

      {/* Name (hero) + one-line audience gloss + the evidence strip */}
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
            {useCase.name}
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
          {useCase.audienceLine}
        </p>

        {/* EVIDENCE STRIP: the backing tests that measure this task, named with
            hairline separators. Trust tags are deliberately omitted here (they
            congest the index); the per-board trust lives one click in. Never a
            model or a score. */}
        {useCase.backing.length > 0 && (
          <div style={{ marginTop: 10, fontSize: 13, fontWeight: 600, color: "var(--color-text-2)", lineHeight: 1.5 }}>
            {useCase.backing.map((b, i) => (
              <span key={b.slug}>
                {i > 0 && <span style={{ margin: "0 8px", color: "var(--color-border)" }}>·</span>}
                {shortName(b.name)}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Col-3: a NEUTRAL affordance only. Same words on every row; the trust
          signal lives entirely in the per-board evidence-strip chips above. */}
      <div
        className="bench-status"
        style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8, marginTop: 6 }}
      >
        {useCase.status === "draft" && <DraftChip />}
        <span
          className="uc-affordance"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600 }}
        >
          See the boards
          <ArrowRight />
        </span>
      </div>
    </div>
  );
}

function ExplorerEmptyState() {
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
        No tasks to show yet
      </p>
      <p style={{ fontSize: 14, margin: 0, color: "var(--color-text-2)", maxWidth: 420, lineHeight: 1.55 }}>
        Seed use cases with scripts/seed-use-cases.ts, then publish them to make them visible to
        members. The Standings tab still lists every benchmark.
      </p>
    </div>
  );
}
