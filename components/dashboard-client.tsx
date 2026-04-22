"use client";

import { useMemo } from "react";
import Link from "next/link";

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
  id: string;
  title: string;
  description: string | null;
  timeLimit: number | null;
  dueDate: string | null;
  questionCount: number;
  completed: boolean;
  score: number | null;
};
type HomeworkItem = {
  id: string;
  title: string;
  dueDate: string | null;
  conceptName: string | null;
  submitted: boolean;
  submittedAt: string | null;
  grade: string | null;
};
type ActivityBucket = { date: string; total: number; correct: number };

// ── Constants ─────────────────────────────────────────────────────────────────

const TIER_LABEL: Record<string, string> = {
  fundamentals: "Fundamentals",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getMasteryColor(pct: number): string {
  if (pct >= 80) return "var(--color-correct)";
  if (pct >= 50) return "var(--color-gold)";
  return "var(--color-incorrect)";
}

function formatDue(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function daysUntil(iso: string | null, nowMs: number): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - nowMs) / 86400000);
}

function dueLabel(days: number | null): string {
  if (days === null) return "no deadline";
  if (days <= 0) return "due today";
  if (days === 1) return "due tomorrow";
  return `due in ${days} days`;
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

  const masteredCount = useMemo(
    () => Object.values(conceptScores).filter((s) => s.pct >= 80).length,
    [conceptScores],
  );
  const touchedCount = overview.conceptsQuizzed;

  const weakItems = useMemo(
    () => computeWeakItems(tiers, conceptScores, 6),
    [tiers, conceptScores],
  );

  const openAssessments = pendingAssessments.filter((a) => !a.completed);
  const openHomework = homeworkItems.filter((h) => !h.submitted);
  const hasUpcoming = openAssessments.length + openHomework.length > 0;

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
          Your progress{firstName ? `, ${firstName}.` : "."}
        </h1>
        <p
          style={{
            margin: "20px 0 0",
            fontSize: 17,
            lineHeight: 1.5,
            color: "var(--color-text-2)",
            maxWidth: 640,
          }}
        >
          {buildHeroSummary(
            touchedCount,
            overview.totalConcepts,
            masteredCount,
            overview.totalQuestions,
          )}
        </p>

        <HairRule top={44} bottom={40} />

        {/* ── Mastery ─────────────────────────────────────────────── */}
        <MasterySection
          tiers={tiers}
          conceptScores={conceptScores}
          masteredCount={masteredCount}
          touchedCount={touchedCount}
          total={overview.totalConcepts}
        />

        <HairRule top={56} bottom={40} />

        {/* ── Study activity ──────────────────────────────────────── */}
        <ActivitySection activity={activity} />

        <HairRule top={56} bottom={40} />

        {/* ── Knowledge map ───────────────────────────────────────── */}
        <KnowledgeMapSection tiers={tiers} conceptScores={conceptScores} />

        {/* ── Review these ────────────────────────────────────────── */}
        {weakItems.length > 0 && (
          <>
            <HairRule top={56} bottom={28} />
            <SectionEyebrow>Review these</SectionEyebrow>
            <ReviewList items={weakItems} />
          </>
        )}

        {/* ── Upcoming ────────────────────────────────────────────── */}
        {hasUpcoming && (
          <>
            <HairRule top={56} bottom={28} />
            <SectionEyebrow>Upcoming</SectionEyebrow>
            <UpcomingList
              assessments={openAssessments}
              homework={openHomework}
            />
          </>
        )}
      </div>

      {/* Hover underline for all editorial links */}
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

function buildHeroSummary(
  touched: number,
  total: number,
  mastered: number,
  questions: number,
): string {
  if (questions === 0) {
    return `You have ${total} concepts waiting. Take a quiz or open a concept to start tracking your mastery.`;
  }
  const bits: string[] = [];
  bits.push(`You've started ${touched} of ${total} concepts`);
  if (mastered > 0) bits.push(`${mastered} at mastery`);
  bits.push(`${questions} ${questions === 1 ? "question" : "questions"} answered`);
  return bits.join(" · ") + ".";
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

// ─── Mastery ────────────────────────────────────────────────────────────────

function MasterySection({
  tiers,
  conceptScores,
  masteredCount,
  touchedCount,
  total,
}: {
  tiers: TierInfo[];
  conceptScores: Record<string, ConceptScore>;
  masteredCount: number;
  touchedCount: number;
  total: number;
}) {
  const masteredPct = total > 0 ? Math.round((masteredCount / total) * 100) : 0;
  const touchedPct = total > 0 ? touchedCount / total : 0;
  const masteredFrac = total > 0 ? masteredCount / total : 0;

  const tierRows = tiers.map((tier) => {
    let t = 0;
    let mastered = 0;
    let touched = 0;
    for (const sec of tier.sections) {
      for (const c of sec.concepts) {
        t++;
        const s = conceptScores[c.id];
        if (s) {
          touched++;
          if (s.pct >= 80) mastered++;
        }
      }
    }
    return {
      id: tier.id,
      slug: tier.slug,
      label: TIER_LABEL[tier.slug] ?? tier.name,
      total: t,
      mastered,
      touched,
      masteredPct: t > 0 ? mastered / t : 0,
      touchedPct: t > 0 ? touched / t : 0,
    };
  });

  return (
    <div>
      <SectionEyebrow>Mastery</SectionEyebrow>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 1px minmax(0, 1.4fr)",
          columnGap: 48,
          alignItems: "start",
        }}
      >
        {/* Left — overall */}
        <div>
          <div
            style={{
              fontSize: "clamp(48px, 5.6vw, 64px)",
              fontWeight: 600,
              letterSpacing: "-0.03em",
              lineHeight: 1,
              color: "var(--color-text)",
            }}
          >
            {masteredPct}%
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 15,
              color: "var(--color-text-2)",
              lineHeight: 1.5,
              maxWidth: 280,
            }}
          >
            {masteredCount === 0
              ? touchedCount === 0
                ? "Nothing mastered yet."
                : `${touchedCount} ${touchedCount === 1 ? "concept" : "concepts"} in progress.`
              : `${masteredCount} of ${total} concepts at 80% or higher.`}
          </div>

          <ThinBar
            style={{ marginTop: 20 }}
            touchedPct={touchedPct}
            masteredPct={masteredFrac}
            touchedColor="var(--color-border)"
            masteredColor="var(--color-correct)"
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 10,
              fontSize: 12,
              color: "var(--color-text-3)",
            }}
          >
            <span>{Math.max(touchedCount - masteredCount, 0)} in progress</span>
            <span>{total - touchedCount} not yet started</span>
          </div>
        </div>

        {/* Vertical rule */}
        <div
          aria-hidden
          style={{
            alignSelf: "stretch",
            width: 1,
            backgroundColor: "var(--color-border)",
            justifySelf: "center",
          }}
        />

        {/* Right — tier breakdown */}
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {tierRows.map((row) => (
            <div key={row.id}>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "var(--color-text)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {row.label}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    color: "var(--color-text-2)",
                  }}
                >
                  <span
                    style={{ color: "var(--color-text)", fontWeight: 600 }}
                  >
                    {row.mastered}
                  </span>
                  <span style={{ color: "var(--color-text-3)" }}>
                    {" "}
                    / {row.total} mastered
                  </span>
                </span>
              </div>
              <ThinBar
                touchedPct={row.touchedPct}
                masteredPct={row.masteredPct}
                touchedColor="var(--color-border)"
                masteredColor="var(--color-text)"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ThinBar({
  touchedPct,
  masteredPct,
  touchedColor,
  masteredColor,
  style,
}: {
  touchedPct: number;
  masteredPct: number;
  touchedColor: string;
  masteredColor: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        position: "relative",
        height: 3,
        width: "100%",
        backgroundColor: "var(--color-border-subtle)",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: `${Math.min(touchedPct * 100, 100)}%`,
          backgroundColor: touchedColor,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: `${Math.min(masteredPct * 100, 100)}%`,
          backgroundColor: masteredColor,
        }}
      />
    </div>
  );
}

