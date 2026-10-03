"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { PageFrame } from "@/components/ui/page-frame";
import { SearchInput } from "@/components/ui/search-input";
import { StatusTag, type StatusTagTone } from "@/components/ui/status-tag";

export type ExplainConcept = { id: string; name: string; slug: string; sectionName: string };

type Feedback = {
  score: "correct" | "partial" | "incorrect";
  gotRight: string[];
  missed: string[];
  modelAnswer: string;
  gradingFailed: boolean;
};

const MIN_CHARS = 20;
const MAX_CHARS = 1200;

const SCORE_COPY: Record<Feedback["score"], { label: string; tone: StatusTagTone }> = {
  correct: { label: "Nailed it", tone: "green" },
  partial: { label: "Partly there", tone: "gold" },
  incorrect: { label: "Not quite yet", tone: "red" },
};

export function ExplainPractice({
  concepts,
  due,
  initial,
}: {
  concepts: ExplainConcept[];
  due: ExplainConcept[];
  initial: ExplainConcept | null;
}) {
  const [concept, setConcept] = useState<ExplainConcept | null>(initial);

  const surprise = () => {
    const pool = concepts.filter((c) => c.id !== concept?.id);
    if (pool.length) setConcept(pool[Math.floor(Math.random() * pool.length)]);
  };

  return (
    <PageFrame maxWidth={760}>
      <Link
        href="/practice"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "var(--space-2)",
          marginBottom: "var(--space-5)",
          fontSize: "var(--text-sm)",
          fontWeight: 500,
          color: "var(--color-text-2)",
          textDecoration: "none",
        }}
      >
        <Icon name="arrow-left" size={14} />
        Practice
      </Link>
      {concept ? (
        <Exercise key={concept.id} concept={concept} onPickAnother={() => setConcept(null)} onSurprise={surprise} />
      ) : (
        <Picker concepts={concepts} due={due} onPick={setConcept} onSurprise={surprise} />
      )}
    </PageFrame>
  );
}

// ── Picker ───────────────────────────────────────────────────────────────────

