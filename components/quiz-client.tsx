"use client";

import { useState, useMemo } from "react";
import { MCQuestion } from "@/components/quiz-mc";
import { ShortAnswerQuestion } from "@/components/quiz-short-answer";
import { QuizResults } from "@/components/quiz-results";
import type { QuizQuestion, MCAnswer } from "@/components/quiz-results";
import { Icon, type IconName } from "@/components/ui/icon";
import { IconTile } from "@/components/ui/icon-tile";
import { TierBadge } from "@/components/ui/tier-badge";
import { StatusTag } from "@/components/ui/status-tag";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { PageFrame } from "@/components/ui/page-frame";

// ── Types ─────────────────────────────────────────────────────────────────────

type ConceptOption = {
  id: string;
  name: string;
  slug: string;
  questionCount: number;
};
type SectionOption = {
  id: string;
  name: string;
  concepts: ConceptOption[];
};
type TierOption = {
  id: string;
  name: string;
  slug: string;
  sections: SectionOption[];
};

type QuizMode = "concept" | "section" | "tier" | "mixed";
type Phase = "select-mode" | "select-target" | "loading" | "quiz" | "summary";

export type QuizResumePick = {
  conceptId: string;
  conceptName: string;
  conceptSlug: string;
  attemptedAt: string;
};

// ── Tile palette per tier (matches --tile-{color}-bg/fg vars) ─────────────────

const TIER_TILE: Record<string, string> = {
  fundamentals: "gold",
  intermediate: "blue",
  advanced: "stone",
};

// ── Back button ───────────────────────────────────────────────────────────────

