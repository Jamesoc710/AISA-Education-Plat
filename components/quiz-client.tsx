"use client";

import { useState } from "react";
import Link from "next/link";
import { MCQuestion } from "@/components/quiz-mc";
import { ShortAnswerQuestion } from "@/components/quiz-short-answer";
import { QuizResults } from "@/components/quiz-results";
import type {
  QuizQuestion,
  MCAnswer,
} from "@/components/quiz-results";

// ── Types ─────────────────────────────────────────────────────────────────────

type ConceptOption = { id: string; name: string; questionCount: number };
type SectionOption = {
  id: string;
  name: string;
  tierName: string;
  tierSlug: string;
  conceptCount: number;
};
type TierOption = {
  id: string;
  name: string;
  slug: string;
  questionCount: number;
};

type QuizMode = "concept" | "section" | "tier" | "mixed";
type Phase = "select" | "loading" | "quiz" | "summary";

// ── Tier color helper ─────────────────────────────────────────────────────────

const TIER_COLOR: Record<string, string> = {
  fundamentals: "var(--color-gold)",
  intermediate: "var(--color-blue)",
  advanced: "var(--color-slate)",
};

// ── Main Component ────────────────────────────────────────────────────────────

export function QuizClient({
  concepts,
  sections,
  tiers,
}: {
  concepts: ConceptOption[];
  sections: SectionOption[];
  tiers: TierOption[];
}) {
  const [phase, setPhase] = useState<Phase>("select");
  const [mode, setMode] = useState<QuizMode | null>(null);
  const [selectedId, setSelectedId] = useState<string>("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mcAnswers, setMcAnswers] = useState<MCAnswer[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch questions and start quiz ──────────────────────────────────────

  const startQuiz = async () => {
    if (!mode) return;
    if ((mode === "concept" || mode === "section" || mode === "tier") && !selectedId) return;

    setPhase("loading");
    setError(null);

    try {
      const params = new URLSearchParams({ mode });
      if (selectedId) params.set("id", selectedId);

      const res = await fetch(`/api/quiz?${params}`);
      if (!res.ok) throw new Error("Failed to fetch questions");

      const data = await res.json();
      if (!data.questions?.length) {
        setError("No questions found for this selection.");
        setPhase("select");
        return;
      }

      setQuestions(data.questions);
      setCurrentIndex(0);
      setMcAnswers([]);
      setPhase("quiz");
    } catch {
      setError("Something went wrong loading the quiz. Please try again.");
      setPhase("select");
    }
  };

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleMCAnswer = (questionId: string, correct: boolean, selectedIndex: number) => {
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
    setPhase("select");
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
        <div style={{ width: "100%", maxWidth: "640px" }}>
          {phase === "select" && (
            <ModeSelection
              mode={mode}
              setMode={setMode}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              concepts={concepts}
              sections={sections}
              tiers={tiers}
              onStart={startQuiz}
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

// ── Mode Selection Screen ─────────────────────────────────────────────────────

function ModeSelection({
  mode,
  setMode,
  selectedId,
  setSelectedId,
  concepts,
  sections,
  tiers,
  onStart,
  error,
}: {
  mode: QuizMode | null;
  setMode: (m: QuizMode) => void;
  selectedId: string;
  setSelectedId: (id: string) => void;
  concepts: ConceptOption[];
  sections: SectionOption[];
  tiers: TierOption[];
  onStart: () => void;
  error: string | null;
}) {
  const modes: { key: QuizMode; label: string; desc: string }[] = [
    {
      key: "concept",
      label: "By Concept",
      desc: "Pick a specific concept and get its questions",
    },
    {
      key: "section",
      label: "By Section",
      desc: "Mixed questions across all concepts in a section",
    },
    {
      key: "tier",
      label: "By Tier",
      desc: "All questions from a difficulty tier",
    },
    {
      key: "mixed",
      label: "Mixed / All Topics",
      desc: "Randomized questions across every topic",
    },
  ];

  const canStart =
    mode === "mixed" || (mode && selectedId);

  // Custom select dropdown SVG
  const selectChevron = `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%235a5a6a' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`;

  const selectStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    backgroundColor: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "6px",
    fontSize: "13px",
    fontFamily: "inherit",
    cursor: "pointer",
    appearance: "none" as const,
    backgroundImage: selectChevron,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 14px center",
  };

  return (
    <div>
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
        Test your understanding of AI concepts. Choose a quiz mode to get started.
      </p>

      {/* Mode cards */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          marginBottom: "28px",
        }}
      >
        {modes.map((m) => {
          const isSelected = mode === m.key;
          return (
            <button
              key={m.key}
              onClick={() => {
                setMode(m.key);
                setSelectedId("");
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "16px 18px",
                backgroundColor: isSelected
                  ? "var(--color-surface-2)"
                  : "var(--color-surface)",
                border: `1px solid ${isSelected ? "var(--color-accent)" : "var(--color-border)"}`,
                borderRadius: "8px",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "inherit",
                transition: "border-color 0.12s, background-color 0.12s",
              }}
            >
              {/* Radio circle */}
              <span
                style={{
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  border: `2px solid ${isSelected ? "var(--color-accent)" : "var(--color-border)"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "border-color 0.12s",
                }}
              >
                {isSelected && (
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: "var(--color-accent)",
                    }}
                  />
                )}
              </span>

              <div>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "var(--color-text)",
                    marginBottom: "2px",
                  }}
                >
                  {m.label}
                </div>
                <div style={{ fontSize: "12px", color: "var(--color-text-3)" }}>
                  {m.desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Concept selector */}
      {mode === "concept" && (
        <div style={{ marginBottom: "28px" }}>
          <label
            style={{
              display: "block",
              fontSize: "12px",
              fontWeight: 500,
              color: "var(--color-text-2)",
              marginBottom: "8px",
            }}
          >
            Select a concept
          </label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            style={{
              ...selectStyle,
              color: selectedId ? "var(--color-text)" : "var(--color-text-3)",
            }}
          >
            <option value="">Choose a concept…</option>
            {concepts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.questionCount} questions)
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Section selector */}
      {mode === "section" && (
        <div style={{ marginBottom: "28px" }}>
          <label
            style={{
              display: "block",
              fontSize: "12px",
              fontWeight: 500,
              color: "var(--color-text-2)",
              marginBottom: "8px",
            }}
          >
            Select a section
          </label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            style={{
              ...selectStyle,
              color: selectedId ? "var(--color-text)" : "var(--color-text-3)",
            }}
          >
            <option value="">Choose a section…</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.tierName} › {s.name} ({s.conceptCount} concepts)
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Tier selector */}
      {mode === "tier" && (
        <div style={{ marginBottom: "28px" }}>
          <label
            style={{
              display: "block",
              fontSize: "12px",
              fontWeight: 500,
              color: "var(--color-text-2)",
              marginBottom: "8px",
            }}
          >
            Select a tier
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {tiers.map((t) => {
              const isSelected = selectedId === t.id;
              const tierColor = TIER_COLOR[t.slug] ?? "var(--color-text-3)";
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "12px 14px",
                    backgroundColor: isSelected
                      ? "var(--color-surface-2)"
                      : "var(--color-surface)",
                    border: `1px solid ${isSelected ? tierColor : "var(--color-border)"}`,
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    textAlign: "left",
                    transition: "border-color 0.12s, background-color 0.12s",
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
                      fontWeight: 500,
                      color: "var(--color-text)",
                    }}
                  >
                    {t.name}
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      color: "var(--color-text-3)",
                    }}
                  >
                    {t.questionCount} questions
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Error */}
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

      {/* Start button */}
      <button
        onClick={onStart}
        disabled={!canStart}
        style={{
          width: "100%",
          padding: "12px 20px",
          fontSize: "14px",
          fontWeight: 500,
          fontFamily: "inherit",
          color: canStart ? "#fff" : "var(--color-text-3)",
          backgroundColor: canStart
            ? "var(--color-accent)"
            : "var(--color-surface-2)",
          border: `1px solid ${canStart ? "var(--color-accent)" : "var(--color-border)"}`,
          borderRadius: "8px",
          cursor: canStart ? "pointer" : "not-allowed",
          transition: "opacity 0.12s",
        }}
      >
        Start Quiz
      </button>
    </div>
  );
}

// ── Loading ───────────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingTop: "16px" }}>
      <div className="skeleton" style={{ height: "20px", width: "40%" }} />
      <div className="skeleton" style={{ height: "48px", width: "100%", borderRadius: "8px" }} />
      <div className="skeleton" style={{ height: "48px", width: "100%", borderRadius: "8px" }} />
      <div className="skeleton" style={{ height: "48px", width: "100%", borderRadius: "8px" }} />
      <div className="skeleton" style={{ height: "48px", width: "100%", borderRadius: "8px" }} />
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
  onMCAnswer: (questionId: string, correct: boolean, selectedIndex: number) => void;
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
