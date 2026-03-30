"use client";

import { useState } from "react";
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
  id: string; title: string; description: string | null;
  timeLimit: number | null; dueDate: string | null;
  questionCount: number; completed: boolean; score: number | null;
};
type HomeworkItem = {
  id: string; title: string; dueDate: string | null;
  conceptName: string | null; submitted: boolean;
  submittedAt: string | null; grade: string | null;
};

const TIER_COLOR: Record<string, string> = {
  fundamentals: "var(--color-gold)",
  intermediate: "var(--color-blue)",
  advanced: "var(--color-slate)",
};

const TIER_DIM: Record<string, string> = {
  fundamentals: "var(--color-gold-dim)",
  intermediate: "var(--color-blue-dim)",
  advanced: "var(--color-slate-dim)",
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

// ── Main Component ────────────────────────────────────────────────────────────

export function DashboardClient({
  userName,
  overview,
  tiers,
  conceptScores,
  pendingAssessments,
  homeworkItems,
}: {
  userName: string;
  overview: Overview;
  tiers: TierInfo[];
  conceptScores: Record<string, ConceptScore>;
  pendingAssessments: PendingAssessment[];
  homeworkItems: HomeworkItem[];
}) {
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

        <span style={{ fontSize: "12px", color: "var(--color-text-3)" }}>
          ›
        </span>
        <span
          style={{
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--color-text-2)",
          }}
        >
          Dashboard
        </span>
      </header>

      {/* ── Content ──────────────────────────────────────────── */}
      <main
        className="quiz-content-padding"
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          padding: "40px 24px 80px",
          overflowY: "auto",
        }}
      >
        <div style={{ width: "100%", maxWidth: "760px" }}>
          {/* Greeting */}
          <div className="animate-fade-in">
            <h1
              style={{
                margin: "0 0 4px",
                fontSize: "24px",
                fontWeight: 600,
                color: "var(--color-text)",
                letterSpacing: "-0.02em",
              }}
            >
              Welcome back, {userName.split(" ")[0]}
            </h1>
            <p
              style={{
                margin: "0 0 32px",
                fontSize: "14px",
                color: "var(--color-text-2)",
              }}
            >
              Here&apos;s your learning progress across the Atlas.
            </p>
          </div>

          {/* Zone 1: Overview Stats */}
          <OverviewStrip overview={overview} />

          {/* Pending Assessments */}
          {pendingAssessments.length > 0 && (
            <div style={{ marginBottom: "36px" }}>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--color-text-3)",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  marginBottom: "12px",
                }}
              >
                ASSESSMENTS
              </div>
              {pendingAssessments.map((a) => {
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
                    key={a.id}
                    style={{
                      backgroundColor: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                      padding: "16px",
                      marginBottom: "8px",
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
                        {a.timeLimit !== null && (
                          <span>{a.timeLimit} min</span>
                        )}
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
                          <span style={{ fontSize: "12px", color: "var(--color-text-3)" }}>
                            Completed
                          </span>
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
              })}
            </div>
          )}

          {/* Homework */}
          {homeworkItems.length > 0 && (
            <div style={{ marginBottom: "36px" }}>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--color-text-3)",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  marginBottom: "12px",
                }}
              >
                HOMEWORK
              </div>
              {homeworkItems.map((h) => (
                <div
                  key={h.id}
                  style={{
                    backgroundColor: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    padding: "16px",
                    marginBottom: "8px",
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
                        <span style={{ fontSize: "12px", color: "var(--color-text-3)" }}>
                          Graded
                        </span>
                      </>
                    ) : (
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "12px", color: "var(--color-text-3)" }}>
                          Submitted
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--color-text-3)" }}>
                          Awaiting review
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Zone 2: Tier Completion Map */}
          <TierMap
            tiers={tiers}
            conceptScores={conceptScores}
          />

          {/* Zone 3: Weak Areas */}
          <WeakAreas
            tiers={tiers}
            conceptScores={conceptScores}
          />
        </div>
      </main>
    </div>
  );
}

// ── Zone 1: Overview Stats ───────────────────────────────────────────────────

