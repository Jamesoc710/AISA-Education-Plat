"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { IconTile } from "@/components/ui/icon-tile";
import { Button } from "@/components/ui/button";
import { StatusTag, type StatusTagTone } from "@/components/ui/status-tag";

type AssessmentItem = {
  id: string;
  title: string;
  description: string | null;
  timeLimit: number | null;
  dueDate: string | null;
  questionCount: number;
  completed: boolean;
  score: number | null;
};

export function AssessmentsListClient({ items }: { items: AssessmentItem[] }) {
  return (
    <div
      style={{
        maxWidth: 820,
        margin: "0 auto",
        padding: "56px 40px 80px",
      }}
    >
      <h1
        style={{
          margin: "0 0 6px",
          fontSize: "var(--text-2xl)",
          fontWeight: 600,
          color: "var(--color-text)",
          letterSpacing: "-0.02em",
        }}
      >
        Assessments
      </h1>
      <p
        style={{
          margin: "0 0 32px",
          fontSize: "var(--text-base)",
          color: "var(--color-text-2)",
          lineHeight: 1.55,
        }}
      >
        Timed assessments to measure your progress. Each can be taken once.
      </p>

      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {items.map((a) => (
            <AssessmentRow key={a.id} item={a} />
          ))}
        </div>
      )}
    </div>
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
      <IconTile icon="bar-chart" color="indigo" size="lg" />
      <div>
        <div
          style={{
            fontSize: "var(--text-md)",
            fontWeight: 600,
            color: "var(--color-text)",
            marginBottom: "var(--space-1)",
          }}
        >
          No assessments yet
        </div>
        <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-3)" }}>
          New assessments will appear here when your mentors post them.
        </div>
      </div>
    </div>
  );
}

function AssessmentRow({ item: a }: { item: AssessmentItem }) {
  const tile = a.completed ? "mint" : "honey";
  const dueLabel = a.dueDate
    ? new Date(a.dueDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-4)",
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-3)",
        padding: "16px 18px",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <IconTile icon="bar-chart" color={tile} size="md" />

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
          {a.title}
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
          <span>{a.questionCount} questions</span>
          {a.timeLimit !== null && (
            <span>
              <Icon
                name="calendar"
                size={11}
                strokeWidth={2}
                style={{
                  display: "inline-block",
                  verticalAlign: "-1px",
                  marginRight: "var(--space-1)",
                }}
              />
              {a.timeLimit} min
            </span>
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
        {a.completed ? (
          <ScorePill score={a.score} />
        ) : (
          <Link href={`/assessment/${a.id}`} style={{ textDecoration: "none" }}>
            <Button variant="primary" size="sm">
              Start
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

function ScorePill({ score }: { score: number | null }) {
  if (score === null) {
    return <StatusTag tone="neutral">Completed</StatusTag>;
  }

  const tagTone: StatusTagTone =
    score >= 80 ? "green" : score >= 50 ? "gold" : "red";

  return <StatusTag tone={tagTone}>{score}%</StatusTag>;
}
