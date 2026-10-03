"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusTag, type StatusTagTone } from "@/components/ui/status-tag";

export type SAResult = {
  type: "SHORT_ANSWER";
  answer: string;
  score: "correct" | "partial" | "incorrect";
  reasoning: string;
  modelAnswer: string;
  gradingFailed: boolean;
};

type ShortAnswerProps = {
  question: {
    id: string;
    questionText: string;
  };
  onResult: (result: SAResult) => void;
};

const SCORE_TOKENS: Record<
  string,
  { bg: string; border: string; tone: StatusTagTone; label: string }
> = {
  correct: {
    bg: "var(--color-correct-dim)",
    border: "var(--color-correct-border)",
    tone: "green",
    label: "Correct",
  },
  partial: {
    bg: "var(--color-gold-soft)",
    border: "rgba(184, 134, 12, 0.28)",
    tone: "gold",
    label: "Partially correct",
  },
  incorrect: {
    bg: "var(--color-incorrect-dim)",
    border: "var(--color-incorrect-border)",
    tone: "red",
    label: "Needs review",
  },
};

export function ShortAnswerQuestion({ question, onResult }: ShortAnswerProps) {
  const [userAnswer, setUserAnswer] = useState("");
  const [grading, setGrading] = useState(false);
  const [result, setResult] = useState<SAResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const revealed = result !== null;

  // An empty answer reveals the model answer and counts as a miss.
  const submit = async (answer: string) => {
    setGrading(true);
    setError(null);
    try {
      const res = await fetch("/api/quiz/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: question.id, answer }),
      });
      if (res.status === 401) {
        setError("Sign in to answer short-answer questions. They're graded and saved to your account.");
        return;
      }
      const data = await res.json();
      if (!res.ok || !["correct", "partial", "incorrect"].includes(data?.score)) {
        throw new Error("Invalid grade response");
      }
      const next: SAResult = { ...data, answer };
      setResult(next);
      onResult(next);
    } catch {
      setError("Something went wrong checking your answer. Try again.");
    } finally {
      setGrading(false);
    }
  };

  const skipped = revealed && !result.answer.trim();
  const scored = revealed && !skipped && !result.gradingFailed;

  return (
    <div>
      {/* Question text */}
      <h2
        style={{
          margin: "0 0 22px",
          fontSize: "var(--text-lg)",
          fontWeight: 600,
          color: "var(--color-text)",
          lineHeight: 1.45,
          letterSpacing: "-0.015em",
        }}
      >
        {question.questionText}
      </h2>

      {/* Text area */}
      <div style={{ marginBottom: "var(--space-4)" }}>
        <label
          htmlFor="quiz-short-answer"
          style={{
            display: "block",
            fontSize: "var(--text-xs)",
            fontWeight: 600,
            color: "var(--color-text-3)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginBottom: "var(--space-2)",
          }}
        >
          Your answer
        </label>
        <textarea
          id="quiz-short-answer"
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
            borderRadius: "var(--radius-2)",
            color: "var(--color-text)",
            fontSize: "var(--text-base)",
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
        <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
          <Button
            variant="primary"
            size="md"
            onClick={() => submit(userAnswer)}
            disabled={!userAnswer.trim() || grading}
          >
            {grading ? "Grading…" : "Check answer"}
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() => submit("")}
            disabled={grading}
          >
            Skip / reveal answer
          </Button>
        </div>
      )}

      {error && (
        <p
          role="alert"
          style={{
            margin: "var(--space-3) 0 0",
            fontSize: "var(--text-sm)",
            color: "var(--color-incorrect)",
          }}
        >
          {error}
        </p>
      )}

      {/* Grade result */}
      {scored && (
        <div
          className="animate-fade-in"
          style={{
            marginTop: "var(--space-1)",
            padding: "18px 20px",
            backgroundColor: SCORE_TOKENS[result.score].bg,
            border: `1px solid ${SCORE_TOKENS[result.score].border}`,
            borderRadius: "var(--radius-3)",
          }}
        >
          <div style={{ marginBottom: "var(--space-3)" }}>
            <StatusTag tone={SCORE_TOKENS[result.score].tone} uppercase>
              {SCORE_TOKENS[result.score].label}
            </StatusTag>
          </div>

          <p
            style={{
              margin: "0 0 16px",
              fontSize: "var(--text-base)",
              color: "var(--color-text)",
              lineHeight: 1.65,
            }}
          >
            {result.reasoning}
          </p>

          <div
            style={{
              paddingTop: "var(--space-4)",
              borderTop: "1px solid var(--color-border)",
            }}
          >
            <div
              style={{
                fontSize: "var(--text-xs)",
                fontWeight: 650,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--color-text-3)",
                marginBottom: "var(--space-2)",
              }}
            >
              Model answer
            </div>
            <p
              style={{
                margin: 0,
                fontSize: "var(--text-base)",
                color: "var(--color-text-2)",
                lineHeight: 1.65,
              }}
            >
              {result.modelAnswer}
            </p>
          </div>
        </div>
      )}

      {/* Skipped, or the grader failed: show the model answer, no score */}
      {revealed && !scored && (
        <div
          className="animate-fade-in"
          style={{
            marginTop: "var(--space-1)",
            padding: "18px 20px",
            backgroundColor: "var(--color-accent-soft)",
            borderLeft: "3px solid var(--color-accent)",
            borderRadius: "var(--radius-2)",
          }}
        >
          <div
            style={{
              fontSize: "var(--text-xs)",
              fontWeight: 650,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--color-accent-on-soft)",
              marginBottom: "var(--space-2)",
            }}
          >
            Model answer
          </div>
          <p
            style={{
              margin: 0,
              fontSize: "var(--text-base)",
              color: "var(--color-text)",
              lineHeight: 1.65,
            }}
          >
            {result.modelAnswer}
          </p>
          <p
            style={{
              margin: "var(--space-3) 0 0",
              fontSize: "var(--text-sm)",
              color: "var(--color-text-2)",
              lineHeight: 1.5,
            }}
          >
            {result.gradingFailed
              ? result.reasoning
              : "Counted as a miss, so this concept comes back in your review."}
          </p>
        </div>
      )}
    </div>
  );
}