// ─── Activity ──────────────────────────────────────────────────────────────

function ActivitySection({ activity }: { activity: ActivityBucket[] }) {
  const activeDays = activity.filter((a) => a.total > 0).length;
  const totalAttempts = activity.reduce((s, a) => s + a.total, 0);

  let currentStreak = 0;
  for (let i = activity.length - 1; i >= 0; i--) {
    if (activity[i].total > 0) currentStreak++;
    else break;
  }

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
    0: "transparent",
    1: "var(--color-accent-soft)",
    2: "var(--color-accent)",
    3: "var(--color-accent-hover)",
  };
  const LEVEL_OPACITY: Record<0 | 1 | 2 | 3, number> = {
    0: 1,
    1: 1,
    2: 0.75,
    3: 1,
  };

  const monthTicks: { index: number; label: string }[] = [];
  let lastMonth = -1;
  activity.forEach((a, i) => {
    const m = new Date(a.date).getMonth();
    if (m !== lastMonth) {
      monthTicks.push({
        index: i,
        label: new Date(a.date).toLocaleDateString("en-US", {
          month: "short",
        }),
      });
      lastMonth = m;
    }
  });

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 32,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <div>
          <SectionEyebrow>Study activity</SectionEyebrow>
          <div
            style={{
              fontSize: 17,
              color: "var(--color-text-2)",
              lineHeight: 1.5,
              marginTop: -4,
            }}
          >
            {activeDays === 0
              ? "No activity in the last 30 days."
              : `You studied ${activeDays} of the last 30 days.`}
          </div>
        </div>
        <div style={{ display: "flex", gap: 40 }}>
          <StreakStat
            label="Current"
            value={currentStreak}
            emphasis={currentStreak > 0}
          />
          <StreakStat label="Longest" value={longestStreak} emphasis={false} />
          <StreakStat
            label="Attempts"
            value={totalAttempts}
            emphasis={false}
          />
        </div>
      </div>

      {/* Month ticks */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(30, 1fr)",
          gap: 4,
          marginBottom: 6,
          height: 14,
          position: "relative",
        }}
      >
        {monthTicks.slice(1).map((t) => (
          <span
            key={t.index}
            style={{
              gridColumn: `${t.index + 1} / span 2`,
              fontSize: 11,
              color: "var(--color-text-3)",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              fontWeight: 500,
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
          gap: 4,
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
              ? `${dateLabel} · no activity`
              : `${dateLabel} · ${a.total} ${a.total === 1 ? "question" : "questions"} answered`;
          return (
            <div
              key={a.date}
              title={tooltip}
              style={{
                aspectRatio: "1 / 1",
                backgroundColor: LEVEL_BG[level],
                opacity: LEVEL_OPACITY[level],
                border:
                  level === 0 ? "1px solid var(--color-border)" : "none",
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
          gap: 8,
          marginTop: 14,
          fontSize: 11,
          color: "var(--color-text-3)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          fontWeight: 500,
        }}
      >
        <span>Less</span>
        {[0, 1, 2, 3].map((lv) => (
          <span
            key={lv}
            style={{
              width: 10,
              height: 10,
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
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "var(--color-text-3)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 600,
          color: emphasis ? "var(--color-accent)" : "var(--color-text)",
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ─── Knowledge map ─────────────────────────────────────────────────────────

function KnowledgeMapSection({
  tiers,
  conceptScores,
}: {
  tiers: TierInfo[];
  conceptScores: Record<string, ConceptScore>;
}) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 24,
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        <SectionEyebrow>Knowledge map</SectionEyebrow>
        <Legend />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {tiers.map((tier, tIdx) => (
          <div
            key={tier.id}
            style={{
              borderTop:
                tIdx === 0 ? "none" : "1px solid var(--color-border)",
              paddingTop: tIdx === 0 ? 0 : 24,
              paddingBottom: 24,
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--color-text)",
                letterSpacing: "-0.01em",
                marginBottom: 14,
              }}
            >
              {TIER_LABEL[tier.slug] ?? tier.name}
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
                const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;

                return (
                  <div
                    key={section.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "minmax(0, 200px) minmax(0, 1fr) 64px",
                      alignItems: "center",
                      gap: 20,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: "var(--color-text)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {section.name}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--color-text-3)",
                          marginTop: 2,
                        }}
                      >
                        {touched}/{total} touched
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 5,
                      }}
                    >
                      {section.concepts.map((concept) => {
                        const score = conceptScores[concept.id] ?? null;
                        const dot = dotColors(score);
                        return (
                          <Link
                            key={concept.id}
                            href={`/concepts/${concept.slug}`}
                            title={
                              score
                                ? `${concept.name} · ${score.pct}% · ${score.correct}/${score.total}`
                                : `${concept.name} · not attempted`
                            }
                            style={{
                              width: 14,
                              height: 14,
                              backgroundColor: dot.bg,
                              border: `1px solid ${dot.border}`,
                              display: "block",
                              transition: "transform 120ms ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = "scale(1.35)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "scale(1)";
                            }}
                          />
                        );
                      })}
                    </div>

                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color:
                          pct >= 80
                            ? "var(--color-correct)"
                            : pct >= 50
                              ? "var(--color-gold)"
                              : "var(--color-text-3)",
                        textAlign: "right",
                      }}
                    >
                      {pct}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function dotColors(score: ConceptScore | null): { bg: string; border: string } {
  if (!score) {
    return {
      bg: "transparent",
      border: "var(--color-border)",
    };
  }
  if (score.pct >= 80) {
    return {
      bg: "var(--color-correct-dim)",
      border: "var(--color-correct-border)",
    };
  }
  if (score.pct >= 50) {
    return {
      bg: "rgba(232, 181, 74, 0.18)",
      border: "rgba(232, 181, 74, 0.5)",
    };
  }
  return {
    bg: "var(--color-incorrect-dim)",
    border: "var(--color-incorrect-border)",
  };
}

function Legend() {
  const items = [
    { label: "New", color: "var(--color-text-3)" },
    { label: "<50%", color: "var(--color-incorrect)" },
    { label: "50–79%", color: "var(--color-gold)" },
    { label: "80%+", color: "var(--color-correct)" },
  ];
  return (
    <div style={{ display: "flex", gap: 20 }}>
      {items.map((it) => (
        <span
          key={it.label}
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: it.color,
          }}
        >
          {it.label}
        </span>
      ))}
    </div>
  );
}

// ─── Review list ───────────────────────────────────────────────────────────

type WeakItem = {
  concept: ConceptInfo;
  sectionName: string;
  score: ConceptScore | null;
};

function computeWeakItems(
  tiers: TierInfo[],
  conceptScores: Record<string, ConceptScore>,
  limit: number,
): WeakItem[] {
  const all: WeakItem[] = [];
  for (const tier of tiers) {
    for (const section of tier.sections) {
      for (const concept of section.concepts) {
        all.push({
          concept,
          sectionName: section.name,
          score: conceptScores[concept.id] ?? null,
        });
      }
    }
  }

  const filtered = all.filter((item) => {
    if (!item.score) {
      // Include untouched concepts only if siblings in the same section have activity.
      const siblings = all.filter(
        (c) => c.sectionName === item.sectionName && c.score !== null,
      );
      return siblings.length > 0;
    }
    return item.score.pct < 80;
  });

  filtered.sort((a, b) => (a.score?.pct ?? -1) - (b.score?.pct ?? -1));
  return filtered.slice(0, limit);
}

function ReviewList({ items }: { items: WeakItem[] }) {
  return (
    <div>
      {items.map((item, i) => (
        <div
          key={item.concept.id}
          style={{
            display: "grid",
            gridTemplateColumns: "72px minmax(0, 1fr) auto",
            alignItems: "center",
            gap: 24,
            padding: "18px 0",
            borderTop:
              i === 0 ? "1px solid var(--color-border)" : "none",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: item.score
                ? getMasteryColor(item.score.pct)
                : "var(--color-text-3)",
            }}
          >
            {item.score ? `${item.score.pct}%` : "–"}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: "-0.01em",
                color: "var(--color-text)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {item.concept.name}
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--color-text-3)",
                marginTop: 3,
              }}
            >
              {item.sectionName}
              {item.score &&
                ` · ${item.score.correct}/${item.score.total} correct`}
            </div>
          </div>
          <Link
            href={`/quiz?mode=concept&id=${item.concept.id}`}
            className="editorial-link"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 14,
              fontWeight: 600,
              color: "var(--color-accent)",
              textDecoration: "none",
              paddingBottom: 2,
              whiteSpace: "nowrap",
            }}
          >
            Quiz now
            <ArrowRight />
          </Link>
        </div>
      ))}
    </div>
  );
}

// ─── Upcoming list ─────────────────────────────────────────────────────────

function UpcomingList({
  assessments,
  homework,
}: {
  assessments: PendingAssessment[];
  homework: HomeworkItem[];
}) {
  type Row =
    | { kind: "assessment"; item: PendingAssessment; dueMs: number }
    | { kind: "homework"; item: HomeworkItem; dueMs: number };
  const rows: Row[] = [];
  for (const a of assessments) {
    rows.push({
      kind: "assessment",
      item: a,
      dueMs: a.dueDate
        ? new Date(a.dueDate).getTime()
        : Number.POSITIVE_INFINITY,
    });
  }
  for (const h of homework) {
    rows.push({
      kind: "homework",
      item: h,
      dueMs: h.dueDate
        ? new Date(h.dueDate).getTime()
        : Number.POSITIVE_INFINITY,
    });
  }
  rows.sort((a, b) => a.dueMs - b.dueMs);

  const now = Date.now();

  return (
    <div>
      {rows.map((row, i) => {
        const item = row.item;
        const dueISO =
          row.kind === "assessment" ? item.dueDate : (item as HomeworkItem).dueDate;
        const days = daysUntil(dueISO, now);
        const dueText = dueLabel(days);
        const overdue = days !== null && days < 0;
        const kindLabel =
          row.kind === "assessment" ? "Assessment" : "Homework";
        const href =
          row.kind === "assessment"
            ? `/assessment/${item.id}`
            : `/homework/${item.id}`;
        const ctaText = row.kind === "assessment" ? "Start" : "Open";
        const meta: string[] = [kindLabel];
        if (row.kind === "assessment") {
          meta.push(`${(item as PendingAssessment).questionCount} questions`);
        } else if ((item as HomeworkItem).conceptName) {
          meta.push((item as HomeworkItem).conceptName as string);
        }

        return (
          <div
            key={`${row.kind}-${item.id}`}
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) 160px auto",
              alignItems: "center",
              gap: 24,
              padding: "18px 0",
              borderTop:
                i === 0 ? "1px solid var(--color-border)" : "none",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  color: "var(--color-text)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {item.title}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--color-text-3)",
                  marginTop: 3,
                }}
              >
                {meta.join(" · ")}
              </div>
            </div>
            <div
              style={{
                fontSize: 13,
                color: overdue
                  ? "var(--color-incorrect)"
                  : "var(--color-text-2)",
                fontWeight: overdue ? 600 : 500,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {overdue && (
                <span
                  aria-hidden
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: "var(--color-incorrect)",
                    flexShrink: 0,
                  }}
                />
              )}
              <span>
                {dueText}
                {dueISO ? ` · ${formatDue(dueISO)}` : ""}
              </span>
            </div>
            <Link
              href={href}
              className="editorial-link"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 14,
                fontWeight: 600,
                color: "var(--color-accent)",
                textDecoration: "none",
                paddingBottom: 2,
                whiteSpace: "nowrap",
              }}
            >
              {ctaText}
              <ArrowRight />
            </Link>
          </div>
        );
      })}
    </div>
  );
}

