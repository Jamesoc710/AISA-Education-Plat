"use client";

import Link from "next/link";
import { daysUntil } from "@/lib/week-utils";
import type {
  HomeWeekEvent,
  ContinuePick,
  DueItem,
  WeakConcept,
  UpcomingWorkshop,
} from "@/lib/home-data";

interface HomeClientProps {
  greeting: string;
  firstName: string | null;
  todayISO: string;
  weekEvents: HomeWeekEvent[];
  continuePick: ContinuePick | null;
  dueItems: DueItem[];
  weakConcept: WeakConcept | null;
  upcomingWorkshops: UpcomingWorkshop[];
}

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
const DAY_LABELS_LONG = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

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

function formatTime(start: string | null, end: string | null): string | null {
  if (!start) return null;
  if (!end) return simplifyTime(start);
  return `${simplifyTime(start)}–${simplifyTime(end)}`;
}

export function HomeClient(props: HomeClientProps) {
  const {
    greeting,
    firstName,
    todayISO,
    weekEvents,
    continuePick,
    dueItems,
    weakConcept,
    upcomingWorkshops,
  } = props;

  const today = new Date(todayISO);
  const todayDayIdx = (today.getDay() + 6) % 7;
  const dateLine = `${DAY_LABELS_LONG[todayDayIdx]}, ${MONTH_NAMES[today.getMonth()]} ${today.getDate()}`;

  return (
    <div
      data-surface="editorial"
      style={{
        backgroundColor: "var(--color-bg)",
        minHeight: "100%",
      }}
    >
      <div
        style={{
          maxWidth: 1080,
          margin: "0 auto",
          padding: "56px 48px 96px",
        }}
      >
        {/* ── Meta line ───────────────────────────────────────────── */}
        <div
          style={{
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--color-text-3)",
            marginBottom: 18,
          }}
        >
          {dateLine}
        </div>

        {/* ── Hero ────────────────────────────────────────────────── */}
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(44px, 6.4vw, 68px)",
            fontWeight: 600,
            letterSpacing: "-0.03em",
            lineHeight: 1.02,
            color: "var(--color-text)",
          }}
        >
          {greeting}
          {firstName ? `, ${firstName}.` : "."}
        </h1>

        <HairRule top={44} bottom={40} />

        {/* ── Continue learning ───────────────────────────────────── */}
        <ContinueSection pick={continuePick} />

        <HairRule top={40} bottom={40} />

        {/* ── Two-column: This week | On plate + Practice ─────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.35fr) 1px minmax(0, 1fr)",
            columnGap: 48,
            alignItems: "stretch",
          }}
        >
          <div>
            <SectionEyebrow>This week</SectionEyebrow>
            <WeekList events={weekEvents} todayDayIdx={todayDayIdx} />
            <Link
              href="/calendar"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                marginTop: 16,
                fontSize: 13,
                fontWeight: 500,
                color: "var(--color-accent)",
                textDecoration: "none",
              }}
              className="editorial-link"
            >
              See full calendar
              <ArrowRight />
            </Link>
          </div>

          <div
            aria-hidden
            style={{
              width: 1,
              backgroundColor: "var(--color-border)",
              justifySelf: "center",
            }}
          />

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ marginBottom: 28 }}>
              <SectionEyebrow>On your plate</SectionEyebrow>
              <DueList items={dueItems} todayISO={todayISO} />
            </div>
            <div
              aria-hidden
              style={{
                height: 1,
                backgroundColor: "var(--color-border)",
                margin: "4px 0 28px",
              }}
            />
            <div>
              <SectionEyebrow>Practice</SectionEyebrow>
              <PracticeBlock weak={weakConcept} />
            </div>
          </div>
        </div>

        {/* ── Workshop prep (shared-edge cards) ───────────────────── */}
        {upcomingWorkshops.length > 0 && (
          <>
            <HairRule top={56} bottom={28} />
            <SectionEyebrow>
              {upcomingWorkshops.length > 1 ? "Prep for upcoming workshops" : "Prep for upcoming workshop"}
            </SectionEyebrow>
            <WorkshopPrepRow workshops={upcomingWorkshops} todayDayIdx={todayDayIdx} today={today} />
          </>
        )}
      </div>

      {/* ── Hover underline for all editorial links ───────────────── */}
      <style>{`
        [data-surface="editorial"] .editorial-link {
          position: relative;
        }
        [data-surface="editorial"] .editorial-link svg {
          transition: transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        [data-surface="editorial"] .editorial-link:hover svg {
          transform: translateX(3px);
        }
        [data-surface="editorial"] .editorial-link::after {
          content: "";
          position: absolute;
          left: 0;
          right: 18px;
          bottom: -2px;
          height: 1px;
          background-color: currentColor;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        [data-surface="editorial"] .editorial-link:hover::after {
          transform: scaleX(1);
        }
      `}</style>
    </div>
  );
}

// ─── Shared primitives ──────────────────────────────────────────────────────

