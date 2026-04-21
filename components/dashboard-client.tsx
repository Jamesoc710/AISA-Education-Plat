"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/icon";
import { IconTile } from "@/components/ui/icon-tile";
import { StatusTag } from "@/components/ui/status-tag";
import { PageFrame } from "@/components/ui/page-frame";

// ── Types ─────────────────────────────────────────────────────────────────────

type ConceptInfo = { id: string; name: string; slug: string };
type SectionInfo = { id: string; name: string; concepts: ConceptInfo[] };
type TierInfo = {
  id: string;
  name: string;
  slug: string;
  sections: SectionInfo[];
};
type ConceptScore = {
  pct: number;
  total: number;
  correct: number;
  lastAttempt: string;
};
type Overview = {
  totalConcepts: number;
  conceptsQuizzed: number;
  totalQuestions: number;
  avgScore: number;
  quizSessions: number;
};
type PendingAssessment = {
  id: string; title: string; description: string | null;
  timeLimit: number | null; dueDate: string | null;
  questionCount: number; completed: boolean; score: number | null;
};
type HomeworkItem = {
  id: string; title: string; dueDate: string | null;
  conceptName: string | null; submitted: boolean;
  submittedAt: string | null; grade: string | null;
};
type ActivityBucket = { date: string; total: number; correct: number };

const TIER_VISUAL: Record<string, { color: string; label: string }> = {
  fundamentals: { color: "amber", label: "Fundamentals" },
  intermediate: { color: "blue", label: "Intermediate" },
  advanced: { color: "stone", label: "Advanced" },
};

function getMasteryColor(pct: number): string {
  if (pct >= 80) return "var(--color-correct)";
  if (pct >= 50) return "var(--color-gold)";
  return "var(--color-incorrect)";
}

function getMasteryBg(pct: number): string {
  if (pct >= 80) return "var(--color-correct-dim)";
  if (pct >= 50) return "var(--color-gold-dim)";
  return "var(--color-incorrect-dim)";
}

function formatDue(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Main Component ────────────────────────────────────────────────────────────

export function DashboardClient({
  userName,
  overview,
  tiers,
  conceptScores,
  pendingAssessments,
  homeworkItems,
  activity,
}: {
  userName: string;
  overview: Overview;
  tiers: TierInfo[];
  conceptScores: Record<string, ConceptScore>;
  pendingAssessments: PendingAssessment[];
  homeworkItems: HomeworkItem[];
  activity: ActivityBucket[];
}) {
  const firstName = userName.split(" ")[0];

  // Count concepts at 80%+ mastery
  const masteredCount = useMemo(
    () => Object.values(conceptScores).filter((s) => s.pct >= 80).length,
    [conceptScores],
  );
  const touchedCount = overview.conceptsQuizzed;

  const nextAction = useMemo(
    () => computeNextAction(pendingAssessments, homeworkItems, tiers, conceptScores),
    [pendingAssessments, homeworkItems, tiers, conceptScores],
  );

  // Hide Upcoming strip when the Next Best Action already points to the
  // only open deadline — avoids showing the same item twice.
  const openDeadlineCount =
    pendingAssessments.filter((a) => !a.completed).length +
    homeworkItems.filter((h) => !h.submitted).length;
  const nbaIsDeadline =
    nextAction.kind === "deadline-assessment" ||
    nextAction.kind === "deadline-homework";
  const showUpcomingStrip =
    (pendingAssessments.length + homeworkItems.length) > 0 &&
    !(nbaIsDeadline && openDeadlineCount <= 1);

  return (
    <PageFrame>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section style={{ marginBottom: "var(--space-6)", display: "flex", alignItems: "center", gap: "var(--space-5)" }}>
        <IconTile icon="chart-line-up" color="indigo" size="lg" />
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: "var(--text-xs)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--color-text-3)",
              marginBottom: "var(--space-1)",
            }}
          >
            Dashboard
          </div>
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
            Your progress, {firstName}
          </h1>
          <p
            style={{
              margin: "6px 0 0",
              fontSize: "var(--text-base)",
              color: "var(--color-text-2)",
            }}
          >
            {touchedCount} of {overview.totalConcepts} concepts started ·
            {" "}{masteredCount} at mastery ·
            {" "}{overview.totalQuestions} questions answered
          </p>
        </div>
      </section>

      {/* ── Next best action ────────────────────────────────────────── */}
      <NextBestActionCard action={nextAction} />

      {/* ── Upcoming strip (collapsed by default) ───────────────────── */}
      {showUpcomingStrip && (
        <UpcomingStrip
          assessments={pendingAssessments}
          homework={homeworkItems}
        />
      )}

      {/* ── Stats row ───────────────────────────────────────────────── */}
      <OverviewStrip overview={overview} masteredCount={masteredCount} />

      {/* ── Mastery + Tier bars ─────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.3fr)",
          gap: "var(--space-4)",
          marginBottom: "var(--space-6)",
        }}
      >
        <MasteryPanel
          masteredCount={masteredCount}
          touchedCount={touchedCount}
          total={overview.totalConcepts}
        />
        <TierBars tiers={tiers} conceptScores={conceptScores} />
      </div>

      {/* ── Activity pulse ──────────────────────────────────────────── */}
      <ActivityPulse activity={activity} />

      {/* ── Knowledge map v2 ────────────────────────────────────────── */}
      <KnowledgeMap tiers={tiers} conceptScores={conceptScores} />

      {/* ── Suggested review ────────────────────────────────────────── */}
      <SuggestedReview tiers={tiers} conceptScores={conceptScores} />
    </PageFrame>
  );
}

