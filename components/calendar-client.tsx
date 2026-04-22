"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { IconTile } from "@/components/ui/icon-tile";
import { StatusTag } from "@/components/ui/status-tag";

interface CalEvent {
  id: string;
  weekNumber: number;
  weekStart: string;
  weekEnd: string;
  dayOfWeek: number;
  date: string;
  title: string;
  description: string | null;
  topics: string[] | null;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  type: string;
  category: string;
}

interface CalendarClientProps {
  events: CalEvent[];
  lastSyncedAt: string | null;
}

// ── Type → color mapping (matches the sheet legend) ─────────────────────────

const TYPE_TOKENS: Record<string, { bar: string; bg: string; fg: string; label: string }> = {
  TECH_TEAM: {
    bar: "var(--color-blue)",
    bg: "var(--color-blue-soft)",
    fg: "var(--color-blue)",
    label: "Tech Team",
  },
  CAPITAL_TEAM: {
    bar: "var(--color-correct)",
    bg: "var(--color-correct-dim)",
    fg: "var(--color-correct)",
    label: "Capital Team",
  },
  EVENTS: {
    bar: "#E08A3C",
    bg: "#FBEAD3",
    fg: "#A85F1F",
    label: "Event",
  },
  MEDIA_TEAM: {
    bar: "#8064A2",
    bg: "#EEE6F4",
    fg: "#5D4477",
    label: "Media Team",
  },
  EXEC: {
    bar: "var(--color-incorrect)",
    bg: "var(--color-incorrect-dim)",
    fg: "var(--color-incorrect)",
    label: "Exec",
  },
  NON_MANDATORY: {
    bar: "var(--color-slate)",
    bg: "var(--color-slate-soft)",
    fg: "var(--color-text-2)",
    label: "Optional",
  },
  GENERAL: {
    bar: "var(--color-text-3)",
    bg: "var(--color-surface-2)",
    fg: "var(--color-text)",
    label: "General",
  },
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDayDate(d: Date): string {
  return `${MONTH_SHORT[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

function formatRange(start: Date, end: Date): string {
  return `${formatDayDate(start)} – ${formatDayDate(end)}`;
}

// Source times may arrive as "12", "12:00", "13:00", or "6:30pm" depending on
// whether the LLM normalized a cell. Collapse to a compact 12-hour form so
// "12:00–13:00" renders the way the sheet author meant it: "12–1".
function simplifyTime(t: string): string {
  const m = t.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!m) return t;
  let hour = parseInt(m[1], 10);
  const minStr = m[2] && m[2] !== "00" ? `:${m[2]}` : "";
  const suffix = m[3] ? m[3].toLowerCase() : "";
  if (hour >= 13 && hour <= 23) hour -= 12;
  else if (hour === 0) hour = 12;
  return `${hour}${minStr}${suffix}`;
}

function formatEventTime(start: string | null, end: string | null): string | null {
  if (!start) return null;
  if (!end) return simplifyTime(start);
  return `${simplifyTime(start)}–${simplifyTime(end)}`;
}

function relativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

export function CalendarClient({ events, lastSyncedAt }: CalendarClientProps) {
  // Group events by week
  const weeks = useMemo(() => {
    const map = new Map<number, { weekNumber: number; start: Date; end: Date; events: CalEvent[] }>();
    for (const e of events) {
      const key = e.weekNumber;
      if (!map.has(key)) {
        map.set(key, {
          weekNumber: e.weekNumber,
          start: new Date(e.weekStart),
          end: new Date(e.weekEnd),
          events: [],
        });
      }
      map.get(key)!.events.push(e);
    }
    return Array.from(map.values()).sort((a, b) => a.weekNumber - b.weekNumber);
  }, [events]);

  // Find current week index (week that contains today)
  const todayUtc = useMemo(() => {
    const t = new Date();
    return Date.UTC(t.getFullYear(), t.getMonth(), t.getDate());
  }, []);

  const initialIndex = useMemo(() => {
    const idx = weeks.findIndex(
      (w) => todayUtc >= w.start.getTime() && todayUtc <= w.end.getTime(),
    );
    return idx >= 0 ? idx : 0;
  }, [weeks, todayUtc]);

  const [weekIdx, setWeekIdx] = useState(initialIndex);
  const [expanded, setExpanded] = useState<string | null>(null);

  if (weeks.length === 0) {
    return <EmptyState lastSyncedAt={lastSyncedAt} />;
  }

  const currentWeek = weeks[weekIdx];
  const isCurrentWeek = todayUtc >= currentWeek.start.getTime() && todayUtc <= currentWeek.end.getTime();

  // Bucket events by day for this week
  const byDay: Map<number, CalEvent[]> = new Map();
  for (let i = 0; i <= 5; i++) byDay.set(i, []);
  for (const e of currentWeek.events) {
    byDay.get(e.dayOfWeek)?.push(e);
  }

  // Build day date for each weekday column
  const dayDates: Date[] = DAY_LABELS.map((_, i) => {
    const d = new Date(currentWeek.start);
    d.setUTCDate(d.getUTCDate() + i);
    return d;
  });

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "40px 40px 80px",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "var(--space-5)",
          marginBottom: "var(--space-6)",
        }}
      >
        <div style={{ display: "flex", gap: "var(--space-4)", alignItems: "center" }}>
          <IconTile icon="calendar" color="indigo" size="md" />
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "var(--text-xl)",
                fontWeight: 600,
                color: "var(--color-text)",
                letterSpacing: "-0.02em",
              }}
            >
              Calendar
            </h1>
            <p
              style={{
                margin: "2px 0 0",
                fontSize: "var(--text-sm)",
                color: "var(--color-text-2)",
              }}
            >
              Spring 2026 — synced from TCO Master Calendar
            </p>
          </div>
        </div>
        {lastSyncedAt && (
          <div
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--color-text-3)",
              marginTop: "var(--space-1)",
              whiteSpace: "nowrap",
            }}
          >
            Last synced {relativeTime(lastSyncedAt)}
          </div>
        )}
      </header>

      {/* Week navigator */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 18px",
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-3)",
          marginBottom: "var(--space-4)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <button
          onClick={() => setWeekIdx((i) => Math.max(0, i - 1))}
          disabled={weekIdx === 0}
          style={navButtonStyle(weekIdx === 0)}
          aria-label="Previous week"
        >
          <Icon name="arrow-left" size={16} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <StatusTag tone="accent" uppercase>
            Week {currentWeek.weekNumber}
          </StatusTag>
          <span
            style={{
              fontSize: "var(--text-md)",
              fontWeight: 600,
              color: "var(--color-text)",
              letterSpacing: "-0.01em",
            }}
          >
            {formatRange(currentWeek.start, currentWeek.end)}
          </span>
          {!isCurrentWeek && (
            <button
              onClick={() => setWeekIdx(initialIndex)}
              style={{
                background: "none",
                border: "none",
                color: "var(--color-accent)",
                fontFamily: "inherit",
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                cursor: "pointer",
                padding: 0,
                textDecoration: "underline",
                textUnderlineOffset: 2,
              }}
            >
              Jump to this week
            </button>
          )}
        </div>

        <button
          onClick={() => setWeekIdx((i) => Math.min(weeks.length - 1, i + 1))}
          disabled={weekIdx === weeks.length - 1}
          style={navButtonStyle(weekIdx === weeks.length - 1)}
          aria-label="Next week"
        >
          <span style={{ display: "inline-flex", transform: "rotate(180deg)" }}>
            <Icon name="arrow-left" size={16} />
          </span>
        </button>
      </div>

      {/* 5-day grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "var(--space-3)",
          marginBottom: "var(--space-5)",
        }}
      >
        {DAY_LABELS.map((label, i) => {
          const dayDate = dayDates[i];
          const isToday = dayDate.getTime() === todayUtc;
          const dayEvents = byDay.get(i) ?? [];
          return (
            <div
              key={label}
              style={{
                backgroundColor: isToday ? "var(--color-accent-soft)" : "var(--color-surface)",
                border: `1px solid ${isToday ? "var(--color-accent)" : "var(--color-border)"}`,
                borderRadius: "var(--radius-3)",
                padding: 0,
                boxShadow: "var(--shadow-card)",
                display: "flex",
                flexDirection: "column",
                minHeight: 280,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "12px 14px",
                  borderBottom: `1px solid ${isToday ? "var(--color-accent)" : "var(--color-border-subtle)"}`,
                  backgroundColor: isToday ? "var(--color-accent-soft)" : "var(--color-surface-2)",
                }}
              >
                <div
                  style={{
                    fontSize: "var(--text-xs)",
                    fontWeight: 650,
                    color: isToday ? "var(--color-accent-on-soft)" : "var(--color-text-3)",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  {label}{isToday && " · TODAY"}
                </div>
                <div
                  style={{
                    fontSize: "var(--text-base)",
                    fontWeight: 600,
                    color: isToday ? "var(--color-accent-on-soft)" : "var(--color-text)",
                    marginTop: "var(--space-1)",
                  }}
                >
                  {formatDayDate(dayDate)}
                </div>
              </div>
              <div style={{ padding: "var(--space-3)", display: "flex", flexDirection: "column", gap: "var(--space-2)", flex: 1 }}>
                {dayEvents.length === 0 ? (
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-3)", padding: "8px 4px" }}>
                    No events
                  </div>
                ) : (
                  dayEvents.map((e) => (
                    <EventCard
                      key={e.id}
                      event={e}
                      expanded={expanded === e.id}
                      onToggle={() => setExpanded(expanded === e.id ? null : e.id)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Homework section */}
      <HomeworkPanel
        events={byDay.get(5) ?? []}
        expanded={expanded}
        setExpanded={setExpanded}
      />
    </div>
  );
}

// ── Event card ────────────────────────────────────────────────────────────

function EventCard({
  event,
  expanded,
  onToggle,
}: {
  event: CalEvent;
  expanded: boolean;
  onToggle: () => void;
}) {
  const tokens = TYPE_TOKENS[event.type] ?? TYPE_TOKENS.GENERAL;
  const topicCount = event.topics?.length ?? 0;
  const hasExpandable = topicCount > 0 || !!event.description;
  const timeLabel = formatEventTime(event.startTime, event.endTime);
  return (
    <button
      onClick={hasExpandable ? onToggle : undefined}
      type="button"
      style={{
        textAlign: "left",
        display: "block",
        width: "100%",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderLeft: `3px solid ${tokens.bar}`,
        borderRadius: "var(--radius-2)",
        padding: "8px 10px",
        cursor: hasExpandable ? "pointer" : "default",
        fontFamily: "inherit",
        boxShadow: expanded ? "var(--shadow-card-hover)" : "none",
        transition: "box-shadow 180ms ease",
      }}
    >
      <div
        style={{
          fontSize: "var(--text-sm)",
          fontWeight: 600,
          color: "var(--color-text)",
          lineHeight: 1.35,
          wordBreak: "break-word",
        }}
      >
        {event.title}
      </div>
      {(timeLabel || event.location) && (
        <div
          style={{
            display: "flex",
            gap: "var(--space-2)",
            alignItems: "center",
            marginTop: "var(--space-1)",
            flexWrap: "wrap",
          }}
        >
          {timeLabel && (
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-3)", fontVariantNumeric: "tabular-nums" }}>
              {timeLabel}
            </span>
          )}
          {event.location && (
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-3)" }}>
              · {event.location}
            </span>
          )}
        </div>
      )}
      {topicCount > 0 && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-1)",
            marginTop: "var(--space-2)",
            fontSize: "var(--text-xs)",
            color: "var(--color-text-3)",
            fontWeight: 500,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 140ms ease",
            }}
          >
            <Icon name="chevron-right" size={12} />
          </span>
          {topicCount} {topicCount === 1 ? "topic" : "topics"}
        </div>
      )}
      {(topicCount > 0 || event.description) && (
        <div
          style={{
            display: "grid",
            gridTemplateRows: expanded ? "1fr" : "0fr",
            transition: "grid-template-rows 220ms ease",
          }}
        >
          <div style={{ overflow: "hidden", minHeight: 0 }}>
            <div
              style={{
                marginTop: "var(--space-2)",
                paddingTop: "var(--space-2)",
                borderTop: "1px solid var(--color-border-subtle)",
                opacity: expanded ? 1 : 0,
                transition: "opacity 180ms ease",
              }}
            >
              {topicCount > 0 && (
                <ul
                  style={{
                    margin: 0,
                    padding: "0 0 0 16px",
                    fontSize: "var(--text-xs)",
                    color: "var(--color-text-2)",
                    lineHeight: 1.5,
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-1)",
                  }}
                >
                  {event.topics!.map((t, i) => (
                    <li key={i} style={{ wordBreak: "break-word" }}>
                      {t}
                    </li>
                  ))}
                </ul>
              )}
              {event.description && (
                <div
                  style={{
                    marginTop: topicCount > 0 ? 8 : 0,
                    fontSize: "var(--text-xs)",
                    color: "var(--color-text-2)",
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {event.description}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {event.type !== "GENERAL" && (
        <div style={{ marginTop: "var(--space-2)" }}>
          <StatusTag
            tone="neutral"
            size="xs"
            uppercase
            style={{ color: tokens.fg, backgroundColor: tokens.bg }}
          >
            {tokens.label}
          </StatusTag>
        </div>
      )}
    </button>
  );
}

// ── Homework panel ────────────────────────────────────────────────────────

function HomeworkPanel({
  events,
  expanded,
  setExpanded,
}: {
  events: CalEvent[];
  expanded: string | null;
  setExpanded: (id: string | null) => void;
}) {
  if (events.length === 0) return null;
  return (
    <div
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-3)",
        boxShadow: "var(--shadow-card)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-3)",
          padding: "14px 18px",
          backgroundColor: "var(--color-surface-2)",
          borderBottom: "1px solid var(--color-border-subtle)",
        }}
      >
        <IconTile icon="clipboard-check" color="honey" size="sm" />
        <h2
          style={{
            margin: 0,
            fontSize: "var(--text-md)",
            fontWeight: 600,
            color: "var(--color-text)",
            letterSpacing: "-0.01em",
          }}
        >
          Homework & Deadlines
        </h2>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-3)", marginLeft: "auto" }}>
          {events.length} {events.length === 1 ? "item" : "items"}
        </span>
      </div>
      <div>
        {events.map((e, i) => {
          const tokens = TYPE_TOKENS[e.type] ?? TYPE_TOKENS.GENERAL;
          const isOpen = expanded === e.id;
          const hasDetails = e.description;
          return (
            <button
              key={e.id}
              onClick={() => setExpanded(isOpen ? null : e.id)}
              type="button"
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "12px 18px",
                background: "transparent",
                border: "none",
                borderTop: i === 0 ? "none" : "1px solid var(--color-border-subtle)",
                cursor: hasDetails ? "pointer" : "default",
                fontFamily: "inherit",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-3)" }}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: tokens.bar,
                    marginTop: "var(--space-2)",
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "var(--text-sm)",
                      color: "var(--color-text)",
                      lineHeight: 1.45,
                    }}
                  >
                    {e.title}
                  </div>
                  {e.description && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateRows: isOpen ? "1fr" : "0fr",
                        transition: "grid-template-rows 220ms ease",
                      }}
                    >
                      <div style={{ overflow: "hidden", minHeight: 0 }}>
                        <div
                          style={{
                            marginTop: "var(--space-2)",
                            fontSize: "var(--text-sm)",
                            color: "var(--color-text-2)",
                            lineHeight: 1.5,
                            whiteSpace: "pre-wrap",
                            opacity: isOpen ? 1 : 0,
                            transition: "opacity 180ms ease",
                          }}
                        >
                          {e.description}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {e.type !== "GENERAL" && (
                  <StatusTag
                    tone="neutral"
                    uppercase
                    style={{ color: tokens.fg, backgroundColor: tokens.bg }}
                  >
                    {tokens.label}
                  </StatusTag>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────

function EmptyState({ lastSyncedAt }: { lastSyncedAt: string | null }) {
  return (
    <div
      style={{
        maxWidth: 600,
        margin: "0 auto",
        padding: "120px 40px 40px",
        textAlign: "center",
      }}
    >
      <div style={{ display: "inline-flex", marginBottom: "var(--space-4)" }}>
        <IconTile icon="calendar" color="indigo" size="lg" />
      </div>
      <h1 style={{ fontSize: "var(--text-lg)", fontWeight: 600, color: "var(--color-text)", margin: "0 0 8px" }}>
        No events yet
      </h1>
      <p style={{ fontSize: "var(--text-base)", color: "var(--color-text-2)", margin: 0 }}>
        The calendar syncs from the TCO Master Calendar every 30 minutes.{" "}
        {lastSyncedAt && `Last synced ${relativeTime(lastSyncedAt)}.`}
      </p>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────

function navButtonStyle(disabled: boolean): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    background: "var(--color-surface-2)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-2)",
    color: disabled ? "var(--color-text-3)" : "var(--color-text)",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    transition: "background 120ms ease",
  };
}