function HairRule({ top = 32, bottom = 32 }: { top?: number; bottom?: number }) {
  return (
    <div
      aria-hidden
      style={{
        height: 1,
        backgroundColor: "var(--color-border)",
        margin: `${top}px 0 ${bottom}px`,
      }}
    />
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "var(--color-text-3)",
        marginBottom: 16,
      }}
    >
      {children}
    </div>
  );
}

function ArrowRight() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

// ─── Continue section ──────────────────────────────────────────────────────

function ContinueSection({ pick }: { pick: ContinuePick | null }) {
  if (!pick) {
    return (
      <div>
        <SectionEyebrow>Continue learning</SectionEyebrow>
        <p
          style={{
            margin: 0,
            fontSize: 17,
            color: "var(--color-text-2)",
            lineHeight: 1.5,
          }}
        >
          Nothing to resume yet.{" "}
          <Link
            href="/browse"
            className="editorial-link"
            style={{
              color: "var(--color-accent)",
              textDecoration: "none",
              fontWeight: 500,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            Pick your first concept
            <ArrowRight />
          </Link>
        </p>
      </div>
    );
  }

  const label = pick.kind === "resume" ? "Resume" : "Start";

  return (
    <div>
      <SectionEyebrow>Continue learning</SectionEyebrow>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 32,
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: "1 1 440px", minWidth: 0 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--color-text-3)",
              marginBottom: 8,
            }}
          >
            {pick.sectionName}
          </div>
          <h2
            style={{
              margin: 0,
              fontSize: "clamp(30px, 3.8vw, 42px)",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              color: "var(--color-text)",
            }}
          >
            {pick.conceptName}
          </h2>
          <p
            style={{
              margin: "12px 0 0 0",
              fontSize: 17,
              color: "var(--color-text-2)",
              lineHeight: 1.5,
              maxWidth: 620,
            }}
          >
            {pick.conceptSubtitle}
          </p>
        </div>
        <Link
          href={`/concepts/${pick.conceptSlug}`}
          className="editorial-link"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: 15,
            fontWeight: 600,
            color: "var(--color-accent)",
            textDecoration: "none",
            paddingBottom: 6,
          }}
        >
          {label}
          <ArrowRight />
        </Link>
      </div>
    </div>
  );
}

// ─── Week list ─────────────────────────────────────────────────────────────

function WeekList({ events, todayDayIdx }: { events: HomeWeekEvent[]; todayDayIdx: number }) {
  if (events.length === 0) {
    return (
      <p
        style={{
          margin: 0,
          fontSize: 15,
          color: "var(--color-text-2)",
          lineHeight: 1.5,
        }}
      >
        No events on the calendar this week.
      </p>
    );
  }

  const upcoming = events.filter((e) => e.dayOfWeek >= todayDayIdx);
  const shown = upcoming.length > 0 ? upcoming.slice(0, 5) : events.slice(-5);

  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {shown.map((e, idx) => {
        const isToday = e.dayOfWeek === todayDayIdx;
        const time = formatTime(e.startTime, e.endTime);
        return (
          <li
            key={e.id}
            style={{
              display: "grid",
              gridTemplateColumns: "52px 78px 1fr",
              columnGap: 16,
              alignItems: "baseline",
              padding: "14px 0",
              borderTop: idx === 0 ? "1px solid var(--color-border)" : "none",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                color: isToday ? "var(--color-accent)" : "var(--color-text-2)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  backgroundColor: TYPE_DOT[e.type] ?? TYPE_DOT.GENERAL,
                  flexShrink: 0,
                }}
              />
              {isToday ? "Today" : DAY_LABELS[e.dayOfWeek]}
            </span>
            <span
              style={{
                fontSize: 12,
                color: "var(--color-text-3)",
                fontVariantNumeric: "tabular-nums",
                whiteSpace: "nowrap",
              }}
            >
              {time ?? ""}
            </span>
            <span
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: "var(--color-text)",
                letterSpacing: "-0.005em",
                lineHeight: 1.35,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical" as const,
                overflow: "hidden",
              }}
            >
              {e.title}
            </span>
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
      <p
        style={{
          margin: 0,
          fontSize: 15,
          color: "var(--color-text-2)",
          lineHeight: 1.5,
        }}
      >
        You&rsquo;re caught up. Nothing pending.
      </p>
    );
  }

  const now = new Date(todayISO);
  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {items.map((it, idx) => {
        const dd = daysUntil(it.dueDate, now);
        let dueLabel = "No date";
        let urgent = false;
        if (dd !== null) {
          if (dd < 0) {
            dueLabel = `${Math.abs(dd)}d overdue`;
            urgent = true;
          } else if (dd === 0) {
            dueLabel = "Due today";
            urgent = true;
          } else if (dd === 1) {
            dueLabel = "Tomorrow";
          } else if (dd <= 7) {
            dueLabel = `In ${dd} days`;
          } else {
            dueLabel = `In ${dd} days`;
          }
        }

        return (
          <li
            key={it.id}
            style={{
              borderTop: idx === 0 ? "1px solid var(--color-border)" : "none",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            <Link
              href={it.href}
              className="editorial-link-row"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "14px 2px",
                textDecoration: "none",
                color: "inherit",
                transition: "color 140ms ease",
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 500,
                    color: "var(--color-text)",
                    letterSpacing: "-0.005em",
                    lineHeight: 1.35,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {it.title}
                </div>
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 12,
                    fontWeight: 500,
                    color: "var(--color-text-3)",
                    letterSpacing: "0.02em",
                    textTransform: "uppercase",
                  }}
                >
                  {it.kind === "homework" ? "Homework" : "Assessment"}
                </div>
              </div>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  color: urgent ? "var(--color-incorrect)" : "var(--color-text-2)",
                  whiteSpace: "nowrap",
                }}
              >
                {urgent && (
                  <span
                    aria-hidden
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 999,
                      backgroundColor: "var(--color-incorrect)",
                    }}
                  />
                )}
                {dueLabel}
              </span>
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
    <div>
      {weak ? (
        <p
          style={{
            margin: 0,
            fontSize: 15,
            color: "var(--color-text)",
            lineHeight: 1.5,
            letterSpacing: "-0.005em",
          }}
        >
          Your shakiest area is{" "}
          <span style={{ fontWeight: 600 }}>{weak.conceptName}</span>
          {" "}at{" "}
          <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>
            {weak.accuracyPct}%
          </span>
          {" "}across {weak.attempts} attempts.
        </p>
      ) : (
        <p
          style={{
            margin: 0,
            fontSize: 15,
            color: "var(--color-text-2)",
            lineHeight: 1.5,
          }}
        >
          Five random questions to keep you sharp.
        </p>
      )}
      <Link
        href="/quiz"
        className="editorial-link"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          marginTop: 14,
          fontSize: 14,
          fontWeight: 600,
          color: "var(--color-accent)",
          textDecoration: "none",
        }}
      >
        Take a practice quiz
        <ArrowRight />
      </Link>
    </div>
  );
}

