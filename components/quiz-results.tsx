"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { StatusTag, type StatusTagTone } from "@/components/ui/status-tag";
import type { MCResult } from "@/components/quiz-mc";
import type { SAResult } from "@/components/quiz-short-answer";

// ── Types ─────────────────────────────────────────────────────────────────────

export type QuizQuestion = {
  id: string;
  type: "MC" | "SHORT_ANSWER";
  questionText: string;
  options: { text: string }[] | null;
  conceptId: string;
  conceptName: string;
  conceptSlug: string;
  sectionName: string;
  sectionId: string;
};

export type AnswerResult = MCResult | SAResult;
export type ResultMap = Map<string, AnswerResult>;

type Outcome = "correct" | "partial" | "incorrect" | null;

/** null = not answered, or a short answer the grader couldn't score. */
function outcomeOf(result: AnswerResult | undefined): Outcome {
  if (!result) return null;
  if (result.type === "MC") return result.isCorrect ? "correct" : "incorrect";
  if (result.gradingFailed) return null;
  return result.score;
}

function tally(questions: QuizQuestion[], results: ResultMap) {
  let correct = 0;
  let partial = 0;
  let scored = 0;
  for (const q of questions) {
    const o = outcomeOf(results.get(q.id));
    if (o === null) continue;
    scored++;
    if (o === "correct") correct++;
    else if (o === "partial") partial++;
  }
  return { correct, partial, scored };
}

type QuizMode = "concept" | "section" | "tier" | "mixed" | "review";

// ── Main Results Component ────────────────────────────────────────────────────

