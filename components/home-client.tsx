"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { IconTile } from "@/components/ui/icon-tile";
import { StatusTag } from "@/components/ui/status-tag";
import { PageFrame } from "@/components/ui/page-frame";
import { getConceptVisual } from "@/lib/section-icons";
import { daysUntil } from "@/lib/week-utils";
import type {
  HomeWeekEvent,
  ContinuePick,
  DueItem,
  BookmarkPreview,
  WeakConcept,
} from "@/lib/home-data";

interface HomeClientProps {
  greeting: string;
  firstName: string | null;
  programLabel: string;
  programWeek: number;
  programTotal: number;
  todayISO: string;
  weekEvents: HomeWeekEvent[];
  continuePick: ContinuePick | null;
  dueItems: DueItem[];
  bookmarks: BookmarkPreview[];
  weakConcept: WeakConcept | null;
}

// Event-type dot color — mirrors the subset of TYPE_TOKENS used in
// calendar-client. Kept inline to avoid pulling a client file into a
// shared module; if we extend this further, extract to lib/event-tokens.
const TYPE_DOT: Record<string, string> = {
  TECH_TEAM: "var(--color-blue)",
  CAPITAL_TEAM: "var(--color-correct)",
  EVENTS: "#E08A3C",
  MEDIA_TEAM: "#8064A2",
  EXEC: "var(--color-incorrect)",
  NON_MANDATORY: "var(--color-slate)",
  GENERAL: "var(--color-text-3)",
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatTime(start: string | null, end: string | null): string | null {
  if (!start) return null;
  if (!end) return start;
  return `${start}–${end}`;
}

export function HomeClient(props: HomeClientProps) {
  const {
    greeting,
    firstName,
    programLabel,
    programWeek,
    programTotal,
    todayISO,
    weekEvents,
    continuePick,
    dueItems,
    bookmarks,
    weakConcept,
  } = props;

  const today = new Date(todayISO);
  const todayDayIdx = (today.getDay() + 6) % 7; // Mon=0..Sun=6

  return (
    <PageFrame>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section style={{ marginBottom: 36 }}>
        <h1
          style={{
            margin: 0,
            fontSize: "var(--text-3xl)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "var(--color-text)",
          }}
        >
          {greeting}
          {firstName ? `, ${firstName}` : ""}
        </h1>
        <ProgramSubLine label={programLabel} week={programWeek} total={programTotal} />
      </section>

      {/* ── Tier 2: Do next (Continue + This week) ───────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "3fr 2fr",
          gap: "var(--space-4)",
          marginBottom: "var(--space-4)",
          alignItems: "start",
        }}
      >
        <Panel eyebrow="Continue learning" title="Pick up where you left off">
          <ContinueCard pick={continuePick} />
        </Panel>

        <Panel
          eyebrow="This week"
          title={programWeek > 0 && programWeek <= programTotal ? `Week ${programWeek}` : "Schedule"}
          footerHref="/calendar"
          footerLabel="See full calendar →"
        >
          <WeekList events={weekEvents} todayDayIdx={todayDayIdx} />
        </Panel>
      </div>

      {/* ── Tier 3: Stay on track (Due soon + Keep sharp) ────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "3fr 2fr",
          gap: "var(--space-4)",
          marginBottom: 36,
          alignItems: "start",
        }}
      >
        <Panel eyebrow="Due soon" title="What's on your plate">
          <DueList items={dueItems} todayISO={todayISO} />
        </Panel>

        <Panel eyebrow="Keep sharp" title="Practice">
          <PracticeBlock weak={weakConcept} />
        </Panel>
      </div>

      {/* ── Tier 4: Bookmarks ────────────────────────────────────────── */}
      <section>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: "var(--space-3)",
          }}
        >
          <h2
            style={{
              fontSize: "var(--text-md)",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              color: "var(--color-text)",
              margin: 0,
            }}
          >
            Recent bookmarks
          </h2>
          {bookmarks.length > 0 && (
            <Link
              href="/browse?filter=bookmarked"
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: 500,
                color: "var(--color-accent)",
                textDecoration: "none",
              }}
            >
              View all →
            </Link>
          )}
        </div>
        <BookmarksRow bookmarks={bookmarks} />
      </section>
    </PageFrame>
  );
}

