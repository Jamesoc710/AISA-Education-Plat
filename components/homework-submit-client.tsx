"use client";

import { useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
        maxWidth: "760px",
        margin: "0 auto",
        padding: "48px 40px 80px",
      }}
    >
      {/* ── Back link ──────────────────────────────────────── */}
      <Link
        href="/dashboard"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          fontSize: "12px",
          color: "var(--color-text-3)",
          textDecoration: "none",
          marginBottom: "20px",
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
        Dashboard
      </Link>

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ marginBottom: "32px" }}>
        <h1
          style={{
            margin: 0,
            fontSize: "24px",
            fontWeight: 600,
            color: "var(--color-text)",
            lineHeight: "1.3",
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </h1>

        {conceptName && conceptSlug && (
          <Link
            href={`/concepts/${conceptSlug}`}
            style={{
              display: "inline-block",
              marginTop: "6px",
              fontSize: "12px",
              color: "var(--color-accent)",
              textDecoration: "none",
            }}
          >
            {conceptName}
          </Link>
        )}

        {formattedDue && (
          <div
            style={{
              marginTop: "8px",
              fontSize: "12px",
              color: "var(--color-text-3)",
            }}
          >
            Due: {formattedDue}
          </div>
        )}
      </div>

      {/* ── Description ────────────────────────────────────── */}
      <div
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "32px",
        }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => (
              <p
                style={{
                  margin: "0 0 14px",
                  fontSize: "14px",
                  lineHeight: "1.75",
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
                style={{ color: "var(--color-accent)", textDecoration: "none" }}
              >
                {children}
              </a>
            ),
            ul: ({ children }) => (
              <ul
                style={{
                  margin: "0 0 14px",
                  paddingLeft: "20px",
                  fontSize: "14px",
                  lineHeight: "1.75",
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
                  paddingLeft: "20px",
                  fontSize: "14px",
                  lineHeight: "1.75",
                  color: "var(--color-text)",
                }}
              >
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li style={{ marginBottom: "4px" }}>{children}</li>
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
                    borderRadius: "6px",
                    fontSize: "12.5px",
                    fontFamily: "var(--font-mono)",
                    color: "var(--color-text)",
                    overflowX: "auto",
                    lineHeight: "1.6",
                    margin: "0 0 14px",
                  }}
                >
                  {children}
                </code>
              ) : (
                <code
                  style={{
                    padding: "1px 5px",
                    backgroundColor: "var(--color-surface-2)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "3px",
                    fontSize: "12px",
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

      {/* ── Submission section ─────────────────────────────── */}
      {submission ? (
        <div>
          {/* Submitted badge */}
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
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "12px",
                fontWeight: 500,
                color: "var(--color-correct, #4ade80)",
                backgroundColor: "rgba(74, 222, 128, 0.10)",
                borderRadius: "4px",
                padding: "3px 10px",
              }}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Submitted
            </span>
            <span style={{ fontSize: "12px", color: "var(--color-text-3)" }}>
              {formattedSubmittedAt}
            </span>
          </div>

          {/* Grade badge */}
          {submission.grade && (
            <div style={{ marginBottom: "16px" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  fontWeight: 600,
                  minWidth: "48px",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  color: isPassGrade(submission.grade)
                    ? "var(--color-correct, #4ade80)"
                    : "var(--color-text)",
                  backgroundColor: isPassGrade(submission.grade)
                    ? "rgba(74, 222, 128, 0.10)"
                    : "var(--color-surface-2)",
                }}
              >
                {submission.grade}
              </span>
            </div>
          )}

          {/* Feedback */}
          {submission.feedback && (
            <p
              style={{
                margin: "0 0 16px",
                fontSize: "14px",
                color: "var(--color-text-2)",
                fontStyle: "italic",
                lineHeight: "1.6",
              }}
            >
              {submission.feedback}
            </p>
          )}

          {/* Not graded yet */}
          {!submission.grade && !submission.feedback && (
            <p
              style={{
                margin: "0 0 16px",
                fontSize: "12px",
                color: "var(--color-text-3)",
              }}
            >
              Awaiting review
            </p>
          )}

          {/* Submitted content */}
          <div
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "8px",
              padding: "20px",
              fontSize: "14px",
              lineHeight: "1.75",
              color: "var(--color-text)",
              whiteSpace: "pre-wrap",
            }}
          >
            {submission.content}
          </div>
        </div>
      ) : (
        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your submission here..."
            style={{
              width: "100%",
              minHeight: "200px",
              padding: "16px",
              fontSize: "14px",
              fontFamily: "inherit",
              color: "var(--color-text)",
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "8px",
              resize: "vertical",
              outline: "none",
              lineHeight: "1.75",
              boxSizing: "border-box",
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "10px",
            }}
          >
            <span style={{ fontSize: "12px", color: "var(--color-text-3)" }}>
              {content.length} characters
            </span>

            {error && (
              <span style={{ fontSize: "12px", color: "#ef4444" }}>
                {error}
              </span>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!content.trim() || submitting}
            style={{
              marginTop: "16px",
              padding: "10px 20px",
              fontSize: "13px",
              fontWeight: 500,
              fontFamily: "inherit",
              color: "#fff",
              backgroundColor:
                !content.trim() || submitting
                  ? "var(--color-accent-dim)"
                  : "var(--color-accent)",
              border: "none",
              borderRadius: "8px",
              cursor: !content.trim() || submitting ? "not-allowed" : "pointer",
              opacity: !content.trim() || submitting ? 0.6 : 1,
              transition: "opacity 0.15s",
            }}
          >
            {submitting ? "Submitting..." : "Submit Homework"}
          </button>
        </div>
      )}
    </div>
  );
}

function isPassGrade(grade: string): boolean {
  const passing = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "Pass"];
  return passing.includes(grade);
}
