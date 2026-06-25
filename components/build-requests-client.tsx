"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { RequestControls, RequestStatusChip } from "@/components/build-request-controls";
import type { MyRequestRow, PendingRequestRow } from "@/lib/build";

/**
 * The requester-side resolution surface plus, for moderators, the board-wide
 * stale-requests view. Resolution is observable here without notifications:
 * a member can read any time whether their request is pending, accepted, or
 * declined; a moderator can clear anything pending across all projects.
 */
export function BuildRequestsClient({
  mine,
  pending,
  isModerator,
  staleDays,
}: {
  mine: MyRequestRow[];
  pending: PendingRequestRow[];
  isModerator: boolean;
  staleDays: number;
}) {
  return (
    <div style={{ padding: "32px 32px 80px" }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <nav
          aria-label="Breadcrumb"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            marginBottom: "var(--space-5)",
            fontSize: "var(--text-sm)",
          }}
        >
          <Link
            href="/build"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--space-2)",
              color: "var(--color-text-3)",
              textDecoration: "none",
            }}
          >
            <Icon name="arrow-left" size={13} />
            Build Board
          </Link>
        </nav>

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
          Your requests
        </h1>
        <p
          style={{
            margin: "8px 0 0 0",
            fontSize: "var(--text-base)",
            color: "var(--color-text-2)",
            lineHeight: 1.55,
            maxWidth: 640,
          }}
        >
          Where your requests to join projects stand. A project lead accepts or
          declines each one, and the result shows up here.
        </p>

        <div style={{ marginTop: "var(--space-6)" }}>
          {mine.length === 0 ? (
            <EmptyMine />
          ) : (
            <div>
              {mine.map((r) => (
                <MyRequestItem key={r.id} row={r} />
              ))}
            </div>
          )}
        </div>

        {isModerator && (
          <section style={{ marginTop: "var(--space-7, 40px)" }}>
            <Eyebrow>Open requests across the board</Eyebrow>
            {pending.length === 0 ? (
              <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-3)" }}>
                No open requests right now. New ones land here as members ask to join.
              </p>
            ) : (
              <div>
                {pending.map((r) => (
                  <PendingItem key={r.id} row={r} staleDays={staleDays} />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        margin: "0 0 var(--space-4) 0",
        paddingTop: "var(--space-5)",
        borderTop: "1px solid var(--color-border-subtle)",
        fontSize: "var(--text-xs)",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color: "var(--color-text-3)",
      }}
    >
      {children}
    </h2>
  );
}

function MyRequestItem({ row }: { row: MyRequestRow }) {
  return (
    <div style={{ borderTop: "1px solid var(--color-border-subtle)", padding: "var(--space-4) 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
        <Link
          href={`/build/${row.project.slug}`}
          style={{
            fontSize: "var(--text-base)",
            fontWeight: 600,
            color: "var(--color-text)",
            textDecoration: "none",
          }}
        >
          {row.project.title}
        </Link>
        <RequestStatusChip status={row.status} />
        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-3)" }}>
          Requested {fmtDate(row.createdAt)}
          {row.respondedAt
            ? ` · ${row.status === "accepted" ? "accepted" : "declined"} ${fmtDate(row.respondedAt)}`
            : ""}
        </span>
      </div>
      {row.note && (
        <p style={{ margin: "6px 0 0", fontSize: "var(--text-sm)", color: "var(--color-text-2)", lineHeight: 1.55 }}>
          {row.note}
        </p>
      )}
      {row.status === "accepted" && (
        <p style={{ margin: "6px 0 0", fontSize: "var(--text-xs)", color: "var(--color-correct)" }}>
          You are on this team. Open the project to see it.
        </p>
      )}
    </div>
  );
}

function PendingItem({ row, staleDays }: { row: PendingRequestRow; staleDays: number }) {
  const stale = Date.now() - new Date(row.createdAt).getTime() > staleDays * 86400000;
  return (
    <div style={{ borderTop: "1px solid var(--color-border-subtle)", padding: "var(--space-4) 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)" }}>
          {row.user.name}
        </span>
        <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-3)" }}>wants to join</span>
        <Link
          href={`/build/${row.project.slug}`}
          style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-accent)", textDecoration: "none" }}
        >
          {row.project.title}
        </Link>
        {stale && (
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
              whiteSpace: "nowrap",
            }}
          >
            Pending {staleDays}+ days
          </span>
        )}
      </div>
      <div style={{ marginTop: "var(--space-1)", fontSize: "var(--text-xs)", color: "var(--color-text-3)" }}>
        <a href={`mailto:${row.user.email}`} style={{ color: "var(--color-accent)", textDecoration: "none" }}>
          {row.user.email}
        </a>
        {" · requested "}
        {fmtDate(row.createdAt)}
      </div>
      {row.note && (
        <p style={{ margin: "6px 0 0", fontSize: "var(--text-sm)", color: "var(--color-text-2)", lineHeight: 1.55 }}>
          {row.note}
        </p>
      )}
      <RequestControls projectId={row.projectId} interestId={row.id} />
    </div>
  );
}

function EmptyMine() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "64px 24px",
        gap: "var(--space-3)",
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-1)",
        textAlign: "center",
      }}
    >
      <span style={{ color: "var(--color-text-3)" }}>
        <Icon name="paper-plane-tilt" size={26} />
      </span>
      <p style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-text)" }}>
        No requests yet
      </p>
      <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-2)", maxWidth: 380, lineHeight: 1.55 }}>
        Browse the board and request to join a project. Anything you send shows up
        here so you can see where it stands.
      </p>
      <div style={{ marginTop: "var(--space-2)" }}>
        <Link href="/build" style={{ textDecoration: "none" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--space-2)",
              height: 34,
              padding: "0 var(--space-4)",
              fontSize: "var(--text-sm)",
              fontWeight: 500,
              color: "var(--color-text)",
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-2)",
            }}
          >
            <Icon name="arrow-left" size={14} />
            Back to the board
          </span>
        </Link>
      </div>
    </div>
  );
}