// ─── Hero sub-line ─────────────────────────────────────────────────────────

function ProgramSubLine({ label, week, total }: { label: string; week: number; total: number }) {
  const active = week > 0 && week <= total;
  return (
    <div
      style={{
        marginTop: "var(--space-3)",
        display: "flex",
        alignItems: "center",
        gap: "var(--space-3)",
        fontSize: "var(--text-sm)",
        color: "var(--color-text-2)",
      }}
    >
      <StatusTag tone={active ? "accent" : "neutral"}>{label}</StatusTag>
    </div>
  );
}

// ─── Panel shell ───────────────────────────────────────────────────────────

function Panel({
  eyebrow,
  title,
  children,
  footerHref,
  footerLabel,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  footerHref?: string;
  footerLabel?: string;
}) {
  return (
    <section
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-3)",
        boxShadow: "var(--shadow-card)",
        padding: "18px 20px 16px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          fontSize: "var(--text-xs)",
          fontWeight: 650,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--color-text-3)",
          marginBottom: "var(--space-1)",
        }}
      >
        {eyebrow}
      </div>
      <h2
        style={{
          margin: 0,
          fontSize: "var(--text-md)",
          fontWeight: 600,
          letterSpacing: "-0.01em",
          color: "var(--color-text)",
          marginBottom: "var(--space-4)",
        }}
      >
        {title}
      </h2>
      <div>{children}</div>
      {footerHref && footerLabel && (
        <div style={{ marginTop: "auto", paddingTop: "var(--space-3)" }}>
          <Link
            href={footerHref}
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: 500,
              color: "var(--color-accent)",
              textDecoration: "none",
            }}
          >
            {footerLabel}
          </Link>
        </div>
      )}
    </section>
  );
}

// ─── Continue card ─────────────────────────────────────────────────────────

