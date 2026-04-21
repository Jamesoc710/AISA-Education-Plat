"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { IconTile } from "@/components/ui/icon-tile";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { PageFrame } from "@/components/ui/page-frame";

type HomeworkItem = {
  id: string;
  title: string;
  dueDate: string | null;
  conceptName: string | null;
  submitted: boolean;
  submittedAt: string | null;
  grade: string | null;
};

export function HomeworkListClient({ items }: { items: HomeworkItem[] }) {
  return (
    <PageFrame maxWidth={820}>
      <h1
        style={{
          margin: "0 0 6px",
          fontSize: "var(--text-2xl)",
          fontWeight: 600,
          color: "var(--color-text)",
          letterSpacing: "-0.02em",
        }}
      >
        Homework
      </h1>
      <p
        style={{
          margin: "0 0 32px",
          fontSize: "var(--text-base)",
          color: "var(--color-text-2)",
          lineHeight: 1.55,
        }}
      >
        Assignments from your mentors. Submit before the due date.
      </p>

      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {items.map((h) => (
            <HomeworkRow key={h.id} item={h} />
          ))}
        </div>
      )}
    </PageFrame>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "72px 24px",
        gap: "var(--space-4)",
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-3)",
        textAlign: "center",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <IconTile icon="clipboard-check" color="indigo" size="lg" />
      <div>
        <div
          style={{
            fontSize: "var(--text-md)",
            fontWeight: 600,
            color: "var(--color-text)",
            marginBottom: "var(--space-1)",
          }}
        >
          No homework assignments yet
        </div>
        <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-3)" }}>
          New assignments will show up here when your mentors post them.
        </div>
      </div>
    </div>
  );
}

function HomeworkRow({ item: h }: { item: HomeworkItem }) {
  const status: "graded" | "submitted" | "pending" = h.grade
    ? "graded"
    : h.submitted
      ? "submitted"
      : "pending";

  const tile =
    status === "graded" ? "mint" : status === "submitted" ? "sky" : "indigo";
  const icon =
    status === "graded"
      ? "clipboard-check"
      : status === "submitted"
        ? "clipboard-check"
        : "book-open";

  const dueLabel = h.dueDate
    ? new Date(h.dueDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <Link
      href={`/homework/${h.id}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-4)",
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-3)",
        padding: "16px 18px",
        boxShadow: "var(--shadow-card)",
        textDecoration: "none",
        transition: "border-color 150ms ease, box-shadow 150ms ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--color-accent)";
        e.currentTarget.style.boxShadow = "var(--shadow-card-hover)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--color-border)";
        e.currentTarget.style.boxShadow = "var(--shadow-card)";
      }}
    >
      <IconTile icon={icon} color={tile} size="md" />

      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: "var(--text-md)",
            fontWeight: 600,
            color: "var(--color-text)",
            letterSpacing: "-0.005em",
            marginBottom: "var(--space-1)",
          }}
        >
          {h.title}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
            flexWrap: "wrap",
            fontSize: "var(--text-sm)",
            color: "var(--color-text-3)",
          }}
        >
          {h.conceptName && (
            <StatusTag tone="neutral">{h.conceptName}</StatusTag>
          )}
          {dueLabel && <span>Due {dueLabel}</span>}
        </div>
      </div>

      <div
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: "var(--space-3)",
        }}
      >
        <StatusPill status={status} grade={h.grade} />
        <Icon
          name="chevron-right"
          size={16}
          strokeWidth={2}
          style={{ color: "var(--color-text-3)" }}
        />
      </div>
    </Link>
  );
}

function StatusPill({
  status,
  grade,
}: {
  status: "graded" | "submitted" | "pending";
  grade: string | null;
}) {
  if (status === "graded" && grade) {
    return <StatusTag tone="green">{grade}</StatusTag>;
  }

  if (status === "submitted") {
    return <StatusTag tone="blue">Submitted</StatusTag>;
  }

  return (
    <Button variant="primary" size="sm">
      Submit
    </Button>
  );
}