function BackButton({ onClick }: { onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-2)",
        padding: "6px 10px 6px 6px",
        marginBottom: "var(--space-5)",
        fontSize: "var(--text-sm)",
        fontWeight: 500,
        fontFamily: "inherit",
        color: hov ? "var(--color-text)" : "var(--color-text-2)",
        backgroundColor: hov ? "var(--color-surface-2)" : "transparent",
        border: "none",
        borderRadius: "var(--radius-2)",
        cursor: "pointer",
        transition: "color 120ms ease, background-color 120ms ease",
      }}
    >
      <span style={{ display: "inline-flex", transform: "rotate(180deg)" }}>
        <Icon name="chevron-right" size={14} strokeWidth={2} />
      </span>
      Back
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function QuizClient({
  tiers,
  resume,
}: {
  tiers: TierOption[];
  resume: QuizResumePick | null;
}) {
  const [phase, setPhase] = useState<Phase>("select-mode");
  const [mode, setMode] = useState<QuizMode | null>(null);
  const [, setSelectedId] = useState<string>("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mcAnswers, setMcAnswers] = useState<MCAnswer[]>([]);
  const [saAnswers, setSaAnswers] = useState<
    { questionId: string; score: string; gotIt: boolean }[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  const startQuiz = async (quizMode: QuizMode, targetId?: string) => {
    setPhase("loading");
    setError(null);

    try {
      const params = new URLSearchParams({ mode: quizMode });
      if (targetId) params.set("id", targetId);

      const res = await fetch(`/api/quiz?${params}`);
      if (!res.ok) throw new Error("Failed to fetch questions");

      const data = await res.json();
      if (!data.questions?.length) {
        setError("No questions found for this selection.");
        setPhase(quizMode === "mixed" ? "select-mode" : "select-target");
        return;
      }

      setQuestions(data.questions);
      setCurrentIndex(0);
      setMcAnswers([]);
      setPhase("quiz");
    } catch {
      setError("Something went wrong loading the quiz. Please try again.");
      setPhase(quizMode === "mixed" ? "select-mode" : "select-target");
    }
  };

  const handleModeSelect = (m: QuizMode) => {
    setMode(m);
    setSelectedId("");
    setError(null);

    if (m === "mixed") {
      startQuiz("mixed");
    } else {
      setPhase("select-target");
    }
  };

  const handleMCAnswer = (
    questionId: string,
    correct: boolean,
    selectedIndex: number,
  ) => {
    setMcAnswers((prev) => [...prev, { questionId, correct, selectedIndex }]);
  };

  const handleGraded = (questionId: string, result: { score: string }) => {
    setSaAnswers((prev) => [
      ...prev,
      { questionId, score: result.score, gotIt: result.score === "correct" },
    ]);
  };

  const saveAttempts = (
    qs: QuizQuestion[],
    mc: MCAnswer[],
    sa: { questionId: string; gotIt: boolean }[],
  ) => {
    const answers = qs.map((q) => {
      const mcAnswer = mc.find((a) => a.questionId === q.id);
      const saAnswer = sa.find((a) => a.questionId === q.id);

      if (mcAnswer) {
        const selectedText = q.options?.[mcAnswer.selectedIndex]?.text ?? null;
        return {
          questionId: q.id,
          selectedAnswer: selectedText,
          isCorrect: mcAnswer.correct,
        };
      }
      if (saAnswer) {
        return {
          questionId: q.id,
          selectedAnswer: null,
          isCorrect: saAnswer.gotIt,
        };
      }
      return { questionId: q.id, selectedAnswer: null, isCorrect: null };
    });

    fetch("/api/quiz/attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    }).catch(() => {});
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      saveAttempts(questions, mcAnswers, saAnswers);
      setPhase("summary");
    }
  };

  const resetQuiz = () => {
    setPhase("select-mode");
    setMode(null);
    setSelectedId("");
    setQuestions([]);
    setCurrentIndex(0);
    setMcAnswers([]);
    setSaAnswers([]);
    setError(null);
  };

  const retakeQuiz = () => {
    const shuffled = [...questions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setQuestions(shuffled);
    setCurrentIndex(0);
    setMcAnswers([]);
    setSaAnswers([]);
    setPhase("quiz");
  };

  const goBackToModeSelect = () => {
    setPhase("select-mode");
    setMode(null);
    setSelectedId("");
    setError(null);
  };

  // Width adjusts per phase: mode select gets a wider grid
  const maxWidth =
    phase === "select-mode"
      ? 820
      : phase === "select-target" && mode === "concept"
        ? 760
        : 720;

  return (
    <PageFrame
      maxWidth={maxWidth}
      padding={phase === "select-mode" ? undefined : "var(--space-7) var(--pad-page-x) var(--space-8)"}
      className="quiz-content-padding"
    >
      {phase === "select-mode" && (
        <ModeSelect
          onSelect={handleModeSelect}
          error={error}
          resume={resume}
          onResume={(conceptId) => startQuiz("concept", conceptId)}
        />
      )}

      {phase === "select-target" && mode && (
        <TargetSelect
          mode={mode}
          tiers={tiers}
          onBack={goBackToModeSelect}
          onStart={(id) => {
            setSelectedId(id);
            startQuiz(mode, id);
          }}
          error={error}
        />
      )}

      {phase === "loading" && <LoadingState />}

      {phase === "quiz" && questions[currentIndex] && (
        <QuizFlow
          question={questions[currentIndex]}
          index={currentIndex}
          total={questions.length}
          onMCAnswer={handleMCAnswer}
          onGraded={handleGraded}
          onNext={handleNext}
        />
      )}

      {phase === "summary" && (
        <QuizResults
          questions={questions}
          mcAnswers={mcAnswers}
          mode={mode!}
          onRetake={retakeQuiz}
          onNewQuiz={resetQuiz}
        />
      )}
    </PageFrame>
  );
}

// ── Screen 1: Mode Selection ─────────────────────────────────────────────────

const MODE_CARDS: {
  key: QuizMode;
  label: string;
  desc: string;
  icon: IconName;
  tile: string;
}[] = [
  {
    key: "concept",
    label: "By Concept",
    desc: "Quiz yourself on a single topic.",
    icon: "target",
    tile: "indigo",
  },
  {
    key: "section",
    label: "By Section",
    desc: "Questions across a full section.",
    icon: "layers",
    tile: "sky",
  },
  {
    key: "tier",
    label: "By Tier",
    desc: "Cover everything in a tier.",
    icon: "bar-chart",
    tile: "honey",
  },
  {
    key: "mixed",
    label: "Mixed",
    desc: "Random questions from all topics.",
    icon: "sparkles",
    tile: "lilac",
  },
];

function ModeSelect({
  onSelect,
  error,
  resume,
  onResume,
}: {
  onSelect: (m: QuizMode) => void;
  error: string | null;
  resume: QuizResumePick | null;
  onResume: (conceptId: string) => void;
}) {
  return (
    <div className="animate-fade-in">
      <h1
        style={{
          margin: "0 0 12px",
          fontSize: "var(--text-3xl)",
          fontWeight: 600,
          color: "var(--color-text)",
          letterSpacing: "-0.025em",
          lineHeight: 1.15,
        }}
      >
        Quiz
      </h1>
      <p
        style={{
          margin: "0 0 28px",
          fontSize: "var(--text-md)",
          color: "var(--color-text-2)",
          lineHeight: 1.55,
          maxWidth: 580,
        }}
      >
        Pick a mode to see where you&rsquo;re at.
      </p>

      {resume && <ResumeStrip resume={resume} onResume={onResume} />}

      {error && (
        <p
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--color-incorrect)",
            backgroundColor: "var(--color-incorrect-dim)",
            border: "1px solid var(--color-incorrect-border)",
            padding: "10px 14px",
            borderRadius: "var(--radius-2)",
            marginBottom: "var(--space-5)",
          }}
        >
          {error}
        </p>
      )}

      <div
        className="quiz-mode-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "var(--space-4)",
        }}
      >
        {MODE_CARDS.map((m) => (
          <ModeCard key={m.key} card={m} onSelect={() => onSelect(m.key)} />
        ))}
      </div>
    </div>
  );
}