// ── Upcoming Strip ──────────────────────────────────────────────────────────

function UpcomingStrip({
  assessments,
  homework,
}: {
  assessments: PendingAssessment[];
  homework: HomeworkItem[];
}) {
  const [open, setOpen] = useState(false);

  // Build an interleaved "open" list sorted by earliest due date.
  type OpenItem =
    | { kind: "assessment"; title: string; due: string | null; dueMs: number }
    | { kind: "homework"; title: string; due: string | null; dueMs: number };
  const openItems: OpenItem[] = [];
  for (const a of assessments) {
    if (a.completed) continue;
    openItems.push({
      kind: "assessment",
      title: a.title,
      due: a.dueDate,
      dueMs: a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY,
    });
  }
  for (const h of homework) {
    if (h.submitted) continue;
    openItems.push({
      kind: "homework",
      title: h.title,
      due: h.dueDate,
      dueMs: h.dueDate ? new Date(h.dueDate).getTime() : Number.POSITIVE_INFINITY,
    });
  }
  openItems.sort((a, b) => a.dueMs - b.dueMs);

  const nearest = openItems[0] ?? null;
  const rest = openItems.length - 1;

  const totalCount = assessments.length + homework.length;

  // Nearest-item inline label
  let inlineText: string;
  if (nearest) {
    const daysLeft = nearest.due
      ? Math.ceil((nearest.dueMs - Date.now()) / 86400000)
      : null;
    const dueLabel = nearest.due
      ? daysLeft !== null && daysLeft <= 0
        ? "due today"
        : daysLeft !== null && daysLeft === 1
          ? "due tomorrow"
          : `due in ${daysLeft} days`
      : "no deadline";
    inlineText = `${nearest.kind === "assessment" ? "Next up:" : "Homework:"} ${nearest.title} — ${dueLabel}`;
  } else {
    inlineText =
      totalCount > 0
        ? `${totalCount} completed`
        : "Nothing pending";
  }

  return (
    <div style={{ marginBottom: "var(--space-6)" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: "12px 16px",
          borderRadius: "var(--radius-2)",
          border: "1px solid var(--color-border)",
          backgroundColor: "var(--color-surface)",
          cursor: "pointer",
          textAlign: "left",
          color: "inherit",
          transition: "border-color 120ms ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", minWidth: 0, flex: 1 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              borderRadius: "var(--radius-2)",
              backgroundColor: "var(--tile-indigo-bg)",
              color: "var(--tile-indigo-fg)",
              flexShrink: 0,
            }}
          >
            <Icon name="clipboard-check" size={15} />
          </span>
          <span
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: 500,
              color: "var(--color-text)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              minWidth: 0,
              flex: 1,
            }}
          >
            {inlineText}
          </span>
          {rest > 0 && <StatusTag tone="accent">+{rest} more</StatusTag>}
        </span>
        <span
          aria-hidden
          style={{
            display: "inline-flex",
            transform: open ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 140ms ease",
            color: "var(--color-text-3)",
            marginLeft: "var(--space-3)",
          }}
        >
          <Icon name="chevron-right" size={14} />
        </span>
      </button>

      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
          {assessments.map((a) => (
            <AssessmentRow key={a.id} a={a} />
          ))}
          {homework.map((h) => (
            <HomeworkRow key={h.id} h={h} />
          ))}
        </div>
      )}
    </div>
  );
}