// ─── Workshop prep (shared-edge cards) ─────────────────────────────────────

function WorkshopPrepRow({
  workshops,
  todayDayIdx,
  today,
}: {
  workshops: UpcomingWorkshop[];
  todayDayIdx: number;
  today: Date;
}) {
  const twoUp = workshops.length > 1;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: twoUp ? "1fr 1fr" : "1fr",
        border: "1px solid var(--color-border)",
        backgroundColor: "var(--color-surface)",
      }}
    >
      {workshops.map((w, idx) => (
        <WorkshopPrepCard
          key={w.eventId}
          workshop={w}
          todayDayIdx={todayDayIdx}
          today={today}
          showLeftBorder={twoUp && idx > 0}
        />
      ))}
    </div>
  );
}

function WorkshopPrepCard({
  workshop,
  todayDayIdx,
  today,
  showLeftBorder,
}: {
  workshop: UpcomingWorkshop;
  todayDayIdx: number;
  today: Date;
  showLeftBorder: boolean;
}) {
  const eventDate = new Date(workshop.date);
  const dayDelta = daysUntil(eventDate, today);
  const time = formatTime(workshop.startTime, workshop.endTime);
  const isToday = workshop.dayOfWeek === todayDayIdx && dayDelta === 0;

  let whenLabel: string;
  if (isToday) {
    whenLabel = "Today";
  } else if (dayDelta === 1) {
    whenLabel = "Tomorrow";
  } else if (dayDelta !== null && dayDelta > 1 && dayDelta <= 6) {
    whenLabel = DAY_LABELS_LONG[workshop.dayOfWeek] ?? "";
  } else {
    const d = new Date(workshop.date);
    whenLabel = `${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
  }

  return (
    <article
      style={{
        display: "flex",
        flexDirection: "column",
        padding: "26px 28px 24px",
        borderLeft: showLeftBorder ? "1px solid var(--color-border)" : "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: isToday ? "var(--color-accent)" : "var(--color-text-3)",
          marginBottom: 14,
        }}
      >
        <span>{whenLabel}</span>
        {time && (
          <>
            <span style={{ opacity: 0.5 }}>/</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{time}</span>
          </>
        )}
      </div>
      <h3
        style={{
          margin: 0,
          fontSize: 22,
          fontWeight: 600,
          color: "var(--color-text)",
          letterSpacing: "-0.015em",
          lineHeight: 1.2,
          marginBottom: 14,
        }}
      >
        {workshop.title}
      </h3>
      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "flex",
          flexWrap: "wrap",
          gap: "6px 14px",
          marginBottom: 20,
        }}
      >
        {workshop.concepts.map((c) => (
          <li
            key={c.slug}
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "var(--color-text-2)",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span
              aria-hidden
              style={{
                width: 3,
                height: 3,
                borderRadius: 999,
                backgroundColor: "var(--color-text-3)",
              }}
            />
            {c.name}
          </li>
        ))}
      </ul>
      <div style={{ marginTop: "auto" }}>
        <Link
          href={`/flashcards/workshop/${workshop.eventId}`}
          className="editorial-link"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 14,
            fontWeight: 600,
            color: "var(--color-accent)",
            textDecoration: "none",
          }}
        >
          Review flashcards
          <ArrowRight />
        </Link>
      </div>
    </article>
  );
}