function ResumeStrip({
  resume,
  onResume,
}: {
  resume: QuizResumePick;
  onResume: (conceptId: string) => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      onClick={() => onResume(resume.conceptId)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-3)",
        width: "100%",
        padding: "14px 16px",
        marginBottom: "var(--space-5)",
        backgroundColor: hov
          ? "var(--color-accent-soft)"
          : "var(--color-surface)",
        border: `1px solid ${hov ? "var(--color-accent)" : "var(--color-border)"}`,
        borderRadius: "var(--radius-2)",
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "inherit",
        boxShadow: "var(--shadow-card)",
        transition: "border-color 140ms ease, background-color 140ms ease",
      }}
    >
      <div
        aria-hidden
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 32,
          height: 32,
          borderRadius: "var(--radius-2)",
          backgroundColor: "var(--color-accent-soft)",
          color: "var(--color-accent-on-soft)",
          flexShrink: 0,
        }}
      >
        <Icon name="arrows-clockwise" size={16} strokeWidth={1.85} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "var(--text-xs)",
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--color-text-3)",
          }}
        >
          Pick up where you left off
        </div>
        <div
          style={{
            fontSize: "var(--text-sm)",
            fontWeight: 550,
            color: "var(--color-text)",
            marginTop: 2,
            letterSpacing: "-0.005em",
          }}
        >
          {resume.conceptName}
          <span
            style={{
              marginLeft: 8,
              fontWeight: 400,
              color: "var(--color-text-3)",
            }}
          >
            · {relativeAttemptedAt(resume.attemptedAt)}
          </span>
        </div>
      </div>
      <span
        style={{
          fontSize: "var(--text-sm)",
          fontWeight: 600,
          color: "var(--color-accent-on-soft)",
          flexShrink: 0,
        }}
      >
        Resume →
      </span>
    </button>
  );
}

