"use client";

import { useState } from "react";
import Link from "next/link";
import { IconTile } from "@/components/ui/icon-tile";
import { Icon } from "@/components/ui/icon";
import { getTrackTileColor } from "@/lib/section-icons";
import type { ProjectCardData, ProjectContributor } from "@/lib/build";

/**
 * Build Board showcase, on the card surface (Brilliant-style bordered rows,
 * cloned from the Browse aesthetic): IconTile colored by track, 18px title,
 * blurb preview, contributor initials, "looking for" tags, repo/demo links.
 */
export function BuildClient({
  projects,
  isModerator,
}: {
  projects: ProjectCardData[];
  isModerator: boolean;
}) {
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
            Build Board
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
            What members are building right now. Open a project to meet the team,
            see what help it needs, and request to join.
          </p>
        </div>

        {/* ── Project cards / empty state ─────────────────────── */}
        {projects.length === 0 ? (
          <BoardEmptyState isModerator={isModerator} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Project card ─────────────────────────────────────────────────────────────
// Whole card is the click target via a stretched link; the repo/demo chips sit
// above it (position: relative + zIndex) so they stay independently clickable.

function ProjectCard({ project }: { project: ProjectCardData }) {
  const [hovered, setHovered] = useState(false);
  const tileColor = getTrackTileColor(project.track?.slug);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "flex-start",
        gap: "var(--space-4)",
        padding: "22px 24px",
        backgroundColor: hovered ? "var(--color-surface-2)" : "var(--color-surface)",
        border: `1px solid ${hovered ? "var(--color-border)" : "var(--color-border-subtle)"}`,
        borderRadius: "var(--radius-2)",
        transition: "background-color 140ms ease, border-color 140ms ease",
      }}
    >
      {/* Stretched link: makes the whole card navigate */}
      <Link
        href={`/build/${project.slug}`}
        aria-label={project.title}
        style={{ position: "absolute", inset: 0, borderRadius: "var(--radius-2)" }}
      />

      <IconTile icon="hammer" color={tileColor} size="md" />

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Title row */}
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
              color: hovered ? "var(--color-accent)" : "var(--color-text)",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              transition: "color 140ms ease",
            }}
          >
            {project.title}
          </h2>
          {project.track && (
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
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 999,
                  backgroundColor: project.track.accentColor,
                }}
              />
              {project.track.shortName}
            </span>
          )}
          {project.status === "draft" && <DraftChip />}
        </div>

        {/* Blurb preview */}
        <p
          style={{
            margin: "6px 0 0 0",
            fontSize: "var(--text-sm)",
            color: "var(--color-text-2)",
            lineHeight: 1.55,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical" as const,
            overflow: "hidden",
          }}
        >
          {project.blurb}
        </p>

        {/* Meta row: contributors · looking for · links */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-4)",
            flexWrap: "wrap",
            marginTop: "var(--space-4)",
          }}
        >
          <ContributorStack contributors={project.contributors} />

          {project.lookingFor.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-3)", fontWeight: 500 }}>
                Looking for:
              </span>
              {project.lookingFor.map((tag) => (
                <LookingForTag key={tag} label={tag} />
              ))}
            </div>
          )}

          <span style={{ flex: 1 }} />

          {(project.repoUrl || project.demoUrl) && (
            <div
              style={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
              }}
            >
              {project.repoUrl && (
                <ExternalChip href={project.repoUrl} icon="github-logo" label="Repo" />
              )}
              {project.demoUrl && (
                <ExternalChip href={project.demoUrl} icon="arrow-square-out" label="Demo" />
              )}
            </div>
          )}
        </div>
      </div>

      <span
        aria-hidden
        style={{
          display: "flex",
          alignSelf: "center",
          color: hovered ? "var(--color-accent)" : "var(--color-text-3)",
          transition: "color 140ms ease",
          flexShrink: 0,
        }}
      >
        <Icon name="chevron-right" size={16} />
      </span>
    </div>
  );
}

// ── Shared pieces (also used by the detail page) ─────────────────────────────

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

/** Overlapping initial circles, capped at 5 with a +N overflow bubble. */
export function ContributorStack({
  contributors,
  max = 5,
}: {
  contributors: ProjectContributor[];
  max?: number;
}) {
  if (contributors.length === 0) return null;
  const shown = contributors.slice(0, max);
  const overflow = contributors.length - shown.length;

  return (
    <div
      style={{ display: "flex", alignItems: "center" }}
      title={contributors.map((c) => c.name).join(", ")}
    >
      {shown.map((c, i) => (
        <span
          key={`${c.name}-${i}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 26,
            height: 26,
            borderRadius: 999,
            backgroundColor: "var(--color-surface-3)",
            border: "2px solid var(--color-surface)",
            color: "var(--color-text-2)",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.02em",
            marginLeft: i === 0 ? 0 : -7,
          }}
        >
          {initialsFor(c.name)}
        </span>
      ))}
      {overflow > 0 && (
        <span
          style={{
            marginLeft: 6,
            fontSize: "var(--text-xs)",
            color: "var(--color-text-3)",
            fontWeight: 500,
          }}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}

function ExternalChip({
  href,
  icon,
  label,
}: {
  href: string;
  icon: "github-logo" | "arrow-square-out";
  label: string;
}) {
  const [hov, setHov] = useState(false);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: "var(--text-xs)",
        fontWeight: 600,
        textDecoration: "none",
        color: hov ? "var(--color-text)" : "var(--color-text-2)",
        backgroundColor: hov ? "var(--color-surface-3)" : "var(--color-surface-2)",
        border: "1px solid var(--color-border)",
        transition: "background-color 120ms ease, color 120ms ease",
      }}
    >
      <Icon name={icon} size={12} />
      {label}
    </a>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────────

function BoardEmptyState({ isModerator }: { isModerator: boolean }) {
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
      <span style={{ color: "var(--color-text-3)" }}>
        <Icon name="rocket-launch" size={28} />
      </span>
      <p style={{ fontSize: "var(--text-base)", margin: 0, fontWeight: 600, color: "var(--color-text)" }}>
        Nothing on the board yet
      </p>
      <p style={{ fontSize: "var(--text-sm)", margin: 0, color: "var(--color-text-2)", maxWidth: 400, lineHeight: 1.55 }}>
        {isModerator
          ? "Seed projects with scripts/seed-projects.ts, then approve them here to make them visible to members."
          : "Member projects will show up here soon. Check back shortly."}
      </p>
    </div>
  );
}
