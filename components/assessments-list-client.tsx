"use client";

import Link from "next/link";

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
        minHeight: "100vh",
        backgroundColor: "var(--color-bg)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Top bar ──────────────────────────────────────────── */}
      <header
        style={{
          height: "56px",
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          gap: "12px",
          flexShrink: 0,
        }}
      >
        <Link
          href="/browse"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            textDecoration: "none",
          }}
        >
          <img
            src="/assets/aisa-logo.png"
            alt="AISA"
            style={{ width: "28px", height: "28px", flexShrink: 0 }}
          />
          <span
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--color-text)",
              letterSpacing: "-0.01em",
            }}
          >
            AISA Atlas
          </span>
        </Link>

        <span style={{ fontSize: "12px", color: "var(--color-text-3)" }}>›</span>
        <span
          style={{
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--color-text-2)",
          }}
        >
          Assessments
        </span>
      </header>

      {/* ── Content ──────────────────────────────────────────── */}
      <main
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          padding: "48px 24px 80px",
          overflowY: "auto",
        }}
      >
        <div style={{ width: "100%", maxWidth: "760px" }}>
          <h1
            style={{
              margin: "0 0 6px",
              fontSize: "24px",
              fontWeight: 600,
              color: "var(--color-text)",
              letterSpacing: "-0.01em",
            }}
          >
            Assessments
          </h1>
          <p
            style={{
              margin: "0 0 28px",
              fontSize: "13.5px",
              color: "var(--color-text-3)",
              lineHeight: 1.55,
            }}
          >
            Timed assessments to measure your progress. Each can be taken once.
          </p>

          {items.length === 0 ? (
            <EmptyState />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {items.map((a) => (
                <AssessmentRow key={a.id} item={a} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "64px 24px",
        gap: "14px",
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border-subtle)",
        borderRadius: "10px",
        textAlign: "center",
      }}
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--color-text-3)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
      <div>
        <div
          style={{
            fontSize: "15px",
            fontWeight: 500,
            color: "var(--color-text)",
            marginBottom: "4px",
          }}
        >
          No assessments at this time
        </div>
        <div style={{ fontSize: "13px", color: "var(--color-text-3)" }}>
          Check back later — new assessments will appear here when they're posted.
        </div>
      </div>
    </div>
  );
}

// ── Row ───────────────────────────────────────────────────────────────────────

function AssessmentRow({ item: a }: { item: AssessmentItem }) {
  const scoreColor =
    a.score !== null
      ? a.score >= 80
        ? "var(--color-correct)"
        : a.score >= 50
          ? "var(--color-gold)"
          : "var(--color-incorrect)"
      : "var(--color-text-3)";
  const scoreBg =
    a.score !== null
      ? a.score >= 80
        ? "var(--color-correct-dim)"
        : a.score >= 50
          ? "var(--color-gold-dim)"
          : "var(--color-incorrect-dim)"
      : "transparent";

  return (
    <div
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "8px",
        padding: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--color-text)",
          }}
        >
          {a.title}
        </div>
        <div
          style={{
            fontSize: "12px",
            color: "var(--color-text-3)",
            marginTop: "4px",
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          <span>{a.questionCount} questions</span>
          {a.timeLimit !== null && <span>{a.timeLimit} min</span>}
          {a.dueDate !== null && (
            <span>
              Due{" "}
              {new Date(a.dueDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
        </div>
      </div>
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: "8px" }}>
        {a.completed ? (
          <>
            {a.score !== null && (
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: scoreColor,
                  backgroundColor: scoreBg,
                  padding: "4px 10px",
                  borderRadius: "6px",
                }}
              >
                {a.score}%
              </span>
            )}
            <span style={{ fontSize: "12px", color: "var(--color-text-3)" }}>Completed</span>
          </>
        ) : (
          <Link
            href={`/assessment/${a.id}`}
            style={{
              backgroundColor: "var(--color-accent)",
              color: "#fff",
              fontSize: "12px",
              fontWeight: 500,
              borderRadius: "6px",
              padding: "6px 14px",
              textDecoration: "none",
            }}
          >
            Start
          </Link>
        )}
      </div>
    </div>
  );
}