function relativeAttemptedAt(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffMs = Date.now() - then;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function ModeCard({
  card,
  onSelect,
}: {
  card: (typeof MODE_CARDS)[number];
  onSelect: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "var(--space-5)",
        padding: "24px 22px 22px",
        backgroundColor: "var(--color-surface)",
        border: `1px solid ${hov ? "var(--color-accent)" : "var(--color-border)"}`,
        borderRadius: "var(--radius-3)",
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "inherit",
        boxShadow: hov ? "var(--shadow-card-hover)" : "var(--shadow-card)",
        transform: hov ? "translateY(-1px)" : "translateY(0)",
        transition:
          "border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease",
      }}
    >
      <IconTile icon={card.icon} color={card.tile} size="md" />
      <div>
        <div
          style={{
            fontSize: "var(--text-md)",
            fontWeight: 600,
            color: "var(--color-text)",
            marginBottom: "var(--space-2)",
            letterSpacing: "-0.01em",
          }}
        >
          {card.label}
        </div>
        <div
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--color-text-2)",
            lineHeight: 1.5,
          }}
        >
          {card.desc}
        </div>
      </div>
    </button>
  );
}

// ── Screen 2: Target Selection ───────────────────────────────────────────────

function TargetSelect({
  mode,
  tiers,
  onBack,
  onStart,
  error,
}: {
  mode: QuizMode;
  tiers: TierOption[];
  onBack: () => void;
  onStart: (id: string) => void;
  error: string | null;
}) {
  return (
    <div className="animate-fade-in">
      <BackButton onClick={onBack} />

      {error && (
        <p
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--color-incorrect)",
            backgroundColor: "var(--color-incorrect-dim)",
            border: "1px solid var(--color-incorrect-border)",
            padding: "10px 14px",
            borderRadius: "var(--radius-2)",
            marginBottom: "var(--space-4)",
          }}
        >
          {error}
        </p>
      )}

      {mode === "concept" && (
        <ConceptPicker tiers={tiers} onSelect={onStart} />
      )}
      {mode === "section" && (
        <SectionPicker tiers={tiers} onSelect={onStart} />
      )}
      {mode === "tier" && <TierPicker tiers={tiers} onSelect={onStart} />}
    </div>
  );
}

// ── Concept Picker (search + tier accordion) ─────────────────────────────────

