"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { IconTile } from "@/components/ui/icon-tile";
import { Button } from "@/components/ui/button";
import { StatusTag, type StatusTagTone } from "@/components/ui/status-tag";
import { PageFrame } from "@/components/ui/page-frame";

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
  const [answers, setAnswers] = useState<Map<string, string>>(new Map());
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

  const [secondsLeft, setSecondsLeft] = useState<number | null>(
    timeLimit ? timeLimit * 60 : null,
  );
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasAutoSubmitted = useRef(false);

  const answeredCount = answers.size;

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

  useEffect(() => {
    if (secondsLeft === 0 && phase === "quiz" && !hasAutoSubmitted.current) {
      hasAutoSubmitted.current = true;
      handleSubmit();
    }
  }, [secondsLeft, phase, handleSubmit]);

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

  // ── Intro phase ──────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <PageFrame maxWidth={680} className="animate-fade-in">
        <Link
          href="/assessments"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-1)",
            fontSize: "var(--text-sm)",
            fontWeight: 500,
            color: "var(--color-text-3)",
            textDecoration: "none",
            marginBottom: "var(--space-5)",
          }}
        >
          <Icon
            name="chevron-right"
            size={14}
            strokeWidth={2}
            style={{ transform: "rotate(180deg)" }}
          />
          Assessments
        </Link>

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "var(--space-4)",
            marginBottom: "var(--space-4)",
          }}
        >
          <IconTile icon="bar-chart" color="indigo" size="lg" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1
              style={{
                margin: "0 0 8px",
                fontSize: "var(--text-2xl)",
                fontWeight: 600,
                color: "var(--color-text)",
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
              }}
            >
              {title}
            </h1>
            {description && (
              <p
                style={{
                  margin: 0,
                  fontSize: "var(--text-base)",
                  color: "var(--color-text-2)",
                  lineHeight: 1.6,
                }}
              >
                {description}
              </p>
            )}
          </div>
        </div>

        <div
          style={{
            padding: "20px 22px",
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-3)",
            margin: "28px 0",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-3)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <InfoRow label="Questions" value={String(questions.length)} />
          {timeLimit && (
            <InfoRow label="Time limit" value={`${timeLimit} minutes`} />
          )}
          <InfoRow
            label="Attempts"
            value="1 · cannot retake"
          />
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setPhase("quiz")}
          rightIcon={
            <Icon name="chevron-right" size={14} strokeWidth={2.25} />
          }
        >
          Begin assessment
        </Button>
      </PageFrame>
    );
  }

  // ── Completed phase ──────────────────────────────────────────
  if (phase === "completed") {
    const mcTotal = resultMCTotal ?? 0;
    const mcCorrect = resultMCCorrect ?? 0;
    const saCount = resultSACount ?? 0;
    const percentage =
      mcTotal > 0 ? Math.round((mcCorrect / mcTotal) * 100) : 0;

    const tone: { fg: string; tag: StatusTagTone; label: string } =
      percentage >= 80
        ? { fg: "var(--color-correct)", tag: "green", label: "Strong" }
        : percentage >= 50
          ? { fg: "var(--color-gold)", tag: "gold", label: "Getting there" }
          : { fg: "var(--color-incorrect)", tag: "red", label: "Keep going" };

    return (
      <PageFrame maxWidth={680} className="animate-fade-in">
        <h1
          style={{
            margin: "0 0 6px",
            fontSize: "var(--text-3xl)",
            fontWeight: 600,
            color: "var(--color-text)",
            letterSpacing: "-0.025em",
          }}
        >
          Assessment complete
        </h1>
        <p
          style={{
            margin: "0 0 32px",
            fontSize: "var(--text-base)",
            color: "var(--color-text-2)",
            lineHeight: 1.55,
          }}
        >
          {title}
        </p>

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
          {mcTotal > 0 && (
            <>
              <div
                style={{
                  fontSize: "var(--text-display)",
                  fontWeight: 700,
                  color: tone.fg,
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                  marginBottom: "var(--space-4)",
                }}
              >
                {percentage}%
              </div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "var(--space-3)",
                }}
              >
                <StatusTag tone={tone.tag} uppercase>
                  {tone.label}
                </StatusTag>
                <span
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--color-text-2)",
                  }}
                >
                  {mcCorrect} of {mcTotal} multiple choice correct
                </span>
              </div>
            </>
          )}
          {saCount > 0 && (
            <div
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--color-text-3)",
                marginTop: mcTotal > 0 ? 18 : 0,
                paddingTop: mcTotal > 0 ? 18 : 0,
                borderTop:
                  mcTotal > 0 ? "1px solid var(--color-border)" : "none",
              }}
            >
              {saCount} short answer question{saCount !== 1 ? "s" : ""},
              awaiting review
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "var(--space-3)" }}>
          <Link href="/dashboard" style={{ textDecoration: "none", flex: 1 }}>
            <Button variant="primary" size="md" fullWidth>
              Back to dashboard
            </Button>
          </Link>
          <Link href="/assessments" style={{ textDecoration: "none", flex: 1 }}>
            <Button variant="secondary" size="md" fullWidth>
              All assessments
            </Button>
          </Link>
        </div>
      </PageFrame>
    );
  }

  // ── Quiz phase ───────────────────────────────────────────────
  const progressPct = Math.round((answeredCount / questions.length) * 100);

  return (
    <div
      className="animate-fade-in"
      style={{ maxWidth: 760, margin: "0 auto", padding: "40px 40px 80px" }}
    >
      {/* Sticky timer + progress header */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          padding: "14px 16px",
          marginBottom: 22,
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-3)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "var(--space-3)",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: "var(--text-xs)",
                fontWeight: 650,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--color-text-3)",
                marginBottom: "var(--space-1)",
              }}
            >
              {answeredCount} of {questions.length} answered
            </div>
            <div
              style={{
                fontSize: "var(--text-base)",
                fontWeight: 600,
                color: "var(--color-text)",
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {title}
            </div>
          </div>
          {secondsLeft !== null && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--space-2)",
                padding: "5px 11px",
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                fontVariantNumeric: "tabular-nums",
                color:
                  secondsLeft < 300
                    ? "var(--color-incorrect)"
                    : "var(--color-text)",
                backgroundColor:
                  secondsLeft < 300
                    ? "var(--color-incorrect-dim)"
                    : "var(--color-surface-2)",
                borderRadius: "var(--radius-1)",
                flexShrink: 0,
              }}
            >
              <Icon name="calendar" size={12} strokeWidth={2} />
              {formatTime(secondsLeft)}
            </div>
          )}
        </div>
        <div
          style={{
            height: 4,
            width: "100%",
            backgroundColor: "var(--color-surface-2)",
            borderRadius: 999,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progressPct}%`,
              height: "100%",
              backgroundColor: "var(--color-accent)",
              transition: "width 220ms ease",
            }}
          />
        </div>
      </div>

      {/* Question list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        {questions.map((q, idx) => (
          <QuestionCard
            key={q.id}
            index={idx}
            question={q}
            value={answers.get(q.id) ?? ""}
            onChange={(v) => setAnswer(q.id, v)}
          />
        ))}
      </div>

      {/* Submit row */}
      <div
        style={{
          marginTop: "var(--space-6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--space-3)",
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-3)" }}>
          {answeredCount === questions.length
            ? "All questions answered."
            : `${questions.length - answeredCount} unanswered`}
        </div>
        <Button
          variant="primary"
          size="md"
          disabled={answeredCount === 0 || submitting}
          onClick={() => setShowConfirm(true)}
        >
          {submitting ? "Submitting…" : "Submit assessment"}
        </Button>
      </div>

      {showConfirm && (
        <ConfirmDialog
          answeredCount={answeredCount}
          totalCount={questions.length}
          onCancel={() => setShowConfirm(false)}
          onConfirm={() => {
            setShowConfirm(false);
            handleSubmit();
          }}
        />
      )}
    </div>
  );
}

function ConfirmDialog({
  answeredCount,
  totalCount,
  onCancel,
  onConfirm,
}: {
  answeredCount: number;
  totalCount: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div
      data-theme="light"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(20, 20, 30, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
      onClick={onCancel}
    >
      <div
        className="animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-3)",
          padding: "var(--space-6)",
          maxWidth: 440,
          width: "92%",
          boxShadow: "var(--shadow-popover)",
        }}
      >
        <h2
          style={{
            margin: "0 0 10px",
            fontSize: "var(--text-md)",
            fontWeight: 600,
            color: "var(--color-text)",
            letterSpacing: "-0.015em",
          }}
        >
          Submit assessment?
        </h2>
        <p
          style={{
            margin: "0 0 8px",
            fontSize: "var(--text-sm)",
            color: "var(--color-text-2)",
            lineHeight: 1.6,
          }}
        >
          You cannot retake this assessment after submitting.
        </p>
        {answeredCount < totalCount && (
          <p
            style={{
              margin: "0 0 20px",
              fontSize: "var(--text-sm)",
              color: "var(--color-incorrect)",
              lineHeight: 1.5,
            }}
          >
            You have only answered {answeredCount} of {totalCount} questions.
          </p>
        )}
        <div
          style={{
            display: "flex",
            gap: "var(--space-3)",
            justifyContent: "flex-end",
            marginTop: 22,
          }}
        >
          <Button variant="secondary" size="md" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" size="md" onClick={onConfirm}>
            Submit
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function QuestionCard({
  index,
  question,
  value,
  onChange,
}: {
  index: number;
  question: AssessmentQuestion;
  value: string;
  onChange: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-3)",
        padding: "20px 22px",
        boxShadow: "var(--shadow-card)",
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
        Question {index + 1}
      </div>
      <h3
        style={{
          margin: "0 0 16px",
          fontSize: "var(--text-md)",
          fontWeight: 600,
          color: "var(--color-text)",
          lineHeight: 1.45,
          letterSpacing: "-0.01em",
        }}
      >
        {question.questionText}
      </h3>

      {question.type === "MC" && question.options ? (
        <MCOptions
          questionId={question.id}
          options={question.options}
          selected={value || null}
          onSelect={onChange}
        />
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Type your answer…"
          rows={4}
          style={{
            width: "100%",
            padding: "12px 14px",
            fontSize: "var(--text-base)",
            fontFamily: "inherit",
            color: "var(--color-text)",
            backgroundColor: "var(--color-surface)",
            border: `1px solid ${focused ? "var(--color-accent)" : "var(--color-border)"}`,
            boxShadow: focused ? "0 0 0 3px var(--color-accent-dim)" : "none",
            borderRadius: "var(--radius-2)",
            resize: "vertical",
            outline: "none",
            lineHeight: 1.6,
            boxSizing: "border-box",
            transition: "border-color 0.15s ease, box-shadow 0.15s ease",
          }}
        />
      )}
    </div>
  );
}

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
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      {options.map((opt, idx) => (
        <MCOptionButton
          key={`${questionId}-${idx}`}
          index={idx}
          text={opt.text}
          isSelected={selected === opt.text}
          onSelect={() => onSelect(opt.text)}
        />
      ))}
    </div>
  );
}

function MCOptionButton({
  index,
  text,
  isSelected,
  onSelect,
}: {
  index: number;
  text: string;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const [hov, setHov] = useState(false);

  let borderColor = "var(--color-border)";
  let bgColor = "var(--color-surface)";
  let indicatorBg = "transparent";
  let indicatorBorder = "var(--color-border)";
  let indicatorColor = "var(--color-text-3)";

  if (isSelected) {
    borderColor = "var(--color-accent)";
    bgColor = "var(--color-accent-soft)";
    indicatorBg = "var(--color-accent)";
    indicatorBorder = "var(--color-accent)";
    indicatorColor = "#fff";
  } else if (hov) {
    borderColor = "var(--color-accent)";
    bgColor = "var(--color-accent-soft)";
    indicatorBorder = "var(--color-accent)";
    indicatorColor = "var(--color-accent-on-soft)";
  }

  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-3)",
        padding: "12px 14px",
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: "var(--radius-2)",
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "inherit",
        transition: "border-color 180ms ease, background-color 180ms ease",
        width: "100%",
      }}
    >
      <span
        style={{
          width: 26,
          height: 26,
          borderRadius: "50%",
          border: `1.5px solid ${indicatorBorder}`,
          backgroundColor: indicatorBg,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          fontSize: "var(--text-xs)",
          fontWeight: 650,
          color: indicatorColor,
          transition: "all 180ms ease",
        }}
      >
        {String.fromCharCode(65 + index)}
      </span>
      <span
        style={{
          fontSize: "var(--text-base)",
          color: "var(--color-text)",
          lineHeight: 1.5,
          fontWeight: 500,
          flex: 1,
        }}
      >
        {text}
      </span>
    </button>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: "var(--text-sm)",
      }}
    >
      <span style={{ color: "var(--color-text-3)" }}>{label}</span>
      <span style={{ color: "var(--color-text)", fontWeight: 500 }}>
        {value}
      </span>
    </div>
  );
}
