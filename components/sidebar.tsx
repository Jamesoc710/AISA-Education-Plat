"use client";

import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { SidebarNavItem } from "@/components/ui/sidebar-nav-item";
import { Icon } from "@/components/ui/icon";
import { FeedbackDialog } from "@/components/feedback-dialog";
import type { ShellUser } from "@/components/main-shell";
import type { TeamLink } from "@/lib/teams";

/**
 * Fixed left sidebar — Uxcel-style.
 * Logo → Home/Browse → DISCOVER → PRACTICE → ME → COMMUNITY → ADMIN → feedback (pinned bottom).
 *
 * Items routing to pages not yet migrated to the new shell still link normally;
 * those pages will appear dark until their own phase ships.
 */
export function Sidebar({
  user,
  teams = [],
}: {
  user: ShellUser | null;
  teams?: TeamLink[];
}) {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const filter = searchParams?.get("filter") ?? null;
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const onBrowse = pathname === "/browse";
  const browseDefault = onBrowse && !filter;

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };


  return (
    <aside
      aria-label="Primary"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        backgroundColor: "var(--color-bg)",
        padding: "16px 12px 12px",
      }}
    >
      {/* ── Logo ─────────────────────────────────────────────── */}
      <Link
        href="/home"
        aria-label="TCO home"
        style={{
          display: "inline-flex",
          alignSelf: "flex-start",
          padding: "0 4px",
          margin: "-8px 0 -4px",
          textDecoration: "none",
          overflow: "hidden",
        }}
      >
        <img
          src="/assets/tco-logo.png"
          alt="TCO"
          style={{ height: 72, width: "auto", flexShrink: 0, margin: "-10px 0" }}
        />
      </Link>

      {/* ── Scrollable nav body ──────────────────────────────── */}
      <nav style={{ flex: 1, overflowY: "auto", paddingTop: "var(--space-1)" }}>
        {/* Primary group (unlabeled) */}
        <div>
          <SidebarNavItem
            href="/home"
            label="Home"
            iconName="home"
            active={isActive("/home")}
          />
          <SidebarNavItem
            href="/browse"
            label="Browse"
            iconName="grid"
            active={browseDefault}
          />
        </div>

        {/* DISCOVER group — editorial + signal surfaces */}
        <SectionLabel>Discover</SectionLabel>
        <div>
          <SidebarNavItem
            href="/digest"
            label="This week"
            iconName="newspaper"
            active={isActive("/digest")}
          />
          <SidebarNavItem
            href="/trends"
            label="Trends"
            iconName="pulse"
            active={isActive("/trends")}
          />
          <SidebarNavItem
            href="/benchmarks"
            label="Benchmarks"
            iconName="ranking"
            active={isActive("/benchmarks")}
          />
        </div>

        {/* PRACTICE group — self-study tools */}
        <SectionLabel>Practice</SectionLabel>
        <div>
          <SidebarNavItem
            href="/quiz"
            label="Practice quiz"
            iconName="help-circle"
            active={isActive("/quiz")}
          />
          <SidebarNavItem
            href="/flashcards"
            label="Flashcards"
            iconName="cards-three"
            active={isActive("/flashcards")}
          />
        </div>

        {/* ME group — personal */}
        <SectionLabel>Me</SectionLabel>
        <div>
          <SidebarNavItem
            href="/dashboard"
            label="Progress"
            iconName="bar-chart"
            active={isActive("/dashboard")}
          />
          <SidebarNavItem
            href="/browse?filter=bookmarked"
            label="Bookmarked"
            iconName="bookmark"
            active={onBrowse && filter === "bookmarked"}
          />
        </div>

        {/* COMMUNITY group — teams, build board, and the club calendar.
            Last among content groups so the variable-height team list grows
            toward the pinned feedback button instead of reflowing the fixed
            groups above it. */}
        <SectionLabel>Community</SectionLabel>
        <div>
          {teams.map((t) => (
            <TeamNavLink
              key={t.slug}
              team={t}
              active={isActive(`/teams/${t.slug}`)}
            />
          ))}
          <SidebarNavItem
            href="/build"
            label="Build board"
            iconName="hammer"
            active={isActive("/build")}
          />
          <SidebarNavItem
            href="/calendar"
            label="Calendar"
            iconName="calendar"
            active={isActive("/calendar")}
          />
        </div>

        {user?.role === "ADMIN" && (
          <>
            <SectionLabel>Admin</SectionLabel>
            <div>
              <SidebarNavItem
                href="/admin"
                label="Admin dashboard"
                iconName="shield"
                active={isActive("/admin")}
              />
            </div>
          </>
        )}
      </nav>

      {/* ── Feedback button (pinned bottom) ──────────────────── */}
      <div style={{ paddingTop: "var(--space-3)", marginTop: "var(--space-2)" }}>
        <button
          type="button"
          onClick={() => setFeedbackOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
            padding: "8px 10px",
            borderRadius: "var(--radius-2)",
            fontSize: "var(--text-sm)",
            fontWeight: 500,
            color: "var(--color-text-2)",
            background: "transparent",
            border: "none",
            width: "100%",
            textAlign: "left",
            cursor: "pointer",
            transition: "background-color 100ms ease, color 100ms ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--color-surface-2)";
            e.currentTarget.style.color = "var(--color-text)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "var(--color-text-2)";
          }}
        >
          <Icon name="message-square" size={16} strokeWidth={1.85} />
          Leave feedback
        </button>
      </div>
      <FeedbackDialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </aside>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: "16px 10px 6px",
        fontSize: "var(--text-xs)",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color: "var(--color-text-3)",
      }}
    >
      {children}
    </div>
  );
}

/**
 * A team row in the sidebar's Teams group. It LINKS to that team's HQ
 * (/teams/[slug]); the team you are viewing shows its accent dot and a filled
 * background. This is navigation, not a content-lens switch.
 */
function TeamNavLink({ team, active }: { team: TeamLink; active: boolean }) {
  return (
    <Link
      href={`/teams/${team.slug}`}
      aria-current={active ? "page" : undefined}
      title={team.displayName}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-3)",
        padding: "8px 10px",
        borderRadius: "var(--radius-2)",
        fontSize: "var(--text-sm)",
        fontWeight: active ? 600 : 500,
        color: active ? "var(--color-text)" : "var(--color-text-2)",
        backgroundColor: active ? "var(--color-surface-2)" : "transparent",
        textDecoration: "none",
        transition: "background-color 100ms ease, color 100ms ease",
      }}
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
    >
      <span
        aria-hidden
        style={{
          width: 9,
          height: 9,
          borderRadius: 999,
          backgroundColor: team.accent,
          flexShrink: 0,
        }}
      />
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {team.displayName}
      </span>
    </Link>
  );
}
