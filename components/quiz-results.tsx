"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { StatusTag, type StatusTagTone } from "@/components/ui/status-tag";

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

  const scoreTagTone: StatusTagTone =
    percentage >= 80 ? "green" : percentage >= 50 ? "gold" : "red";

  const scoreLabel =
    percentage >= 80 ? "Strong" : percentage >= 50 ? "Getting there" : "Keep going";

  // Build answer lookup
  const answerMap = new Map(mcAnswers.map((a) => [a.questionId, a]));

  // Concepts that need review
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
          margin: "0 0 10px",
          fontSize: 32,
          fontWeight: 600,
          color: "var(--color-text)",
          letterSpacing: "-0.025em",
          lineHeight: 1.15,
        }}
      >
        Quiz complete
      </h1>
      <p
        style={{
          margin: "0 0 28px",
          fontSize: 15,
          color: "var(--color-text-2)",
          lineHeight: 1.55,
        }}
      >
        Here&apos;s how you did — review the questions below to cement what you
        learned.
      </p>

      {/* ── Score card ─────────────────────────────────────────── */}
      <div
        style={{
          padding: "32px 28px",
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 14,
          textAlign: "center",
          marginBottom: 32,
          boxShadow: "var(--shadow-card)",
        }}
      >
        {totalMC > 0 && (
          <>
            <div
              style={{
                fontSize: 56,
                fontWeight: 700,
                color: scoreColor,
                letterSpacing: "-0.035em",
                lineHeight: 1,
                marginBottom: 10,
              }}
            >
              {percentage}%
            </div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                fontWeight: 550,
                color: "var(--color-text-2)",
                marginBottom: 4,
              }}
            >
              <StatusTag tone={scoreTagTone} uppercase>
                {scoreLabel}
              </StatusTag>
              <span>
                {correctMC} of {totalMC} multiple choice correct
              </span>
            </div>
          </>
        )}
        {totalSA > 0 && (
          <div
            style={{
              fontSize: 12.5,
              color: "var(--color-text-3)",
              marginTop: totalMC > 0 ? 12 : 0,
              paddingTop: totalMC > 0 ? 12 : 0,
              borderTop: totalMC > 0 ? "1px solid var(--color-border)" : "none",
            }}
          >
            {totalSA} short answer question{totalSA !== 1 ? "s" : ""}{" "}
            (self-assessed)
          </div>
        )}
      </div>

      {/* ── Question Review ────────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <SectionHeading>Question review</SectionHeading>

        {mode === "concept" ? (
          <FlatQuestionList questions={questions} answerMap={answerMap} />
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
        <div style={{ marginBottom: 32 }}>
          <SectionHeading>Review these concepts</SectionHeading>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {needsStudy.map((c) => (
              <StudyLinkRow
                key={c.slug}
                name={c.name}
                slug={c.slug}
                correct={c.correct}
                total={c.total}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Actions ────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          marginBottom: 10,
        }}
      >
        <Button variant="secondary" size="md" onClick={onRetake} fullWidth>
          Retake quiz
        </Button>
        <Button variant="primary" size="md" onClick={onNewQuiz} fullWidth>
          Choose another quiz
        </Button>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
        }}
      >
        <LinkCardButton href="/browse">Browse concepts</LinkCardButton>
        <LinkCardButton href="/dashboard">Dashboard</LinkCardButton>
      </div>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        margin: "0 0 14px",
        fontSize: 11,
        fontWeight: 650,
        color: "var(--color-text-3)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </h2>
  );
}

function LinkCardButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const [hov, setHov] = useState(false);
  return (
    <Link
      href={href}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        height: 34,
        padding: "0 14px",
        fontSize: 13.5,
        fontWeight: 500,
        color: hov ? "var(--color-text)" : "var(--color-text-2)",
        backgroundColor: hov ? "var(--color-surface-2)" : "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 10,
        textDecoration: "none",
        transition: "color 120ms ease, background-color 120ms ease",
        letterSpacing: "-0.005em",
      }}
    >
      {children}
    </Link>
  );
}

function StudyLinkRow({
  name,
  slug,
  correct,
  total,
}: {
  name: string;
  slug: string;
  correct: number;
  total: number;
}) {
  const [hov, setHov] = useState(false);
  return (
    <Link
      href={`/concepts/${slug}`}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        backgroundColor: hov ? "var(--color-accent-soft)" : "var(--color-surface)",
        border: `1px solid ${hov ? "var(--color-accent)" : "var(--color-border)"}`,
        borderRadius: 10,
        textDecoration: "none",
        boxShadow: hov ? "var(--shadow-card-hover)" : "var(--shadow-card)",
        transition:
          "background-color 140ms ease, border-color 140ms ease, box-shadow 140ms ease",
      }}
    >
      <span
        style={{
          fontSize: 14,
          fontWeight: 550,
          color: hov ? "var(--color-accent-on-soft)" : "var(--color-text)",
          letterSpacing: "-0.005em",
          transition: "color 140ms ease",
        }}
      >
        {name}
      </span>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--color-incorrect)",
          }}
        >
          {correct}/{total}
        </span>
        <span
          style={{
            display: "inline-flex",
            color: hov ? "var(--color-accent)" : "var(--color-text-3)",
            transition: "color 140ms ease",
          }}
        >
          <Icon name="chevron-right" size={14} strokeWidth={2} />
        </span>
      </span>
    </Link>
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
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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
      sectionMap.set(q.sectionId, { name: q.sectionName, concepts: new Map() });
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

  // Section mode with a single section — skip outer accordion
  if (mode === "section" && sections.length === 1) {
    const concepts = [...sections[0][1].concepts.values()];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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
                <QuestionRow key={q.id} question={q} answer={answerMap.get(q.id)} />
              ))}
            </ConceptAccordion>
          );
        })}
      </div>
    );
  }

  // Tier/Mixed: two-level accordion
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {sections.map(([sectionId, section]) => {
        const allMCInSection = [...section.concepts.values()]
          .flatMap((c) => c.questions)
          .filter((q) => q.type === "MC");
        const sectionCorrect = allMCInSection.filter(
          (q) => answerMap.get(q.id)?.correct,
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
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: "var(--color-surface)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          padding: "14px 16px",
          backgroundColor: "transparent",
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
          gap: 10,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            color: "var(--color-text-3)",
            transform: open ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 150ms ease",
          }}
        >
          <Icon name="chevron-right" size={14} strokeWidth={2} />
        </span>
        <span
          style={{
            flex: 1,
            textAlign: "left",
            fontSize: 14,
            fontWeight: 600,
            color: "var(--color-text)",
            letterSpacing: "-0.005em",
          }}
        >
          {name}
        </span>
        {total > 0 && (
          <ScoreChip correct={correct} total={total} allCorrect={allCorrect} />
        )}
      </button>
      {open && (
        <div
          className="animate-fade-in"
          style={{ padding: "4px 10px 10px" }}
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
        borderRadius: 10,
        overflow: "hidden",
        backgroundColor: nested ? "transparent" : "var(--color-surface)",
        boxShadow: nested ? "none" : "var(--shadow-card)",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          padding: nested ? "10px 12px" : "12px 14px",
          backgroundColor: nested ? "var(--color-surface-2)" : "transparent",
          border: "none",
          borderRadius: nested ? 8 : undefined,
          cursor: "pointer",
          fontFamily: "inherit",
          gap: 8,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            color: "var(--color-text-3)",
            transform: open ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 150ms ease",
          }}
        >
          <Icon name="chevron-right" size={12} strokeWidth={2} />
        </span>
        <span
          style={{
            flex: 1,
            textAlign: "left",
            fontSize: 13.5,
            fontWeight: 550,
            color: "var(--color-text)",
          }}
        >
          {name}
        </span>
        {total > 0 && (
          <ScoreChip
            correct={correct}
            total={total}
            allCorrect={allCorrect}
            small
          />
        )}
      </button>
      {open && (
        <div
          className="animate-fade-in"
          style={{ padding: nested ? "4px 4px 4px" : "4px 10px 10px" }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function ScoreChip({
  correct,
  total,
  allCorrect,
  small,
}: {
  correct: number;
  total: number;
  allCorrect: boolean;
  small?: boolean;
}) {
  return (
    <StatusTag
      tone={allCorrect ? "green" : "neutral"}
      size={small ? "xs" : "sm"}
      style={{ gap: 4, fontVariantNumeric: "tabular-nums" }}
    >
      {correct}/{total}
      {allCorrect && (
        <span style={{ fontSize: small ? 10 : 11, lineHeight: 1 }}>✓</span>
      )}
    </StatusTag>
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
    if (question.type === "MC" && answer && !answer.correct) return true;
    return false;
  });

  const isMC = question.type === "MC";
  const isCorrect = isMC ? answer?.correct ?? false : null;
  const correctOption = isMC
    ? question.options?.find((o) => o.isCorrect)?.text
    : null;
  const selectedOption =
    isMC && answer && question.options
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
        borderRadius: 8,
        border: `1px solid ${rowBorder}`,
        backgroundColor: rowBg,
        overflow: "hidden",
        marginTop: 4,
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
          gap: 10,
          textAlign: "left",
        }}
      >
        {/* Status indicator */}
        <StatusDot state={isCorrect} />

        {/* Question text */}
        <span
          style={{
            flex: 1,
            fontSize: 13.5,
            color: "var(--color-text)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: expanded ? "normal" : "nowrap",
            lineHeight: 1.4,
            fontWeight: 500,
          }}
        >
          {question.questionText}
        </span>

        {/* Type label */}
        <StatusTag tone="neutral" size="xs" uppercase>
          {isMC ? "MC" : "SA"}
        </StatusTag>

        {/* Expand chevron */}
        <span
          style={{
            display: "inline-flex",
            color: "var(--color-text-3)",
            transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 150ms ease",
            flexShrink: 0,
          }}
        >
          <Icon name="chevron-right" size={12} strokeWidth={2} />
        </span>
      </button>

      {expanded && (
        <div
          className="animate-fade-in"
          style={{
            padding: "0 14px 14px 40px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--color-text-3)",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            {question.conceptName}
          </span>

          {isMC && selectedOption && (
            <div style={{ fontSize: 13.5, lineHeight: 1.55 }}>
              <div style={{ color: "var(--color-text-2)", marginBottom: 3 }}>
                <span style={{ color: "var(--color-text-3)" }}>Your answer: </span>
                <span
                  style={{
                    color: isCorrect ? "var(--color-correct)" : "var(--color-incorrect)",
                    fontWeight: 550,
                  }}
                >
                  {selectedOption}
                </span>
              </div>
              {!isCorrect && correctOption && (
                <div style={{ color: "var(--color-text-2)" }}>
                  <span style={{ color: "var(--color-text-3)" }}>Correct: </span>
                  <span style={{ color: "var(--color-correct)", fontWeight: 550 }}>
                    {correctOption}
                  </span>
                </div>
              )}
            </div>
          )}

          {!isMC && (
            <div style={{ fontSize: 13.5, color: "var(--color-text-2)", lineHeight: 1.6 }}>
              <span style={{ color: "var(--color-text-3)", fontWeight: 600 }}>
                Model answer:{" "}
              </span>
              {question.answerExplanation}
            </div>
          )}

          {isMC && (
            <div
              style={{
                fontSize: 13.5,
                color: "var(--color-text)",
                lineHeight: 1.65,
                paddingTop: 8,
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

function StatusDot({ state }: { state: boolean | null }) {
  const bg =
    state === true
      ? "var(--color-correct)"
      : state === false
        ? "var(--color-incorrect)"
        : "var(--color-surface-2)";
  const fg =
    state === null ? "var(--color-text-3)" : "#fff";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 22,
        height: 22,
        borderRadius: "50%",
        backgroundColor: bg,
        color: fg,
        fontSize: 12,
        fontWeight: 650,
        flexShrink: 0,
        lineHeight: 1,
      }}
      aria-hidden
    >
      {state === true ? "✓" : state === false ? "✗" : "–"}
    </span>
  );
}
