"use client";

import { useState, useMemo } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

type AssessmentData = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  timeLimit: number | null;
  availableAt: string | null;
  dueDate: string | null;
  createdAt: string;
  questionCount: number;
  attemptCount: number;
};

type QuestionOption = {
  id: string;
  questionText: string;
  type: string;
  conceptName: string;
  conceptSlug: string;
  sectionName: string;
  tierName: string;
  tierSlug: string;
};

interface AdminAssessmentsProps {
  assessments: AssessmentData[];
  questions: QuestionOption[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function statusBadgeStyle(status: string): React.CSSProperties {
  const base: React.CSSProperties = {
    display: "inline-block",
    fontSize: "11px",
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: "4px",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  };
  switch (status) {
    case "active":
      return { ...base, backgroundColor: "#1b3a2a", color: "#34c759" };
    case "closed":
      return { ...base, backgroundColor: "#3a1b1b", color: "#ff453a" };
    default:
      return {
        ...base,
        backgroundColor: "var(--color-surface-2)",
        color: "var(--color-text-3)",
      };
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return "--";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ── Group questions by tier -> concept ───────────────────────────────────────

type TierGroup = {
  tierName: string;
  tierSlug: string;
  concepts: {
    conceptName: string;
    conceptSlug: string;
    questions: QuestionOption[];
  }[];
};

function groupByTier(questions: QuestionOption[]): TierGroup[] {
  const tierMap = new Map<
    string,
    {
      tierName: string;
      tierSlug: string;
      conceptMap: Map<
        string,
        { conceptName: string; conceptSlug: string; questions: QuestionOption[] }
      >;
    }
  >();

  for (const q of questions) {
    let tier = tierMap.get(q.tierSlug);
    if (!tier) {
      tier = {
        tierName: q.tierName,
        tierSlug: q.tierSlug,
        conceptMap: new Map(),
      };
      tierMap.set(q.tierSlug, tier);
    }
    let concept = tier.conceptMap.get(q.conceptSlug);
    if (!concept) {
      concept = {
        conceptName: q.conceptName,
        conceptSlug: q.conceptSlug,
        questions: [],
      };
      tier.conceptMap.set(q.conceptSlug, concept);
    }
    concept.questions.push(q);
  }

  return Array.from(tierMap.values()).map((t) => ({
    tierName: t.tierName,
    tierSlug: t.tierSlug,
    concepts: Array.from(t.conceptMap.values()),
  }));
}

// ── Component ────────────────────────────────────────────────────────────────

export function AdminAssessments({
  assessments: initialAssessments,
  questions,
}: AdminAssessmentsProps) {
  const [view, setView] = useState<"list" | "create">("list");
  const [assessments, setAssessments] =
    useState<AssessmentData[]>(initialAssessments);
  const [expandedResults, setExpandedResults] = useState<string | null>(null);
  type AnswerDetail = {
    id: string;
    questionId: string;
    questionText: string;
    type: string;
    modelAnswer: string;
    selected: string | null;
    isCorrect: boolean | null;
    llmScore: string | null;
    llmReasoning: string | null;
    llmGradedAt: string | null;
  };
  type AttemptResult = {
    id: string;
    name: string;
    score: number;
    submittedAt: string;
    answers: AnswerDetail[];
  };
  const [results, setResults] = useState<
    Record<string, { average: number; attempts: AttemptResult[] }>
  >({});
  const [loadingResults, setLoadingResults] = useState<string | null>(null);
  const [expandedAttempt, setExpandedAttempt] = useState<string | null>(null);

  async function handleOverrideGrade(
    quizId: string,
    answerId: string,
    isCorrect: boolean,
  ) {
    const res = await fetch("/api/admin/assessments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answerId, isCorrect }),
    });
    if (!res.ok) return;
    const { newScore } = await res.json();
    // Update local state
    setResults((prev) => {
      const quizResults = prev[quizId];
      if (!quizResults) return prev;
      return {
        ...prev,
        [quizId]: {
          ...quizResults,
          attempts: quizResults.attempts.map((att) => ({
            ...att,
            score: att.answers.some((a) => a.id === answerId) ? newScore : att.score,
            answers: att.answers.map((a) =>
              a.id === answerId ? { ...a, isCorrect } : a,
            ),
          })),
        },
      };
    });
  }

  // ── Create form state ────────────────────────────────────
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState("");
  const [availableAt, setAvailableAt] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [collapsedTiers, setCollapsedTiers] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const tierGroups = useMemo(() => groupByTier(questions), [questions]);

  // ── Handlers ─────────────────────────────────────────────

  function toggleQuestion(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleTier(slug: string) {
    setCollapsedTiers((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  async function handleCreate() {
    if (!title.trim() || selectedIds.size === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          timeLimit: timeLimit ? parseInt(timeLimit, 10) : null,
          availableAt: availableAt || null,
          dueDate: dueDate || null,
          questionIds: Array.from(selectedIds),
        }),
      });
      if (!res.ok) throw new Error("Failed to create assessment");
      const created = await res.json();
      setAssessments((prev) => [
        {
          id: created.id,
          title: created.title,
          description: created.description,
          status: created.status,
          timeLimit: created.timeLimit,
          availableAt: created.availableAt,
          dueDate: created.dueDate,
          createdAt: created.createdAt,
          questionCount: selectedIds.size,
          attemptCount: 0,
        },
        ...prev,
      ]);
      // Reset form
      setTitle("");
      setDescription("");
      setTimeLimit("");
      setAvailableAt("");
      setDueDate("");
      setSelectedIds(new Set());
      setView("list");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(quizId: string, status: string) {
    const res = await fetch("/api/admin/assessments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quizId, status }),
    });
    if (!res.ok) return;
    const updated = await res.json();
    setAssessments((prev) =>
      prev.map((a) => (a.id === quizId ? { ...a, status: updated.status } : a))
    );
  }

  async function handleViewResults(quizId: string) {
    if (expandedResults === quizId) {
      setExpandedResults(null);
      return;
    }
    setExpandedResults(quizId);
    if (results[quizId]) return;
    setLoadingResults(quizId);
    try {
      const res = await fetch(`/api/admin/assessments?quizId=${quizId}`);
      if (!res.ok) return;
      const data = await res.json();
      setResults((prev) => ({ ...prev, [quizId]: data }));
    } finally {
      setLoadingResults(null);
    }
  }

  // ── Shared styles ────────────────────────────────────────

  const cardStyle: React.CSSProperties = {
    backgroundColor: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "10px",
    padding: "20px",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    fontSize: "14px",
    backgroundColor: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "6px",
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

  const btnAccent: React.CSSProperties = {
    backgroundColor: "var(--color-accent)",
    color: "#fff",
    fontSize: "13px",
    fontWeight: 600,
    border: "none",
    borderRadius: "6px",
    padding: "8px 16px",
    cursor: "pointer",
  };

  const btnBorder: React.CSSProperties = {
    backgroundColor: "transparent",
    color: "var(--color-text-2)",
    fontSize: "12px",
    fontWeight: 500,
    border: "1px solid var(--color-border)",
    borderRadius: "6px",
    padding: "6px 12px",
    cursor: "pointer",
  };

  // ── Create View ──────────────────────────────────────────

  if (view === "create") {
    return (
      <div style={{ padding: "32px", maxWidth: "960px" }}>
        <h1
          style={{
            fontSize: "18px",
            fontWeight: 600,
            color: "var(--color-text)",
            margin: "0 0 24px",
            letterSpacing: "-0.01em",
          }}
        >
          Create Assessment
        </h1>

        <div style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Title */}
          <div>
            <label style={labelStyle}>Title</label>
            <input
              style={inputStyle}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Midterm Assessment"
            />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description (optional)</label>
            <textarea
              style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this assessment..."
            />
          </div>

          {/* Time limit + dates row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
            <div>
              <label style={labelStyle}>Time Limit (minutes)</label>
              <input
                style={inputStyle}
                type="number"
                min="1"
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value)}
                placeholder="No limit"
              />
            </div>
            <div>
              <label style={labelStyle}>Available At</label>
              <input
                style={inputStyle}
                type="datetime-local"
                value={availableAt}
                onChange={(e) => setAvailableAt(e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>Due Date</label>
              <input
                style={inputStyle}
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {/* Question picker */}
          <div>
            <label style={labelStyle}>
              Questions ({selectedIds.size} selected)
            </label>
            <div
              style={{
                backgroundColor: "var(--color-surface-2)",
                border: "1px solid var(--color-border-subtle)",
                borderRadius: "8px",
                maxHeight: "400px",
                overflowY: "auto",
              }}
            >
              {tierGroups.map((tier: TierGroup) => {
                const isCollapsed = collapsedTiers.has(tier.tierSlug);
                const tierQuestionIds = tier.concepts.flatMap((c) =>
                  c.questions.map((q) => q.id)
                );
                const tierSelectedCount = tierQuestionIds.filter((id) =>
                  selectedIds.has(id)
                ).length;

                return (
                  <div key={tier.tierSlug}>
                    {/* Tier header */}
                    <button
                      type="button"
                      onClick={() => toggleTier(tier.tierSlug)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        backgroundColor: "var(--color-surface-3)",
                        border: "none",
                        borderBottom: "1px solid var(--color-border-subtle)",
                        cursor: "pointer",
                        color: "var(--color-text)",
                        fontSize: "13px",
                        fontWeight: 600,
                        textAlign: "left",
                      }}
                    >
                      <span>
                        {isCollapsed ? "+" : "-"} {tier.tierName}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          color: "var(--color-text-3)",
                          fontWeight: 400,
                        }}
                      >
                        {tierSelectedCount}/{tierQuestionIds.length} selected
                      </span>
                    </button>

                    {/* Concepts + questions */}
                    {!isCollapsed &&
                      tier.concepts.map((concept) => (
                        <div key={concept.conceptSlug} style={{ padding: "0 14px" }}>
                          <div
                            style={{
                              fontSize: "12px",
                              fontWeight: 600,
                              color: "var(--color-text-2)",
                              padding: "8px 0 4px",
                            }}
                          >
                            {concept.conceptName}
                          </div>
                          {concept.questions.map((q: QuestionOption) => (
                            <label
                              key={q.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "4px 0",
                                cursor: "pointer",
                                fontSize: "13px",
                                color: "var(--color-text)",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={selectedIds.has(q.id)}
                                onChange={() => toggleQuestion(q.id)}
                                style={{ accentColor: "var(--color-accent)" }}
                              />
                              <span
                                style={{
                                  flex: 1,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {q.questionText}
                              </span>
                              <span
                                style={{
                                  fontSize: "10px",
                                  fontWeight: 600,
                                  color: "var(--color-text-3)",
                                  backgroundColor: "var(--color-surface)",
                                  padding: "1px 6px",
                                  borderRadius: "3px",
                                  flexShrink: 0,
                                }}
                              >
                                {q.type === "MC" ? "MC" : "SA"}
                              </span>
                            </label>
                          ))}
                        </div>
                      ))}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button
              type="button"
              style={btnBorder}
              onClick={() => setView("list")}
            >
              Cancel
            </button>
            <button
              type="button"
              style={{
                ...btnAccent,
                opacity: !title.trim() || selectedIds.size === 0 || submitting ? 0.5 : 1,
              }}
              disabled={!title.trim() || selectedIds.size === 0 || submitting}
              onClick={handleCreate}
            >
              {submitting ? "Creating..." : "Create Assessment"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── List View (default) ──────────────────────────────────

  return (
    <div style={{ padding: "32px", maxWidth: "960px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
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
          Assessments
        </h1>
        <button type="button" style={btnAccent} onClick={() => setView("create")}>
          Create Assessment
        </button>
      </div>

      {/* Card grid (single column) */}
      {assessments.length === 0 ? (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            fontSize: "13px",
            color: "var(--color-text-3)",
          }}
        >
          No assessments yet. Create one to get started.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {assessments.map((a: AssessmentData) => (
            <div key={a.id}>
              <div style={cardStyle}>
                {/* Title + status row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "10px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "var(--color-text)",
                    }}
                  >
                    {a.title}
                  </span>
                  <span style={statusBadgeStyle(a.status)}>{a.status}</span>
                </div>

                {/* Description */}
                {a.description && (
                  <div
                    style={{
                      fontSize: "13px",
                      color: "var(--color-text-2)",
                      marginBottom: "10px",
                      lineHeight: 1.4,
                    }}
                  >
                    {a.description}
                  </div>
                )}

                {/* Stats row */}
                <div
                  style={{
                    display: "flex",
                    gap: "16px",
                    fontSize: "12px",
                    color: "var(--color-text-3)",
                    marginBottom: "10px",
                  }}
                >
                  <span>{a.questionCount} questions</span>
                  <span>{a.attemptCount} attempts</span>
                  {a.timeLimit && <span>{a.timeLimit} min limit</span>}
                </div>

                {/* Due date */}
                {a.dueDate && (
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--color-text-3)",
                      marginBottom: "12px",
                    }}
                  >
                    Due: {formatDate(a.dueDate)}
                  </div>
                )}

                {/* Action buttons */}
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    borderTop: "1px solid var(--color-border-subtle)",
                    paddingTop: "12px",
                  }}
                >
                  <button
                    type="button"
                    style={btnBorder}
                    onClick={() => handleViewResults(a.id)}
                  >
                    {expandedResults === a.id ? "Hide Results" : "View Results"}
                  </button>
                  {a.status === "draft" && (
                    <button
                      type="button"
                      style={{
                        ...btnBorder,
                        borderColor: "#34c759",
                        color: "#34c759",
                      }}
                      onClick={() => handleStatusChange(a.id, "active")}
                    >
                      Activate
                    </button>
                  )}
                  {a.status === "active" && (
                    <button
                      type="button"
                      style={{
                        ...btnBorder,
                        borderColor: "#ff453a",
                        color: "#ff453a",
                      }}
                      onClick={() => handleStatusChange(a.id, "closed")}
                    >
                      Close
                    </button>
                  )}
                  {a.status === "closed" && (
                    <button
                      type="button"
                      style={btnBorder}
                      onClick={() => handleStatusChange(a.id, "draft")}
                    >
                      Revert to Draft
                    </button>
                  )}
                </div>
              </div>

              {/* Results panel */}
              {expandedResults === a.id && (
                <div
                  style={{
                    backgroundColor: "var(--color-surface-2)",
                    border: "1px solid var(--color-border-subtle)",
                    borderTop: "none",
                    borderRadius: "0 0 10px 10px",
                    padding: "16px 20px",
                  }}
                >
                  {loadingResults === a.id ? (
                    <div
                      style={{
                        fontSize: "13px",
                        color: "var(--color-text-3)",
                        textAlign: "center",
                        padding: "12px",
                      }}
                    >
                      Loading results...
                    </div>
                  ) : results[a.id] ? (
                    <>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "var(--color-text)",
                          marginBottom: "10px",
                        }}
                      >
                        Average Score:{" "}
                        {results[a.id].attempts.length > 0
                          ? `${Math.round(results[a.id].average)}%`
                          : "N/A"}
                      </div>
                      {results[a.id].attempts.length === 0 ? (
                        <div
                          style={{
                            fontSize: "12px",
                            color: "var(--color-text-3)",
                          }}
                        >
                          No attempts yet.
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          {results[a.id].attempts.map(
                            (att: AttemptResult) => (
                              <div key={att.id}>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedAttempt(
                                      expandedAttempt === att.id ? null : att.id,
                                    )
                                  }
                                  style={{
                                    width: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "8px 10px",
                                    backgroundColor: "var(--color-surface)",
                                    borderRadius: "6px",
                                    fontSize: "13px",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "var(--color-text)",
                                    fontFamily: "inherit",
                                  }}
                                >
                                  <span>{att.name}</span>
                                  <div
                                    style={{
                                      display: "flex",
                                      gap: "16px",
                                      alignItems: "center",
                                    }}
                                  >
                                    {att.answers.some(
                                      (ans) =>
                                        ans.type === "SHORT_ANSWER" &&
                                        ans.llmScore,
                                    ) && (
                                      <span
                                        style={{
                                          fontSize: "10px",
                                          padding: "2px 6px",
                                          borderRadius: "3px",
                                          backgroundColor: "#1b2a3a",
                                          color: "#5ac8fa",
                                          fontWeight: 600,
                                        }}
                                      >
                                        AI Graded
                                      </span>
                                    )}
                                    <span
                                      style={{
                                        fontWeight: 600,
                                        color:
                                          att.score >= 70
                                            ? "#34c759"
                                            : "#ff453a",
                                      }}
                                    >
                                      {Math.round(att.score)}%
                                    </span>
                                    <span
                                      style={{
                                        fontSize: "11px",
                                        color: "var(--color-text-3)",
                                      }}
                                    >
                                      {formatDate(att.submittedAt)}
                                    </span>
                                  </div>
                                </button>

                                {/* Expanded answer details */}
                                {expandedAttempt === att.id && (
                                  <div
                                    style={{
                                      padding: "12px",
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: "10px",
                                    }}
                                  >
                                    {att.answers.map((ans: AnswerDetail) => (
                                      <div
                                        key={ans.id}
                                        style={{
                                          padding: "12px",
                                          backgroundColor:
                                            "var(--color-surface)",
                                          border:
                                            "1px solid var(--color-border-subtle)",
                                          borderRadius: "8px",
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            marginBottom: "6px",
                                          }}
                                        >
                                          <span
                                            style={{
                                              fontSize: "10px",
                                              fontWeight: 600,
                                              padding: "1px 6px",
                                              borderRadius: "3px",
                                              backgroundColor:
                                                "var(--color-surface-2)",
                                              color: "var(--color-text-3)",
                                            }}
                                          >
                                            {ans.type === "MC" ? "MC" : "SA"}
                                          </span>
                                          <span
                                            style={{
                                              fontSize: "12px",
                                              fontWeight: 600,
                                              color: "var(--color-text)",
                                            }}
                                          >
                                            {ans.questionText}
                                          </span>
                                        </div>

                                        {/* Student answer */}
                                        <div
                                          style={{
                                            fontSize: "12px",
                                            color: "var(--color-text-2)",
                                            marginBottom: "4px",
                                          }}
                                        >
                                          <strong>Answer:</strong>{" "}
                                          {ans.selected || (
                                            <em style={{ color: "var(--color-text-3)" }}>
                                              No answer
                                            </em>
                                          )}
                                        </div>

                                        {/* Model answer */}
                                        <div
                                          style={{
                                            fontSize: "11px",
                                            color: "var(--color-text-3)",
                                            marginBottom: "6px",
                                          }}
                                        >
                                          <strong>Expected:</strong>{" "}
                                          {ans.modelAnswer}
                                        </div>

                                        {/* LLM reasoning */}
                                        {ans.llmScore && (
                                          <div
                                            style={{
                                              fontSize: "11px",
                                              padding: "6px 8px",
                                              borderRadius: "4px",
                                              backgroundColor:
                                                ans.llmScore === "correct"
                                                  ? "rgba(52,199,89,0.08)"
                                                  : ans.llmScore === "partial"
                                                    ? "rgba(232,181,74,0.08)"
                                                    : "rgba(255,69,58,0.08)",
                                              color: "var(--color-text-2)",
                                              marginBottom: "6px",
                                            }}
                                          >
                                            <span
                                              style={{
                                                fontWeight: 600,
                                                color:
                                                  ans.llmScore === "correct"
                                                    ? "#34c759"
                                                    : ans.llmScore ===
                                                        "partial"
                                                      ? "#e8b54a"
                                                      : "#ff453a",
                                              }}
                                            >
                                              AI:{" "}
                                              {ans.llmScore
                                                .charAt(0)
                                                .toUpperCase() +
                                                ans.llmScore.slice(1)}
                                            </span>
                                            {" — "}
                                            {ans.llmReasoning}
                                          </div>
                                        )}

                                        {/* Grade status + override */}
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                          }}
                                        >
                                          <span
                                            style={{
                                              fontSize: "11px",
                                              fontWeight: 600,
                                              color:
                                                ans.isCorrect === true
                                                  ? "#34c759"
                                                  : ans.isCorrect === false
                                                    ? "#ff453a"
                                                    : "#e8b54a",
                                            }}
                                          >
                                            {ans.isCorrect === true
                                              ? "Correct"
                                              : ans.isCorrect === false
                                                ? "Incorrect"
                                                : "Ungraded"}
                                          </span>
                                          {ans.type === "SHORT_ANSWER" && (
                                            <>
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  handleOverrideGrade(
                                                    a.id,
                                                    ans.id,
                                                    true,
                                                  )
                                                }
                                                style={{
                                                  fontSize: "10px",
                                                  fontWeight: 600,
                                                  padding: "2px 8px",
                                                  borderRadius: "4px",
                                                  border:
                                                    ans.isCorrect === true
                                                      ? "2px solid #34c759"
                                                      : "1px solid var(--color-border)",
                                                  backgroundColor:
                                                    ans.isCorrect === true
                                                      ? "rgba(52,199,89,0.15)"
                                                      : "transparent",
                                                  color:
                                                    ans.isCorrect === true
                                                      ? "#34c759"
                                                      : "var(--color-text-3)",
                                                  cursor: "pointer",
                                                  fontFamily: "inherit",
                                                }}
                                              >
                                                Mark Correct
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  handleOverrideGrade(
                                                    a.id,
                                                    ans.id,
                                                    false,
                                                  )
                                                }
                                                style={{
                                                  fontSize: "10px",
                                                  fontWeight: 600,
                                                  padding: "2px 8px",
                                                  borderRadius: "4px",
                                                  border:
                                                    ans.isCorrect === false
                                                      ? "2px solid #ff453a"
                                                      : "1px solid var(--color-border)",
                                                  backgroundColor:
                                                    ans.isCorrect === false
                                                      ? "rgba(255,69,58,0.15)"
                                                      : "transparent",
                                                  color:
                                                    ans.isCorrect === false
                                                      ? "#ff453a"
                                                      : "var(--color-text-3)",
                                                  cursor: "pointer",
                                                  fontFamily: "inherit",
                                                }}
                                              >
                                                Mark Incorrect
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ),
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--color-text-3)",
                      }}
                    >
                      Failed to load results.
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
