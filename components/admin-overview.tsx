"use client";

import { Icon } from "@/components/ui/icon";
import { IconTile } from "@/components/ui/icon-tile";
import { StatusTag, type StatusTagTone } from "@/components/ui/status-tag";
import { AdminCalendarSync } from "@/components/admin-calendar-sync";

interface Stats {
  totalRecruits: number;
  activeThisWeek: number;
  pendingToGrade: number;
  formalQuizzes: number;
}

interface CalendarSyncInfo {
  lastSyncedAt: string | null;
  eventCount: number;
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
  calendarSync: CalendarSyncInfo;
}

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

function statusTone(status: ActivityItem["status"]): StatusTagTone {
  switch (status) {
    case "correct":
      return "green";
    case "incorrect":
      return "red";
    case "submitted":
      return "blue";
    case "graded":
      return "accent";
  }
}

export function AdminOverview({ stats, activity, calendarSync }: AdminOverviewProps) {
  const statCards: { value: number; label: string; tile: "indigo" | "sky" | "honey" | "mint" }[] = [
    { value: stats.totalRecruits, label: "Total recruits", tile: "indigo" },
    { value: stats.activeThisWeek, label: "Active this week", tile: "sky" },
    { value: stats.pendingToGrade, label: "Pending to grade", tile: "honey" },
    { value: stats.formalQuizzes, label: "Formal quizzes", tile: "mint" },
  ];

  return (
    <div>
      <AdminCalendarSync
        lastSyncedAt={calendarSync.lastSyncedAt}
        eventCount={calendarSync.eventCount}
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 36,
        }}
      >
        {statCards.map((card) => (
          <div
            key={card.label}
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 12,
              padding: "18px 20px",
              boxShadow: "var(--shadow-card)",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <IconTile icon="bar-chart" color={card.tile} size="sm" />
            <div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 600,
                  color: "var(--color-text)",
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                  marginBottom: 6,
                }}
              >
                {card.value}
              </div>
              <div
                style={{
                  fontSize: 12.5,
                  color: "var(--color-text-3)",
                  fontWeight: 500,
                }}
              >
                {card.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "var(--color-text)",
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          Recent activity
        </h2>
        <span
          style={{
            fontSize: 12,
            color: "var(--color-text-3)",
          }}
        >
          {activity.length} events
        </span>
      </div>

      {activity.length === 0 ? (
        <EmptyState />
      ) : (
        <div
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 12,
            boxShadow: "var(--shadow-card)",
            overflow: "hidden",
          }}
        >
          {activity.map((item, idx) => {
            const tone = statusTone(item.status);
            return (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 18px",
                  borderTop:
                    idx === 0 ? "none" : "1px solid var(--color-border-subtle)",
                }}
              >
                <StatusTag tone={tone} style={{ textTransform: "capitalize" }}>
                  {item.status}
                </StatusTag>
                <span
                  style={{
                    flex: 1,
                    fontSize: 13.5,
                    color: "var(--color-text)",
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.description}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--color-text-3)",
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                  }}
                >
                  {relativeTime(item.timestamp)}
                </span>
              </div>
            );
          })}
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
        padding: "60px 24px",
        gap: 12,
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 12,
        boxShadow: "var(--shadow-card)",
      }}
    >
      <IconTile icon="bell" color="indigo" size="lg" />
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: 14.5,
            fontWeight: 600,
            color: "var(--color-text)",
            marginBottom: 4,
          }}
        >
          No recent activity
        </div>
        <div style={{ fontSize: 13, color: "var(--color-text-3)" }}>
          Recruit progress will show up here as it happens.
        </div>
      </div>
    </div>
  );
}
