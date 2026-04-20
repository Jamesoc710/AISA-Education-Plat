"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type GradeResult = {
  score: "correct" | "partial" | "incorrect";
  reasoning: string;
};

type ShortAnswerProps = {
  question: {
    id: string;
    questionText: string;
    answerExplanation: string;
  };
  onRevealed: () => void;
  onGraded?: (questionId: string, result: GradeResult) => void;
};

const SCORE_TOKENS: Record<
  string,
  { bg: string; border: string; chipBg: string; chipFg: string; label: string }
> = {
  correct: {
    bg: "var(--color-correct-dim)",
    border: "var(--color-correct-border)",
    chipBg: "var(--color-correct)",
    chipFg: "#fff",
    label: "Correct",
  },
  partial: {
    bg: "var(--color-gold-soft)",
    border: "rgba(184, 134, 12, 0.28)",
    chipBg: "var(--color-gold)",
    chipFg: "#fff",
    label: "Partially correct",
  },
  incorrect: {
    bg: "var(--color-incorrect-dim)",
    border: "var(--color-incorrect-border)",
    chipBg: "var(--color-incorrect)",
    chipFg: "#fff",
    label: "Needs review",
  },
};

export function ShortAnswerQuestion({
  question,
  onRevealed,
  onGraded,
}: ShortAnswerProps) {
  const [userAnswer, setUserAnswer] = useState("");
  const [grading, setGrading] = useState(false);
  const [gradeResult, setGradeResult] = useState<GradeResult | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [focused, setFocused] = useState(false);

  const handleCheckAnswer = async () => {
    if (!userAnswer.trim()) return;

    setGrading(true);
    try {
      const res = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          studentAnswer: userAnswer,
        }),
      });
      const result: GradeResult = await res.json();
      setGradeResult(result);
      setRevealed(true);
      onRevealed();
      onGraded?.(question.id, result);
    } catch {
      setGradeResult({
        score: "partial",
        reasoning: "Grading failed. Your answer has been saved for review.",
      });
      setRevealed(true);
      onRevealed();
    } finally {
      setGrading(false);
    }
  };

  const handleRevealOnly = () => {
    setRevealed(true);
    onRevealed();
    onGraded?.(question.id, {
      score: "incorrect",
      reasoning: "No answer submitted — revealed model answer directly.",
    });
  };

  return (
    <div>
      {/* Question text */}
      <h2
        style={{
          margin: "0 0 22px",
          fontSize: 20,
          fontWeight: 600,
          color: "var(--color-text)",
          lineHeight: 1.45,
          letterSpacing: "-0.015em",
        }}
      >
        {question.questionText}
      </h2>

      {/* Text area */}
      <div style={{ marginBottom: 14 }}>
        <label
          style={{
            display: "block",
            fontSize: 11,
            fontWeight: 600,
            color: "var(--color-text-3)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Your answer
        </label>
        <textarea
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={revealed || grading}
          placeholder="Type your answer here…"
          rows={5}
          style={{
            width: "100%",
            padding: "14px 16px",
            backgroundColor: "var(--color-surface)",
            border: `1px solid ${focused ? "var(--color-accent)" : "var(--color-border)"}`,
            boxShadow: focused
              ? "0 0 0 3px var(--color-accent-dim)"
              : "var(--shadow-card)",
            borderRadius: 10,
            color: "var(--color-text)",
            fontSize: 14,
            fontFamily: "inherit",
            lineHeight: 1.6,
            resize: "vertical",
            opacity: revealed ? 0.55 : 1,
            transition:
              "opacity 0.2s ease, border-color 0.15s ease, box-shadow 0.15s ease",
            boxSizing: "border-box",
            outline: "none",
          }}
        />
      </div>

      {/* Action buttons */}
      {!revealed && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button
            variant="primary"
            size="md"
            onClick={handleCheckAnswer}
            disabled={!userAnswer.trim() || grading}
          >
            {grading ? "Grading…" : "Check answer"}
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={handleRevealOnly}
            disabled={grading}
          >
            Skip / reveal answer
          </Button>
        </div>
      )}

      {/* Grade result */}
      {revealed && gradeResult && (
        <div
          className="animate-fade-in"
          style={{
            marginTop: 4,
            padding: "18px 20px",
            backgroundColor: SCORE_TOKENS[gradeResult.score].bg,
            border: `1px solid ${SCORE_TOKENS[gradeResult.score].border}`,
            borderRadius: 12,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "3px 10px",
              fontSize: 11,
              fontWeight: 650,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              color: SCORE_TOKENS[gradeResult.score].chipFg,
              backgroundColor: SCORE_TOKENS[gradeResult.score].chipBg,
              borderRadius: 999,
              marginBottom: 12,
            }}
          >
            {SCORE_TOKENS[gradeResult.score].label}
          </div>

          <p
            style={{
              margin: "0 0 16px",
              fontSize: 14,
              color: "var(--color-text)",
              lineHeight: 1.65,
            }}
          >
            {gradeResult.reasoning}
          </p>

          <div
            style={{
              paddingTop: 14,
              borderTop: "1px solid var(--color-border)",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 650,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--color-text-3)",
                marginBottom: 8,
              }}
            >
              Model answer
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                color: "var(--color-text-2)",
                lineHeight: 1.65,
              }}
            >
              {question.answerExplanation}
            </p>
          </div>
        </div>
      )}

      {/* Fallback: revealed without grade */}
      {revealed && !gradeResult && (
        <div
          className="animate-fade-in"
          style={{
            marginTop: 4,
            padding: "18px 20px",
            backgroundColor: "var(--color-accent-soft)",
            borderLeft: "3px solid var(--color-accent)",
            borderRadius: 10,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 650,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--color-accent-on-soft)",
              marginBottom: 8,
            }}
          >
            Model answer
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              color: "var(--color-text)",
              lineHeight: 1.65,
            }}
          >
            {question.answerExplanation}
          </p>
        </div>
      )}
    </div>
  );
}