function ContinueCard({ pick }: { pick: ContinuePick | null }) {
  if (!pick) {
    return (
      <EmptyBlock
        icon="compass"
        title="Nothing to resume yet"
        body="Head to Browse to pick your first concept."
        cta={{ label: "Open Browse →", href: "/browse" }}
      />
    );
  }

  const visual = getConceptVisual(pick.conceptSlug, pick.sectionSlug);
  const ctaLabel = pick.kind === "resume" ? "Resume" : "Start";

  return (
    <Link
      href={`/concepts/${pick.conceptSlug}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-4)",
        padding: "14px 16px",
        borderRadius: "var(--radius-2)",
        backgroundColor: "var(--color-surface-2)",
        border: "1px solid var(--color-border)",
        textDecoration: "none",
        color: "inherit",
        transition: "border-color 120ms ease, background-color 120ms ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--color-accent)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--color-border)";
      }}
    >
      <IconTile icon={visual.icon} color={visual.color} size="md" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "var(--text-xs)",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--color-text-3)",
            marginBottom: 3,
          }}
        >
          {pick.sectionName}
        </div>
        <div
          style={{
            fontSize: "var(--text-md)",
            fontWeight: 600,
            color: "var(--color-text)",
            letterSpacing: "-0.01em",
            lineHeight: 1.25,
            marginBottom: "var(--space-1)",
          }}
        >
          {pick.conceptName}
        </div>
        <div
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--color-text-2)",
            lineHeight: 1.45,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical" as const,
            overflow: "hidden",
          }}
        >
          {pick.conceptSubtitle}
        </div>
      </div>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "var(--space-2)",
          padding: "8px 14px",
          borderRadius: "var(--radius-2)",
          fontSize: "var(--text-sm)",
          fontWeight: 600,
          color: "var(--color-accent-on-soft)",
          backgroundColor: "var(--color-accent-soft)",
          whiteSpace: "nowrap",
        }}
      >
        {ctaLabel}
        <Icon name="chevron-right" size={14} />
      </span>
    </Link>
  );
}

// ─── Week list ─────────────────────────────────────────────────────────────

function WeekList({ events, todayDayIdx }: { events: HomeWeekEvent[]; todayDayIdx: number }) {
  if (events.length === 0) {
    return (
      <EmptyBlock
        icon="calendar"
        title="Nothing scheduled"
        body="No events on the calendar this week."
      />
    );
  }

  const upcoming = events.filter((e) => e.dayOfWeek >= todayDayIdx).slice(0, 4);
  const shown = upcoming.length > 0 ? upcoming : events.slice(0, 4);

  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      {shown.map((e) => {
        const isToday = e.dayOfWeek === todayDayIdx;
        const time = formatTime(e.startTime, e.endTime);
        return (
          <li
            key={e.id}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "var(--space-3)",
              padding: "6px 2px",
            }}
          >
            <span
              aria-hidden
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                marginTop: "var(--space-2)",
                backgroundColor: TYPE_DOT[e.type] ?? TYPE_DOT.GENERAL,
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "var(--space-2)",
                  fontSize: "var(--text-xs)",
                  color: "var(--color-text-3)",
                  marginBottom: "var(--space-1)",
                }}
              >
                <span style={{ fontWeight: 600, color: isToday ? "var(--color-accent)" : "var(--color-text-3)" }}>
                  {isToday ? "Today" : DAY_LABELS[e.dayOfWeek]}
                </span>
                {time && <span>{time}</span>}
              </div>
              <div
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: 500,
                  color: "var(--color-text)",
                  lineHeight: 1.35,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical" as const,
                  overflow: "hidden",
                }}
              >
                {e.title}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// ─── Due list ──────────────────────────────────────────────────────────────

function DueList({ items, todayISO }: { items: DueItem[]; todayISO: string }) {
  if (items.length === 0) {
    return (
      <EmptyBlock
        icon="check-circle"
        title="You're caught up"
        body="Nothing pending. Keep momentum with a quick practice quiz."
        cta={{ label: "Practice quiz →", href: "/quiz" }}
      />
    );
  }

  const now = new Date(todayISO);
  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      {items.map((it) => {
        const dd = daysUntil(it.dueDate, now);
        let dueLabel = "No due date";
        let dueTone: "neutral" | "warn" | "urgent" = "neutral";
        if (dd !== null) {
          if (dd < 0) {
            dueLabel = `${Math.abs(dd)}d overdue`;
            dueTone = "urgent";
          } else if (dd === 0) {
            dueLabel = "Due today";
            dueTone = "urgent";
          } else if (dd === 1) {
            dueLabel = "Due tomorrow";
            dueTone = "warn";
          } else if (dd <= 7) {
            dueLabel = `Due in ${dd} days`;
            dueTone = "warn";
          } else {
            dueLabel = `Due in ${dd} days`;
          }
        }

        const toneFg =
          dueTone === "urgent"
            ? "var(--color-incorrect)"
            : dueTone === "warn"
            ? "var(--color-accent-on-soft)"
            : "var(--color-text-3)";

        return (
          <li key={it.id}>
            <Link
              href={it.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-3)",
                padding: "10px 12px",
                borderRadius: "var(--radius-2)",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface-2)",
                textDecoration: "none",
                color: "inherit",
                transition: "border-color 120ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--color-accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--color-border)";
              }}
            >
              <IconTile
                icon={it.kind === "homework" ? "book-open" : "clipboard-check"}
                color={it.kind === "homework" ? "indigo" : "honey"}
                size="sm"
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "var(--text-sm)",
                    fontWeight: 600,
                    color: "var(--color-text)",
                    lineHeight: 1.3,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {it.title}
                </div>
                <div style={{ fontSize: "var(--text-xs)", color: toneFg, fontWeight: 500 }}>{dueLabel}</div>
              </div>
              <Icon name="chevron-right" size={14} />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

// ─── Practice block ────────────────────────────────────────────────────────

function PracticeBlock({ weak }: { weak: WeakConcept | null }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
      {weak && (
        <Link
          href="/quiz"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-1)",
            padding: "10px 12px",
            borderRadius: "var(--radius-2)",
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-incorrect-dim)",
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <div style={{ fontSize: "var(--text-xs)", fontWeight: 650, color: "var(--color-incorrect)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
            Shaky area
          </div>
          <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)", lineHeight: 1.3 }}>
            {weak.conceptName}
          </div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-2)" }}>
            {weak.accuracyPct}% across {weak.attempts} attempts
          </div>
        </Link>
      )}
      <Link
        href="/quiz"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "var(--space-2)",
          padding: "12px 14px",
          borderRadius: "var(--radius-2)",
          backgroundColor: "var(--color-accent)",
          color: "white",
          fontSize: "var(--text-sm)",
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        <Icon name="help-circle" size={15} />
        Take a practice quiz
      </Link>
      {!weak && (
        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-3)", textAlign: "center", marginTop: "var(--space-1)" }}>
          5 random questions from your curriculum.
        </div>
      )}
    </div>
  );
}

// ─── Bookmarks row ─────────────────────────────────────────────────────────

function BookmarksRow({ bookmarks }: { bookmarks: BookmarkPreview[] }) {
  if (bookmarks.length === 0) {
    return (
      <div
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px dashed var(--color-border)",
          borderRadius: "var(--radius-3)",
          padding: "24px 20px",
          display: "flex",
          alignItems: "center",
          gap: "var(--space-4)",
        }}
      >
        <IconTile icon="bookmark" color="honey" size="sm" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)" }}>
            Bookmark concepts you want to revisit
          </div>
          <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-3)", marginTop: "var(--space-1)" }}>
            Click the bookmark icon on any concept card — they'll show up here.
          </div>
        </div>
        <Link
          href="/browse"
          style={{
            fontSize: "var(--text-sm)",
            fontWeight: 500,
            color: "var(--color-accent)",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          Explore concepts →
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--space-3)" }}>
      {bookmarks.map((b) => {
        const visual = getConceptVisual(b.conceptSlug, b.sectionSlug);
        return (
          <Link
            key={b.conceptId}
            href={`/concepts/${b.conceptSlug}`}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "var(--space-3)",
              padding: "14px 16px",
              borderRadius: "var(--radius-3)",
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              boxShadow: "var(--shadow-card)",
              textDecoration: "none",
              color: "inherit",
              transition: "box-shadow 120ms ease, transform 120ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "var(--shadow-card-hover)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "var(--shadow-card)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <IconTile icon={visual.icon} color={visual.color} size="sm" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: "var(--text-base)",
                  fontWeight: 600,
                  color: "var(--color-text)",
                  lineHeight: 1.3,
                  letterSpacing: "-0.01em",
                }}
              >
                {b.conceptName}
              </h3>
              <p
                style={{
                  margin: "4px 0 0 0",
                  fontSize: "var(--text-xs)",
                  color: "var(--color-text-2)",
                  lineHeight: 1.45,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical" as const,
                  overflow: "hidden",
                }}
              >
                {b.conceptSubtitle}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ─── Empty-state block ─────────────────────────────────────────────────────

function EmptyBlock({
  icon,
  title,
  body,
  cta,
}: {
  icon: Parameters<typeof IconTile>[0]["icon"];
  title: string;
  body: string;
  cta?: { label: string; href: string };
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "var(--space-2)",
        padding: "14px 16px",
        borderRadius: "var(--radius-2)",
        backgroundColor: "var(--color-surface-2)",
        border: "1px dashed var(--color-border)",
      }}
    >
      <IconTile icon={icon} color="stone" size="sm" />
      <div>
        <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)" }}>{title}</div>
        <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-3)", marginTop: "var(--space-1)" }}>{body}</div>
      </div>
      {cta && (
        <Link
          href={cta.href}
          style={{
            fontSize: "var(--text-sm)",
            fontWeight: 500,
            color: "var(--color-accent)",
            textDecoration: "none",
            marginTop: "var(--space-1)",
          }}
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}