function ConceptPicker({
  tiers,
  onSelect,
}: {
  tiers: TierOption[];
  onSelect: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [expandedTiers, setExpandedTiers] = useState<Set<string>>(
    () => new Set(tiers.map((t) => t.id)),
  );
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    () => new Set(),
  );

  const query = search.toLowerCase().trim();

  const filteredTiers = useMemo(() => {
    return tiers
      .map((tier) => ({
        ...tier,
        sections: tier.sections
          .map((section) => ({
            ...section,
            concepts: section.concepts.filter(
              (c) => !query || c.name.toLowerCase().includes(query),
            ),
          }))
          .filter((s) => s.concepts.length > 0),
      }))
      .filter((t) => t.sections.length > 0);
  }, [tiers, query]);

  const toggleTier = (id: string) => {
    setExpandedTiers((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div>
      <h2
        style={{
          margin: "0 0 8px",
          fontSize: "var(--text-lg)",
          fontWeight: 600,
          color: "var(--color-text)",
          letterSpacing: "-0.02em",
        }}
      >
        Choose a concept
      </h2>
      <p
        style={{
          margin: "0 0 24px",
          fontSize: "var(--text-base)",
          color: "var(--color-text-2)",
        }}
      >
        Pick a topic to quiz yourself on.
      </p>

      <div style={{ marginBottom: "var(--space-5)" }}>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search concepts…"
          width={360}
          focusedWidth={460}
        />
      </div>

      {filteredTiers.length === 0 && (
        <p
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--color-text-3)",
            textAlign: "center",
            padding: "32px 0",
          }}
        >
          No concepts match &ldquo;{search}&rdquo;
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        {filteredTiers.map((tier) => {
          const isTierOpen = query.length > 0 || expandedTiers.has(tier.id);

          return (
            <div
              key={tier.id}
              style={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-3)",
                overflow: "hidden",
                boxShadow: "var(--shadow-card)",
              }}
            >
              {/* Tier header */}
              <button
                onClick={() => toggleTier(tier.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-3)",
                  padding: "14px 16px",
                  backgroundColor: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "left",
                }}
              >
                <TierBadge slug={tier.slug} label={tier.name} />
                <span style={{ flex: 1 }} />
                <span
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-text-3)",
                  }}
                >
                  {tier.sections.reduce(
                    (s, sec) => s + sec.concepts.length,
                    0,
                  )}{" "}
                  concepts
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    transform: isTierOpen ? "rotate(90deg)" : "rotate(0deg)",
                    transition: "transform 150ms ease",
                    color: "var(--color-text-3)",
                  }}
                >
                  <Icon name="chevron-right" size={14} strokeWidth={2} />
                </span>
              </button>

              {/* Sections */}
              {isTierOpen && (
                <div
                  style={{ borderTop: "1px solid var(--color-border-subtle)" }}
                >
                  {tier.sections.map((section, sIdx) => {
                    const isSectionOpen =
                      query.length > 0 || expandedSections.has(section.id);

                    return (
                      <div key={section.id}>
                        {sIdx > 0 && (
                          <div
                            style={{
                              height: 1,
                              backgroundColor: "var(--color-border-subtle)",
                              marginLeft: "var(--space-4)",
                            }}
                          />
                        )}
                        <button
                          onClick={() => toggleSection(section.id)}
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            gap: "var(--space-2)",
                            padding: "10px 16px 10px 22px",
                            backgroundColor: "transparent",
                            border: "none",
                            cursor: "pointer",
                            fontFamily: "inherit",
                            textAlign: "left",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-flex",
                              transform: isSectionOpen
                                ? "rotate(90deg)"
                                : "rotate(0deg)",
                              transition: "transform 150ms ease",
                              color: "var(--color-text-3)",
                            }}
                          >
                            <Icon
                              name="chevron-right"
                              size={11}
                              strokeWidth={2}
                            />
                          </span>
                          <span
                            style={{
                              flex: 1,
                              fontSize: "var(--text-sm)",
                              fontWeight: 550,
                              color: "var(--color-text-2)",
                            }}
                          >
                            {section.name}
                          </span>
                          <span
                            style={{
                              fontSize: "var(--text-xs)",
                              color: "var(--color-text-3)",
                            }}
                          >
                            {section.concepts.length}
                          </span>
                        </button>

                        {isSectionOpen && (
                          <div style={{ paddingBottom: "var(--space-2)" }}>
                            {section.concepts.map((concept) => (
                              <ConceptRow
                                key={concept.id}
                                concept={concept}
                                onSelect={() => onSelect(concept.id)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ConceptRow({
  concept,
  onSelect,
}: {
  concept: ConceptOption;
  onSelect: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "var(--space-2)",
        padding: "8px 16px 8px 42px",
        backgroundColor: hov ? "var(--color-accent-soft)" : "transparent",
        border: "none",
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left",
        transition: "background-color 100ms ease",
      }}
    >
      <span
        style={{
          flex: 1,
          fontSize: "var(--text-sm)",
          fontWeight: 500,
          color: hov ? "var(--color-accent-on-soft)" : "var(--color-text)",
          transition: "color 100ms ease",
        }}
      >
        {concept.name}
      </span>
      <span
        style={{
          fontSize: "var(--text-xs)",
          color: "var(--color-text-3)",
          flexShrink: 0,
        }}
      >
        {concept.questionCount} {concept.questionCount === 1 ? "q" : "qs"}
      </span>
      <span
        style={{
          display: "inline-flex",
          color: hov ? "var(--color-accent)" : "var(--color-text-3)",
          opacity: hov ? 1 : 0,
          transition: "opacity 120ms ease, color 120ms ease",
        }}
      >
        <Icon name="chevron-right" size={12} strokeWidth={2} />
      </span>
    </button>
  );
}

// ── Section Picker ───────────────────────────────────────────────────────────

function SectionPicker({
  tiers,
  onSelect,
}: {
  tiers: TierOption[];
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <h2
        style={{
          margin: "0 0 8px",
          fontSize: "var(--text-lg)",
          fontWeight: 600,
          color: "var(--color-text)",
          letterSpacing: "-0.02em",
        }}
      >
        Choose a section
      </h2>
      <p
        style={{
          margin: "0 0 28px",
          fontSize: "var(--text-base)",
          color: "var(--color-text-2)",
        }}
      >
        All questions from every concept in the section.
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-6)",
        }}
      >
        {tiers.map((tier) => (
          <div key={tier.id}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-3)",
                marginBottom: "var(--space-3)",
              }}
            >
              <TierBadge slug={tier.slug} label={tier.name} />
              <span
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-text-3)",
                }}
              >
                {tier.sections.length} sections
              </span>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-2)",
              }}
            >
              {tier.sections.map((section) => (
                <SectionRow
                  key={section.id}
                  section={section}
                  tierTile={TIER_TILE[tier.slug] ?? "stone"}
                  onSelect={() => onSelect(section.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionRow({
  section,
  tierTile,
  onSelect,
}: {
  section: SectionOption;
  tierTile: string;
  onSelect: () => void;
}) {
  const [hov, setHov] = useState(false);
  const totalQuestions = section.concepts.reduce(
    (sum, c) => sum + c.questionCount,
    0,
  );
  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-4)",
        padding: "14px 16px",
        backgroundColor: "var(--color-surface)",
        border: `1px solid ${hov ? "var(--color-accent)" : "var(--color-border)"}`,
        borderRadius: "var(--radius-2)",
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left",
        boxShadow: hov ? "var(--shadow-card-hover)" : "var(--shadow-card)",
        transition:
          "border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease",
        transform: hov ? "translateY(-1px)" : "translateY(0)",
      }}
    >
      <IconTile icon="layers" color={tierTile} size="sm" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "var(--text-base)",
            fontWeight: 550,
            color: "var(--color-text)",
            marginBottom: "var(--space-1)",
            letterSpacing: "-0.005em",
          }}
        >
          {section.name}
        </div>
        <div
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--color-text-3)",
          }}
        >
          {section.concepts.length} concepts · {totalQuestions} questions
        </div>
      </div>
      <span
        style={{
          display: "inline-flex",
          color: hov ? "var(--color-accent)" : "var(--color-text-3)",
          transition: "color 120ms ease",
        }}
      >
        <Icon name="chevron-right" size={15} strokeWidth={2} />
      </span>
    </button>
  );
}

