"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { IconTile } from "@/components/ui/icon-tile";
import { StatusTag, type StatusTagTone } from "@/components/ui/status-tag";

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

const PASS_GRADES = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "Pass"];

function gradeTone(grade: string | null): StatusTagTone | null {
  if (!grade) return null;
  return PASS_GRADES.includes(grade.trim()) ? "green" : "red";
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "var(--text-xs)",
  fontWeight: 600,
  color: "var(--color-text-3)",
  marginBottom: "var(--space-2)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

function inputStyle(focused: boolean): React.CSSProperties {
  return {
    width: "100%",
    padding: "10px 12px",
    backgroundColor: "var(--color-surface)",
    border: `1px solid ${focused ? "var(--color-accent)" : "var(--color-border)"}`,
    borderRadius: "var(--radius-2)",
    fontSize: "var(--text-sm)",
    color: "var(--color-text)",
    outline: "none",
    boxSizing: "border-box",
    boxShadow: focused ? "0 0 0 3px var(--color-accent-dim)" : "none",
    transition: "border-color 150ms ease, box-shadow 150ms ease",
    fontFamily: "inherit",
  };
}

export function AdminHomework({
  assignments: initialAssignments,
  concepts,
}: AdminHomeworkProps) {
  const [view, setView] = useState<View>("list");
  const [assignments, setAssignments] = useState(initialAssignments);
  const [selectedAssignment, setSelectedAssignment] =
    useState<AssignmentData | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [gradingId, setGradingId] = useState<string | null>(null);

  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formConceptId, setFormConceptId] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [gradeValue, setGradeValue] = useState("");
  const [feedbackValue, setFeedbackValue] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AssignmentData | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/admin/homework?assignmentId=${deleteTarget.id}`,
        { method: "DELETE" },
      );
      if (!res.ok) return;
      setAssignments((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  async function viewSubmissions(assignment: AssignmentData) {
    setSelectedAssignment(assignment);
    setView("detail");
    setLoadingSubmissions(true);
    setGradingId(null);

    try {
      const res = await fetch(
        `/api/admin/homework?assignmentId=${assignment.id}`,
      );
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
      const concept = formConceptId
        ? concepts.find((c) => c.id === formConceptId)
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
          prev.map((s) =>
            s.id === submissionId
              ? {
                  ...s,
                  grade: gradeValue,
                  feedback: feedbackValue,
                  gradedAt: new Date().toISOString(),
                }
              : s,
          ),
        );
        setGradingId(null);
        setGradeValue("");
        setFeedbackValue("");
      }
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

  if (view === "create") {
    return (
      <div style={{ maxWidth: 640 }}>
        <button
          onClick={() => setView("list")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-2)",
            padding: "4px 0",
            background: "none",
            border: "none",
            color: "var(--color-text-2)",
            fontSize: "var(--text-sm)",
            cursor: "pointer",
            marginBottom: "var(--space-5)",
          }}
        >
          <Icon name="arrow-left" size={14} strokeWidth={2} />
          Homework
        </button>

        <h2
          style={{
            fontSize: "var(--text-lg)",
            fontWeight: 600,
            color: "var(--color-text)",
            margin: "0 0 24px",
            letterSpacing: "-0.015em",
          }}
        >
          Create assignment
        </h2>

        <form onSubmit={handleCreate}>
          <div style={{ marginBottom: "var(--space-5)" }}>
            <label htmlFor="hw-title" style={labelStyle}>Title</label>
            <input
              id="hw-title"
              type="text"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              onFocus={() => setFocusedField("title")}
              onBlur={() => setFocusedField(null)}
              placeholder="Assignment title"
              style={inputStyle(focusedField === "title")}
            />
          </div>

          <div style={{ marginBottom: "var(--space-5)" }}>
            <label htmlFor="hw-description" style={labelStyle}>Description (Markdown)</label>
            <textarea
              id="hw-description"
              required
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              onFocus={() => setFocusedField("desc")}
              onBlur={() => setFocusedField(null)}
              placeholder="Write assignment instructions in Markdown..."
              rows={8}
              style={{
                ...inputStyle(focusedField === "desc"),
                resize: "vertical",
                lineHeight: 1.6,
              }}
            />
          </div>

          <div style={{ marginBottom: "var(--space-5)" }}>
            <label htmlFor="hw-concept" style={labelStyle}>Concept (optional)</label>
            <select
              id="hw-concept"
              value={formConceptId}
              onChange={(e) => setFormConceptId(e.target.value)}
              onFocus={() => setFocusedField("concept")}
              onBlur={() => setFocusedField(null)}
              style={inputStyle(focusedField === "concept")}
            >
              <option value="">None</option>
              {concepts
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.sectionName} · {c.name}
                  </option>
                ))}
            </select>
          </div>

          <div style={{ marginBottom: "var(--space-5)" }}>
            <label htmlFor="hw-due-date" style={labelStyle}>Due date (optional)</label>
            <input
              id="hw-due-date"
              type="datetime-local"
              value={formDueDate}
              onChange={(e) => setFormDueDate(e.target.value)}
              onFocus={() => setFocusedField("due")}
              onBlur={() => setFocusedField(null)}
              style={inputStyle(focusedField === "due")}
            />
          </div>

          {createError && (
            <div
              style={{
                marginBottom: "var(--space-5)",
                padding: "10px 14px",
                backgroundColor: "var(--color-incorrect-dim)",
                border: "1px solid var(--color-incorrect)",
                borderRadius: "var(--radius-2)",
                fontSize: "var(--text-sm)",
                color: "var(--color-incorrect)",
              }}
            >
              {createError}
            </div>
          )}

          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <Button
              variant="primary"
              type="submit"
              disabled={creating}
            >
              {creating ? "Creating..." : "Create assignment"}
            </Button>
            <Button
              variant="secondary"
              type="button"
              onClick={() => setView("list")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    );
  }

  if (view === "detail" && selectedAssignment) {
    return (
      <div style={{ maxWidth: 960 }}>
        <button
          onClick={() => {
            setView("list");
            setSelectedAssignment(null);
            setGradingId(null);
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-2)",
            padding: "4px 0",
            background: "none",
            border: "none",
            color: "var(--color-text-2)",
            fontSize: "var(--text-sm)",
            cursor: "pointer",
            marginBottom: "var(--space-5)",
          }}
        >
          <Icon name="arrow-left" size={14} strokeWidth={2} />
          Homework
        </button>

        <h2
          style={{
            fontSize: "var(--text-lg)",
            fontWeight: 600,
            color: "var(--color-text)",
            margin: "0 0 6px",
            letterSpacing: "-0.015em",
          }}
        >
          {selectedAssignment.title}
        </h2>
        {selectedAssignment.conceptName && (
          <div style={{ marginBottom: "var(--space-4)" }}>
            <StatusTag tone="accent">
              {selectedAssignment.conceptName}
            </StatusTag>
          </div>
        )}
        <p
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--color-text-2)",
            margin: "0 0 32px",
            lineHeight: 1.6,
          }}
        >
          {selectedAssignment.description}
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: "var(--space-3)",
          }}
        >
          <h3
            style={{
              fontSize: "var(--text-md)",
              fontWeight: 600,
              color: "var(--color-text)",
              margin: 0,
            }}
          >
            Submissions
          </h3>
          <span
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--color-text-3)",
            }}
          >
            {submissions.length} total
          </span>
        </div>

        {loadingSubmissions ? (
          <div
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--color-text-3)",
              padding: "20px 0",
            }}
          >
            Loading submissions...
          </div>
        ) : submissions.length === 0 ? (
          <EmptyCard
            title="No submissions yet"
            description="Recruit submissions will appear here once they start turning work in."
            icon="clipboard-check"
          />
        ) : (
          <div
            style={{
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-3)",
              backgroundColor: "var(--color-surface)",
              boxShadow: "var(--shadow-card)",
              overflow: "hidden",
            }}
          >
            {submissions.map((sub, idx) => {
              const tone = gradeTone(sub.grade);
              const expanded = gradingId === sub.id;
              return (
                <div
                  key={sub.id}
                  style={{
                    borderTop:
                      idx === 0 ? "none" : "1px solid var(--color-border-subtle)",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 160px 110px 110px",
                      gap: "var(--space-3)",
                      padding: "14px 18px",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "var(--text-sm)",
                          fontWeight: 600,
                          color: "var(--color-text)",
                        }}
                      >
                        {sub.user.name}
                      </div>
                      <div
                        style={{
                          fontSize: "var(--text-sm)",
                          color: "var(--color-text-3)",
                          marginTop: "var(--space-1)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {sub.content.slice(0, 110)}
                        {sub.content.length > 110 ? "…" : ""}
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: "var(--text-sm)",
                        color: "var(--color-text-2)",
                      }}
                    >
                      {formatDate(sub.submittedAt)}
                    </span>

                    <span>
                      {tone ? (
                        <StatusTag tone={tone}>{sub.grade}</StatusTag>
                      ) : (
                        <span
                          style={{
                            fontSize: "var(--text-xs)",
                            color: "var(--color-text-3)",
                          }}
                        >
                          Ungraded
                        </span>
                      )}
                    </span>

                    <Button
                      size="sm"
                      variant={expanded ? "secondary" : "primary"}
                      onClick={() => {
                        if (expanded) setGradingId(null);
                        else openGrading(sub);
                      }}
                    >
                      {expanded ? "Close" : "Grade"}
                    </Button>
                  </div>

                  {expanded && (
                    <div
                      style={{
                        padding: "18px 18px 22px",
                        backgroundColor: "var(--color-surface-2)",
                        borderTop: "1px solid var(--color-border-subtle)",
                      }}
                    >
                      <div style={labelStyle}>Submission</div>
                      <div
                        style={{
                          fontSize: "var(--text-sm)",
                          color: "var(--color-text)",
                          lineHeight: 1.6,
                          marginBottom: "var(--space-5)",
                          padding: "14px 16px",
                          backgroundColor: "var(--color-surface)",
                          border: "1px solid var(--color-border-subtle)",
                          borderRadius: "var(--radius-2)",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {sub.content}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: "var(--space-3)",
                          alignItems: "flex-end",
                          flexWrap: "wrap",
                        }}
                      >
                        <div style={{ width: 160 }}>
                          <label htmlFor={`hw-grade-${sub.id}`} style={labelStyle}>Grade</label>
                          <input
                            id={`hw-grade-${sub.id}`}
                            type="text"
                            value={gradeValue}
                            onChange={(e) => setGradeValue(e.target.value)}
                            onFocus={() => setFocusedField(`grade-${sub.id}`)}
                            onBlur={() => setFocusedField(null)}
                            placeholder='e.g. "A", "B+", "Pass"'
                            style={inputStyle(focusedField === `grade-${sub.id}`)}
                          />
                        </div>

                        <div style={{ flex: 1, minWidth: 240 }}>
                          <label htmlFor={`hw-feedback-${sub.id}`} style={labelStyle}>Feedback</label>
                          <textarea
                            id={`hw-feedback-${sub.id}`}
                            value={feedbackValue}
                            onChange={(e) => setFeedbackValue(e.target.value)}
                            onFocus={() => setFocusedField(`fb-${sub.id}`)}
                            onBlur={() => setFocusedField(null)}
                            placeholder="Optional feedback..."
                            rows={2}
                            style={{
                              ...inputStyle(focusedField === `fb-${sub.id}`),
                              resize: "vertical",
                            }}
                          />
                        </div>

                        <Button
                          variant="primary"
                          onClick={() => handleSaveGrade(sub.id)}
                          disabled={saving || !gradeValue}
                        >
                          {saving ? "Saving..." : "Save grade"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "var(--space-5)",
        }}
      >
        <h2
          style={{
            fontSize: "var(--text-md)",
            fontWeight: 600,
            color: "var(--color-text)",
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          Assignments
        </h2>
        <Button
          variant="primary"
          onClick={() => setView("create")}
          leftIcon={<Icon name="clipboard-check" size={14} strokeWidth={2} />}
        >
          New assignment
        </Button>
      </div>

      {assignments.length === 0 ? (
        <EmptyCard
          title="No assignments yet"
          description="Create one to start posting work for recruits."
          icon="clipboard-check"
        />
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-3)",
          }}
        >
          {assignments.map((a) => {
            const pending = a.submissionCount - a.gradedCount;
            return (
              <div
                key={a.id}
                style={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-3)",
                  padding: "16px 18px",
                  boxShadow: "var(--shadow-card)",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-4)",
                }}
              >
                <IconTile
                  icon="clipboard-check"
                  color={pending > 0 ? "honey" : "mint"}
                  size="md"
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "var(--text-md)",
                      fontWeight: 600,
                      color: "var(--color-text)",
                      letterSpacing: "-0.005em",
                      marginBottom: "var(--space-1)",
                    }}
                  >
                    {a.title}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-3)",
                      flexWrap: "wrap",
                      fontSize: "var(--text-sm)",
                      color: "var(--color-text-3)",
                    }}
                  >
                    {a.conceptName && (
                      <StatusTag tone="neutral">{a.conceptName}</StatusTag>
                    )}
                    <span>
                      {a.submissionCount} submission
                      {a.submissionCount !== 1 ? "s" : ""}
                    </span>
                    <span>{a.gradedCount} graded</span>
                    {pending > 0 && (
                      <span style={{ color: "var(--color-gold)" }}>
                        {pending} pending
                      </span>
                    )}
                    {a.dueDate && <span>Due {formatDate(a.dueDate)}</span>}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-2)",
                    flexShrink: 0,
                  }}
                >
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => viewSubmissions(a)}
                    rightIcon={
                      <Icon name="chevron-right" size={12} strokeWidth={2} />
                    }
                  >
                    Submissions
                  </Button>
                  <DeleteIconButton
                    onClick={() => setDeleteTarget(a)}
                    label={`Delete ${a.title}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
    {deleteTarget && (
      <DeleteConfirmDialog
        title={deleteTarget.title}
        body={
          deleteTarget.submissionCount > 0
            ? `This will also delete ${deleteTarget.submissionCount} recruit submission${
                deleteTarget.submissionCount !== 1 ? "s" : ""
              }. This can't be undone.`
            : "This can't be undone."
        }
        confirmLabel="Delete assignment"
        submitting={deleting}
        onCancel={() => (deleting ? null : setDeleteTarget(null))}
        onConfirm={handleDelete}
      />
    )}
    </>
  );
}

function DeleteIconButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label={label}
      title={label}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 32,
        height: 32,
        padding: 0,
        border: `1px solid ${
          hover ? "var(--color-incorrect)" : "var(--color-border)"
        }`,
        backgroundColor: hover
          ? "var(--color-incorrect-dim)"
          : "var(--color-surface)",
        color: hover ? "var(--color-incorrect)" : "var(--color-text-3)",
        borderRadius: "var(--radius-2)",
        cursor: "pointer",
        transition:
          "background-color 120ms ease, color 120ms ease, border-color 120ms ease",
      }}
    >
      <Icon name="trash" size={14} />
    </button>
  );
}

function DeleteConfirmDialog({
  title,
  body,
  confirmLabel,
  submitting,
  onCancel,
  onConfirm,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  submitting: boolean;
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
          Delete &ldquo;{title}&rdquo;?
        </h2>
        <p
          style={{
            margin: "0 0 20px",
            fontSize: "var(--text-sm)",
            color: "var(--color-text-2)",
            lineHeight: 1.6,
          }}
        >
          {body}
        </p>
        <div
          style={{
            display: "flex",
            gap: "var(--space-3)",
            justifyContent: "flex-end",
          }}
        >
          <Button
            variant="secondary"
            size="md"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </Button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              height: 40,
              padding: "0 16px",
              fontSize: "var(--text-sm)",
              fontWeight: 600,
              fontFamily: "inherit",
              color: "#fff",
              backgroundColor: "var(--color-incorrect)",
              border: "none",
              borderRadius: "var(--radius-2)",
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.7 : 1,
              letterSpacing: "-0.005em",
              transition: "opacity 120ms ease",
            }}
          >
            {submitting ? "Deleting…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function EmptyCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: "clipboard-check" | "users" | "bar-chart";
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 24px",
        gap: "var(--space-3)",
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-3)",
        boxShadow: "var(--shadow-card)",
        textAlign: "center",
      }}
    >
      <IconTile icon={icon} color="indigo" size="lg" />
      <div>
        <div
          style={{
            fontSize: "var(--text-base)",
            fontWeight: 600,
            color: "var(--color-text)",
            marginBottom: "var(--space-1)",
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-3)" }}>
          {description}
        </div>
      </div>
    </div>
  );
}
