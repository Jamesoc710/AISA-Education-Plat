"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { IconTile } from "@/components/ui/icon-tile";

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

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", padding: "56px 40px 80px" }}>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section style={{ marginBottom: 36, display: "flex", alignItems: "center", gap: 20 }}>
        <IconTile icon="chart-line-up" color="indigo" size="lg" />
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--color-text-3)",
              marginBottom: 4,
            }}
          >
            Dashboard
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 30,
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
              fontSize: 14,
              color: "var(--color-text-2)",
            }}
          >
            {overview.conceptsQuizzed} of {overview.totalConcepts} concepts touched ·
            {" "}{masteredCount} at mastery ·
            {" "}{overview.totalQuestions} questions answered
          </p>
        </div>
      </section>

      {/* ── Upcoming strip (collapsed by default) ───────────────────── */}
      {(pendingAssessments.length > 0 || homeworkItems.length > 0) && (
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
          gap: 16,
          marginBottom: 28,
        }}
      >
        <MasteryPanel masteredCount={masteredCount} total={overview.totalConcepts} />
        <TierBars tiers={tiers} conceptScores={conceptScores} />
      </div>

      {/* ── Activity pulse ──────────────────────────────────────────── */}
      <ActivityPulse activity={activity} />

      {/* ── Knowledge map v2 ────────────────────────────────────────── */}
      <KnowledgeMap tiers={tiers} conceptScores={conceptScores} />

      {/* ── Suggested review ────────────────────────────────────────── */}
      <SuggestedReview tiers={tiers} conceptScores={conceptScores} />
    </div>
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
  const pendingCount =
    assessments.filter((a) => !a.completed).length +
    homework.filter((h) => !h.submitted).length;

  const summaryBits: string[] = [];
  if (assessments.length > 0) {
    summaryBits.push(
      `${assessments.length} ${assessments.length === 1 ? "assessment" : "assessments"}`,
    );
  }
  if (homework.length > 0) {
    summaryBits.push(
      `${homework.length} ${homework.length === 1 ? "homework item" : "homework items"}`,
    );
  }

  return (
    <div style={{ marginBottom: 28 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: "12px 16px",
          borderRadius: 10,
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
        <span style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              borderRadius: 7,
              backgroundColor: "var(--tile-indigo-bg)",
              color: "var(--tile-indigo-fg)",
            }}
          >
            <Icon name="clipboard-check" size={15} />
          </span>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--color-text)" }}>
            Upcoming
          </span>
          <span style={{ fontSize: 12.5, color: "var(--color-text-3)" }}>
            {summaryBits.join(" · ")}
          </span>
          {pendingCount > 0 && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 999,
                backgroundColor: "var(--color-accent-soft)",
                color: "var(--color-accent-on-soft)",
                marginLeft: 4,
              }}
            >
              {pendingCount} open
            </span>
          )}
        </span>
        <span
          aria-hidden
          style={{
            display: "inline-flex",
            transform: open ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 140ms ease",
            color: "var(--color-text-3)",
          }}
        >
          <Icon name="chevron-right" size={14} />
        </span>
      </button>

      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
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
        gap: 12,
        padding: "12px 16px",
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <IconTile icon="clipboard-check" color="honey" size="sm" />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--color-text)" }}>
            {a.title}
          </div>
          <div
            style={{
              fontSize: 11.5,
              color: "var(--color-text-3)",
              marginTop: 2,
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <span>{a.questionCount} questions</span>
            {a.timeLimit !== null && <span>· {a.timeLimit} min</span>}
            {due && <span>· Due {due}</span>}
          </div>
        </div>
      </div>
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 8 }}>
        {a.completed ? (
          <>
            {a.score !== null && (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: scoreColor,
                  backgroundColor: scoreBg,
                  padding: "4px 10px",
                  borderRadius: 6,
                }}
              >
                {a.score}%
              </span>
            )}
            <span style={{ fontSize: 12, color: "var(--color-text-3)" }}>Completed</span>
          </>
        ) : (
          <Link
            href={`/assessment/${a.id}`}
            style={{
              backgroundColor: "var(--color-accent)",
              color: "#fff",
              fontSize: 12,
              fontWeight: 500,
              borderRadius: 6,
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
        gap: 12,
        padding: "12px 16px",
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <IconTile icon="file-text" color="sage" size="sm" />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--color-text)" }}>
            {h.title}
          </div>
          <div
            style={{
              fontSize: 11.5,
              color: "var(--color-text-3)",
              marginTop: 2,
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            {h.conceptName && <span>{h.conceptName}</span>}
            {due && <span>{h.conceptName ? "· " : ""}Due {due}</span>}
          </div>
        </div>
      </div>
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 8 }}>
        {!h.submitted ? (
          <Link
            href={`/homework/${h.id}`}
            style={{
              border: "1px solid var(--color-accent)",
              color: "var(--color-accent)",
              backgroundColor: "transparent",
              fontSize: 12,
              fontWeight: 500,
              borderRadius: 6,
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
                fontSize: 12,
                fontWeight: 600,
                color: "#fff",
                backgroundColor: "var(--color-correct)",
                padding: "4px 10px",
                borderRadius: 6,
              }}
            >
              {h.grade}
            </span>
            <span style={{ fontSize: 12, color: "var(--color-text-3)" }}>Graded</span>
          </>
        ) : (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: "var(--color-text-3)" }}>Submitted</div>
            <div style={{ fontSize: 11, color: "var(--color-text-3)" }}>Awaiting review</div>
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
        gap: 10,
        marginBottom: 28,
      }}
    >
      {stats.map((s) => (
        <div
          key={s.label}
          style={{
            padding: 16,
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 10,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <IconTile icon={s.icon} color={s.tile} size="sm" />
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--color-text-3)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              {s.label}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span
              style={{
                fontSize: 28,
                fontWeight: 600,
                color: s.valueColor ?? "var(--color-text)",
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              {s.value}
            </span>
            {s.sub && (
              <span style={{ fontSize: 12.5, color: "var(--color-text-3)" }}>
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

function MasteryPanel({ masteredCount, total }: { masteredCount: number; total: number }) {
  const pct = total > 0 ? masteredCount / total : 0;
  const R = 54;
  const C = 2 * Math.PI * R;
  const dash = C * pct;

  return (
    <div
      style={{
        padding: 20,
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        gap: 20,
      }}
    >
      <svg width={132} height={132} viewBox="0 0 132 132" style={{ flexShrink: 0 }}>
        <circle
          cx={66}
          cy={66}
          r={R}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={10}
        />
        <circle
          cx={66}
          cy={66}
          r={R}
          fill="none"
          stroke="var(--color-correct)"
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${C}`}
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
            fontSize: 11,
            fontWeight: 600,
            color: "var(--color-text-3)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          Mastery
        </div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "var(--color-text)",
            letterSpacing: "-0.01em",
            lineHeight: 1.3,
            marginBottom: 4,
          }}
        >
          {Math.round(pct * 100)}% at 80%+
        </div>
        <div style={{ fontSize: 12.5, color: "var(--color-text-2)", lineHeight: 1.5 }}>
          Concepts you&apos;ve scored 80% or higher on at least once.
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
        padding: 20,
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 10,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "var(--color-text-3)",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        Progress by Tier
      </div>
      {rows.map(({ tier, total, mastered, touched, visual, pct }) => (
        <div key={tier.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  backgroundColor: `var(--tile-${visual.color}-fg)`,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>
                {visual.label}
              </span>
            </div>
            <div style={{ fontSize: 12, color: "var(--color-text-3)" }}>
              {mastered}/{total} mastered
              <span style={{ marginLeft: 6, color: "var(--color-text-3)", opacity: 0.7 }}>
                · {touched} touched
              </span>
            </div>
          </div>
          <div
            style={{
              position: "relative",
              height: 8,
              borderRadius: 999,
              backgroundColor: `var(--tile-${visual.color}-bg)`,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                width: `${pct * 100}%`,
                backgroundColor: `var(--tile-${visual.color}-fg)`,
                borderRadius: 999,
                transition: "width 400ms ease",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Activity Pulse ──────────────────────────────────────────────────────────

function ActivityPulse({ activity }: { activity: ActivityBucket[] }) {
  const maxTotal = Math.max(1, ...activity.map((a) => a.total));
  const activeDays = activity.filter((a) => a.total > 0).length;
  const totalAttempts = activity.reduce((s, a) => s + a.total, 0);

  return (
    <div
      style={{
        padding: 20,
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 10,
        marginBottom: 28,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--color-text-3)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          Last 30 days
        </div>
        <div style={{ fontSize: 12, color: "var(--color-text-3)" }}>
          {activeDays} active days · {totalAttempts} attempts
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(30, 1fr)",
          gap: 4,
          alignItems: "end",
        }}
      >
        {activity.map((a) => {
          const intensity = maxTotal > 0 ? a.total / maxTotal : 0;
          const height = a.total === 0 ? 6 : Math.max(8, Math.round(6 + intensity * 28));
          const pct = a.total > 0 ? (a.correct / a.total) * 100 : -1;
          const bg =
            a.total === 0
              ? "var(--color-surface-2)"
              : pct >= 80
                ? "var(--color-correct)"
                : pct >= 50
                  ? "var(--color-gold)"
                  : "var(--color-incorrect)";
          const border =
            a.total === 0 ? "1px solid var(--color-border)" : "none";
          const d = new Date(a.date);
          const tooltip =
            a.total === 0
              ? `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} — no activity`
              : `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} — ${a.correct}/${a.total} correct`;
          return (
            <div
              key={a.date}
              title={tooltip}
              style={{
                height,
                borderRadius: 3,
                backgroundColor: bg,
                border,
                transition: "height 200ms ease",
              }}
            />
          );
        })}
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
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
        <h2
          style={{
            margin: 0,
            fontSize: 16,
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
          fontSize: 13,
          color: "var(--color-text-3)",
        }}
      >
        Each dot is a concept. Hover for name, click to open.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, position: "relative" }}>
        {tiers.map((tier) => {
          const visual = TIER_VISUAL[tier.slug] ?? { color: "stone", label: tier.name };
          return (
            <div
              key={tier.id}
              style={{
                padding: 14,
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: 10,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    backgroundColor: `var(--tile-${visual.color}-fg)`,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: `var(--tile-${visual.color}-fg)`,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  {visual.label}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
                        gap: 14,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: "var(--color-text)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {section.name}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--color-text-3)", marginTop: 1 }}>
                          {touched}/{total} touched
                        </div>
                      </div>

                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
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
                                borderRadius: 4,
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
                          fontSize: 12,
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
              borderRadius: 6,
              pointerEvents: "none",
              zIndex: 100,
              whiteSpace: "nowrap",
              boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text)", marginBottom: 2 }}>
              {tooltip.text}
            </div>
            <div style={{ fontSize: 11, color: tooltip.color }}>{tooltip.sub}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function Legend() {
  const items = [
    { label: "New", bg: "var(--color-surface-2)", border: "var(--color-border)" },
    { label: "<50%", bg: "var(--color-incorrect-dim)", border: "var(--color-incorrect-border)" },
    { label: "50–79%", bg: "var(--color-gold-dim)", border: "rgba(232, 181, 74, 0.35)" },
    { label: "80%+", bg: "var(--color-correct-dim)", border: "var(--color-correct-border)" },
  ];
  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      {items.map((it) => (
        <div key={it.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 3,
              backgroundColor: it.bg,
              border: `1px solid ${it.border}`,
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 11, color: "var(--color-text-3)" }}>{it.label}</span>
        </div>
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
          borderRadius: 10,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 500, color: "var(--color-text)", marginBottom: 8 }}>
          No quiz data yet
        </div>
        <p
          style={{
            margin: "0 0 20px",
            fontSize: 13,
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
            fontSize: 13,
            fontWeight: 500,
            color: "#fff",
            backgroundColor: "var(--color-accent)",
            borderRadius: 6,
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
          padding: 24,
          textAlign: "center",
          backgroundColor: "var(--color-correct-dim)",
          border: "1px solid var(--color-correct-border)",
          borderRadius: 10,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 500, color: "var(--color-correct)", marginBottom: 4 }}>
          All concepts at 80%+
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-2)" }}>
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
          fontSize: 16,
          fontWeight: 600,
          color: "var(--color-text)",
          letterSpacing: "-0.01em",
        }}
      >
        Suggested Review
      </h2>
      <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--color-text-3)" }}>
        Concepts that need more attention, sorted by score.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {weakItems.map((item) => {
          const visual = TIER_VISUAL[item.tierSlug] ?? { color: "stone", label: item.tierSlug };
          return (
            <div
              key={item.concept.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
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
                    fontSize: 12,
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
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: "var(--color-text)",
                    marginBottom: 2,
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
                    gap: 6,
                    fontSize: 11.5,
                    color: "var(--color-text-3)",
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 999,
                      backgroundColor: `var(--tile-${visual.color}-fg)`,
                      flexShrink: 0,
                    }}
                  />
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
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--color-accent-on-soft)",
                  backgroundColor: "var(--color-accent-soft)",
                  borderRadius: 6,
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
