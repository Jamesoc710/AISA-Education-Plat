"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

// ── Types ────────────────────────────────────────────────────────────────────

type AssessmentQuestion = {
  id: string;
  type: "MC" | "SHORT_ANSWER";
  questionText: string;
  options: { text: string; isCorrect: boolean }[] | null;
  answerExplanation: string;
};

type AssessmentProps = {
  quizId: string;
  title: string;
  description: string | null;
  timeLimit: number | null;
  questions: AssessmentQuestion[];
  existingScore: number | null;
  existingMCTotal: number | null;
  existingMCCorrect: number | null;
  existingSACount: number | null;
};

type Phase = "intro" | "quiz" | "completed";

// ── Main Component ───────────────────────────────────────────────────────────

export function AssessmentClient({
  quizId,
  title,
  description,
  timeLimit,
  questions,
  existingScore,
  existingMCTotal,
  existingMCCorrect,
  existingSACount,
}: AssessmentProps) {
  const alreadyCompleted = existingScore !== null;
  const [phase, setPhase] = useState<Phase>(
    alreadyCompleted ? "completed" : "intro",
  );

  // Answers map: questionId -> selected text (MC) or typed text (SA)
  const [answers, setAnswers] = useState<Map<string, string>>(new Map());

  // Result state (after submission)
  const [resultScore, setResultScore] = useState<number | null>(existingScore);
  const [resultMCTotal, setResultMCTotal] = useState<number | null>(
    existingMCTotal,
  );
  const [resultMCCorrect, setResultMCCorrect] = useState<number | null>(
    existingMCCorrect,
  );
  const [resultSACount, setResultSACount] = useState<number | null>(
    existingSACount,
  );

  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Timer
  const [secondsLeft, setSecondsLeft] = useState<number | null>(
    timeLimit ? timeLimit * 60 : null,
  );
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasAutoSubmitted = useRef(false);

  const answeredCount = answers.size;

  // ── Submit handler ─────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);

    const payload = {
      quizId,
      answers: questions.map((q) => ({
        questionId: q.id,
        selected: answers.get(q.id) ?? null,
      })),
    };

    try {
      const res = await fetch("/api/assessments/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to submit assessment.");
        setSubmitting(false);
        return;
      }

      const data = await res.json();
      setResultScore(data.score);
      setResultMCCorrect(data.mcCorrect);
      setResultMCTotal(data.mcTotal);
      setResultSACount(data.saCount);
      setPhase("completed");
    } catch {
      alert("Network error. Please try again.");
      setSubmitting(false);
    }
  }, [submitting, quizId, questions, answers]);

  // ── Timer effect ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== "quiz" || secondsLeft === null) return;

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, secondsLeft === null]);

  // Auto-submit when timer hits 0
  useEffect(() => {
    if (secondsLeft === 0 && phase === "quiz" && !hasAutoSubmitted.current) {
      hasAutoSubmitted.current = true;
      handleSubmit();
    }
  }, [secondsLeft, phase, handleSubmit]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  function setAnswer(questionId: string, value: string) {
    setAnswers((prev) => {
      const next = new Map(prev);
      next.set(questionId, value);
      return next;
    });
  }

  function formatTime(s: number): string {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  // ── Intro Phase ────────────────────────────────────────────────────────────

  if (phase === "intro") {
    return (
      <div className="animate-fade-in" style={{ maxWidth: 600 }}>
        <h1
          style={{
            margin: "0 0 8px",
            fontSize: "24px",
            fontWeight: 600,
            color: "var(--color-text)",
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </h1>
        {description && (
          <p
            style={{
              margin: "0 0 24px",
              fontSize: "14px",
              color: "var(--color-text-2)",
              lineHeight: "1.6",
            }}
          >
            {description}
          </p>
        )}

        <div
          style={{
            padding: "20px",
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "10px",
            marginBottom: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <InfoRow label="Questions" value={String(questions.length)} />
          {timeLimit && (
            <InfoRow label="Time limit" value={`${timeLimit} minutes`} />
          )}
          <InfoRow
            label="Attempts"
            value="1 (you cannot retake this assessment)"
          />
        </div>

        <button
          onClick={() => setPhase("quiz")}
          style={{
            padding: "12px 28px",
            fontSize: "14px",
            fontWeight: 500,
            fontFamily: "inherit",
            color: "#fff",
            backgroundColor: "var(--color-accent)",
            border: "1px solid var(--color-accent)",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "opacity 0.12s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Begin Assessment
        </button>
      </div>
    );
  }

  // ── Completed Phase ────────────────────────────────────────────────────────

  if (phase === "completed") {
    const mcTotal = resultMCTotal ?? 0;
    const mcCorrect = resultMCCorrect ?? 0;
    const saCount = resultSACount ?? 0;
    const percentage =
      mcTotal > 0 ? Math.round((mcCorrect / mcTotal) * 100) : 0;
    const scoreColor =
      percentage >= 80
        ? "var(--color-correct)"
        : percentage >= 50
          ? "var(--color-gold)"
          : "var(--color-incorrect)";

    return (
      <div className="animate-fade-in" style={{ maxWidth: 600 }}>
        <h1
          style={{
            margin: "0 0 8px",
            fontSize: "24px",
            fontWeight: 600,
            color: "var(--color-text)",
            letterSpacing: "-0.02em",
          }}
        >
          Assessment Complete
        </h1>
        <p
          style={{
            margin: "0 0 28px",
            fontSize: "14px",
            color: "var(--color-text-2)",
            lineHeight: "1.6",
          }}
        >
          {title}
        </p>

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
          {mcTotal > 0 && (
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
                {mcCorrect} of {mcTotal} multiple choice correct
              </div>
            </>
          )}
          {saCount > 0 && (
            <div
              style={{
                fontSize: "13px",
                color: "var(--color-text-3)",
                marginTop: mcTotal > 0 ? "10px" : "0",
                paddingTop: mcTotal > 0 ? "10px" : "0",
                borderTop:
                  mcTotal > 0
                    ? "1px solid var(--color-border)"
                    : "none",
              }}
            >
              {saCount} short answer question{saCount !== 1 ? "s" : ""} —
              awaiting review
            </div>
          )}
        </div>

        <Link
          href="/dashboard"
          style={{
            display: "inline-block",
            padding: "12px 28px",
            fontSize: "13px",
            fontWeight: 500,
            color: "#fff",
            backgroundColor: "var(--color-accent)",
            border: "1px solid var(--color-accent)",
            borderRadius: "8px",
            textDecoration: "none",
            transition: "opacity 0.12s",
          }}
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  // ── Quiz Phase ─────────────────────────────────────────────────────────────

  return (
    <div className="animate-fade-in" style={{ maxWidth: 700 }}>
      {/* Timer */}
      {secondsLeft !== null && (
        <div
          style={{
            position: "fixed",
            top: 16,
            right: 20,
            fontSize: "14px",
            fontWeight: 600,
            color: secondsLeft < 300 ? "#e5716f" : "var(--color-text-2)",
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "8px",
            padding: "8px 14px",
            zIndex: 50,
          }}
        >
          {formatTime(secondsLeft)}
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "20px",
            fontWeight: 600,
            color: "var(--color-text)",
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </h1>
        <span
          style={{
            fontSize: "13px",
            color: "var(--color-text-3)",
            fontWeight: 500,
          }}
        >
          {answeredCount} of {questions.length} answered
        </span>
      </div>

      {/* Questions */}
      {questions.map((q, idx) => (
        <div
          key={q.id}
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "10px",
            padding: "20px",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              fontWeight: 500,
              color: "var(--color-text)",
              marginBottom: "14px",
              lineHeight: "1.5",
            }}
          >
            <span style={{ color: "var(--color-text-3)", marginRight: "8px" }}>
              {idx + 1}.
            </span>
            {q.questionText}
          </div>

          {q.type === "MC" && q.options ? (
            <MCOptions
              questionId={q.id}
              options={q.options}
              selected={answers.get(q.id) ?? null}
              onSelect={(text) => setAnswer(q.id, text)}
            />
          ) : (
            <textarea
              value={answers.get(q.id) ?? ""}
              onChange={(e) => setAnswer(q.id, e.target.value)}
              placeholder="Type your answer..."
              style={{
                width: "100%",
                minHeight: "100px",
                padding: "12px",
                fontSize: "13px",
                fontFamily: "inherit",
                color: "var(--color-text)",
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "6px",
                resize: "vertical",
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
          )}
        </div>
      ))}

      {/* Submit */}
      <div style={{ marginTop: "8px", marginBottom: "40px" }}>
        <button
          disabled={answeredCount === 0 || submitting}
          onClick={() => setShowConfirm(true)}
          style={{
            padding: "12px 28px",
            fontSize: "14px",
            fontWeight: 500,
            fontFamily: "inherit",
            color: "#fff",
            backgroundColor:
              answeredCount === 0 || submitting
                ? "var(--color-surface-3)"
                : "var(--color-accent)",
            border: "1px solid transparent",
            borderRadius: "8px",
            cursor: answeredCount === 0 || submitting ? "not-allowed" : "pointer",
            transition: "opacity 0.12s",
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? "Submitting..." : "Submit Assessment"}
        </button>
      </div>

      {/* Confirm dialog */}
      {showConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "12px",
              padding: "28px",
              maxWidth: 400,
              width: "90%",
            }}
          >
            <h2
              style={{
                margin: "0 0 8px",
                fontSize: "16px",
                fontWeight: 600,
                color: "var(--color-text)",
              }}
            >
              Submit Assessment?
            </h2>
            <p
              style={{
                margin: "0 0 20px",
                fontSize: "13px",
                color: "var(--color-text-2)",
                lineHeight: "1.6",
              }}
            >
              Are you sure? You cannot retake this assessment.
              {answeredCount < questions.length && (
                <span style={{ display: "block", marginTop: "8px", color: "var(--color-incorrect)" }}>
                  You have only answered {answeredCount} of {questions.length} questions.
                </span>
              )}
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  fontSize: "13px",
                  fontWeight: 500,
                  fontFamily: "inherit",
                  color: "var(--color-text)",
                  backgroundColor: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false);
                  handleSubmit();
                }}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  fontSize: "13px",
                  fontWeight: 500,
                  fontFamily: "inherit",
                  color: "#fff",
                  backgroundColor: "var(--color-accent)",
                  border: "1px solid var(--color-accent)",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── MC Options ───────────────────────────────────────────────────────────────

function MCOptions({
  questionId,
  options,
  selected,
  onSelect,
}: {
  questionId: string;
  options: { text: string; isCorrect: boolean }[];
  selected: string | null;
  onSelect: (text: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {options.map((opt, idx) => {
        const isSelected = selected === opt.text;
        return (
          <button
            key={`${questionId}-${idx}`}
            onClick={() => onSelect(opt.text)}
            style={{
              display: "block",
              width: "100%",
              padding: "12px",
              fontSize: "13px",
              fontFamily: "inherit",
              color: "var(--color-text)",
              backgroundColor: isSelected
                ? "var(--color-accent-dim)"
                : "var(--color-surface-2)",
              border: isSelected
                ? "1px solid var(--color-accent)"
                : "1px solid var(--color-border)",
              borderRadius: "6px",
              cursor: "pointer",
              textAlign: "left",
              lineHeight: "1.4",
              transition: "background-color 0.12s, border-color 0.12s",
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.currentTarget.style.backgroundColor =
                  "var(--color-surface-3)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.backgroundColor =
                  "var(--color-surface-2)";
              }
            }}
          >
            {opt.text}
          </button>
        );
      })}
    </div>
  );
}

// ── Info Row ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: "13px",
      }}
    >
      <span style={{ color: "var(--color-text-3)" }}>{label}</span>
      <span style={{ color: "var(--color-text)", fontWeight: 500 }}>
        {value}
      </span>
    </div>
  );
}
