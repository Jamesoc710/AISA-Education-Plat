"use client";

import { useState } from "react";

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

export function ShortAnswerQuestion({
  question,
  onRevealed,
  onGraded,
}: ShortAnswerProps) {
  const [userAnswer, setUserAnswer] = useState("");
  const [grading, setGrading] = useState(false);
  const [gradeResult, setGradeResult] = useState<GradeResult | null>(null);
  const [revealed, setRevealed] = useState(false);

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

  const scoreColors: Record<string, { bg: string; border: string; text: string; label: string }> = {
    correct: {
      bg: "var(--color-correct-dim)",
      border: "var(--color-correct-border)",
      text: "var(--color-correct)",
      label: "Correct",
    },
    partial: {
      bg: "var(--color-gold-dim)",
      border: "rgba(232, 181, 74, 0.35)",
      text: "var(--color-gold)",
      label: "Partially Correct",
    },
    incorrect: {
      bg: "var(--color-incorrect-dim, rgba(220, 60, 60, 0.12))",
      border: "var(--color-incorrect-border, rgba(220, 60, 60, 0.25))",
      text: "var(--color-incorrect, #dc3c3c)",
      label: "Incorrect",
    },
  };

  return (
    <div>
      {/* Question text */}
      <h2
        style={{
          margin: "0 0 24px",
          fontSize: "18px",
          fontWeight: 500,
          color: "var(--color-text)",
          lineHeight: "1.5",
          letterSpacing: "-0.01em",
        }}
      >
        {question.questionText}
      </h2>

      {/* Text area for user's attempt */}
      <div style={{ marginBottom: "16px" }}>
        <label
          style={{
            display: "block",
            fontSize: "12px",
            fontWeight: 500,
            color: "var(--color-text-3)",
            marginBottom: "6px",
          }}
        >
          Your answer
        </label>
        <textarea
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          disabled={revealed || grading}
          placeholder="Type your answer here…"
          rows={4}
          style={{
            width: "100%",
            padding: "12px 14px",
            backgroundColor: revealed
              ? "var(--color-bg)"
              : "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "8px",
            color: "var(--color-text)",
            fontSize: "13px",
            fontFamily: "inherit",
            lineHeight: "1.6",
            resize: "vertical",
            opacity: revealed ? 0.5 : 1,
            transition: "opacity 0.2s ease, background-color 0.2s ease",
          }}
        />
      </div>

      {/* Action buttons */}
      {!revealed && (
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={handleCheckAnswer}
            disabled={!userAnswer.trim() || grading}
            style={{
              padding: "10px 20px",
              fontSize: "13px",
              fontWeight: 500,
              fontFamily: "inherit",
              color: "#fff",
              backgroundColor:
                !userAnswer.trim() || grading
                  ? "var(--color-text-3)"
                  : "var(--color-accent)",
              border: "none",
              borderRadius: "6px",
              cursor:
                !userAnswer.trim() || grading ? "not-allowed" : "pointer",
              transition: "opacity 0.15s",
              opacity: grading ? 0.7 : 1,
            }}
          >
            {grading ? "Grading…" : "Check Answer"}
          </button>
          <button
            onClick={handleRevealOnly}
            disabled={grading}
            style={{
              padding: "10px 20px",
              fontSize: "13px",
              fontWeight: 500,
              fontFamily: "inherit",
              color: "var(--color-text-2)",
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "6px",
              cursor: grading ? "not-allowed" : "pointer",
              transition: "opacity 0.15s",
            }}
          >
            Skip / Reveal Answer
          </button>
        </div>
      )}

      {/* Grade result */}
      {revealed && gradeResult && (
        <div
          className="animate-fade-in"
          style={{
            marginTop: "4px",
            padding: "16px 18px",
            backgroundColor: scoreColors[gradeResult.score]?.bg ?? "var(--color-surface-2)",
            border: `1px solid ${scoreColors[gradeResult.score]?.border ?? "var(--color-border)"}`,
            borderRadius: "8px",
          }}
        >
          {/* Score badge */}
          <div
            style={{
              display: "inline-block",
              padding: "3px 10px",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: scoreColors[gradeResult.score]?.text ?? "var(--color-text-2)",
              backgroundColor: "rgba(0,0,0,0.2)",
              borderRadius: "4px",
              marginBottom: "10px",
            }}
          >
            {scoreColors[gradeResult.score]?.label ?? gradeResult.score}
          </div>

          {/* Reasoning */}
          <p
            style={{
              margin: "0 0 16px",
              fontSize: "13px",
              color: "var(--color-text-2)",
              lineHeight: "1.65",
            }}
          >
            {gradeResult.reasoning}
          </p>

          {/* Model answer */}
          <div
            style={{
              paddingTop: "12px",
              borderTop: "1px solid var(--color-border)",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--color-text-3)",
                marginBottom: "8px",
              }}
            >
              Model Answer
            </div>
            <p
              style={{
                margin: 0,
                fontSize: "13px",
                color: "var(--color-text-2)",
                lineHeight: "1.65",
              }}
            >
              {question.answerExplanation}
            </p>
          </div>
        </div>
      )}

      {/* Fallback: revealed without grade (skip) */}
      {revealed && !gradeResult && (
        <div
          className="animate-fade-in"
          style={{
            marginTop: "4px",
            padding: "16px 18px",
            backgroundColor: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            borderRadius: "8px",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--color-text-3)",
              marginBottom: "8px",
            }}
          >
            Model Answer
          </div>
          <p
            style={{
              margin: 0,
              fontSize: "13px",
              color: "var(--color-text-2)",
              lineHeight: "1.65",
            }}
          >
            {question.answerExplanation}
          </p>
        </div>
      )}
    </div>
  );
}
