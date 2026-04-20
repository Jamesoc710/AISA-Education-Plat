"use client";

import { useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

type HomeworkSubmitProps = {
  assignmentId: string;
  title: string;
  description: string;
  conceptName: string | null;
  conceptSlug: string | null;
  dueDate: string | null;
  existingSubmission: {
    content: string;
    submittedAt: string;
    grade: string | null;
    feedback: string | null;
  } | null;
};

export function HomeworkSubmitClient({
  assignmentId,
  title,
  description,
  conceptName,
  conceptSlug,
  dueDate,
  existingSubmission,
}: HomeworkSubmitProps) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submission, setSubmission] = useState(existingSubmission);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/homework/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId, content: content.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Submission failed");
        return;
      }

      const data = await res.json();
      setSubmission({
        content: data.content,
        submittedAt: data.submittedAt,
        grade: data.grade ?? null,
        feedback: data.feedback ?? null,
      });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formattedDue = dueDate
    ? new Date(dueDate).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const formattedSubmittedAt = submission
    ? new Date(submission.submittedAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div
      style={{
        maxWidth: 760,
        margin: "0 auto",
        padding: "40px 40px 80px",
      }}
    >
      <Link
        href="/homework"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontSize: 12.5,
          fontWeight: 500,
          color: "var(--color-text-3)",
          textDecoration: "none",
          marginBottom: 18,
        }}
      >
        <Icon
          name="chevron-right"
          size={14}
          strokeWidth={2}
          style={{ transform: "rotate(180deg)" }}
        />
        Homework
      </Link>

      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            margin: "0 0 10px",
            fontSize: 28,
            fontWeight: 600,
            color: "var(--color-text)",
            lineHeight: 1.25,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </h1>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          {conceptName && conceptSlug && (
            <Link
              href={`/concepts/${conceptSlug}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "3px 10px",
                fontSize: 12,
                fontWeight: 500,
                color: "var(--color-accent-on-soft)",
                backgroundColor: "var(--color-accent-soft)",
                borderRadius: 999,
                textDecoration: "none",
              }}
            >
              {conceptName}
            </Link>
          )}
          {formattedDue && (
            <span style={{ fontSize: 12.5, color: "var(--color-text-3)" }}>
              Due {formattedDue}
            </span>
          )}
        </div>
      </div>

      {/* Description card */}
      <div
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 12,
          padding: "22px 24px",
          marginBottom: 28,
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 650,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--color-text-3)",
            marginBottom: 14,
          }}
        >
          Assignment
        </div>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => (
              <p
                style={{
                  margin: "0 0 14px",
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: "var(--color-text)",
                }}
              >
                {children}
              </p>
            ),
            strong: ({ children }) => (
              <strong style={{ fontWeight: 600 }}>{children}</strong>
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "var(--color-accent)",
                  textDecoration: "underline",
                  textUnderlineOffset: 2,
                }}
              >
                {children}
              </a>
            ),
            ul: ({ children }) => (
              <ul
                style={{
                  margin: "0 0 14px",
                  paddingLeft: 22,
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: "var(--color-text)",
                }}
              >
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol
                style={{
                  margin: "0 0 14px",
                  paddingLeft: 22,
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: "var(--color-text)",
                }}
              >
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li style={{ marginBottom: 4 }}>{children}</li>
            ),
            code: ({ children, className }) => {
              const isBlock = className?.includes("language-");
              return isBlock ? (
                <code
                  style={{
                    display: "block",
                    padding: "12px 16px",
                    backgroundColor: "var(--color-surface-2)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12.5,
                    fontFamily: "var(--font-mono)",
                    color: "var(--color-text)",
                    overflowX: "auto",
                    lineHeight: 1.6,
                    margin: "0 0 14px",
                  }}
                >
                  {children}
                </code>
              ) : (
                <code
                  style={{
                    padding: "1px 6px",
                    backgroundColor: "var(--color-surface-2)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 4,
                    fontSize: 12.5,
                    fontFamily: "var(--font-mono)",
                    color: "var(--color-text)",
                  }}
                >
                  {children}
                </code>
              );
            },
          }}
        >
          {description}
        </ReactMarkdown>
      </div>

      {/* Submission section */}
      {submission ? (
        <SubmissionView
          submission={submission}
          formattedSubmittedAt={formattedSubmittedAt}
        />
      ) : (
        <div>
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
            Your submission
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Write your submission here…"
            rows={9}
            style={{
              width: "100%",
              padding: "14px 16px",
              fontSize: 14,
              fontFamily: "inherit",
              color: "var(--color-text)",
              backgroundColor: "var(--color-surface)",
              border: `1px solid ${focused ? "var(--color-accent)" : "var(--color-border)"}`,
              boxShadow: focused
                ? "0 0 0 3px var(--color-accent-dim)"
                : "var(--shadow-card)",
              borderRadius: 10,
              resize: "vertical",
              outline: "none",
              lineHeight: 1.65,
              boxSizing: "border-box",
              transition:
                "border-color 0.15s ease, box-shadow 0.15s ease",
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 10,
              fontSize: 12,
              color: "var(--color-text-3)",
            }}
          >
            <span>{content.length} characters</span>
            {error && (
              <span style={{ color: "var(--color-incorrect)" }}>{error}</span>
            )}
          </div>

          <div style={{ marginTop: 18 }}>
            <Button
              variant="primary"
              size="md"
              onClick={handleSubmit}
              disabled={!content.trim() || submitting}
            >
              {submitting ? "Submitting…" : "Submit homework"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function SubmissionView({
  submission,
  formattedSubmittedAt,
}: {
  submission: {
    content: string;
    submittedAt: string;
    grade: string | null;
    feedback: string | null;
  };
  formattedSubmittedAt: string | null;
}) {
  const passed = submission.grade ? isPassGrade(submission.grade) : false;

  return (
    <div>
      {/* Status row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 18,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "3px 10px",
            fontSize: 11.5,
            fontWeight: 600,
            color: "var(--color-correct)",
            backgroundColor: "var(--color-correct-dim)",
            borderRadius: 999,
          }}
        >
          <Icon name="clipboard-check" size={11} strokeWidth={2.25} />
          Submitted
        </span>
        {formattedSubmittedAt && (
          <span style={{ fontSize: 12, color: "var(--color-text-3)" }}>
            {formattedSubmittedAt}
          </span>
        )}
      </div>

      {/* Grade + feedback panel */}
      {(submission.grade || submission.feedback) && (
        <div
          style={{
            padding: "18px 20px",
            backgroundColor: passed
              ? "var(--color-correct-dim)"
              : "var(--color-surface)",
            border: `1px solid ${
              passed
                ? "var(--color-correct-border)"
                : "var(--color-border)"
            }`,
            borderRadius: 12,
            marginBottom: 18,
            boxShadow: passed ? "none" : "var(--shadow-card)",
          }}
        >
          {submission.grade && (
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 14,
                marginBottom: submission.feedback ? 12 : 0,
              }}
            >
              <span
                style={{
                  fontSize: 36,
                  fontWeight: 700,
                  color: passed
                    ? "var(--color-correct)"
                    : "var(--color-text)",
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                }}
              >
                {submission.grade}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 650,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "var(--color-text-3)",
                }}
              >
                Grade
              </span>
            </div>
          )}
          {submission.feedback && (
            <p
              style={{
                margin: 0,
                fontSize: 14,
                color: "var(--color-text-2)",
                lineHeight: 1.65,
              }}
            >
              {submission.feedback}
            </p>
          )}
        </div>
      )}

      {!submission.grade && !submission.feedback && (
        <p
          style={{
            margin: "0 0 18px",
            fontSize: 13,
            color: "var(--color-text-3)",
          }}
        >
          Awaiting review by your mentor.
        </p>
      )}

      {/* Submitted content */}
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
        Your submission
      </div>
      <div
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 12,
          padding: "18px 20px",
          fontSize: 14,
          lineHeight: 1.7,
          color: "var(--color-text)",
          whiteSpace: "pre-wrap",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {submission.content}
      </div>
    </div>
  );
}

function isPassGrade(grade: string): boolean {
  const passing = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "Pass"];
  return passing.includes(grade);
}
