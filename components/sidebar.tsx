"use client";

import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { SidebarNavItem } from "@/components/ui/sidebar-nav-item";
import { Icon } from "@/components/ui/icon";
import { FeedbackDialog } from "@/components/feedback-dialog";
import type { ShellUser } from "@/components/main-shell";

/**
 * Fixed left sidebar — Uxcel-style.
 * Logo → primary nav → LEARN group → PREPARE group → feedback (pinned bottom).
 *
 * Items routing to pages not yet migrated to the new shell still link normally;
 * those pages will appear dark until their own phase ships.
 */
export function Sidebar({ user }: { user: ShellUser | null }) {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const filter = searchParams?.get("filter") ?? null;
  const tier = searchParams?.get("tier") ?? null;
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const onBrowse = pathname === "/browse";
  const browseDefault = onBrowse && !filter && !tier;

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
        href="/browse"
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
          <SidebarNavItem
            href="/browse?filter=bookmarked"
            label="Bookmarked"
            iconName="bookmark"
            active={onBrowse && filter === "bookmarked"}
          />
          <SidebarNavItem
            href="/dashboard"
            label="Progress"
            iconName="bar-chart"
            active={isActive("/dashboard")}
          />
        </div>

        {/* LEARN group */}
        <SectionLabel>Learn</SectionLabel>
        <div>
          <SidebarNavItem
            href="/browse?tier=fundamentals"
            label="Fundamentals"
            iconName="circle-dashed"
            defaultIconColor="var(--color-gold)"
            active={onBrowse && tier === "fundamentals"}
          />
          <SidebarNavItem
            href="/browse?tier=intermediate"
            label="Intermediate"
            iconName="circle-half"
            defaultIconColor="var(--color-blue)"
            active={onBrowse && tier === "intermediate"}
          />
          <SidebarNavItem
            href="/browse?tier=advanced"
            label="Advanced"
            iconName="circles-three-plus"
            defaultIconColor="var(--color-slate)"
            active={onBrowse && tier === "advanced"}
          />
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

        {/* PREPARE group */}
        <SectionLabel>Prepare</SectionLabel>
        <div>
          <SidebarNavItem
            href="/assessments"
            label="Assessments"
            iconName="clipboard-check"
            active={isActive("/assessments")}
          />
          <SidebarNavItem
            href="/calendar"
            label="Calendar"
            iconName="calendar"
            active={isActive("/calendar")}
          />
          <SidebarNavItem
            href="/homework"
            label="Homework"
            iconName="book-open"
            active={isActive("/homework")}
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