// ── Tier Picker ──────────────────────────────────────────────────────────────

function TierPicker({
  tiers,
  onSelect,
}: {
  tiers: TierOption[];
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <h2
        style={{
          margin: "0 0 8px",
          fontSize: "var(--text-lg)",
          fontWeight: 600,
          color: "var(--color-text)",
          letterSpacing: "-0.02em",
        }}
      >
        Choose a tier
      </h2>
      <p
        style={{
          margin: "0 0 28px",
          fontSize: "var(--text-base)",
          color: "var(--color-text-2)",
        }}
      >
        Every question from all sections in the tier.
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-3)",
        }}
      >
        {tiers.map((tier) => (
          <TierRow
            key={tier.id}
            tier={tier}
            onSelect={() => onSelect(tier.id)}
          />
        ))}
      </div>
    </div>
  );
}

function TierRow({
  tier,
  onSelect,
}: {
  tier: TierOption;
  onSelect: () => void;
}) {
  const [hov, setHov] = useState(false);
  const totalQuestions = tier.sections.reduce(
    (sum, s) => sum + s.concepts.reduce((cs, c) => cs + c.questionCount, 0),
    0,
  );
  const totalConcepts = tier.sections.reduce(
    (sum, s) => sum + s.concepts.length,
    0,
  );
  const tile = TIER_TILE[tier.slug] ?? "stone";

  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-5)",
        padding: "22px 22px",
        backgroundColor: "var(--color-surface)",
        border: `1px solid ${hov ? "var(--color-accent)" : "var(--color-border)"}`,
        borderRadius: "var(--radius-3)",
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left",
        boxShadow: hov ? "var(--shadow-card-hover)" : "var(--shadow-card)",
        transition:
          "border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease",
        transform: hov ? "translateY(-1px)" : "translateY(0)",
      }}
    >
      <IconTile icon="bar-chart" color={tile} size="lg" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "var(--text-md)",
            fontWeight: 600,
            color: "var(--color-text)",
            marginBottom: "var(--space-1)",
            letterSpacing: "-0.01em",
          }}
        >
          {tier.name}
        </div>
        <div
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--color-text-3)",
          }}
        >
          {tier.sections.length} sections · {totalConcepts} concepts ·{" "}
          {totalQuestions} questions
        </div>
      </div>
      <span
        style={{
          display: "inline-flex",
          color: hov ? "var(--color-accent)" : "var(--color-text-3)",
          transition: "color 120ms ease",
        }}
      >
        <Icon name="chevron-right" size={18} strokeWidth={2} />
      </span>
    </button>
  );
}

