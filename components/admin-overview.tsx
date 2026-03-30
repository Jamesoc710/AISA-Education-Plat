"use client";

// ── Types ────────────────────────────────────────────────────────────────────

interface Stats {
  totalRecruits: number;
  activeThisWeek: number;
  pendingToGrade: number;
  formalQuizzes: number;
}

interface ActivityItem {
  id: string;
  type: "quiz" | "homework";
  description: string;
  timestamp: string;
  status: "correct" | "incorrect" | "submitted" | "graded";
}

interface AdminOverviewProps {
  stats: Stats;
  activity: ActivityItem[];
}

// ── Relative time helper ─────────────────────────────────────────────────────

function relativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return "Yesterday";
  return `${diffDay}d ago`;
}

// ── Dot color by status ──────────────────────────────────────────────────────

function dotColor(status: ActivityItem["status"]): string {
  switch (status) {
    case "correct":
      return "#34c759";
    case "incorrect":
      return "#ff453a";
    case "submitted":
    case "graded":
      return "var(--color-accent)";
  }
}

// ── Component ────────────────────────────────────────────────────────────────

export function AdminOverview({ stats, activity }: AdminOverviewProps) {
  const statCards: { value: number; label: string }[] = [
    { value: stats.totalRecruits, label: "Total Recruits" },
    { value: stats.activeThisWeek, label: "Active This Week" },
    { value: stats.pendingToGrade, label: "Pending to Grade" },
    { value: stats.formalQuizzes, label: "Formal Quizzes" },
  ];

  return (
    <div style={{ padding: "32px", maxWidth: "960px" }}>
      {/* ── Page title ──────────────────────────────────── */}
      <h1
        style={{
          fontSize: "18px",
          fontWeight: 600,
          color: "var(--color-text)",
          margin: "0 0 24px",
          letterSpacing: "-0.01em",
        }}
      >
        Overview
      </h1>

      {/* ── Stats strip ─────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "12px",
          marginBottom: "32px",
        }}
      >
        {statCards.map((card: (typeof statCards)[number]) => (
          <div
            key={card.label}
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "8px",
              padding: "20px",
            }}
          >
            <div
              style={{
                fontSize: "24px",
                fontWeight: 700,
                color: "var(--color-text)",
                lineHeight: 1,
              }}
            >
              {card.value}
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "var(--color-text-3)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginTop: "8px",
              }}
            >
              {card.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Activity feed ───────────────────────────────── */}
      <h2
        style={{
          fontSize: "14px",
          fontWeight: 600,
          color: "var(--color-text)",
          margin: "0 0 12px",
          letterSpacing: "-0.01em",
        }}
      >
        Recent Activity
      </h2>

      {activity.length === 0 ? (
        <div
          style={{
            padding: "24px",
            textAlign: "center",
            fontSize: "13px",
            color: "var(--color-text-3)",
          }}
        >
          No recent activity
        </div>
      ) : (
        <div>
          {activity.map((item: ActivityItem) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "6px",
                padding: "12px 14px",
                marginBottom: "4px",
              }}
            >
              {/* Status dot */}
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: dotColor(item.status),
                  flexShrink: 0,
                }}
              />

              {/* Description */}
              <span
                style={{
                  flex: 1,
                  fontSize: "13px",
                  color: "var(--color-text)",
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {item.description}
              </span>

              {/* Relative time */}
              <span
                style={{
                  fontSize: "12px",
                  color: "var(--color-text-3)",
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                }}
              >
                {relativeTime(item.timestamp)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
