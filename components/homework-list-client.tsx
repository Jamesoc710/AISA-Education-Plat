"use client";

import Link from "next/link";

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
          Homework
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
            Homework
          </h1>
          <p
            style={{
              margin: "0 0 28px",
              fontSize: "13.5px",
              color: "var(--color-text-3)",
              lineHeight: 1.55,
            }}
          >
            Assignments from your mentors. Submit before the due date.
          </p>

          {items.length === 0 ? (
            <EmptyState />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {items.map((h) => (
                <HomeworkRow key={h.id} item={h} />
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
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="9" y1="15" x2="15" y2="15" />
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
          No homework assignments at this time
        </div>
        <div style={{ fontSize: "13px", color: "var(--color-text-3)" }}>
          Check back later — new assignments will appear here when they're posted.
        </div>
      </div>
    </div>
  );
}

// ── Row ───────────────────────────────────────────────────────────────────────

function HomeworkRow({ item: h }: { item: HomeworkItem }) {
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
          {h.title}
        </div>
        {h.conceptName && (
          <div style={{ fontSize: "12px", color: "var(--color-text-3)", marginTop: "2px" }}>
            {h.conceptName}
          </div>
        )}
        {h.dueDate !== null && (
          <div style={{ fontSize: "12px", color: "var(--color-text-3)", marginTop: "2px" }}>
            Due{" "}
            {new Date(h.dueDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </div>
        )}
      </div>
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: "8px" }}>
        {!h.submitted ? (
          <Link
            href={`/homework/${h.id}`}
            style={{
              border: "1px solid var(--color-accent)",
              color: "var(--color-accent)",
              backgroundColor: "transparent",
              fontSize: "12px",
              fontWeight: 500,
              borderRadius: "6px",
              padding: "6px 14px",
              textDecoration: "none",
            }}
          >
            Submit
          </Link>
        ) : h.grade !== null ? (
          <>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#fff",
                backgroundColor: "var(--color-correct)",
                padding: "4px 10px",
                borderRadius: "6px",
              }}
            >
              {h.grade}
            </span>
            <span style={{ fontSize: "12px", color: "var(--color-text-3)" }}>Graded</span>
          </>
        ) : (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "12px", color: "var(--color-text-3)" }}>Submitted</div>
            <div style={{ fontSize: "11px", color: "var(--color-text-3)" }}>
              Awaiting review
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