function AssessmentRow({ a }: { a: PendingAssessment }) {
  const scoreColor = a.score !== null ? getMasteryColor(a.score) : "var(--color-text-3)";
  const scoreBg = a.score !== null ? getMasteryBg(a.score) : "transparent";
  const due = formatDue(a.dueDate);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--space-3)",
        padding: "12px 16px",
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-2)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", minWidth: 0 }}>
        <IconTile icon="clipboard-check" color="honey" size="sm" />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-text)" }}>
            {a.title}
          </div>
          <div
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--color-text-3)",
              marginTop: "var(--space-1)",
              display: "flex",
              gap: "var(--space-2)",
              flexWrap: "wrap",
            }}
          >
            <span>{a.questionCount} questions</span>
            {a.timeLimit !== null && <span>· {a.timeLimit} min</span>}
            {due && <span>· Due {due}</span>}
          </div>
        </div>
      </div>
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
        {a.completed ? (
          <>
            {a.score !== null && (
              <span
                style={{
                  fontSize: "var(--text-xs)",
                  fontWeight: 600,
                  color: scoreColor,
                  backgroundColor: scoreBg,
                  padding: "4px 10px",
                  borderRadius: "var(--radius-1)",
                }}
              >
                {a.score}%
              </span>
            )}
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-3)" }}>Completed</span>
          </>
        ) : (
          <Link
            href={`/assessment/${a.id}`}
            style={{
              backgroundColor: "var(--color-accent)",
              color: "#fff",
              fontSize: "var(--text-xs)",
              fontWeight: 500,
              borderRadius: "var(--radius-1)",
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

function HomeworkRow({ h }: { h: HomeworkItem }) {
  const due = formatDue(h.dueDate);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--space-3)",
        padding: "12px 16px",
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-2)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", minWidth: 0 }}>
        <IconTile icon="file-text" color="sage" size="sm" />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-text)" }}>
            {h.title}
          </div>
          <div
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--color-text-3)",
              marginTop: "var(--space-1)",
              display: "flex",
              gap: "var(--space-2)",
              flexWrap: "wrap",
            }}
          >
            {h.conceptName && <span>{h.conceptName}</span>}
            {due && <span>{h.conceptName ? "· " : ""}Due {due}</span>}
          </div>
        </div>
      </div>
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
        {!h.submitted ? (
          <Link
            href={`/homework/${h.id}`}
            style={{
              border: "1px solid var(--color-accent)",
              color: "var(--color-accent)",
              backgroundColor: "transparent",
              fontSize: "var(--text-xs)",
              fontWeight: 500,
              borderRadius: "var(--radius-1)",
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
                fontSize: "var(--text-xs)",
                fontWeight: 600,
                color: "#fff",
                backgroundColor: "var(--color-correct)",
                padding: "4px 10px",
                borderRadius: "var(--radius-1)",
              }}
            >
              {h.grade}
            </span>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-3)" }}>Graded</span>
          </>
        ) : (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-3)" }}>Submitted</div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-3)" }}>Awaiting review</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Overview Stats ──────────────────────────────────────────────────────────

