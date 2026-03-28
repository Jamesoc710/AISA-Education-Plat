"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { MCQuestion } from "@/components/quiz-mc";
import { ShortAnswerQuestion } from "@/components/quiz-short-answer";
import { QuizResults } from "@/components/quiz-results";
import type {
  QuizQuestion,
  MCAnswer,
} from "@/components/quiz-results";

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

// ── Tier color helper ─────────────────────────────────────────────────────────

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

// ── Back button ───────────────────────────────────────────────────────────────

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 0",
        marginBottom: "24px",
        fontSize: "13px",
        fontWeight: 500,
        fontFamily: "inherit",
        color: "var(--color-text-3)",
        background: "none",
        border: "none",
        cursor: "pointer",
        transition: "color 0.12s",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.color = "var(--color-text-2)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.color = "var(--color-text-3)")
      }
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        style={{ flexShrink: 0 }}
      >
        <path
          d="M10 12L6 8l4-4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Back
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function QuizClient({ tiers }: { tiers: TierOption[] }) {
  const [phase, setPhase] = useState<Phase>("select-mode");
  const [mode, setMode] = useState<QuizMode | null>(null);
  const [selectedId, setSelectedId] = useState<string>("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mcAnswers, setMcAnswers] = useState<MCAnswer[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch questions and start quiz ──────────────────────────────────────

  const startQuiz = async (
    quizMode: QuizMode,
    targetId?: string,
  ) => {
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

  // ── Mode selected handler ─────────────────────────────────────────────

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

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleMCAnswer = (
    questionId: string,
    correct: boolean,
    selectedIndex: number,
  ) => {
    setMcAnswers((prev) => [...prev, { questionId, correct, selectedIndex }]);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
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
    setPhase("quiz");
  };

  const goBackToModeSelect = () => {
    setPhase("select-mode");
    setMode(null);
    setSelectedId("");
    setError(null);
  };

  // ── Render ──────────────────────────────────────────────────────────────

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
          Quiz
        </span>

        {phase === "quiz" && (
          <span
            style={{
              marginLeft: "auto",
              fontSize: "12px",
              color: "var(--color-text-3)",
            }}
          >
            Question {currentIndex + 1} of {questions.length}
          </span>
        )}
      </header>

      {/* ── Content ──────────────────────────────────────────── */}
      <main
        className="quiz-content-padding"
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          padding: "48px 24px 80px",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: phase === "select-target" && mode === "concept"
              ? "720px"
              : "640px",
          }}
        >
          {phase === "select-mode" && (
            <ModeSelect onSelect={handleModeSelect} error={error} />
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
        </div>
      </main>
    </div>
  );
}

// ── Screen 1: Mode Selection ─────────────────────────────────────────────────

const MODE_CARDS: {
  key: QuizMode;
  label: string;
  desc: string;
  icon: React.ReactNode;
}[] = [
  {
    key: "concept",
    label: "By Concept",
    desc: "Quiz yourself on a single topic",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect
          x="3"
          y="3"
          width="14"
          height="14"
          rx="3"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M7 10h6M10 7v6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    key: "section",
    label: "By Section",
    desc: "Questions across a full section",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M4 6h12M4 10h12M4 14h8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    key: "tier",
    label: "By Tier",
    desc: "Cover everything in a tier",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M4 14h12M6 10h8M8 6h4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    key: "mixed",
    label: "Mixed",
    desc: "Random questions from all topics",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M4 5h3l3 10h3l3-10"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

function ModeSelect({
  onSelect,
  error,
}: {
  onSelect: (m: QuizMode) => void;
  error: string | null;
}) {
  return (
    <div className="animate-fade-in">
      <h1
        style={{
          margin: "0 0 8px",
          fontSize: "24px",
          fontWeight: 600,
          color: "var(--color-text)",
          letterSpacing: "-0.02em",
        }}
      >
        Quiz
      </h1>
      <p
        style={{
          margin: "0 0 32px",
          fontSize: "14px",
          color: "var(--color-text-2)",
          lineHeight: "1.6",
        }}
      >
        Test your understanding of AI concepts. Choose how you&apos;d like to
        be quizzed.
      </p>

      {error && (
        <p
          style={{
            fontSize: "13px",
            color: "var(--color-incorrect)",
            marginBottom: "16px",
          }}
        >
          {error}
        </p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
        }}
        className="quiz-mode-grid"
      >
        {MODE_CARDS.map((m) => (
          <button
            key={m.key}
            onClick={() => onSelect(m.key)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: "12px",
              padding: "20px",
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "10px",
              cursor: "pointer",
              textAlign: "left",
              fontFamily: "inherit",
              transition:
                "border-color 0.15s, background-color 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--color-accent)";
              e.currentTarget.style.backgroundColor =
                "var(--color-surface-2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--color-border)";
              e.currentTarget.style.backgroundColor =
                "var(--color-surface)";
            }}
          >
            <span style={{ color: "var(--color-accent)" }}>{m.icon}</span>
            <div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "var(--color-text)",
                  marginBottom: "4px",
                }}
              >
                {m.label}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--color-text-3)",
                  lineHeight: "1.4",
                }}
              >
                {m.desc}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
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
            fontSize: "13px",
            color: "var(--color-incorrect)",
            marginBottom: "16px",
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

  // When searching, auto-expand everything; otherwise use manual state
  const filteredTiers = useMemo(() => {
    return tiers
      .map((tier) => ({
        ...tier,
        sections: tier.sections
          .map((section) => ({
            ...section,
            concepts: section.concepts.filter(
              (c) =>
                !query || c.name.toLowerCase().includes(query),
            ),
          }))
          .filter((s) => s.concepts.length > 0),
      }))
      .filter((t) => t.sections.length > 0);
  }, [tiers, query]);

  const toggleTier = (id: string) => {
    setExpandedTiers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div>
      <h2
        style={{
          margin: "0 0 8px",
          fontSize: "20px",
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
          fontSize: "13px",
          color: "var(--color-text-3)",
        }}
      >
        Pick a topic to quiz yourself on.
      </p>

      {/* Search bar */}
      <div style={{ position: "relative", marginBottom: "20px" }}>
        <svg
          width="15"
          height="15"
          viewBox="0 0 16 16"
          fill="none"
          style={{
            position: "absolute",
            left: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
          }}
        >
          <circle
            cx="7"
            cy="7"
            r="5"
            stroke="var(--color-text-3)"
            strokeWidth="1.5"
          />
          <path
            d="M11 11l3 3"
            stroke="var(--color-text-3)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <input
          type="text"
          placeholder="Search concepts…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 14px 10px 36px",
            fontSize: "13px",
            fontFamily: "inherit",
            color: "var(--color-text)",
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "8px",
            outline: "none",
            boxSizing: "border-box",
          }}
          onFocus={(e) =>
            (e.currentTarget.style.borderColor = "var(--color-accent)")
          }
          onBlur={(e) =>
            (e.currentTarget.style.borderColor = "var(--color-border)")
          }
        />
      </div>

      {/* Tier accordion */}
      {filteredTiers.length === 0 && (
        <p
          style={{
            fontSize: "13px",
            color: "var(--color-text-3)",
            textAlign: "center",
            padding: "32px 0",
          }}
        >
          No concepts match &ldquo;{search}&rdquo;
        </p>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {filteredTiers.map((tier) => {
          const tierColor = TIER_COLOR[tier.slug] ?? "var(--color-text-3)";
          const isTierOpen = query.length > 0 || expandedTiers.has(tier.id);

          return (
            <div
              key={tier.id}
              style={{
                border: "1px solid var(--color-border)",
                borderRadius: "10px",
                overflow: "hidden",
              }}
            >
              {/* Tier header */}
              <button
                onClick={() => toggleTier(tier.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "14px 16px",
                  backgroundColor: "var(--color-surface)",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "left",
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
                    flex: 1,
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--color-text)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {tier.name}
                </span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  style={{
                    transition: "transform 0.15s",
                    transform: isTierOpen
                      ? "rotate(90deg)"
                      : "rotate(0deg)",
                    flexShrink: 0,
                  }}
                >
                  <path
                    d="M4.5 2.5l3.5 3.5-3.5 3.5"
                    stroke="var(--color-text-3)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {/* Sections under tier */}
              {isTierOpen && (
                <div
                  style={{
                    borderTop: "1px solid var(--color-border-subtle)",
                  }}
                >
                  {tier.sections.map((section, sIdx) => {
                    const isSectionOpen =
                      query.length > 0 || expandedSections.has(section.id);

                    return (
                      <div key={section.id}>
                        {sIdx > 0 && (
                          <div
                            style={{
                              height: "1px",
                              backgroundColor:
                                "var(--color-border-subtle)",
                              marginLeft: "16px",
                            }}
                          />
                        )}
                        {/* Section header */}
                        <button
                          onClick={() => toggleSection(section.id)}
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "10px 16px 10px 28px",
                            backgroundColor: "transparent",
                            border: "none",
                            cursor: "pointer",
                            fontFamily: "inherit",
                            textAlign: "left",
                          }}
                        >
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 10 10"
                            fill="none"
                            style={{
                              transition: "transform 0.15s",
                              transform: isSectionOpen
                                ? "rotate(90deg)"
                                : "rotate(0deg)",
                              flexShrink: 0,
                            }}
                          >
                            <path
                              d="M3.5 1.5l3 3-3 3"
                              stroke="var(--color-text-3)"
                              strokeWidth="1.3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <span
                            style={{
                              flex: 1,
                              fontSize: "12px",
                              fontWeight: 500,
                              color: "var(--color-text-2)",
                            }}
                          >
                            {section.name}
                          </span>
                          <span
                            style={{
                              fontSize: "11px",
                              color: "var(--color-text-3)",
                            }}
                          >
                            {section.concepts.length}
                          </span>
                        </button>

                        {/* Concepts under section */}
                        {isSectionOpen && (
                          <div style={{ paddingBottom: "4px" }}>
                            {section.concepts.map((concept) => (
                              <button
                                key={concept.id}
                                onClick={() => onSelect(concept.id)}
                                style={{
                                  width: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  padding: "8px 16px 8px 48px",
                                  backgroundColor: "transparent",
                                  border: "none",
                                  cursor: "pointer",
                                  fontFamily: "inherit",
                                  textAlign: "left",
                                  transition: "background-color 0.1s",
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.backgroundColor =
                                    "var(--color-surface-2)")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.backgroundColor =
                                    "transparent")
                                }
                              >
                                <span
                                  style={{
                                    flex: 1,
                                    fontSize: "13px",
                                    color: "var(--color-text)",
                                  }}
                                >
                                  {concept.name}
                                </span>
                                <span
                                  style={{
                                    fontSize: "11px",
                                    color: "var(--color-text-3)",
                                    flexShrink: 0,
                                  }}
                                >
                                  {concept.questionCount}{" "}
                                  {concept.questionCount === 1 ? "q" : "q\u2019s"}
                                </span>
                              </button>
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
          fontSize: "20px",
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
          fontSize: "13px",
          color: "var(--color-text-3)",
        }}
      >
        All questions from every concept in the section.
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        {tiers.map((tier) => {
          const tierColor = TIER_COLOR[tier.slug] ?? "var(--color-text-3)";
          const tierDim = TIER_DIM[tier.slug] ?? "rgba(139,139,158,0.08)";

          return (
            <div key={tier.id}>
              {/* Tier label */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "10px",
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

              {/* Section cards */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                {tier.sections.map((section) => {
                  const totalQuestions = section.concepts.reduce(
                    (sum, c) => sum + c.questionCount,
                    0,
                  );

                  return (
                    <button
                      key={section.id}
                      onClick={() => onSelect(section.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "14px 16px",
                        backgroundColor: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        textAlign: "left",
                        transition:
                          "border-color 0.15s, background-color 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = tierColor;
                        e.currentTarget.style.backgroundColor = tierDim;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor =
                          "var(--color-border)";
                        e.currentTarget.style.backgroundColor =
                          "var(--color-surface)";
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: 500,
                            color: "var(--color-text)",
                            marginBottom: "2px",
                          }}
                        >
                          {section.name}
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "var(--color-text-3)",
                          }}
                        >
                          {section.concepts.length} concepts ·{" "}
                          {totalQuestions} questions
                        </div>
                      </div>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 16 16"
                        fill="none"
                        style={{ flexShrink: 0 }}
                      >
                        <path
                          d="M6 4l4 4-4 4"
                          stroke="var(--color-text-3)"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
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
          fontSize: "20px",
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
          fontSize: "13px",
          color: "var(--color-text-3)",
        }}
      >
        Every question from all sections in the tier.
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {tiers.map((tier) => {
          const tierColor = TIER_COLOR[tier.slug] ?? "var(--color-text-3)";
          const tierDim = TIER_DIM[tier.slug] ?? "rgba(139,139,158,0.08)";
          const totalQuestions = tier.sections.reduce(
            (sum, s) =>
              sum + s.concepts.reduce((cSum, c) => cSum + c.questionCount, 0),
            0,
          );
          const totalConcepts = tier.sections.reduce(
            (sum, s) => sum + s.concepts.length,
            0,
          );

          return (
            <button
              key={tier.id}
              onClick={() => onSelect(tier.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                padding: "24px 20px",
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "10px",
                cursor: "pointer",
                fontFamily: "inherit",
                textAlign: "left",
                transition:
                  "border-color 0.15s, background-color 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = tierColor;
                e.currentTarget.style.backgroundColor = tierDim;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--color-border)";
                e.currentTarget.style.backgroundColor =
                  "var(--color-surface)";
              }}
            >
              <span
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  backgroundColor: tierColor,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "var(--color-text)",
                    marginBottom: "4px",
                  }}
                >
                  {tier.name}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--color-text-3)",
                  }}
                >
                  {tier.sections.length} sections · {totalConcepts}{" "}
                  concepts · {totalQuestions} questions
                </div>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                style={{ flexShrink: 0 }}
              >
                <path
                  d="M6 4l4 4-4 4"
                  stroke="var(--color-text-3)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Loading ───────────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        paddingTop: "16px",
      }}
    >
      <div className="skeleton" style={{ height: "20px", width: "40%" }} />
      <div
        className="skeleton"
        style={{ height: "48px", width: "100%", borderRadius: "8px" }}
      />
      <div
        className="skeleton"
        style={{ height: "48px", width: "100%", borderRadius: "8px" }}
      />
      <div
        className="skeleton"
        style={{ height: "48px", width: "100%", borderRadius: "8px" }}
      />
      <div
        className="skeleton"
        style={{ height: "48px", width: "100%", borderRadius: "8px" }}
      />
    </div>
  );
}

// ── Quiz Flow ─────────────────────────────────────────────────────────────────

function QuizFlow({
  question,
  index,
  total,
  onMCAnswer,
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
  onNext: () => void;
}) {
  const [answered, setAnswered] = useState(false);

  const handleAnswered = () => setAnswered(true);

  const handleNext = () => {
    setAnswered(false);
    onNext();
  };

  // Reset answered state when question changes
  const [prevIndex, setPrevIndex] = useState(index);
  if (index !== prevIndex) {
    setPrevIndex(index);
    setAnswered(false);
  }

  return (
    <div>
      {/* Progress bar */}
      <div
        style={{
          height: "3px",
          backgroundColor: "var(--color-surface-2)",
          borderRadius: "2px",
          marginBottom: "32px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${((index + 1) / total) * 100}%`,
            backgroundColor: "var(--color-accent)",
            borderRadius: "2px",
            transition: "width 0.3s ease",
          }}
        />
      </div>

      {/* Concept label */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            fontWeight: 500,
            color: "var(--color-text-3)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {question.conceptName}
        </span>
        <span style={{ fontSize: "11px", color: "var(--color-text-3)" }}>
          ·
        </span>
        <span style={{ fontSize: "11px", color: "var(--color-text-3)" }}>
          {question.type === "MC" ? "Multiple Choice" : "Short Answer"}
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
        />
      )}

      {/* Next / Finish button */}
      {answered && (
        <div className="animate-fade-in" style={{ marginTop: "24px" }}>
          <button
            onClick={handleNext}
            style={{
              padding: "10px 24px",
              fontSize: "13px",
              fontWeight: 500,
              fontFamily: "inherit",
              color: "#fff",
              backgroundColor: "var(--color-accent)",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            {index < total - 1 ? "Next Question →" : "View Results"}
          </button>
        </div>
      )}
    </div>
  );
}