function OverviewStrip({ overview }: { overview: Overview }) {
  const stats = [
    {
      label: "Concepts Explored",
      value: `${overview.conceptsQuizzed}`,
      sub: `of ${overview.totalConcepts}`,
    },
    {
      label: "Questions Answered",
      value: `${overview.totalQuestions}`,
      sub: null,
    },
    {
      label: "Average Score",
      value: overview.totalQuestions > 0 ? `${overview.avgScore}%` : "—",
      sub: null,
    },
    {
      label: "Quiz Sessions",
      value: `${overview.quizSessions}`,
      sub: null,
    },
  ];

  return (
    <div
      className="animate-fade-in dashboard-stats-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "10px",
        marginBottom: "36px",
      }}
    >
      {stats.map((s) => (
        <div
          key={s.label}
          style={{
            padding: "18px 16px",
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "10px",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: 500,
              color: "var(--color-text-3)",
              letterSpacing: "0.03em",
              textTransform: "uppercase",
              marginBottom: "8px",
            }}
          >
            {s.label}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "6px",
            }}
          >
            <span
              style={{
                fontSize: "28px",
                fontWeight: 600,
                color: "var(--color-text)",
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              {s.value}
            </span>
            {s.sub && (
              <span
                style={{
                  fontSize: "13px",
                  color: "var(--color-text-3)",
                }}
              >
                {s.sub}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Zone 2: Tier Completion Map ──────────────────────────────────────────────

function TierMap({
  tiers,
  conceptScores,
}: {
  tiers: TierInfo[];
  conceptScores: Record<string, ConceptScore>;
}) {
  const [tooltip, setTooltip] = useState<{
    concept: ConceptInfo;
    score: ConceptScore | null;
    x: number;
    y: number;
  } | null>(null);

  return (
    <div style={{ marginBottom: "36px" }}>
      <h2
        style={{
          margin: "0 0 6px",
          fontSize: "16px",
          fontWeight: 600,
          color: "var(--color-text)",
          letterSpacing: "-0.01em",
        }}
      >
        Knowledge Map
      </h2>
      <p
        style={{
          margin: "0 0 20px",
          fontSize: "13px",
          color: "var(--color-text-3)",
        }}
      >
        Each cell is a concept. Color shows your mastery level.
      </p>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          marginBottom: "16px",
          flexWrap: "wrap",
        }}
      >
        {[
          { label: "Not attempted", bg: "var(--color-surface)", border: "var(--color-border)" },
          { label: "< 50%", bg: "var(--color-incorrect-dim)", border: "var(--color-incorrect-border)" },
          { label: "50–79%", bg: "var(--color-gold-dim)", border: "rgba(232, 181, 74, 0.35)" },
          { label: "80%+", bg: "var(--color-correct-dim)", border: "var(--color-correct-border)" },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "3px",
                backgroundColor: item.bg,
                border: `1px solid ${item.border}`,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: "11px", color: "var(--color-text-3)" }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Tier rows */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          position: "relative",
        }}
      >
        {tiers.map((tier) => {
          const tierColor = TIER_COLOR[tier.slug] ?? "var(--color-text-3)";

          return (
            <div
              key={tier.id}
              style={{
                padding: "16px",
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "10px",
              }}
            >
              {/* Tier label */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "12px",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: tierColor,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: tierColor,
                    letterSpacing: "0.03em",
                    textTransform: "uppercase",
                  }}
                >
                  {tier.name}
                </span>
              </div>

              {/* Sections */}
              {tier.sections.map((section) => (
                <div key={section.id} style={{ marginBottom: "10px" }}>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 500,
                      color: "var(--color-text-3)",
                      marginBottom: "6px",
                    }}
                  >
                    {section.name}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "4px",
                    }}
                  >
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
                            width: "28px",
                            height: "28px",
                            borderRadius: "5px",
                            backgroundColor: bg,
                            border: `1px solid ${border}`,
                            cursor: "pointer",
                            transition: "transform 0.1s, box-shadow 0.1s",
                            position: "relative",
                            display: "block",
                          }}
                          title={`${concept.name}${score ? ` — ${score.pct}%` : " — Not attempted"}`}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "scale(1.15)";
                            e.currentTarget.style.zIndex = "10";
                            const rect = e.currentTarget.getBoundingClientRect();
                            setTooltip({
                              concept,
                              score,
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
                </div>
              ))}
            </div>
          );
        })}

        {/* Tooltip */}
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
              borderRadius: "6px",
              pointerEvents: "none",
              zIndex: 100,
              whiteSpace: "nowrap",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                fontWeight: 500,
                color: "var(--color-text)",
                marginBottom: tooltip.score ? "2px" : 0,
              }}
            >
              {tooltip.concept.name}
            </div>
            {tooltip.score ? (
              <div style={{ fontSize: "11px", color: getMasteryColor(tooltip.score.pct) }}>
                {tooltip.score.pct}% — {tooltip.score.correct}/{tooltip.score.total} correct
              </div>
            ) : (
              <div style={{ fontSize: "11px", color: "var(--color-text-3)" }}>
                Not attempted
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Zone 3: Weak Areas ───────────────────────────────────────────────────────

function WeakAreas({
  tiers,
  conceptScores,
}: {
  tiers: TierInfo[];
  conceptScores: Record<string, ConceptScore>;
}) {
  // Build flat list of all concepts with their tier/section info
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

  // Priority: low scores first, then unattempted concepts in sections with some activity
  const weakItems = allConcepts
    .filter((item) => {
      if (!item.score) {
        // Include unattempted if they're in a section where the user has quizzed siblings
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
          borderRadius: "10px",
        }}
      >
        <div
          style={{
            fontSize: "15px",
            fontWeight: 500,
            color: "var(--color-text)",
            marginBottom: "8px",
          }}
        >
          No quiz data yet
        </div>
        <p
          style={{
            margin: "0 0 20px",
            fontSize: "13px",
            color: "var(--color-text-3)",
            lineHeight: "1.6",
          }}
        >
          Take your first quiz to start tracking progress.
        </p>
        <Link
          href="/quiz"
          style={{
            display: "inline-block",
            padding: "10px 24px",
            fontSize: "13px",
            fontWeight: 500,
            color: "#fff",
            backgroundColor: "var(--color-accent)",
            borderRadius: "6px",
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
          padding: "24px",
          textAlign: "center",
          backgroundColor: "var(--color-correct-dim)",
          border: "1px solid var(--color-correct-border)",
          borderRadius: "10px",
        }}
      >
        <div
          style={{
            fontSize: "15px",
            fontWeight: 500,
            color: "var(--color-correct)",
            marginBottom: "4px",
          }}
        >
          All concepts at 80%+
        </div>
        <p
          style={{
            margin: 0,
            fontSize: "13px",
            color: "var(--color-text-2)",
          }}
        >
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
          fontSize: "16px",
          fontWeight: 600,
          color: "var(--color-text)",
          letterSpacing: "-0.01em",
        }}
      >
        Suggested Review
      </h2>
      <p
        style={{
          margin: "0 0 16px",
          fontSize: "13px",
          color: "var(--color-text-3)",
        }}
      >
        Concepts that need more attention, sorted by score.
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        {weakItems.map((item) => {
          const tierColor =
            TIER_COLOR[item.tierSlug] ?? "var(--color-text-3)";

          return (
            <div
              key={item.concept.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
              }}
            >
              {/* Score indicator */}
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
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
                    fontSize: "12px",
                    fontWeight: 600,
                    color: item.score
                      ? getMasteryColor(item.score.pct)
                      : "var(--color-text-3)",
                  }}
                >
                  {item.score ? `${item.score.pct}%` : "—"}
                </span>
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "var(--color-text)",
                    marginBottom: "2px",
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
                    gap: "6px",
                    fontSize: "11px",
                    color: "var(--color-text-3)",
                  }}
                >
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      backgroundColor: tierColor,
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

              {/* Quiz button */}
              <Link
                href={`/quiz?mode=concept&id=${item.concept.id}`}
                style={{
                  padding: "6px 14px",
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "var(--color-accent)",
                  backgroundColor: "var(--color-accent-dim)",
                  border: "none",
                  borderRadius: "5px",
                  textDecoration: "none",
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                }}
              >
                Quiz Now
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
