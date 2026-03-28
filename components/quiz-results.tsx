"use client";

import { useState } from "react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

export type QuizQuestion = {
  id: string;
  type: "MC" | "SHORT_ANSWER";
  questionText: string;
  options: { text: string; isCorrect: boolean }[] | null;
  answerExplanation: string;
  conceptName: string;
  conceptSlug: string;
  sectionName: string;
  sectionId: string;
};

export type MCAnswer = {
  questionId: string;
  correct: boolean;
  selectedIndex: number;
};

type QuizMode = "concept" | "section" | "tier" | "mixed";

// ── Main Results Component ────────────────────────────────────────────────────

export function QuizResults({
  questions,
  mcAnswers,
  mode,
  onRetake,
  onNewQuiz,
}: {
  questions: QuizQuestion[];
  mcAnswers: MCAnswer[];
  mode: QuizMode;
  onRetake: () => void;
  onNewQuiz: () => void;
}) {
  const totalMC = questions.filter((q) => q.type === "MC").length;
  const correctMC = mcAnswers.filter((a) => a.correct).length;
  const totalSA = questions.filter((q) => q.type === "SHORT_ANSWER").length;
  const percentage = totalMC > 0 ? Math.round((correctMC / totalMC) * 100) : 0;

  const scoreColor =
    percentage >= 80
      ? "var(--color-correct)"
      : percentage >= 50
        ? "var(--color-gold)"
        : "var(--color-incorrect)";

  // Build answer lookup
  const answerMap = new Map(mcAnswers.map((a) => [a.questionId, a]));

  // Identify concepts with wrong answers for study links
  const conceptScores = new Map<
    string,
    { name: string; slug: string; correct: number; total: number }
  >();
  for (const q of questions) {
    if (q.type !== "MC") continue;
    const entry = conceptScores.get(q.conceptSlug) ?? {
      name: q.conceptName,
      slug: q.conceptSlug,
      correct: 0,
      total: 0,
    };
    entry.total++;
    if (answerMap.get(q.id)?.correct) entry.correct++;
    conceptScores.set(q.conceptSlug, entry);
  }
  const needsStudy = [...conceptScores.values()]
    .filter((c) => c.correct < c.total)
    .sort((a, b) => a.correct / a.total - b.correct / b.total);

  return (
    <div className="animate-fade-in">
      {/* ── Header ─────────────────────────────────────────────── */}
      <h1
        style={{
          margin: "0 0 8px",
          fontSize: "24px",
          fontWeight: 600,
          color: "var(--color-text)",
          letterSpacing: "-0.02em",
        }}
      >
        Quiz Complete
      </h1>
      <p
        style={{
          margin: "0 0 28px",
          fontSize: "14px",
          color: "var(--color-text-2)",
          lineHeight: "1.6",
        }}
      >
        Here's how you did.
      </p>

      {/* ── Score card ─────────────────────────────────────────── */}
      <div
        style={{
          padding: "28px",
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "10px",
          textAlign: "center",
          marginBottom: "28px",
        }}
      >
        {totalMC > 0 && (
          <>
            <div
              style={{
                fontSize: "48px",
                fontWeight: 700,
                color: scoreColor,
                letterSpacing: "-0.03em",
                lineHeight: 1,
                marginBottom: "8px",
              }}
            >
              {percentage}%
            </div>
            <div
              style={{
                fontSize: "15px",
                color: "var(--color-text-2)",
                marginBottom: "4px",
              }}
            >
              {correctMC} of {totalMC} multiple choice correct
            </div>
          </>
        )}
        {totalSA > 0 && (
          <div
            style={{
              fontSize: "13px",
              color: "var(--color-text-3)",
              marginTop: totalMC > 0 ? "10px" : "0",
              paddingTop: totalMC > 0 ? "10px" : "0",
              borderTop: totalMC > 0 ? "1px solid var(--color-border)" : "none",
            }}
          >
            {totalSA} short answer question{totalSA !== 1 ? "s" : ""}{" "}
            (self-assessed)
          </div>
        )}
      </div>

      {/* ── Question Review ────────────────────────────────────── */}
      <div style={{ marginBottom: "28px" }}>
        <h2
          style={{
            margin: "0 0 12px",
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--color-text-2)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          Question Review
        </h2>

        {mode === "concept" ? (
          <FlatQuestionList
            questions={questions}
            answerMap={answerMap}
          />
        ) : (
          <GroupedQuestionList
            questions={questions}
            answerMap={answerMap}
            mode={mode}
          />
        )}
      </div>

      {/* ── Study Links ────────────────────────────────────────── */}
      {needsStudy.length > 0 && (
        <div style={{ marginBottom: "28px" }}>
          <h2
            style={{
              margin: "0 0 12px",
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--color-text-2)",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Review these concepts
          </h2>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            {needsStudy.map((c) => (
              <Link
                key={c.slug}
                href={`/concepts/${c.slug}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "6px",
                  textDecoration: "none",
                  transition: "background-color 0.12s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "var(--color-surface-2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "var(--color-surface)";
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    color: "var(--color-text)",
                    fontWeight: 500,
                  }}
                >
                  {c.name}
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--color-incorrect)",
                    fontWeight: 500,
                  }}
                >
                  {c.correct}/{c.total}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Actions ────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button
          onClick={onRetake}
          style={{
            flex: 1,
            minWidth: "140px",
            padding: "12px 20px",
            fontSize: "13px",
            fontWeight: 500,
            fontFamily: "inherit",
            color: "var(--color-text)",
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "background-color 0.12s",
          }}
        >
          Retake Quiz
        </button>
        <button
          onClick={onNewQuiz}
          style={{
            flex: 1,
            minWidth: "140px",
            padding: "12px 20px",
            fontSize: "13px",
            fontWeight: 500,
            fontFamily: "inherit",
            color: "#fff",
            backgroundColor: "var(--color-accent)",
            border: "1px solid var(--color-accent)",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "opacity 0.12s",
          }}
        >
          Choose Another Quiz
        </button>
      </div>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "10px" }}>
        <Link
          href="/browse"
          style={{
            flex: 1,
            minWidth: "140px",
            padding: "12px 20px",
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--color-text-2)",
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "8px",
            textDecoration: "none",
            textAlign: "center",
            transition: "background-color 0.12s",
          }}
        >
          Browse Concepts
        </Link>
        <Link
          href="/dashboard"
          style={{
            flex: 1,
            minWidth: "140px",
            padding: "12px 20px",
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--color-text-2)",
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "8px",
            textDecoration: "none",
            textAlign: "center",
            transition: "background-color 0.12s",
          }}
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}

// ── Flat Question List (Concept mode) ─────────────────────────────────────────

function FlatQuestionList({
  questions,
  answerMap,
}: {
  questions: QuizQuestion[];
  answerMap: Map<string, MCAnswer>;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      {questions.map((q) => (
        <QuestionRow key={q.id} question={q} answer={answerMap.get(q.id)} />
      ))}
    </div>
  );
}

// ── Grouped Question List (Section/Tier/Mixed modes) ──────────────────────────

function GroupedQuestionList({
  questions,
  answerMap,
  mode,
}: {
  questions: QuizQuestion[];
  answerMap: Map<string, MCAnswer>;
  mode: QuizMode;
}) {
  // Group by section, then by concept within section
  const sectionMap = new Map<
    string,
    {
      name: string;
      concepts: Map<
        string,
        { name: string; slug: string; questions: QuizQuestion[] }
      >;
    }
  >();

  for (const q of questions) {
    if (!sectionMap.has(q.sectionId)) {
      sectionMap.set(q.sectionId, {
        name: q.sectionName,
        concepts: new Map(),
      });
    }
    const section = sectionMap.get(q.sectionId)!;
    if (!section.concepts.has(q.conceptSlug)) {
      section.concepts.set(q.conceptSlug, {
        name: q.conceptName,
        slug: q.conceptSlug,
        questions: [],
      });
    }
    section.concepts.get(q.conceptSlug)!.questions.push(q);
  }

  const sections = [...sectionMap.entries()];

  // For section mode with only one section, skip the section-level accordion
  if (mode === "section" && sections.length === 1) {
    const concepts = [...sections[0][1].concepts.values()];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {concepts.map((c) => {
          const conceptMCAnswers = c.questions
            .filter((q) => q.type === "MC")
            .map((q) => answerMap.get(q.id))
            .filter(Boolean) as MCAnswer[];
          const correct = conceptMCAnswers.filter((a) => a.correct).length;
          const total = conceptMCAnswers.length;
          const hasWrong = correct < total;

          return (
            <ConceptAccordion
              key={c.slug}
              name={c.name}
              correct={correct}
              total={total}
              defaultOpen={hasWrong}
            >
              {c.questions.map((q) => (
                <QuestionRow
                  key={q.id}
                  question={q}
                  answer={answerMap.get(q.id)}
                />
              ))}
            </ConceptAccordion>
          );
        })}
      </div>
    );
  }

  // Tier/Mixed: two-level accordion (Section → Concept → Questions)
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {sections.map(([sectionId, section]) => {
        const allMCInSection = [...section.concepts.values()]
          .flatMap((c) => c.questions)
          .filter((q) => q.type === "MC");
        const sectionCorrect = allMCInSection.filter(
          (q) => answerMap.get(q.id)?.correct
        ).length;
        const sectionTotal = allMCInSection.length;
        const sectionHasWrong = sectionCorrect < sectionTotal;

        return (
          <SectionAccordion
            key={sectionId}
            name={section.name}
            correct={sectionCorrect}
            total={sectionTotal}
            defaultOpen={sectionHasWrong}
          >
            {[...section.concepts.values()].map((c) => {
              const conceptMCAnswers = c.questions
                .filter((q) => q.type === "MC")
                .map((q) => answerMap.get(q.id))
                .filter(Boolean) as MCAnswer[];
              const correct = conceptMCAnswers.filter((a) => a.correct).length;
              const total = conceptMCAnswers.length;
              const hasWrong = correct < total;

              return (
                <ConceptAccordion
                  key={c.slug}
                  name={c.name}
                  correct={correct}
                  total={total}
                  defaultOpen={hasWrong}
                  nested
                >
                  {c.questions.map((q) => (
                    <QuestionRow
                      key={q.id}
                      question={q}
                      answer={answerMap.get(q.id)}
                    />
                  ))}
                </ConceptAccordion>
              );
            })}
          </SectionAccordion>
        );
      })}
    </div>
  );
}

// ── Section Accordion ─────────────────────────────────────────────────────────

function SectionAccordion({
  name,
  correct,
  total,
  defaultOpen,
  children,
}: {
  name: string;
  correct: number;
  total: number;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const allCorrect = total > 0 && correct === total;

  return (
    <div
      style={{
        border: "1px solid var(--color-border)",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          padding: "12px 14px",
          backgroundColor: "var(--color-surface)",
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
          gap: "10px",
        }}
      >
        <span
          style={{
            fontSize: "10px",
            color: "var(--color-text-3)",
            transform: open ? "rotate(0deg)" : "rotate(-90deg)",
            transition: "transform 0.15s",
          }}
        >
          ▾
        </span>
        <span
          style={{
            flex: 1,
            textAlign: "left",
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--color-text)",
          }}
        >
          {name}
        </span>
        {total > 0 && (
          <span
            style={{
              fontSize: "12px",
              fontWeight: 500,
              color: allCorrect
                ? "var(--color-correct)"
                : "var(--color-text-3)",
            }}
          >
            {correct}/{total}
            {allCorrect ? " ✓" : ""}
          </span>
        )}
      </button>
      {open && (
        <div
          className="animate-fade-in"
          style={{ padding: "2px 8px 8px" }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ── Concept Accordion ─────────────────────────────────────────────────────────

function ConceptAccordion({
  name,
  correct,
  total,
  defaultOpen,
  nested,
  children,
}: {
  name: string;
  correct: number;
  total: number;
  defaultOpen: boolean;
  nested?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const allCorrect = total > 0 && correct === total;

  return (
    <div
      style={{
        border: nested ? "none" : "1px solid var(--color-border)",
        borderRadius: nested ? "4px" : "8px",
        overflow: "hidden",
        backgroundColor: nested ? "transparent" : undefined,
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          padding: nested ? "8px 10px" : "10px 14px",
          backgroundColor: nested
            ? "var(--color-surface-2)"
            : "var(--color-surface)",
          border: "none",
          borderRadius: nested ? "4px" : undefined,
          cursor: "pointer",
          fontFamily: "inherit",
          gap: "8px",
        }}
      >
        <span
          style={{
            fontSize: "9px",
            color: "var(--color-text-3)",
            transform: open ? "rotate(0deg)" : "rotate(-90deg)",
            transition: "transform 0.15s",
          }}
        >
          ▾
        </span>
        <span
          style={{
            flex: 1,
            textAlign: "left",
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--color-text)",
          }}
        >
          {name}
        </span>
        {total > 0 && (
          <span
            style={{
              fontSize: "12px",
              fontWeight: 500,
              color: allCorrect
                ? "var(--color-correct)"
                : "var(--color-text-3)",
            }}
          >
            {correct}/{total}
            {allCorrect ? " ✓" : ""}
          </span>
        )}
      </button>
      {open && (
        <div
          className="animate-fade-in"
          style={{ padding: nested ? "2px 4px 4px" : "2px 8px 8px" }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ── Individual Question Row ───────────────────────────────────────────────────

function QuestionRow({
  question,
  answer,
}: {
  question: QuizQuestion;
  answer?: MCAnswer;
}) {
  const [expanded, setExpanded] = useState(() => {
    // Wrong MC answers expanded by default, everything else collapsed
    if (question.type === "MC" && answer && !answer.correct) return true;
    return false;
  });

  const isMC = question.type === "MC";
  const isCorrect = isMC ? answer?.correct ?? false : null; // null = SA, not scored
  const correctOption = isMC
    ? question.options?.find((o) => o.isCorrect)?.text
    : null;
  const selectedOption = isMC && answer && question.options
    ? question.options[answer.selectedIndex]?.text
    : null;

  const rowBg =
    isCorrect === true
      ? "var(--color-correct-dim)"
      : isCorrect === false
        ? "var(--color-incorrect-dim)"
        : "var(--color-surface)";
  const rowBorder =
    isCorrect === true
      ? "var(--color-correct-border)"
      : isCorrect === false
        ? "var(--color-incorrect-border)"
        : "var(--color-border)";

  return (
    <div
      style={{
        borderRadius: "6px",
        border: `1px solid ${rowBorder}`,
        backgroundColor: rowBg,
        overflow: "hidden",
        marginTop: "4px",
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          padding: "10px 12px",
          backgroundColor: "transparent",
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
          gap: "8px",
          textAlign: "left",
        }}
      >
        {/* Status icon */}
        <span
          style={{
            fontSize: "12px",
            flexShrink: 0,
            width: "18px",
            textAlign: "center",
          }}
        >
          {isCorrect === true ? (
            <span style={{ color: "var(--color-correct)" }}>✓</span>
          ) : isCorrect === false ? (
            <span style={{ color: "var(--color-incorrect)" }}>✗</span>
          ) : (
            <span style={{ color: "var(--color-text-3)" }}>—</span>
          )}
        </span>

        {/* Question text (truncated) */}
        <span
          style={{
            flex: 1,
            fontSize: "13px",
            color: "var(--color-text)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: expanded ? "normal" : "nowrap",
            lineHeight: "1.4",
          }}
        >
          {question.questionText}
        </span>

        {/* Type label */}
        <span
          style={{
            fontSize: "10px",
            color: "var(--color-text-3)",
            flexShrink: 0,
            letterSpacing: "0.02em",
          }}
        >
          {isMC ? "MC" : "SA"}
        </span>

        {/* Expand chevron */}
        <span
          style={{
            fontSize: "9px",
            color: "var(--color-text-3)",
            transform: expanded ? "rotate(0deg)" : "rotate(-90deg)",
            transition: "transform 0.15s",
            flexShrink: 0,
          }}
        >
          ▾
        </span>
      </button>

      {expanded && (
        <div
          className="animate-fade-in"
          style={{
            padding: "0 12px 12px 38px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {/* Concept label */}
          <span
            style={{
              fontSize: "11px",
              color: "var(--color-text-3)",
            }}
          >
            {question.conceptName}
          </span>

          {/* MC answer details */}
          {isMC && selectedOption && (
            <div style={{ fontSize: "13px", lineHeight: "1.5" }}>
              <div style={{ color: "var(--color-text-2)" }}>
                <span style={{ color: "var(--color-text-3)" }}>
                  Your answer:{" "}
                </span>
                <span
                  style={{
                    color: isCorrect
                      ? "var(--color-correct)"
                      : "var(--color-incorrect)",
                  }}
                >
                  {selectedOption}
                </span>
              </div>
              {!isCorrect && correctOption && (
                <div style={{ color: "var(--color-text-2)" }}>
                  <span style={{ color: "var(--color-text-3)" }}>
                    Correct:{" "}
                  </span>
                  <span style={{ color: "var(--color-correct)" }}>
                    {correctOption}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* SA: show model answer */}
          {!isMC && (
            <div style={{ fontSize: "13px", color: "var(--color-text-2)" }}>
              <span style={{ color: "var(--color-text-3)" }}>
                Model answer:{" "}
              </span>
              {question.answerExplanation}
            </div>
          )}

          {/* Explanation */}
          {isMC && (
            <div
              style={{
                fontSize: "13px",
                color: "var(--color-text-2)",
                lineHeight: "1.6",
                paddingTop: "4px",
                borderTop: "1px solid var(--color-border-subtle)",
              }}
            >
              {question.answerExplanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