// ── Loading ───────────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-4)",
        paddingTop: "var(--space-5)",
      }}
    >
      <div
        className="skeleton"
        style={{ height: 18, width: "30%", borderRadius: "var(--radius-1)" }}
      />
      <div
        className="skeleton"
        style={{ height: 28, width: "70%", borderRadius: "var(--radius-1)", marginBottom: "var(--space-2)" }}
      />
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="skeleton"
          style={{ height: 56, width: "100%", borderRadius: "var(--radius-3)" }}
        />
      ))}
    </div>
  );
}

// ── Quiz Flow ─────────────────────────────────────────────────────────────────

function QuizFlow({
  question,
  index,
  total,
  onMCAnswer,
  onGraded,
  onNext,
}: {
  question: QuizQuestion;
  index: number;
  total: number;
  onMCAnswer: (
    questionId: string,
    correct: boolean,
    selectedIndex: number,
  ) => void;
  onGraded: (questionId: string, result: { score: string }) => void;
  onNext: () => void;
}) {
  const [answered, setAnswered] = useState(false);

  const handleAnswered = () => setAnswered(true);

  const handleNext = () => {
    setAnswered(false);
    onNext();
  };

  const [prevIndex, setPrevIndex] = useState(index);
  if (index !== prevIndex) {
    setPrevIndex(index);
    setAnswered(false);
  }

  const progress = ((index + 1) / total) * 100;

  return (
    <div>
      {/* Progress meta */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--space-3)",
        }}
      >
        <span
          style={{
            fontSize: "var(--text-xs)",
            fontWeight: 600,
            color: "var(--color-text-3)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Question {index + 1} of {total}
        </span>
        <span
          style={{
            fontSize: "var(--text-xs)",
            fontWeight: 500,
            color: "var(--color-text-3)",
          }}
        >
          {Math.round(progress)}%
        </span>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: 4,
          backgroundColor: "var(--color-surface-2)",
          borderRadius: 999,
          marginBottom: "var(--space-6)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            backgroundColor: "var(--color-accent)",
            borderRadius: 999,
            transition: "width 300ms ease",
          }}
        />
      </div>

      {/* Concept label */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-3)",
          marginBottom: "var(--space-4)",
          flexWrap: "wrap",
        }}
      >
        <StatusTag tone="neutral" uppercase>
          {question.conceptName}
        </StatusTag>
        <span
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--color-text-3)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {question.type === "MC" ? "Multiple choice" : "Short answer"}
        </span>
      </div>

      {/* Question */}
      {question.type === "MC" && question.options ? (
        <MCQuestion
          key={question.id}
          question={{ ...question, options: question.options }}
          onAnswer={(correct, selectedIndex) => {
            onMCAnswer(question.id, correct, selectedIndex);
            handleAnswered();
          }}
        />
      ) : (
        <ShortAnswerQuestion
          key={question.id}
          question={question}
          onRevealed={handleAnswered}
          onGraded={onGraded}
        />
      )}

      {/* Next / Finish */}
      {answered && (
        <div className="animate-fade-in" style={{ marginTop: "var(--space-6)" }}>
          <Button
            variant="primary"
            size="md"
            onClick={handleNext}
            rightIcon={
              index < total - 1 ? (
                <Icon name="chevron-right" size={14} strokeWidth={2} />
              ) : undefined
            }
          >
            {index < total - 1 ? "Next question" : "View results"}
          </Button>
        </div>
      )}
    </div>
  );
}