function OverviewStrip({
  overview,
  masteredCount,
}: {
  overview: Overview;
  masteredCount: number;
}) {
  const avgColor =
    overview.totalQuestions === 0
      ? "var(--color-text)"
      : getMasteryColor(overview.avgScore);

  const stats: {
    label: string;
    value: string;
    sub: string | null;
    icon: "check-circle" | "target" | "sparkle" | "list-checks";
    tile: string;
    valueColor?: string;
  }[] = [
    {
      label: "Concepts Explored",
      value: `${overview.conceptsQuizzed}`,
      sub: `of ${overview.totalConcepts}`,
      icon: "target",
      tile: "blue",
    },
    {
      label: "At Mastery",
      value: `${masteredCount}`,
      sub: "80%+",
      icon: "check-circle",
      tile: "sage",
    },
    {
      label: "Average Score",
      value: overview.totalQuestions > 0 ? `${overview.avgScore}%` : "—",
      sub: null,
      icon: "sparkle",
      tile: "gold",
      valueColor: avgColor,
    },
    {
      label: "Quiz Sessions",
      value: `${overview.quizSessions}`,
      sub: null,
      icon: "list-checks",
      tile: "lilac",
    },
  ];

  return (
    <div
      className="dashboard-stats-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "var(--space-3)",
        marginBottom: "var(--space-6)",
      }}
    >
      {stats.map((s) => (
        <div
          key={s.label}
          style={{
            padding: "var(--space-4)",
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-2)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-3)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <IconTile icon={s.icon} color={s.tile} size="sm" />
            <span
              style={{
                fontSize: "var(--text-xs)",
                fontWeight: 600,
                color: "var(--color-text-3)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              {s.label}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-2)" }}>
            <span
              style={{
                fontSize: "var(--text-2xl)",
                fontWeight: 600,
                color: s.valueColor ?? "var(--color-text)",
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              {s.value}
            </span>
            {s.sub && (
              <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-3)" }}>
                {s.sub}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Mastery Ring Panel ──────────────────────────────────────────────────────

function MasteryPanel({
  masteredCount,
  touchedCount,
  total,
}: {
  masteredCount: number;
  touchedCount: number;
  total: number;
}) {
  const masteredPct = total > 0 ? masteredCount / total : 0;
  const touchedPct = total > 0 ? touchedCount / total : 0;
  const R = 54;
  const C = 2 * Math.PI * R;
  const masteredDash = C * masteredPct;
  const touchedDash = C * touchedPct;

  return (
    <div
      style={{
        padding: "var(--space-5)",
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-2)",
        display: "flex",
        alignItems: "center",
        gap: "var(--space-5)",
      }}
    >
      <svg width={132} height={132} viewBox="0 0 132 132" style={{ flexShrink: 0 }}>
        {/* Base ring */}
        <circle
          cx={66}
          cy={66}
          r={R}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={10}
        />
        {/* Touched arc (faint) */}
        <circle
          cx={66}
          cy={66}
          r={R}
          fill="none"
          stroke="var(--tile-sage-bg)"
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${touchedDash} ${C}`}
          transform="rotate(-90 66 66)"
          style={{ transition: "stroke-dasharray 400ms ease" }}
        />
        {/* Mastered arc (solid) */}
        <circle
          cx={66}
          cy={66}
          r={R}
          fill="none"
          stroke="var(--color-correct)"
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${masteredDash} ${C}`}
          transform="rotate(-90 66 66)"
          style={{ transition: "stroke-dasharray 400ms ease" }}
        />
        <text
          x={66}
          y={62}
          textAnchor="middle"
          fontSize={26}
          fontWeight={600}
          fill="var(--color-text)"
          style={{ letterSpacing: "-0.02em" }}
        >
          {masteredCount}
        </text>
        <text
          x={66}
          y={82}
          textAnchor="middle"
          fontSize={11}
          fill="var(--color-text-3)"
          style={{ letterSpacing: "0.04em", textTransform: "uppercase" }}
        >
          of {total}
        </text>
      </svg>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: "var(--text-xs)",
            fontWeight: 600,
            color: "var(--color-text-3)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            marginBottom: "var(--space-2)",
          }}
        >
          Mastery
        </div>
        <div
          style={{
            fontSize: "var(--text-md)",
            fontWeight: 600,
            color: "var(--color-text)",
            letterSpacing: "-0.01em",
            lineHeight: 1.3,
            marginBottom: "var(--space-2)",
          }}
        >
          {masteredCount === 0
            ? touchedCount === 0
              ? "Ready to start"
              : `${touchedCount} in progress`
            : `${Math.round(masteredPct * 100)}% at mastery`}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)", fontSize: "var(--text-xs)", color: "var(--color-text-2)" }}>
          <span>
            <span style={{ color: "var(--color-correct)", fontWeight: 600 }}>
              {masteredCount} mastered
            </span>{" "}
            (80%+)
          </span>
          <span>{touchedCount - masteredCount} in progress</span>
        </div>
      </div>
    </div>
  );
}

// ── Tier Bars ───────────────────────────────────────────────────────────────

function TierBars({
  tiers,
  conceptScores,
}: {
  tiers: TierInfo[];
  conceptScores: Record<string, ConceptScore>;
}) {
  const rows = tiers.map((tier) => {
    let total = 0;
    let mastered = 0;
    let touched = 0;
    for (const sec of tier.sections) {
      for (const c of sec.concepts) {
        total++;
        const s = conceptScores[c.id];
        if (s) {
          touched++;
          if (s.pct >= 80) mastered++;
        }
      }
    }
    const visual = TIER_VISUAL[tier.slug] ?? { color: "stone", label: tier.name };
    const pct = total > 0 ? mastered / total : 0;
    return { tier, total, mastered, touched, visual, pct };
  });

  return (
    <div
      style={{
        padding: "var(--space-5)",
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-2)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-4)",
      }}
    >
      <div
        style={{
          fontSize: "var(--text-xs)",
          fontWeight: 600,
          color: "var(--color-text-3)",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        Progress by Tier
      </div>
      {rows.map(({ tier, total, mastered, touched, visual, pct }) => {
        const touchedPct = total > 0 ? touched / total : 0;
        return (
          <div key={tier.id} style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: `var(--tile-${visual.color}-fg)` }}>
                {visual.label}
              </span>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-3)" }}>
                <span style={{ color: "var(--color-text-2)", fontWeight: 600 }}>
                  {mastered}/{total}
                </span>
                <span style={{ marginLeft: "var(--space-1)" }}>mastered</span>
                <span style={{ marginLeft: "var(--space-2)", opacity: 0.75 }}>· {touched} touched</span>
              </div>
            </div>
            <div
              style={{
                position: "relative",
                height: 8,
                borderRadius: 999,
                backgroundColor: "var(--color-surface-2)",
                overflow: "hidden",
              }}
            >
              {/* Touched layer (faint) */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: 0,
                  width: `${touchedPct * 100}%`,
                  backgroundColor: `var(--tile-${visual.color}-bg)`,
                  borderRadius: 999,
                  transition: "width 400ms ease",
                }}
              />
              {/* Mastered layer (solid) */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: 0,
                  width: `${pct * 100}%`,
                  backgroundColor: `var(--tile-${visual.color}-fg)`,
                  borderRadius: 999,
                  transition: "width 400ms ease",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Activity Pulse ──────────────────────────────────────────────────────────

function ActivityPulse({ activity }: { activity: ActivityBucket[] }) {
  const activeDays = activity.filter((a) => a.total > 0).length;
  const totalAttempts = activity.reduce((s, a) => s + a.total, 0);

  // Current streak: consecutive active days ending at the last bucket (today).
  // If today has no activity yet, streak breaks at 0.
  let currentStreak = 0;
  for (let i = activity.length - 1; i >= 0; i--) {
    if (activity[i].total > 0) currentStreak++;
    else break;
  }

  // Longest streak in the window.
  let longestStreak = 0;
  let run = 0;
  for (const a of activity) {
    if (a.total > 0) {
      run++;
      if (run > longestStreak) longestStreak = run;
    } else {
      run = 0;
    }
  }

  function intensityLevel(total: number): 0 | 1 | 2 | 3 {
    if (total === 0) return 0;
    if (total <= 2) return 1;
    if (total <= 7) return 2;
    return 3;
  }
  const LEVEL_BG: Record<0 | 1 | 2 | 3, string> = {
    0: "var(--color-surface-2)",
    1: "var(--tile-sage-bg)",
    2: "var(--tile-sage-fg)",
    3: "var(--color-correct)",
  };
  const LEVEL_OPACITY: Record<0 | 1 | 2 | 3, number> = {
    0: 1,
    1: 1,
    2: 0.7,
    3: 1,
  };

  // Month labels: "Mar" above the first day of each new month in the window.
  const monthTicks: { index: number; label: string }[] = [];
  let lastMonth = -1;
  activity.forEach((a, i) => {
    const m = new Date(a.date).getMonth();
    if (m !== lastMonth) {
      monthTicks.push({ index: i, label: new Date(a.date).toLocaleDateString("en-US", { month: "short" }) });
      lastMonth = m;
    }
  });

  return (
    <div
      style={{
        padding: "var(--space-5)",
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-2)",
        marginBottom: "var(--space-6)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: "var(--space-4)",
          gap: "var(--space-4)",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "var(--text-xs)",
              fontWeight: 600,
              color: "var(--color-text-3)",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              marginBottom: "var(--space-1)",
            }}
          >
            Study activity
          </div>
          <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-2)" }}>
            {activeDays === 0
              ? "No activity in the last 30 days"
              : `You studied ${activeDays} of the last 30 days`}
          </div>
        </div>
        <div style={{ display: "flex", gap: "var(--space-5)" }}>
          <StreakStat
            label="Current streak"
            value={currentStreak}
            emphasis={currentStreak > 0}
          />
          <StreakStat
            label="Longest streak"
            value={longestStreak}
            emphasis={false}
          />
          <StreakStat
            label="Total attempts"
            value={totalAttempts}
            emphasis={false}
          />
        </div>
      </div>

      {/* Month tick row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(30, 1fr)",
          gap: "var(--space-1)",
          marginBottom: "var(--space-1)",
          height: 14,
          position: "relative",
        }}
      >
        {monthTicks.slice(1).map((t) => (
          <span
            key={t.index}
            style={{
              gridColumn: `${t.index + 1} / span 2`,
              fontSize: "var(--text-xs)",
              color: "var(--color-text-3)",
              letterSpacing: "0.03em",
            }}
          >
            {t.label}
          </span>
        ))}
      </div>

      {/* Day cells */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(30, 1fr)",
          gap: "var(--space-1)",
        }}
      >
        {activity.map((a) => {
          const level = intensityLevel(a.total);
          const d = new Date(a.date);
          const dateLabel = d.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          });
          const tooltip =
            a.total === 0
              ? `${dateLabel} — no activity`
              : `${dateLabel} — ${a.total} ${a.total === 1 ? "question" : "questions"} answered`;
          return (
            <div
              key={a.date}
              title={tooltip}
              style={{
                aspectRatio: "1 / 1",
                borderRadius: "var(--radius-1)",
                backgroundColor: LEVEL_BG[level],
                opacity: LEVEL_OPACITY[level],
                border: level === 0 ? "1px solid var(--color-border)" : "none",
                transition: "transform 120ms ease",
                cursor: "default",
              }}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: "var(--space-2)",
          marginTop: "var(--space-3)",
          fontSize: "var(--text-xs)",
          color: "var(--color-text-3)",
        }}
      >
        <span>Less</span>
        {[0, 1, 2, 3].map((lv) => (
          <span
            key={lv}
            style={{
              width: 12,
              height: 12,
              borderRadius: "var(--radius-1)",
              backgroundColor: LEVEL_BG[lv as 0 | 1 | 2 | 3],
              opacity: LEVEL_OPACITY[lv as 0 | 1 | 2 | 3],
              border: lv === 0 ? "1px solid var(--color-border)" : "none",
            }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

function StreakStat({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: number;
  emphasis: boolean;
}) {
  return (
    <div style={{ textAlign: "right" }}>
      <div
        style={{
          fontSize: "var(--text-xs)",
          fontWeight: 600,
          color: "var(--color-text-3)",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "var(--text-md)",
          fontWeight: 600,
          color: emphasis ? "var(--color-correct)" : "var(--color-text)",
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ── Knowledge Map v2 ────────────────────────────────────────────────────────

function KnowledgeMap({
  tiers,
  conceptScores,
}: {
  tiers: TierInfo[];
  conceptScores: Record<string, ConceptScore>;
}) {
  const [tooltip, setTooltip] = useState<{
    text: string;
    sub: string;
    color: string;
    x: number;
    y: number;
  } | null>(null);

  return (
    <div style={{ marginBottom: "var(--space-6)" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "var(--space-1)" }}>
        <h2
          style={{
            margin: 0,
            fontSize: "var(--text-md)",
            fontWeight: 600,
            color: "var(--color-text)",
            letterSpacing: "-0.01em",
          }}
        >
          Knowledge Map
        </h2>
        <Legend />
      </div>
      <p
        style={{
          margin: "0 0 16px",
          fontSize: "var(--text-sm)",
          color: "var(--color-text-3)",
        }}
      >
        Each dot is a concept. Hover for name, click to open.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", position: "relative" }}>
        {tiers.map((tier) => {
          const visual = TIER_VISUAL[tier.slug] ?? { color: "stone", label: tier.name };
          return (
            <div
              key={tier.id}
              style={{
                padding: "var(--space-4)",
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-2)",
              }}
            >
              <div style={{ marginBottom: "var(--space-3)" }}>
                <span
                  style={{
                    fontSize: "var(--text-xs)",
                    fontWeight: 700,
                    color: `var(--tile-${visual.color}-fg)`,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  {visual.label}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                {tier.sections.map((section) => {
                  const total = section.concepts.length;
                  let mastered = 0;
                  let touched = 0;
                  for (const c of section.concepts) {
                    const s = conceptScores[c.id];
                    if (s) {
                      touched++;
                      if (s.pct >= 80) mastered++;
                    }
                  }
                  const sectionPct = total > 0 ? Math.round((mastered / total) * 100) : 0;

                  return (
                    <div
                      key={section.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0, 180px) minmax(0, 1fr) 72px",
                        alignItems: "center",
                        gap: "var(--space-4)",
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: "var(--text-sm)",
                            fontWeight: 600,
                            color: "var(--color-text)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {section.name}
                        </div>
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-3)", marginTop: 1 }}>
                          {touched}/{total} touched
                        </div>
                      </div>

                      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
                        {section.concepts.map((concept) => {
                          const score = conceptScores[concept.id] ?? null;
                          let bg = "var(--color-surface-2)";
                          let border = "var(--color-border)";

                          if (score) {
                            bg = getMasteryBg(score.pct);
                            if (score.pct >= 80) border = "var(--color-correct-border)";
                            else if (score.pct >= 50) border = "rgba(232, 181, 74, 0.35)";
                            else border = "var(--color-incorrect-border)";
                          }

                          return (
                            <Link
                              key={concept.id}
                              href={`/concepts/${concept.slug}`}
                              style={{
                                width: 18,
                                height: 18,
                                borderRadius: "var(--radius-1)",
                                backgroundColor: bg,
                                border: `1px solid ${border}`,
                                cursor: "pointer",
                                transition: "transform 0.1s",
                                display: "block",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "scale(1.25)";
                                e.currentTarget.style.zIndex = "10";
                                const rect = e.currentTarget.getBoundingClientRect();
                                setTooltip({
                                  text: concept.name,
                                  sub: score
                                    ? `${score.pct}% — ${score.correct}/${score.total} correct`
                                    : "Not attempted",
                                  color: score ? getMasteryColor(score.pct) : "var(--color-text-3)",
                                  x: rect.left + rect.width / 2,
                                  y: rect.top - 8,
                                });
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "scale(1)";
                                e.currentTarget.style.zIndex = "0";
                                setTooltip(null);
                              }}
                            />
                          );
                        })}
                      </div>

                      <div
                        style={{
                          fontSize: "var(--text-xs)",
                          fontWeight: 600,
                          color: sectionPct >= 80
                            ? "var(--color-correct)"
                            : sectionPct >= 50
                              ? "var(--color-gold)"
                              : "var(--color-text-3)",
                          textAlign: "right",
                        }}
                      >
                        {sectionPct}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {tooltip && (
          <div
            style={{
              position: "fixed",
              left: tooltip.x,
              top: tooltip.y,
              transform: "translate(-50%, -100%)",
              padding: "8px 12px",
              backgroundColor: "var(--color-surface-3)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-1)",
              pointerEvents: "none",
              zIndex: 100,
              whiteSpace: "nowrap",
              boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
            }}
          >
            <div style={{ fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--color-text)", marginBottom: "var(--space-1)" }}>
              {tooltip.text}
            </div>
            <div style={{ fontSize: "var(--text-xs)", color: tooltip.color }}>{tooltip.sub}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function Legend() {
  const items = [
    { label: "New", color: "var(--color-text-3)" },
    { label: "<50%", color: "var(--color-incorrect)" },
    { label: "50–79%", color: "var(--color-gold)" },
    { label: "80%+", color: "var(--color-correct)" },
  ];
  return (
    <div style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap" }}>
      {items.map((it) => (
        <span key={it.label} style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: it.color }}>
          {it.label}
        </span>
      ))}
    </div>
  );
}

// ── Suggested Review ────────────────────────────────────────────────────────

function SuggestedReview({
  tiers,
  conceptScores,
}: {
  tiers: TierInfo[];
  conceptScores: Record<string, ConceptScore>;
}) {
  const allConcepts: {
    concept: ConceptInfo;
    tierSlug: string;
    sectionName: string;
    score: ConceptScore | null;
  }[] = [];

  for (const tier of tiers) {
    for (const section of tier.sections) {
      for (const concept of section.concepts) {
        allConcepts.push({
          concept,
          tierSlug: tier.slug,
          sectionName: section.name,
          score: conceptScores[concept.id] ?? null,
        });
      }
    }
  }

  const weakItems = allConcepts
    .filter((item) => {
      if (!item.score) {
        const siblings = allConcepts.filter(
          (c) => c.sectionName === item.sectionName && c.score !== null,
        );
        return siblings.length > 0;
      }
      return item.score.pct < 80;
    })
    .sort((a, b) => {
      const scoreA = a.score?.pct ?? -1;
      const scoreB = b.score?.pct ?? -1;
      return scoreA - scoreB;
    })
    .slice(0, 8);

  if (weakItems.length === 0 && Object.keys(conceptScores).length === 0) {
    return (
      <div
        style={{
          padding: "32px 24px",
          textAlign: "center",
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-2)",
        }}
      >
        <div style={{ fontSize: "var(--text-md)", fontWeight: 500, color: "var(--color-text)", marginBottom: "var(--space-2)" }}>
          No quiz data yet
        </div>
        <p
          style={{
            margin: "0 0 20px",
            fontSize: "var(--text-sm)",
            color: "var(--color-text-3)",
            lineHeight: 1.6,
          }}
        >
          Take your first quiz to start tracking progress.
        </p>
        <Link
          href="/quiz"
          style={{
            display: "inline-block",
            padding: "10px 24px",
            fontSize: "var(--text-sm)",
            fontWeight: 500,
            color: "#fff",
            backgroundColor: "var(--color-accent)",
            borderRadius: "var(--radius-1)",
            textDecoration: "none",
          }}
        >
          Start a Quiz
        </Link>
      </div>
    );
  }

  if (weakItems.length === 0) {
    return (
      <div
        style={{
          padding: "var(--space-5)",
          textAlign: "center",
          backgroundColor: "var(--color-correct-dim)",
          border: "1px solid var(--color-correct-border)",
          borderRadius: "var(--radius-2)",
        }}
      >
        <div style={{ fontSize: "var(--text-md)", fontWeight: 500, color: "var(--color-correct)", marginBottom: "var(--space-1)" }}>
          All concepts at 80%+
        </div>
        <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-2)" }}>
          You&apos;re mastering the Atlas. Keep it up!
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2
        style={{
          margin: "0 0 6px",
          fontSize: "var(--text-md)",
          fontWeight: 600,
          color: "var(--color-text)",
          letterSpacing: "-0.01em",
        }}
      >
        Suggested Review
      </h2>
      <p style={{ margin: "0 0 16px", fontSize: "var(--text-sm)", color: "var(--color-text-3)" }}>
        Concepts that need more attention, sorted by score.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        {weakItems.map((item) => {
          return (
            <div
              key={item.concept.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-3)",
                padding: "12px 16px",
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-2)",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "var(--radius-2)",
                  backgroundColor: item.score
                    ? getMasteryBg(item.score.pct)
                    : "var(--color-surface-2)",
                  border: `1px solid ${
                    item.score
                      ? item.score.pct >= 50
                        ? "rgba(232, 181, 74, 0.35)"
                        : "var(--color-incorrect-border)"
                      : "var(--color-border)"
                  }`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontSize: "var(--text-xs)",
                    fontWeight: 700,
                    color: item.score
                      ? getMasteryColor(item.score.pct)
                      : "var(--color-text-3)",
                  }}
                >
                  {item.score ? `${item.score.pct}%` : "—"}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "var(--text-sm)",
                    fontWeight: 600,
                    color: "var(--color-text)",
                    marginBottom: "var(--space-1)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.concept.name}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-2)",
                    fontSize: "var(--text-xs)",
                    color: "var(--color-text-3)",
                  }}
                >
                  {item.sectionName}
                  {item.score && (
                    <>
                      <span>·</span>
                      <span>
                        {item.score.correct}/{item.score.total} correct
                      </span>
                    </>
                  )}
                </div>
              </div>
              <Link
                href={`/quiz?mode=concept&id=${item.concept.id}`}
                style={{
                  padding: "6px 14px",
                  fontSize: "var(--text-xs)",
                  fontWeight: 500,
                  color: "var(--color-accent-on-soft)",
                  backgroundColor: "var(--color-accent-soft)",
                  borderRadius: "var(--radius-1)",
                  textDecoration: "none",
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                }}
              >
                Quiz now
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Next Best Action ────────────────────────────────────────────────────────

type NextAction =
  | { kind: "deadline-assessment"; item: PendingAssessment; daysLeft: number | null }
  | { kind: "deadline-homework"; item: HomeworkItem; daysLeft: number | null }
  | {
      kind: "review";
      concept: ConceptInfo;
      score: ConceptScore;
      sectionName: string;
      tierSlug: string;
    }
  | {
      kind: "start";
      concept: ConceptInfo;
      sectionName: string;
      tierSlug: string;
      continueSection: boolean;
    }
  | { kind: "welcome" };

function computeNextAction(
  assessments: PendingAssessment[],
  homework: HomeworkItem[],
  tiers: TierInfo[],
  conceptScores: Record<string, ConceptScore>,
): NextAction {
  const now = Date.now();

  // 1. Deadlines — earliest due wins (open only).
  type Dl =
    | { kind: "deadline-assessment"; item: PendingAssessment; days: number | null }
    | { kind: "deadline-homework"; item: HomeworkItem; days: number | null };
  const deadlines: Dl[] = [];
  for (const a of assessments) {
    if (a.completed) continue;
    const days = a.dueDate
      ? Math.ceil((new Date(a.dueDate).getTime() - now) / 86400000)
      : null;
    deadlines.push({ kind: "deadline-assessment", item: a, days });
  }
  for (const h of homework) {
    if (h.submitted) continue;
    const days = h.dueDate
      ? Math.ceil((new Date(h.dueDate).getTime() - now) / 86400000)
      : null;
    deadlines.push({ kind: "deadline-homework", item: h, days });
  }
  deadlines.sort((a, b) => (a.days ?? 9999) - (b.days ?? 9999));
  const nearest = deadlines[0];
  if (nearest) {
    if (nearest.kind === "deadline-assessment") {
      return { kind: "deadline-assessment", item: nearest.item, daysLeft: nearest.days };
    }
    return { kind: "deadline-homework", item: nearest.item, daysLeft: nearest.days };
  }

  // 2. Weakest concept at <50% (if any activity).
  type Flat = {
    concept: ConceptInfo;
    sectionName: string;
    tierSlug: string;
    score: ConceptScore | null;
  };
  const flat: Flat[] = [];
  for (const tier of tiers) {
    for (const sec of tier.sections) {
      for (const c of sec.concepts) {
        flat.push({
          concept: c,
          sectionName: sec.name,
          tierSlug: tier.slug,
          score: conceptScores[c.id] ?? null,
        });
      }
    }
  }
  const weak = flat
    .filter((f): f is Flat & { score: ConceptScore } => f.score !== null && f.score.pct < 50)
    .sort((a, b) => a.score.pct - b.score.pct)[0];
  if (weak) {
    return {
      kind: "review",
      concept: weak.concept,
      score: weak.score,
      sectionName: weak.sectionName,
      tierSlug: weak.tierSlug,
    };
  }

  // 3. Untouched concept inside a section the user has already touched.
  const touchedSections = new Set(
    flat.filter((f) => f.score !== null).map((f) => f.sectionName),
  );
  const continueNext = flat.find(
    (f) => f.score === null && touchedSections.has(f.sectionName),
  );
  if (continueNext) {
    return {
      kind: "start",
      concept: continueNext.concept,
      sectionName: continueNext.sectionName,
      tierSlug: continueNext.tierSlug,
      continueSection: true,
    };
  }

  // 4. Fresh start — first untouched overall.
  const firstUntouched = flat.find((f) => f.score === null);
  if (firstUntouched) {
    return {
      kind: "start",
      concept: firstUntouched.concept,
      sectionName: firstUntouched.sectionName,
      tierSlug: firstUntouched.tierSlug,
      continueSection: false,
    };
  }

  return { kind: "welcome" };
}

function NextBestActionCard({ action }: { action: NextAction }) {
  let icon: IconName;
  let tile: string;
  let eyebrow: string;
  let title: string;
  let subtitle: string;
  let href: string;
  let cta: string;

  if (action.kind === "deadline-assessment") {
    const d = action.daysLeft;
    const dueLabel =
      d === null
        ? "no deadline"
        : d <= 0
          ? "due today"
          : d === 1
            ? "due tomorrow"
            : `due in ${d} days`;
    icon = "clipboard-check";
    tile = "honey";
    eyebrow = "Do this next";
    title = action.item.title;
    subtitle = `Assessment · ${action.item.questionCount} questions · ${dueLabel}`;
    href = `/assessment/${action.item.id}`;
    cta = "Start";
  } else if (action.kind === "deadline-homework") {
    const d = action.daysLeft;
    const dueLabel =
      d === null
        ? "no deadline"
        : d <= 0
          ? "due today"
          : d === 1
            ? "due tomorrow"
            : `due in ${d} days`;
    icon = "file-text";
    tile = "sage";
    eyebrow = "Do this next";
    title = action.item.title;
    const bits: string[] = ["Homework"];
    if (action.item.conceptName) bits.push(action.item.conceptName);
    bits.push(dueLabel);
    subtitle = bits.join(" · ");
    href = `/homework/${action.item.id}`;
    cta = "Open";
  } else if (action.kind === "review") {
    icon = "target";
    tile = "rose";
    eyebrow = "Brush up on";
    title = action.concept.name;
    subtitle = `${action.sectionName} · ${action.score.pct}% — ${action.score.correct}/${action.score.total} correct`;
    href = `/quiz?mode=concept&id=${action.concept.id}`;
    cta = "Quiz now";
  } else if (action.kind === "start") {
    icon = action.continueSection ? "arrow-left" : "sparkle";
    tile = "lilac";
    eyebrow = action.continueSection ? "Continue where you left off" : "Try next";
    title = action.concept.name;
    subtitle = `${action.sectionName} · new concept`;
    href = `/concepts/${action.concept.slug}`;
    cta = "Open";
  } else {
    icon = "sparkle";
    tile = "indigo";
    eyebrow = "Get started";
    title = "Take your first quiz";
    subtitle = "Answer a few questions to start tracking mastery.";
    href = "/quiz";
    cta = "Start";
  }

  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-4)",
        padding: "16px 18px",
        marginBottom: "var(--space-5)",
        borderRadius: "var(--radius-3)",
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        textDecoration: "none",
        color: "inherit",
        transition: "border-color 140ms ease, transform 140ms ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--color-accent)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--color-border)";
      }}
    >
      <IconTile icon={icon} color={tile} size="md" />
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
          {eyebrow}
        </div>
        <div
          style={{
            fontSize: "var(--text-md)",
            fontWeight: 600,
            color: "var(--color-text)",
            letterSpacing: "-0.01em",
            lineHeight: 1.25,
            marginBottom: 3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--color-text-2)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {subtitle}
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
          flexShrink: 0,
        }}
      >
        {cta}
        <Icon name="chevron-right" size={14} />
      </span>
    </Link>
  );
}