function Picker({
  concepts,
  due,
  onPick,
  onSurprise,
}: {
  concepts: ExplainConcept[];
  due: ExplainConcept[];
  onPick: (c: ExplainConcept) => void;
  onSurprise: () => void;
}) {
  const [query, setQuery] = useState("");
  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    const map = new Map<string, ExplainConcept[]>();
    for (const c of concepts) {
      if (q && !c.name.toLowerCase().includes(q)) continue;
      if (!map.has(c.sectionName)) map.set(c.sectionName, []);
      map.get(c.sectionName)!.push(c);
    }
    return [...map.entries()];
  }, [concepts, query]);

  return (
    <div className="animate-fade-in">
      <h1
        style={{
          margin: "0 0 12px",
          fontSize: "var(--text-3xl)",
          fontWeight: 600,
          color: "var(--color-text)",
          letterSpacing: "-0.025em",
          lineHeight: 1.15,
        }}
      >
        Explain it back
      </h1>
      <p
        style={{
          margin: "0 0 24px",
          fontSize: "var(--text-md)",
          color: "var(--color-text-2)",
          lineHeight: 1.55,
          maxWidth: 600,
        }}
      >
        If you can explain it simply, you understand it. Pick a concept, explain it in two or three
        sentences, and see what you nailed and what you missed.
      </p>

      <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", marginBottom: "var(--space-5)" }}>
        <Button variant="primary" size="md" onClick={onSurprise} leftIcon={<Icon name="shuffle" size={14} />}>
          Surprise me
        </Button>
        <SearchInput value={query} onChange={setQuery} width={280} placeholder="Find a concept…" />
      </div>

      {due.length > 0 && !query && (
        <div style={{ marginBottom: "var(--space-5)" }}>
          <Eyebrow>Due for review</Eyebrow>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
            {due.map((c) => (
              <ConceptChip key={c.id} concept={c} onPick={onPick} highlight />
            ))}
          </div>
        </div>
      )}

      {sections.length === 0 && (
        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-2)" }}>No concepts match &ldquo;{query}&rdquo;.</p>
      )}
      {sections.map(([name, list]) => (
        <div key={name} style={{ marginBottom: "var(--space-4)" }}>
          <Eyebrow>{name}</Eyebrow>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
            {list.map((c) => (
              <ConceptChip key={c.id} concept={c} onPick={onPick} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        margin: "0 0 8px",
        fontSize: "var(--text-xs)",
        fontWeight: 650,
        color: "var(--color-text-3)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </div>
  );
}

function ConceptChip({
  concept,
  onPick,
  highlight,
}: {
  concept: ExplainConcept;
  onPick: (c: ExplainConcept) => void;
  highlight?: boolean;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      onClick={() => onPick(concept)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "7px 12px",
        borderRadius: "var(--radius-2)",
        border: `1px solid ${hov || highlight ? "var(--color-accent)" : "var(--color-border)"}`,
        backgroundColor: hov || highlight ? "var(--color-accent-soft)" : "var(--color-surface)",
        color: "var(--color-text)",
        fontFamily: "inherit",
        fontSize: "var(--text-sm)",
        fontWeight: 500,
        cursor: "pointer",
        transition: "background-color 120ms ease, border-color 120ms ease",
      }}
    >
      {concept.name}
    </button>
  );
}

// ── Exercise ─────────────────────────────────────────────────────────────────

function Exercise({
  concept,
  onPickAnother,
  onSurprise,
}: {
  concept: ExplainConcept;
  onPickAnother: () => void;
  onSurprise: () => void;
}) {
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const length = text.trim().length;

  const check = async () => {
    setChecking(true);
    setError(null);
    try {
      const res = await fetch("/api/practice/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conceptId: concept.id, explanation: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Something went wrong. Try again.");
        return;
      }
      setFeedback(data as Feedback);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <Eyebrow>{concept.sectionName}</Eyebrow>
      <h1
        style={{
          margin: "0 0 10px",
          fontSize: "var(--text-2xl)",
          fontWeight: 600,
          color: "var(--color-text)",
          letterSpacing: "-0.02em",
          lineHeight: 1.2,
        }}
      >
        {concept.name}
      </h1>
      <p style={{ margin: "0 0 18px", fontSize: "var(--text-base)", color: "var(--color-text-2)", lineHeight: 1.55 }}>
        Explain it in two or three sentences, as if to a friend who has never heard of it.
      </p>

      <label htmlFor="explain-text" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
        Your explanation of {concept.name}
      </label>
      <textarea
        id="explain-text"
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={checking}
        rows={5}
        placeholder={`${concept.name} is…`}
        style={{
          width: "100%",
          padding: "14px 16px",
          backgroundColor: "var(--color-surface)",
          border: `1px solid ${focused ? "var(--color-accent)" : "var(--color-border)"}`,
          boxShadow: focused ? "0 0 0 3px var(--color-accent-dim)" : "var(--shadow-card)",
          borderRadius: "var(--radius-2)",
          color: "var(--color-text)",
          fontSize: "var(--text-base)",
          fontFamily: "inherit",
          lineHeight: 1.6,
          resize: "vertical",
          boxSizing: "border-box",
          outline: "none",
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "var(--space-2)",
          marginTop: "var(--space-3)",
        }}
      >
        <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
          <Button variant="primary" size="md" onClick={check} disabled={checking || length < MIN_CHARS}>
            {checking ? "Reading your explanation…" : feedback ? "Check again" : "Check my explanation"}
          </Button>
          <Button variant="ghost" size="md" onClick={onSurprise} disabled={checking}>
            Different concept
          </Button>
          <Button variant="ghost" size="md" onClick={onPickAnother} disabled={checking}>
            Choose from list
          </Button>
        </div>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-3)", fontVariantNumeric: "tabular-nums" }}>
          {length < MIN_CHARS ? `${MIN_CHARS - length} more characters to check` : `${length} / ${MAX_CHARS}`}
        </span>
      </div>

      {error && (
        <p role="alert" style={{ margin: "var(--space-3) 0 0", fontSize: "var(--text-sm)", color: "var(--color-incorrect)" }}>
          {error}
        </p>
      )}

      {feedback && <FeedbackPanel feedback={feedback} slug={concept.slug} />}
    </div>
  );
}

function FeedbackPanel({ feedback, slug }: { feedback: Feedback; slug: string }) {
  const listStyle = {
    margin: "6px 0 0",
    paddingLeft: 18,
    fontSize: "var(--text-base)",
    color: "var(--color-text)",
    lineHeight: 1.6,
  } as const;
  return (
    <section
      aria-live="polite"
      className="animate-fade-in"
      style={{
        marginTop: "var(--space-5)",
        padding: "20px 22px",
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-3)",
        boxShadow: "var(--shadow-card)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-4)",
      }}
    >
      {feedback.gradingFailed ? (
        <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-2)" }}>
          Automatic feedback hit a snag, so this one isn&rsquo;t scored. Compare yours with the reference below.
        </p>
      ) : (
        <div>
          <StatusTag tone={SCORE_COPY[feedback.score].tone} uppercase>
            {SCORE_COPY[feedback.score].label}
          </StatusTag>
        </div>
      )}

      {feedback.gotRight.length > 0 && (
        <div>
          <Eyebrow>What you got right</Eyebrow>
          <ul style={listStyle}>
            {feedback.gotRight.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
      )}

      {feedback.missed.length > 0 && (
        <div>
          <Eyebrow>What to add or fix</Eyebrow>
          <ul style={listStyle}>
            {feedback.missed.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ paddingTop: "var(--space-3)", borderTop: "1px solid var(--color-border-subtle)" }}>
        <Eyebrow>{feedback.gradingFailed ? "Reference" : "A strong answer"}</Eyebrow>
        <p style={{ margin: "6px 0 0", fontSize: "var(--text-base)", color: "var(--color-text-2)", lineHeight: 1.65 }}>
          {feedback.modelAnswer}
        </p>
      </div>

      <Link
        href={`/concepts/${slug}`}
        style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-accent)", textDecoration: "none" }}
      >
        Read the full concept →
      </Link>
    </section>
  );
}
