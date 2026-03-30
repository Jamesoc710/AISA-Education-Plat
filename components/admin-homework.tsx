"use client";

import { useState } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

type AssignmentData = {
  id: string;
  title: string;
  description: string;
  conceptName: string | null;
  conceptSlug: string | null;
  dueDate: string | null;
  createdAt: string;
  submissionCount: number;
  gradedCount: number;
};

type ConceptOption = {
  id: string;
  name: string;
  sectionName: string;
};

type Submission = {
  id: string;
  userId: string;
  content: string;
  submittedAt: string;
  grade: string | null;
  feedback: string | null;
  gradedAt: string | null;
  user: { name: string; email: string };
};

interface AdminHomeworkProps {
  assignments: AssignmentData[];
  concepts: ConceptOption[];
}

type View = "list" | "create" | "detail";

// ── Component ────────────────────────────────────────────────────────────────

export function AdminHomework({ assignments: initialAssignments, concepts }: AdminHomeworkProps) {
  const [view, setView] = useState<View>("list");
  const [assignments, setAssignments] = useState(initialAssignments);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentData | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [gradingId, setGradingId] = useState<string | null>(null);

  // ── Create form state ──────────────────────────────────────────────────────
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formConceptId, setFormConceptId] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // ── Grading state ──────────────────────────────────────────────────────────
  const [gradeValue, setGradeValue] = useState("");
  const [feedbackValue, setFeedbackValue] = useState("");
  const [saving, setSaving] = useState(false);

  // ── Handlers ───────────────────────────────────────────────────────────────

  async function viewSubmissions(assignment: AssignmentData) {
    setSelectedAssignment(assignment);
    setView("detail");
    setLoadingSubmissions(true);
    setGradingId(null);

    try {
      const res = await fetch(`/api/admin/homework?assignmentId=${assignment.id}`);
      const data = await res.json();
      setSubmissions(data.submissions ?? []);
    } catch {
      setSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError("");

    try {
      const res = await fetch("/api/admin/homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          description: formDescription,
          conceptId: formConceptId || null,
          dueDate: formDueDate || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setCreateError(data.error || "Failed to create assignment");
        return;
      }

      const data = await res.json();
      const created = data.assignment;

      // Find concept info for the new assignment
      const concept = formConceptId
        ? concepts.find((c: ConceptOption) => c.id === formConceptId)
        : null;

      const newAssignment: AssignmentData = {
        id: created.id,
        title: formTitle,
        description: formDescription,
        conceptName: concept?.name ?? null,
        conceptSlug: null,
        dueDate: formDueDate ? new Date(formDueDate).toISOString() : null,
        createdAt: created.createdAt ?? new Date().toISOString(),
        submissionCount: 0,
        gradedCount: 0,
      };

      setAssignments([newAssignment, ...assignments]);
      setFormTitle("");
      setFormDescription("");
      setFormConceptId("");
      setFormDueDate("");
      setView("list");
    } catch {
      setCreateError("Network error");
    } finally {
      setCreating(false);
    }
  }

  async function handleSaveGrade(submissionId: string) {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/homework", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          grade: gradeValue,
          feedback: feedbackValue,
        }),
      });

      if (res.ok) {
        setSubmissions((prev) =>
          prev.map((s: Submission) =>
            s.id === submissionId
              ? { ...s, grade: gradeValue, feedback: feedbackValue, gradedAt: new Date().toISOString() }
              : s
          )
        );
        setGradingId(null);
        setGradeValue("");
        setFeedbackValue("");
      }
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  function openGrading(submission: Submission) {
    setGradingId(submission.id);
    setGradeValue(submission.grade ?? "");
    setFeedbackValue(submission.feedback ?? "");
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  // ── Shared styles ──────────────────────────────────────────────────────────

  const btnAccent: React.CSSProperties = {
    padding: "8px 16px",
    backgroundColor: "var(--color-accent)",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
  };

  const btnSecondary: React.CSSProperties = {
    padding: "8px 16px",
    backgroundColor: "var(--color-surface-2)",
    color: "var(--color-text)",
    border: "1px solid var(--color-border)",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    backgroundColor: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "6px",
    fontSize: "13px",
    color: "var(--color-text)",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "12px",
    fontWeight: 600,
    color: "var(--color-text-2)",
    marginBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  };

  // ── CREATE VIEW ────────────────────────────────────────────────────────────

  if (view === "create") {
    return (
      <div style={{ padding: "32px", maxWidth: "640px" }}>
        <h1
          style={{
            fontSize: "18px",
            fontWeight: 600,
            color: "var(--color-text)",
            margin: "0 0 24px",
            letterSpacing: "-0.01em",
          }}
        >
          Create Assignment
        </h1>

        <form onSubmit={handleCreate}>
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Title</label>
            <input
              type="text"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Assignment title"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Description (Markdown)</label>
            <textarea
              required
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Write assignment instructions in Markdown..."
              rows={8}
              style={{ ...inputStyle, resize: "vertical", lineHeight: "1.6" }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Concept (optional)</label>
            <select
              value={formConceptId}
              onChange={(e) => setFormConceptId(e.target.value)}
              style={inputStyle}
            >
              <option value="">None</option>
              {concepts
                .slice()
                .sort((a: ConceptOption, b: ConceptOption) => a.name.localeCompare(b.name))
                .map((c: ConceptOption) => (
                  <option key={c.id} value={c.id}>
                    {c.sectionName} — {c.name}
                  </option>
                ))}
            </select>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={labelStyle}>Due Date (optional)</label>
            <input
              type="datetime-local"
              value={formDueDate}
              onChange={(e) => setFormDueDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          {createError && (
            <div
              style={{
                marginBottom: "16px",
                padding: "10px 14px",
                backgroundColor: "rgba(229, 113, 111, 0.1)",
                border: "1px solid #e5716f",
                borderRadius: "6px",
                fontSize: "13px",
                color: "#e5716f",
              }}
            >
              {createError}
            </div>
          )}

          <div style={{ display: "flex", gap: "10px" }}>
            <button type="submit" disabled={creating} style={btnAccent}>
              {creating ? "Creating..." : "Create Assignment"}
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              style={btnSecondary}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ── DETAIL VIEW ────────────────────────────────────────────────────────────

  if (view === "detail" && selectedAssignment) {
    return (
      <div style={{ padding: "32px", maxWidth: "960px" }}>
        {/* Back button */}
        <button
          onClick={() => {
            setView("list");
            setSelectedAssignment(null);
            setGradingId(null);
          }}
          style={{
            ...btnSecondary,
            marginBottom: "20px",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Homework
        </button>

        {/* Assignment info */}
        <h1
          style={{
            fontSize: "18px",
            fontWeight: 600,
            color: "var(--color-text)",
            margin: "0 0 8px",
            letterSpacing: "-0.01em",
          }}
        >
          {selectedAssignment.title}
        </h1>
        <p
          style={{
            fontSize: "13px",
            color: "var(--color-text-2)",
            margin: "0 0 24px",
            lineHeight: "1.6",
          }}
        >
          {selectedAssignment.description}
        </p>

        {/* Submissions table */}
        <h2
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--color-text)",
            margin: "0 0 12px",
          }}
        >
          Submissions
        </h2>

        {loadingSubmissions ? (
          <div style={{ fontSize: "13px", color: "var(--color-text-3)", padding: "20px 0" }}>
            Loading submissions...
          </div>
        ) : submissions.length === 0 ? (
          <div
            style={{
              padding: "24px",
              textAlign: "center",
              fontSize: "13px",
              color: "var(--color-text-3)",
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "8px",
            }}
          >
            No submissions yet
          </div>
        ) : (
          <div
            style={{
              border: "1px solid var(--color-border)",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            {/* Table header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 140px 90px 100px",
                gap: "12px",
                padding: "10px 14px",
                backgroundColor: "var(--color-surface-2)",
                borderBottom: "1px solid var(--color-border)",
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--color-text-3)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              <span>Recruit</span>
              <span>Submitted</span>
              <span>Grade</span>
              <span>Actions</span>
            </div>

            {/* Rows */}
            {submissions.map((sub: Submission) => (
              <div key={sub.id}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 140px 90px 100px",
                    gap: "12px",
                    padding: "12px 14px",
                    backgroundColor: "var(--color-surface)",
                    borderBottom: "1px solid var(--color-border-subtle)",
                    alignItems: "center",
                  }}
                >
                  {/* Recruit name + content preview */}
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text)" }}>
                      {sub.user.name}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--color-text-3)",
                        marginTop: "2px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "300px",
                      }}
                    >
                      {sub.content.slice(0, 100)}
                      {sub.content.length > 100 ? "..." : ""}
                    </div>
                  </div>

                  {/* Submitted at */}
                  <span style={{ fontSize: "12px", color: "var(--color-text-2)" }}>
                    {formatDate(sub.submittedAt)}
                  </span>

                  {/* Grade */}
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: sub.grade ? 600 : 400,
                      color: sub.grade ? "#4ade80" : "var(--color-text-3)",
                    }}
                  >
                    {sub.grade ?? "Ungraded"}
                  </span>

                  {/* Actions */}
                  <button
                    onClick={() => {
                      if (gradingId === sub.id) {
                        setGradingId(null);
                      } else {
                        openGrading(sub);
                      }
                    }}
                    style={{
                      ...btnSecondary,
                      padding: "5px 10px",
                      fontSize: "12px",
                    }}
                  >
                    {gradingId === sub.id ? "Close" : "Grade"}
                  </button>
                </div>

                {/* Inline grading panel */}
                {gradingId === sub.id && (
                  <div
                    style={{
                      padding: "16px 14px",
                      backgroundColor: "var(--color-surface-2)",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    {/* Full submission content */}
                    <div
                      style={{
                        fontSize: "13px",
                        color: "var(--color-text)",
                        lineHeight: "1.6",
                        marginBottom: "16px",
                        padding: "12px",
                        backgroundColor: "var(--color-surface)",
                        border: "1px solid var(--color-border-subtle)",
                        borderRadius: "6px",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {sub.content}
                    </div>

                    <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}>
                      <div>
                        <label style={labelStyle}>Grade</label>
                        <input
                          type="text"
                          value={gradeValue}
                          onChange={(e) => setGradeValue(e.target.value)}
                          placeholder='e.g. "A", "B+", "Pass"'
                          style={{ ...inputStyle, width: "140px" }}
                        />
                      </div>

                      <div style={{ flex: 1, minWidth: "200px" }}>
                        <label style={labelStyle}>Feedback</label>
                        <textarea
                          value={feedbackValue}
                          onChange={(e) => setFeedbackValue(e.target.value)}
                          placeholder="Optional feedback..."
                          rows={2}
                          style={{ ...inputStyle, resize: "vertical" }}
                        />
                      </div>

                      <button
                        onClick={() => handleSaveGrade(sub.id)}
                        disabled={saving || !gradeValue}
                        style={{
                          ...btnAccent,
                          opacity: saving || !gradeValue ? 0.5 : 1,
                        }}
                      >
                        {saving ? "Saving..." : "Save Grade"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── LIST VIEW (default) ────────────────────────────────────────────────────

  return (
    <div style={{ padding: "32px", maxWidth: "960px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <h1
          style={{
            fontSize: "18px",
            fontWeight: 600,
            color: "var(--color-text)",
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          Homework
        </h1>
        <button onClick={() => setView("create")} style={btnAccent}>
          Create Assignment
        </button>
      </div>

      {/* Assignment list */}
      {assignments.length === 0 ? (
        <div
          style={{
            padding: "40px 24px",
            textAlign: "center",
            fontSize: "13px",
            color: "var(--color-text-3)",
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "8px",
          }}
        >
          No assignments created yet
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {assignments.map((a: AssignmentData) => {
            const pending = a.submissionCount - a.gradedCount;
            return (
              <div
                key={a.id}
                style={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  padding: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "12px",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Title */}
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "var(--color-text)",
                        marginBottom: "4px",
                      }}
                    >
                      {a.title}
                    </div>

                    {/* Concept */}
                    {a.conceptName && (
                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--color-text-2)",
                          marginBottom: "4px",
                        }}
                      >
                        {a.conceptName}
                      </div>
                    )}

                    {/* Due date */}
                    {a.dueDate && (
                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--color-text-3)",
                          marginBottom: "6px",
                        }}
                      >
                        Due: {formatDate(a.dueDate)}
                      </div>
                    )}

                    {/* Stats */}
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--color-text-3)",
                      }}
                    >
                      {a.submissionCount} submission{a.submissionCount !== 1 ? "s" : ""}
                      {" · "}
                      {a.gradedCount} graded
                      {" · "}
                      {pending} pending
                    </div>
                  </div>

                  <button
                    onClick={() => viewSubmissions(a)}
                    style={{
                      ...btnSecondary,
                      flexShrink: 0,
                      fontSize: "12px",
                      padding: "6px 12px",
                    }}
                  >
                    View Submissions
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
