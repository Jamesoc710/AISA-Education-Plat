"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { IconTile } from "@/components/ui/icon-tile";
import { StatusTag, type StatusTagTone } from "@/components/ui/status-tag";

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

type TierGroup = {
  tierName: string;
  tierSlug: string;
  concepts: {
    conceptName: string;
    conceptSlug: string;
    questions: QuestionOption[];
  }[];
};

function statusTone(status: string): { tone: StatusTagTone; label: string } {
  if (status === "active") return { tone: "green", label: "Active" };
  if (status === "closed") return { tone: "red", label: "Closed" };
  return { tone: "neutral", label: "Draft" };
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

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

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  color: "var(--color-text-3)",
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

function inputStyle(focused: boolean): React.CSSProperties {
  return {
    width: "100%",
    padding: "10px 12px",
    fontSize: 13.5,
    backgroundColor: "var(--color-surface)",
    border: `1px solid ${focused ? "var(--color-accent)" : "var(--color-border)"}`,
    borderRadius: 8,
    color: "var(--color-text)",
    outline: "none",
    boxSizing: "border-box",
    boxShadow: focused ? "0 0 0 3px var(--color-accent-dim)" : "none",
    transition: "border-color 150ms ease, box-shadow 150ms ease",
    fontFamily: "inherit",
  };
}

export function AdminAssessments({
  assessments: initialAssessments,
  questions,
}: AdminAssessmentsProps) {
  const [view, setView] = useState<"list" | "create">("list");
  const [assessments, setAssessments] =
    useState<AssessmentData[]>(initialAssessments);
  const [expandedResults, setExpandedResults] = useState<string | null>(null);
  const [results, setResults] = useState<
    Record<string, { average: number; attempts: AttemptResult[] }>
  >({});
  const [loadingResults, setLoadingResults] = useState<string | null>(null);
  const [expandedAttempt, setExpandedAttempt] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState("");
  const [availableAt, setAvailableAt] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [collapsedTiers, setCollapsedTiers] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const tierGroups = useMemo(() => groupByTier(questions), [questions]);

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
      prev.map((a) => (a.id === quizId ? { ...a, status: updated.status } : a)),
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
    setResults((prev) => {
      const quizResults = prev[quizId];
      if (!quizResults) return prev;
      return {
        ...prev,
        [quizId]: {
          ...quizResults,
          attempts: quizResults.attempts.map((att) => ({
            ...att,
            score: att.answers.some((a) => a.id === answerId)
              ? newScore
              : att.score,
            answers: att.answers.map((a) =>
              a.id === answerId ? { ...a, isCorrect } : a,
            ),
          })),
        },
      };
    });
  }

  if (view === "create") {
    return (
      <div style={{ maxWidth: 960 }}>
        <button
          onClick={() => setView("list")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 0",
            background: "none",
            border: "none",
            color: "var(--color-text-2)",
            fontSize: 13,
            cursor: "pointer",
            marginBottom: 18,
          }}
        >
          <Icon name="arrow-left" size={14} strokeWidth={2} />
          Assessments
        </button>

        <h2
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: "var(--color-text)",
            margin: "0 0 24px",
            letterSpacing: "-0.015em",
          }}
        >
          Create assessment
        </h2>

        <div
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 12,
            padding: 24,
            boxShadow: "var(--shadow-card)",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          <div>
            <label style={labelStyle}>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onFocus={() => setFocusedField("title")}
              onBlur={() => setFocusedField(null)}
              placeholder="e.g. Midterm Assessment"
              style={inputStyle(focusedField === "title")}
            />
          </div>

          <div>
            <label style={labelStyle}>Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onFocus={() => setFocusedField("desc")}
              onBlur={() => setFocusedField(null)}
              placeholder="Brief description of this assessment..."
              rows={3}
              style={{
                ...inputStyle(focusedField === "desc"),
                resize: "vertical",
                lineHeight: 1.6,
              }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 12,
            }}
          >
            <div>
              <label style={labelStyle}>Time limit (minutes)</label>
              <input
                type="number"
                min="1"
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value)}
                onFocus={() => setFocusedField("time")}
                onBlur={() => setFocusedField(null)}
                placeholder="No limit"
                style={inputStyle(focusedField === "time")}
              />
            </div>
            <div>
              <label style={labelStyle}>Available at</label>
              <input
                type="datetime-local"
                value={availableAt}
                onChange={(e) => setAvailableAt(e.target.value)}
                onFocus={() => setFocusedField("avail")}
                onBlur={() => setFocusedField(null)}
                style={inputStyle(focusedField === "avail")}
              />
            </div>
            <div>
              <label style={labelStyle}>Due date</label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                onFocus={() => setFocusedField("due")}
                onBlur={() => setFocusedField(null)}
                style={inputStyle(focusedField === "due")}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>
              Questions ({selectedIds.size} selected)
            </label>
            <div
              style={{
                backgroundColor: "var(--color-surface-2)",
                border: "1px solid var(--color-border-subtle)",
                borderRadius: 10,
                maxHeight: 400,
                overflowY: "auto",
              }}
            >
              {tierGroups.map((tier) => {
                const isCollapsed = collapsedTiers.has(tier.tierSlug);
                const tierQuestionIds = tier.concepts.flatMap((c) =>
                  c.questions.map((q) => q.id),
                );
                const tierSelectedCount = tierQuestionIds.filter((id) =>
                  selectedIds.has(id),
                ).length;

                return (
                  <div key={tier.tierSlug}>
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
                        fontSize: 13,
                        fontWeight: 600,
                        textAlign: "left",
                        fontFamily: "inherit",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Icon
                          name="chevron-right"
                          size={12}
                          strokeWidth={2.5}
                          style={{
                            color: "var(--color-text-3)",
                            transform: isCollapsed
                              ? "rotate(0deg)"
                              : "rotate(90deg)",
                            transition: "transform 150ms ease",
                          }}
                        />
                        {tier.tierName}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--color-text-3)",
                          fontWeight: 500,
                        }}
                      >
                        {tierSelectedCount}/{tierQuestionIds.length} selected
                      </span>
                    </button>

                    {!isCollapsed &&
                      tier.concepts.map((concept) => (
                        <div
                          key={concept.conceptSlug}
                          style={{ padding: "0 14px 6px" }}
                        >
                          <div
                            style={{
                              fontSize: 11.5,
                              fontWeight: 600,
                              color: "var(--color-text-2)",
                              padding: "10px 0 6px",
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                            }}
                          >
                            {concept.conceptName}
                          </div>
                          {concept.questions.map((q) => {
                            const checked = selectedIds.has(q.id);
                            return (
                              <label
                                key={q.id}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 10,
                                  padding: "6px 6px",
                                  cursor: "pointer",
                                  fontSize: 13,
                                  color: "var(--color-text)",
                                  borderRadius: 6,
                                  backgroundColor: checked
                                    ? "var(--color-accent-soft)"
                                    : "transparent",
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleQuestion(q.id)}
                                  style={{
                                    accentColor: "var(--color-accent)",
                                    cursor: "pointer",
                                  }}
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
                                    fontSize: 10,
                                    fontWeight: 700,
                                    letterSpacing: "0.04em",
                                    color: "var(--color-text-3)",
                                    backgroundColor:
                                      "var(--color-surface)",
                                    border: "1px solid var(--color-border)",
                                    padding: "1px 6px",
                                    borderRadius: 4,
                                    flexShrink: 0,
                                  }}
                                >
                                  {q.type === "MC" ? "MC" : "SA"}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      ))}
                  </div>
                );
              })}
            </div>
          </div>

          <div
            style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
          >
            <Button variant="secondary" onClick={() => setView("list")}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              disabled={!title.trim() || selectedIds.size === 0 || submitting}
            >
              {submitting ? "Creating..." : "Create assessment"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 18,
        }}
      >
        <h2
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: "var(--color-text)",
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          Assessments
        </h2>
        <Button
          variant="primary"
          onClick={() => setView("create")}
          leftIcon={<Icon name="bar-chart" size={14} strokeWidth={2} />}
        >
          New assessment
        </Button>
      </div>

      {assessments.length === 0 ? (
        <EmptyCard />
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {assessments.map((a) => (
            <AssessmentCard
              key={a.id}
              assessment={a}
              expanded={expandedResults === a.id}
              loading={loadingResults === a.id}
              results={results[a.id]}
              expandedAttempt={expandedAttempt}
              onToggleResults={() => handleViewResults(a.id)}
              onStatusChange={(status) => handleStatusChange(a.id, status)}
              onToggleAttempt={(id) =>
                setExpandedAttempt(expandedAttempt === id ? null : id)
              }
              onOverrideGrade={(answerId, isCorrect) =>
                handleOverrideGrade(a.id, answerId, isCorrect)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AssessmentCard({
  assessment: a,
  expanded,
  loading,
  results,
  expandedAttempt,
  onToggleResults,
  onStatusChange,
  onToggleAttempt,
  onOverrideGrade,
}: {
  assessment: AssessmentData;
  expanded: boolean;
  loading: boolean;
  results?: { average: number; attempts: AttemptResult[] };
  expandedAttempt: string | null;
  onToggleResults: () => void;
  onStatusChange: (status: string) => void;
  onToggleAttempt: (id: string) => void;
  onOverrideGrade: (answerId: string, isCorrect: boolean) => void;
}) {
  const tone = statusTone(a.status);

  return (
    <div
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 12,
        boxShadow: "var(--shadow-card)",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "18px 20px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <IconTile
            icon="bar-chart"
            color={a.status === "active" ? "honey" : a.status === "closed" ? "mint" : "indigo"}
            size="md"
          />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--color-text)",
                  letterSpacing: "-0.005em",
                }}
              >
                {a.title}
              </span>
              <StatusTag tone={tone.tone}>{tone.label}</StatusTag>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                fontSize: 12.5,
                color: "var(--color-text-3)",
                flexWrap: "wrap",
              }}
            >
              <span>
                {a.questionCount} question{a.questionCount !== 1 ? "s" : ""}
              </span>
              <span>
                {a.attemptCount} attempt{a.attemptCount !== 1 ? "s" : ""}
              </span>
              {a.timeLimit !== null && <span>{a.timeLimit} min limit</span>}
              {a.dueDate && <span>Due {formatDate(a.dueDate)}</span>}
            </div>
          </div>

          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            {a.status === "draft" && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => onStatusChange("active")}
              >
                Activate
              </Button>
            )}
            {a.status === "active" && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onStatusChange("closed")}
              >
                Close
              </Button>
            )}
            {a.status === "closed" && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onStatusChange("draft")}
              >
                Revert
              </Button>
            )}
            <Button
              size="sm"
              variant="secondary"
              onClick={onToggleResults}
            >
              {expanded ? "Hide results" : "Results"}
            </Button>
          </div>
        </div>

        {a.description && (
          <div
            style={{
              fontSize: 13,
              color: "var(--color-text-2)",
              marginTop: 10,
              marginLeft: 56,
              lineHeight: 1.55,
            }}
          >
            {a.description}
          </div>
        )}
      </div>

      {expanded && (
        <div
          style={{
            backgroundColor: "var(--color-surface-2)",
            borderTop: "1px solid var(--color-border-subtle)",
            padding: "16px 20px 20px",
          }}
        >
          {loading ? (
            <div
              style={{
                fontSize: 13,
                color: "var(--color-text-3)",
                textAlign: "center",
                padding: 12,
              }}
            >
              Loading results...
            </div>
          ) : results ? (
            <ResultsPanel
              results={results}
              expandedAttempt={expandedAttempt}
              onToggleAttempt={onToggleAttempt}
              onOverrideGrade={onOverrideGrade}
            />
          ) : (
            <div style={{ fontSize: 12.5, color: "var(--color-text-3)" }}>
              Failed to load results.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResultsPanel({
  results,
  expandedAttempt,
  onToggleAttempt,
  onOverrideGrade,
}: {
  results: { average: number; attempts: AttemptResult[] };
  expandedAttempt: string | null;
  onToggleAttempt: (id: string) => void;
  onOverrideGrade: (answerId: string, isCorrect: boolean) => void;
}) {
  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--color-text-3)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Average
        </span>
        <span
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "var(--color-text)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {results.attempts.length > 0
            ? `${Math.round(results.average)}%`
            : "—"}
        </span>
      </div>

      {results.attempts.length === 0 ? (
        <div style={{ fontSize: 12.5, color: "var(--color-text-3)" }}>
          No attempts yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {results.attempts.map((att) => (
            <AttemptRow
              key={att.id}
              attempt={att}
              expanded={expandedAttempt === att.id}
              onToggle={() => onToggleAttempt(att.id)}
              onOverrideGrade={onOverrideGrade}
            />
          ))}
        </div>
      )}
    </>
  );
}

function AttemptRow({
  attempt: att,
  expanded,
  onToggle,
  onOverrideGrade,
}: {
  attempt: AttemptResult;
  expanded: boolean;
  onToggle: () => void;
  onOverrideGrade: (answerId: string, isCorrect: boolean) => void;
}) {
  const passing = att.score >= 70;
  const scoreTagTone: StatusTagTone = passing ? "green" : "red";
  const hasAi = att.answers.some(
    (a) => a.type === "SHORT_ANSWER" && a.llmScore,
  );

  return (
    <div
      style={{
        border: "1px solid var(--color-border-subtle)",
        borderRadius: 8,
        backgroundColor: "var(--color-surface)",
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          backgroundColor: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--color-text)",
          fontFamily: "inherit",
          fontSize: 13,
        }}
      >
        <span style={{ fontWeight: 500 }}>{att.name}</span>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          {hasAi && <StatusTag tone="blue">AI graded</StatusTag>}
          <StatusTag tone={scoreTagTone}>{Math.round(att.score)}%</StatusTag>
          <span
            style={{
              fontSize: 11.5,
              color: "var(--color-text-3)",
            }}
          >
            {formatDate(att.submittedAt)}
          </span>
        </div>
      </button>

      {expanded && (
        <div
          style={{
            padding: "0 14px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {att.answers.map((ans) => (
            <AnswerCard
              key={ans.id}
              answer={ans}
              onOverrideGrade={onOverrideGrade}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AnswerCard({
  answer: ans,
  onOverrideGrade,
}: {
  answer: AnswerDetail;
  onOverrideGrade: (answerId: string, isCorrect: boolean) => void;
}) {
  const llmTone =
    ans.llmScore === "correct"
      ? { fg: "var(--color-correct)", bg: "var(--color-correct-dim)" }
      : ans.llmScore === "partial"
        ? { fg: "var(--color-gold)", bg: "var(--color-gold-soft)" }
        : { fg: "var(--color-incorrect)", bg: "var(--color-incorrect-dim)" };

  const statusFg =
    ans.isCorrect === true
      ? "var(--color-correct)"
      : ans.isCorrect === false
        ? "var(--color-incorrect)"
        : "var(--color-gold)";

  return (
    <div
      style={{
        padding: 12,
        backgroundColor: "var(--color-surface-2)",
        border: "1px solid var(--color-border-subtle)",
        borderRadius: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.04em",
            padding: "1px 6px",
            borderRadius: 4,
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-3)",
          }}
        >
          {ans.type === "MC" ? "MC" : "SA"}
        </span>
        <span
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: "var(--color-text)",
          }}
        >
          {ans.questionText}
        </span>
      </div>

      <div
        style={{
          fontSize: 12,
          color: "var(--color-text-2)",
          marginBottom: 4,
        }}
      >
        <strong style={{ color: "var(--color-text)" }}>Answer:</strong>{" "}
        {ans.selected || (
          <em style={{ color: "var(--color-text-3)" }}>No answer</em>
        )}
      </div>

      <div
        style={{
          fontSize: 11.5,
          color: "var(--color-text-3)",
          marginBottom: 8,
        }}
      >
        <strong style={{ color: "var(--color-text-2)" }}>Expected:</strong>{" "}
        {ans.modelAnswer}
      </div>

      {ans.llmScore && (
        <div
          style={{
            fontSize: 11.5,
            padding: "6px 10px",
            borderRadius: 6,
            backgroundColor: llmTone.bg,
            color: "var(--color-text-2)",
            marginBottom: 8,
            lineHeight: 1.45,
          }}
        >
          <span style={{ fontWeight: 650, color: llmTone.fg }}>
            AI: {ans.llmScore.charAt(0).toUpperCase() + ans.llmScore.slice(1)}
          </span>
          {" — "}
          {ans.llmReasoning}
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 650,
            color: statusFg,
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
              onClick={() => onOverrideGrade(ans.id, true)}
              style={{
                fontSize: 10.5,
                fontWeight: 650,
                padding: "3px 9px",
                borderRadius: 4,
                border:
                  ans.isCorrect === true
                    ? "1px solid var(--color-correct)"
                    : "1px solid var(--color-border)",
                backgroundColor:
                  ans.isCorrect === true
                    ? "var(--color-correct-dim)"
                    : "var(--color-surface)",
                color:
                  ans.isCorrect === true
                    ? "var(--color-correct)"
                    : "var(--color-text-3)",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Mark correct
            </button>
            <button
              type="button"
              onClick={() => onOverrideGrade(ans.id, false)}
              style={{
                fontSize: 10.5,
                fontWeight: 650,
                padding: "3px 9px",
                borderRadius: 4,
                border:
                  ans.isCorrect === false
                    ? "1px solid var(--color-incorrect)"
                    : "1px solid var(--color-border)",
                backgroundColor:
                  ans.isCorrect === false
                    ? "var(--color-incorrect-dim)"
                    : "var(--color-surface)",
                color:
                  ans.isCorrect === false
                    ? "var(--color-incorrect)"
                    : "var(--color-text-3)",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Mark incorrect
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function EmptyCard() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 24px",
        gap: 12,
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 12,
        boxShadow: "var(--shadow-card)",
        textAlign: "center",
      }}
    >
      <IconTile icon="bar-chart" color="indigo" size="lg" />
      <div>
        <div
          style={{
            fontSize: 14.5,
            fontWeight: 600,
            color: "var(--color-text)",
            marginBottom: 4,
          }}
        >
          No assessments yet
        </div>
        <div style={{ fontSize: 13, color: "var(--color-text-3)" }}>
          Create one to get started.
        </div>
      </div>
    </div>
  );
}
