"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { FilterTabs, type FilterTabItem } from "@/components/ui/filter-tabs";
import { BuildPostDialog } from "@/components/build-post-dialog";
import { PROJECT_STAGES, stageMeta } from "@/lib/project-stages";
import type { ProjectCardData, BuildTrack } from "@/lib/build";

/**
 * Build Board index, on the editorial surface (data-surface="editorial"): a
 * single-column hairline index cloned from the Benchmarks Standings grammar.
 * .build-row reuses the 36px / 1fr / 172px grid, the staggered entrance with a
 * reduced-motion opt-out, SectionEyebrow, and the editorial-link hover sweep.
 *
 * The title is the hero; stage is a quiet 11px lifecycle line, never a big
 * status word; the help-wanted line is the one column-three element that earns
 * the accent. No IconTile, no chevron, no contributor stack, no thumbnail on the
 * row: team and links live one click deep on the detail page.
 *
 * Branch LOW: a growing index, not a celebration wall. No featured rail.
 */

const STAGGER_CAP = 11;

export function BuildClient({
  projects,
  isModerator,
  isLoggedIn,
  tracks,
}: {
  projects: ProjectCardData[];
  isModerator: boolean;
  isLoggedIn: boolean;
  tracks: BuildTrack[];
}) {
  const [postOpen, setPostOpen] = useState(false);
  const [stage, setStage] = useState<string>("all"); // "all" (active board) or a stage value
  const [helpWanted, setHelpWanted] = useState(false);

  const stageCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const p of projects) c[p.stage] = (c[p.stage] ?? 0) + 1;
    return c;
  }, [projects]);

  const nonPausedCount = useMemo(
    () => projects.filter((p) => p.stage !== "paused").length,
    [projects],
  );
  const helpWantedCount = useMemo(
    () => projects.filter((p) => p.stage !== "paused" && p.lookingFor.length > 0).length,
    [projects],
  );

  const draftCount = projects.filter((p) => p.status === "draft").length;

  // "all" is the active board: Paused drops out of the default view (per the
  // plan), reachable only by selecting its own tab.
  const base =
    stage === "all"
      ? projects.filter((p) => p.stage !== "paused")
      : projects.filter((p) => p.stage === stage);
  const visible = helpWanted ? base.filter((p) => p.lookingFor.length > 0) : base;

  const tabs: FilterTabItem<string>[] = [
    { key: "all", label: "All", count: nonPausedCount },
    ...PROJECT_STAGES.filter((s) => (stageCounts[s] ?? 0) > 0).map((s) => ({
      key: s,
      label: stageMeta(s).label,
      count: stageCounts[s],
    })),
  ];

  return (
    <div data-surface="editorial" style={{ backgroundColor: "var(--color-bg)", minHeight: "100%" }}>
      <div style={{ maxWidth: "var(--maxw-content)", margin: "0 auto", padding: "48px 40px 96px" }}>
        {/* ── Header ──────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "var(--space-5)",
            flexWrap: "wrap",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <SectionEyebrow>Member projects</SectionEyebrow>
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
              Build Board
            </h1>
            <p
              style={{
                margin: "12px 0 0",
                fontSize: "var(--text-md)",
                color: "var(--color-text-2)",
                lineHeight: 1.55,
                maxWidth: 620,
              }}
            >
              A growing index of what members are building and shipping. Open one to
              meet the team, see what help it needs, or ask to join.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", flexShrink: 0 }}>
            {isLoggedIn && (
              <Link
                href="/build/requests"
                style={{
                  fontSize: "var(--text-base)",
                  fontWeight: 500,
                  color: "var(--color-text-2)",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
              >
                Your requests
              </Link>
            )}
            <PostAction isLoggedIn={isLoggedIn} onOpen={() => setPostOpen(true)} />
          </div>
        </div>

        {isModerator && draftCount > 0 && (
          <p style={{ margin: "12px 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-3)", letterSpacing: "0.04em" }}>
            Admin view: {draftCount} draft{draftCount === 1 ? "" : "s"} below are hidden from members
            until published.
          </p>
        )}

        {/* ── Facets: stage tabs + the counted help-wanted toggle ─ */}
        {projects.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: "var(--space-4)",
              flexWrap: "wrap",
              margin: "28px 0 0",
            }}
          >
            <FilterTabs<string>
              tabs={tabs}
              active={stage}
              onChange={setStage}
              style={{ flex: 1, minWidth: 240 }}
            />
            {helpWantedCount > 0 && (
              <HelpWantedToggle
                active={helpWanted}
                count={helpWantedCount}
                onClick={() => setHelpWanted((v) => !v)}
              />
            )}
          </div>
        )}

        {/* ── Index / empty states ────────────────────────────── */}
        {projects.length === 0 ? (
          <BoardEmptyState
            isLoggedIn={isLoggedIn}
            isModerator={isModerator}
            onOpen={() => setPostOpen(true)}
          />
        ) : visible.length === 0 ? (
          <NoMatch
            onReset={() => {
              setStage("all");
              setHelpWanted(false);
            }}
          />
        ) : (
          <div style={{ marginTop: "var(--space-1)", borderTop: "1px solid var(--color-border)" }}>
            {visible.map((p, i) => (
              <ProjectRow key={p.id} project={p} index={i} />
            ))}
          </div>
        )}
      </div>

      <BuildPostDialog open={postOpen} onClose={() => setPostOpen(false)} tracks={tracks} />

      {/* Editorial-link sweep + the row name lift on row hover + the row entrance.
          Reduced motion collapses the entrance to instant. Copied by value per
          the editorial-surface convention. */}
      <style>{`
        [data-surface="editorial"] .editorial-link { position: relative; }
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

        [data-surface="editorial"] .build-name {
          color: var(--color-text);
          transition: color 180ms ease;
          /* The whole row is the link; let title clicks fall through to the
             absolute overlay. Hover is row-triggered, so unaffected. */
          pointer-events: none;
        }
        [data-surface="editorial"] .build-row:hover .build-name { color: var(--color-accent); }
        [data-surface="editorial"] .build-row:hover .build-name::after { transform: scaleX(1); }

        @keyframes buildRowIn {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: none; }
        }
        [data-surface="editorial"] .build-row {
          animation-name: buildRowIn;
          animation-duration: 220ms;
          animation-timing-function: cubic-bezier(0.2, 0.8, 0.2, 1);
          animation-fill-mode: both;
          transform-origin: left;
        }
        @media (prefers-reduced-motion: reduce) {
          [data-surface="editorial"] .build-row { animation-name: none; }
        }

        @media (max-width: 600px) {
          [data-surface="editorial"] .build-row {
            grid-template-columns: 36px minmax(0, 1fr) !important;
            row-gap: 12px;
          }
          [data-surface="editorial"] .build-meta {
            grid-column: 2 / -1 !important;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}

// ── The single-column hairline row ────────────────────────────────────────────

function ProjectRow({ project, index }: { project: ProjectCardData; index: number }) {
  const reduced = usePrefersReducedMotion();
  const badgeNum = String(index + 1).padStart(2, "0");
  const staggerMs = Math.min(index, STAGGER_CAP) * 18;
  const lifecycle =
    project.stage === "shipped"
      ? `Shipped · ${new Date(project.createdAt).getFullYear()}`
      : stageMeta(project.stage).label;

  return (
    <div
      className="build-row"
      style={{
        position: "relative",
        display: "grid",
        gridTemplateColumns: "36px minmax(0, 1fr) 172px",
        columnGap: "var(--space-5)",
        alignItems: "start",
        padding: "26px 0",
        borderBottom: "1px solid var(--color-border)",
        animationName: reduced ? "none" : undefined,
        animationDelay: reduced ? undefined : `${staggerMs}ms`,
      }}
    >
      {/* Full-row click target; aria-label carries the name. */}
      <Link
        href={`/build/${project.slug}`}
        aria-label={project.title}
        style={{ position: "absolute", inset: 0 }}
      />

      {/* Ordinal badge (position, never rank) */}
      <span
        aria-hidden
        style={{
          width: 28,
          height: 28,
          marginTop: "var(--space-1)",
          flexShrink: 0,
          borderRadius: 999,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--tile-indigo-bg)",
          color: "var(--tile-indigo-fg)",
          fontSize: "var(--text-xs)",
          fontWeight: 600,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {badgeNum}
      </span>

      {/* Title (hero) + one-line blurb + TRACK */}
      <div style={{ minWidth: 0 }}>
        <h2 style={{ margin: 0 }}>
          <span
            className="editorial-link build-name"
            style={{
              display: "inline-block",
              maxWidth: "100%",
              fontSize: "var(--text-xl)",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
            }}
          >
            {project.title}
          </span>
        </h2>
        <p
          style={{
            margin: "8px 0 0",
            fontSize: "var(--text-base)",
            color: "var(--color-text-2)",
            lineHeight: 1.5,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {project.blurb}
        </p>
        {project.track && (
          <div
            style={{
              marginTop: "var(--space-3)",
              fontSize: "var(--text-xs)",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--color-text-3)",
            }}
          >
            {project.track.shortName}
          </div>
        )}
      </div>

      {/* Lifecycle (quiet) + help-wanted (the one accent element) */}
      <div
        className="build-meta"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: "var(--space-2)",
          marginTop: "var(--space-1)",
        }}
      >
        {project.status === "draft" && <DraftChip />}
        <div
          style={{
            fontSize: "var(--text-xs)",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--color-text-3)",
          }}
        >
          {lifecycle}
        </div>
        {project.lookingFor.length > 0 && (
          <div
            style={{
              fontSize: "var(--text-xs)",
              fontWeight: 600,
              letterSpacing: "0.03em",
              color: "var(--color-accent)",
              lineHeight: 1.45,
            }}
          >
            Help wanted: {project.lookingFor.join(", ")}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Post-a-project action (opens the modal, or routes to sign-in) ────────────

function PostAction({ isLoggedIn, onOpen }: { isLoggedIn: boolean; onOpen: () => void }) {
  if (!isLoggedIn) {
    return (
      <Link href="/login?redirect=/build" style={{ textDecoration: "none", flexShrink: 0 }}>
        <Button leftIcon={<Icon name="rocket-launch" size={14} />}>Post a project</Button>
      </Link>
    );
  }
  return (
    <Button onClick={onOpen} leftIcon={<Icon name="rocket-launch" size={14} />}>
      Post a project
    </Button>
  );
}

// ── Help-wanted facet toggle (the counted recruiting chip) ───────────────────

function HelpWantedToggle({
  active,
  count,
  onClick,
}: {
  active: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-2)",
        padding: "5px 12px",
        marginBottom: "var(--space-2)",
        borderRadius: 999,
        cursor: "pointer",
        fontSize: "var(--text-base)",
        fontWeight: 600,
        fontFamily: "inherit",
        color: active ? "#fff" : "var(--color-accent-on-soft)",
        backgroundColor: active ? "var(--color-accent)" : "var(--color-accent-soft)",
        border: "1px solid transparent",
        whiteSpace: "nowrap",
        transition: "background-color 120ms ease, color 120ms ease",
      }}
    >
      Open roles
      <span style={{ opacity: 0.85 }}>{count}</span>
    </button>
  );
}

// ── No-match state (filters yielded nothing, but the board is not empty) ─────

function NoMatch({ onReset }: { onReset: () => void }) {
  return (
    <div style={{ padding: "56px 0", textAlign: "center" }}>
      <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-text-2)" }}>
        No projects match these filters.
      </p>
      <button
        type="button"
        onClick={onReset}
        style={{
          marginTop: "var(--space-3)",
          border: "none",
          background: "none",
          padding: 0,
          cursor: "pointer",
          fontFamily: "inherit",
          fontSize: "var(--text-base)",
          fontWeight: 600,
          color: "var(--color-accent)",
        }}
      >
        Clear filters
      </button>
    </div>
  );
}

// ── Shared chips/helpers (also used by the detail page and the post modal) ───

/** Stage pill: where the project sits in its lifecycle (idea -> shipped). */
export function StageChip({ stage }: { stage: string }) {
  const meta = stageMeta(stage);
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

export function LookingForTag({ label }: { label: string }) {
  return (
    <span
      style={{
        padding: "2px 10px",
        borderRadius: 999,
        fontSize: "var(--text-xs)",
        fontWeight: 500,
        color: "var(--color-accent-on-soft)",
        backgroundColor: "var(--color-accent-soft)",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase();
}

// ── Editorial primitives (copied by value per the editorial-surface convention) ─

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: "var(--text-xs)",
        fontWeight: 600,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "var(--color-text-3)",
        marginBottom: "var(--space-4)",
      }}
    >
      {children}
    </div>
  );
}

/** matchMedia hook; SSR-safe (false until mounted), with listener cleanup. */
function usePrefersReducedMotion(): boolean {
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

// ── Empty state (active: post the first project) ─────────────────────────────

function BoardEmptyState({
  isLoggedIn,
  isModerator,
  onOpen,
}: {
  isLoggedIn: boolean;
  isModerator: boolean;
  onOpen: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px",
        marginTop: "var(--space-6)",
        gap: "var(--space-4)",
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-1)",
        textAlign: "center",
      }}
    >
      <span style={{ color: "var(--color-text-3)" }}>
        <Icon name="rocket-launch" size={28} />
      </span>
      <p style={{ fontSize: "var(--text-md)", margin: 0, fontWeight: 600, color: "var(--color-text)" }}>
        Be the first to post a project
      </p>
      <p style={{ fontSize: "var(--text-base)", margin: 0, color: "var(--color-text-2)", maxWidth: 400, lineHeight: 1.55 }}>
        The board grows as members add what they are building or have shipped. Post
        yours to get it started.
      </p>
      <div style={{ marginTop: "var(--space-1)" }}>
        <PostAction isLoggedIn={isLoggedIn} onOpen={onOpen} />
      </div>
      {isModerator && (
        <p style={{ fontSize: "var(--text-xs)", margin: 0, color: "var(--color-text-3)", maxWidth: 400, lineHeight: 1.5 }}>
          New posts arrive as drafts for you to approve. You can also bulk-seed with
          scripts/seed-projects.ts.
        </p>
      )}
    </div>
  );
}