export function QuizResults({
  questions,
  results,
  mode,
  onRetake,
  onNewQuiz,
}: {
  questions: QuizQuestion[];
  results: ResultMap;
  mode: QuizMode;
  onRetake: () => void;
  onNewQuiz: () => void;
}) {
  const { correct, partial, scored } = tally(questions, results);
  // Partial short answers count as half.
  const percentage = scored > 0 ? Math.round(((correct + partial / 2) / scored) * 100) : 0;
  const unscored = questions.length - scored;

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

  // Concepts that need review
  const conceptScores = new Map<
    string,
    { name: string; slug: string; correct: number; total: number }
  >();
  for (const q of questions) {
    const o = outcomeOf(results.get(q.id));
    if (o === null) continue;
    const entry = conceptScores.get(q.conceptSlug) ?? {
      name: q.conceptName,
      slug: q.conceptSlug,
      correct: 0,
      total: 0,
    };
    entry.total++;
    if (o === "correct") entry.correct++;
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
          fontSize: "var(--text-3xl)",
          fontWeight: 600,
          color: "var(--color-text)",
          letterSpacing: "-0.025em",
          lineHeight: 1.15,
        }}
      >
        {mode === "review" ? "Review complete" : "Quiz complete"}
      </h1>
      <p
        style={{
          margin: "0 0 28px",
          fontSize: "var(--text-md)",
          color: "var(--color-text-2)",
          lineHeight: 1.55,
        }}
      >
        {mode === "review"
          ? "Misses come back tomorrow. Correct answers move further out, so each concept returns right before you'd forget it."
          : "Here's how you did. Anything you missed is now in your review queue."}
      </p>

      {/* ── Score card ─────────────────────────────────────────── */}
      <div
        style={{
          padding: "32px 28px",
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-3)",
          textAlign: "center",
          marginBottom: "var(--space-6)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {scored > 0 && (
          <>
            <div
              style={{
                fontSize: "var(--text-display)",
                fontWeight: 700,
                color: scoreColor,
                letterSpacing: "-0.035em",
                lineHeight: 1,
                marginBottom: "var(--space-3)",
              }}
            >
              {percentage}%
            </div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--space-2)",
                fontSize: "var(--text-sm)",
                fontWeight: 550,
                color: "var(--color-text-2)",
                marginBottom: "var(--space-1)",
              }}
            >
              <StatusTag tone={scoreTagTone} uppercase>
                {scoreLabel}
              </StatusTag>
              <span>
                {correct} of {scored} correct
                {partial > 0 ? `, ${partial} partly right` : ""}
              </span>
            </div>
          </>
        )}
        {unscored > 0 && (
          <div
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--color-text-3)",
              marginTop: scored > 0 ? 12 : 0,
              paddingTop: scored > 0 ? 12 : 0,
              borderTop: scored > 0 ? "1px solid var(--color-border)" : "none",
            }}
          >
            {unscored} question{unscored !== 1 ? "s" : ""} not scored
          </div>
        )}
      </div>

      {/* ── Question Review ────────────────────────────────────── */}
      <div style={{ marginBottom: "var(--space-6)" }}>
        <SectionHeading>Question review</SectionHeading>

        {mode === "concept" ? (
          <FlatQuestionList questions={questions} results={results} />
        ) : (
          <GroupedQuestionList
            questions={questions}
            results={results}
            mode={mode}
          />
        )}
      </div>

      {/* ── Study Links ────────────────────────────────────────── */}
      {needsStudy.length > 0 && (
        <div style={{ marginBottom: "var(--space-6)" }}>
          <SectionHeading>Review these concepts</SectionHeading>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
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
          gap: "var(--space-3)",
          marginBottom: "var(--space-3)",
        }}
      >
        <Button variant="secondary" size="md" onClick={onRetake} fullWidth>
          Retake quiz
        </Button>
        <Button variant="primary" size="md" onClick={onNewQuiz} fullWidth>
          {mode === "review" ? "Back to practice" : "Choose another quiz"}
        </Button>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "var(--space-3)",
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
        fontSize: "var(--text-xs)",
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
        fontSize: "var(--text-sm)",
        fontWeight: 500,
        color: hov ? "var(--color-text)" : "var(--color-text-2)",
        backgroundColor: hov ? "var(--color-surface-2)" : "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-2)",
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
        borderRadius: "var(--radius-2)",
        textDecoration: "none",
        boxShadow: hov ? "var(--shadow-card-hover)" : "var(--shadow-card)",
        transition:
          "background-color 140ms ease, border-color 140ms ease, box-shadow 140ms ease",
      }}
    >
      <span
        style={{
          fontSize: "var(--text-base)",
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
          gap: "var(--space-2)",
        }}
      >
        <span
          style={{
            fontSize: "var(--text-xs)",
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
  results,
}: {
  questions: QuizQuestion[];
  results: ResultMap;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      {questions.map((q) => (
        <QuestionRow key={q.id} question={q} result={results.get(q.id)} />
      ))}
    </div>
  );
}

// ── Grouped Question List (Section/Tier/Mixed modes) ──────────────────────────

function GroupedQuestionList({
  questions,
  results,
  mode,
}: {
  questions: QuizQuestion[];
  results: ResultMap;
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
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        {concepts.map((c) => {
          const { correct, scored: total } = tally(c.questions, results);
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
                <QuestionRow key={q.id} question={q} result={results.get(q.id)} />
              ))}
            </ConceptAccordion>
          );
        })}
      </div>
    );
  }

  // Tier/Mixed: two-level accordion
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      {sections.map(([sectionId, section]) => {
        const { correct: sectionCorrect, scored: sectionTotal } = tally(
          [...section.concepts.values()].flatMap((c) => c.questions),
          results,
        );
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
              const { correct, scored: total } = tally(c.questions, results);
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
                      result={results.get(q.id)}
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
        borderRadius: "var(--radius-3)",
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
          gap: "var(--space-3)",
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
            fontSize: "var(--text-base)",
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
        borderRadius: "var(--radius-2)",
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
          gap: "var(--space-2)",
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
            fontSize: "var(--text-sm)",
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
      style={{ gap: "var(--space-1)", fontVariantNumeric: "tabular-nums" }}
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
  result,
}: {
  question: QuizQuestion;
  result?: AnswerResult;
}) {
  const outcome = outcomeOf(result);
  const [expanded, setExpanded] = useState(() => outcome === "incorrect" || outcome === "partial");

  const rowBg =
    outcome === "correct"
      ? "var(--color-correct-dim)"
      : outcome === "incorrect"
        ? "var(--color-incorrect-dim)"
        : outcome === "partial"
          ? "var(--color-gold-soft)"
          : "var(--color-surface)";
  const rowBorder =
    outcome === "correct"
      ? "var(--color-correct-border)"
      : outcome === "incorrect"
        ? "var(--color-incorrect-border)"
        : "var(--color-border)";

  const detail = { fontSize: "var(--text-sm)", lineHeight: 1.55, color: "var(--color-text-2)" } as const;
  const label = { color: "var(--color-text-3)" } as const;

  return (
    <div
      style={{
        borderRadius: "var(--radius-2)",
        border: `1px solid ${rowBorder}`,
        backgroundColor: rowBg,
        overflow: "hidden",
        marginTop: "var(--space-1)",
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          padding: "10px 12px",
          backgroundColor: "transparent",
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
          gap: "var(--space-3)",
          textAlign: "left",
        }}
      >
        <StatusDot outcome={outcome} />

        <span
          style={{
            flex: 1,
            fontSize: "var(--text-sm)",
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

        <StatusTag tone="neutral" size="xs" uppercase>
          {question.type === "MC" ? "MC" : "SA"}
        </StatusTag>

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
            gap: "var(--space-3)",
          }}
        >
          <span
            style={{
              fontSize: "var(--text-xs)",
              fontWeight: 600,
              color: "var(--color-text-3)",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            {question.conceptName}
          </span>

          {!result && <div style={detail}>Not answered.</div>}

          {result?.type === "MC" && (
            <>
              <div style={detail}>
                <div style={{ marginBottom: 3 }}>
                  <span style={label}>Your answer: </span>
                  <span
                    style={{
                      color: result.isCorrect ? "var(--color-correct)" : "var(--color-incorrect)",
                      fontWeight: 550,
                    }}
                  >
                    {result.selectedText}
                  </span>
                </div>
                {!result.isCorrect && result.correctText && (
                  <div>
                    <span style={label}>Correct: </span>
                    <span style={{ color: "var(--color-correct)", fontWeight: 550 }}>
                      {result.correctText}
                    </span>
                  </div>
                )}
              </div>
              <div
                style={{
                  ...detail,
                  color: "var(--color-text)",
                  lineHeight: 1.65,
                  paddingTop: "var(--space-2)",
                  borderTop: "1px solid var(--color-border-subtle)",
                }}
              >
                {result.explanation}
              </div>
            </>
          )}

          {result?.type === "SHORT_ANSWER" && (
            <>
              <div style={detail}>
                <span style={label}>Your answer: </span>
                {result.answer.trim() ? result.answer : "Skipped"}
              </div>
              {result.answer.trim() && (
                <div style={detail}>
                  <span style={label}>Feedback: </span>
                  {result.reasoning}
                </div>
              )}
              <div
                style={{
                  ...detail,
                  lineHeight: 1.6,
                  paddingTop: "var(--space-2)",
                  borderTop: "1px solid var(--color-border-subtle)",
                }}
              >
                <span style={{ ...label, fontWeight: 600 }}>Model answer: </span>
                {result.modelAnswer}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function StatusDot({ outcome }: { outcome: Outcome }) {
  const bg =
    outcome === "correct"
      ? "var(--color-correct)"
      : outcome === "incorrect"
        ? "var(--color-incorrect)"
        : outcome === "partial"
          ? "var(--color-gold)"
          : "var(--color-surface-2)";
  const fg = outcome === null ? "var(--color-text-3)" : "#fff";
  const glyph =
    outcome === "correct" ? "✓" : outcome === "incorrect" ? "✗" : outcome === "partial" ? "½" : "–";
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
        fontSize: "var(--text-xs)",
        fontWeight: 650,
        flexShrink: 0,
        lineHeight: 1,
      }}
      aria-hidden
    >
      {glyph}
    </span>
  );
}
