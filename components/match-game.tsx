"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { PageFrame } from "@/components/ui/page-frame";

export type MatchConcept = { id: string; name: string; slug: string; definition: string };
export type MatchPool = { key: string; label: string; concepts: MatchConcept[] };

const ROUND_SIZE = 6;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Round = { id: number; concepts: MatchConcept[]; terms: MatchConcept[]; defs: MatchConcept[] };

let roundSeq = 0;

function drawRound(pool: MatchPool): Round {
  const concepts = shuffle(pool.concepts).slice(0, ROUND_SIZE);
  return { id: ++roundSeq, concepts, terms: shuffle(concepts), defs: shuffle(concepts) };
}

export function MatchGame({ pools, signedIn }: { pools: MatchPool[]; signedIn: boolean }) {
  const [pool, setPool] = useState<MatchPool | null>(null);
  const [round, setRound] = useState<Round | null>(null);

  const start = (p: MatchPool) => {
    setPool(p);
    setRound(drawRound(p));
  };

  return (
    <PageFrame maxWidth={900}>
      {!pool || !round ? (
        <PoolPicker pools={pools} onPick={start} />
      ) : (
        <Board
          key={round.id}
          pool={pool}
          round={round}
          signedIn={signedIn}
          onAgain={() => setRound(drawRound(pool))}
          onChoose={() => {
            setPool(null);
            setRound(null);
          }}
        />
      )}
    </PageFrame>
  );
}

// ── Pool picker ──────────────────────────────────────────────────────────────

function PoolPicker({ pools, onPick }: { pools: MatchPool[]; onPick: (p: MatchPool) => void }) {
  return (
    <div className="animate-fade-in">
      <BackToPractice />
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
        Match
      </h1>
      <p
        style={{
          margin: "0 0 28px",
          fontSize: "var(--text-md)",
          color: "var(--color-text-2)",
          lineHeight: 1.55,
          maxWidth: 600,
        }}
      >
        Six terms, six definitions. Pick a term, then the definition that goes with it. Anything you
        don&rsquo;t get on the first try comes back in your review.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
        {pools.map((p) => (
          <PoolChip key={p.key} pool={p} onPick={() => onPick(p)} />
        ))}
      </div>
    </div>
  );
}

function PoolChip({ pool, onPick }: { pool: MatchPool; onPick: () => void }) {
  const [hov, setHov] = useState(false);
  const highlight = pool.key === "due";
  return (
    <button
      type="button"
      onClick={onPick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-2)",
        padding: "10px 14px",
        borderRadius: "var(--radius-2)",
        border: `1px solid ${hov || highlight ? "var(--color-accent)" : "var(--color-border)"}`,
        backgroundColor: hov || highlight ? "var(--color-accent-soft)" : "var(--color-surface)",
        color: "var(--color-text)",
        fontFamily: "inherit",
        fontSize: "var(--text-sm)",
        fontWeight: 550,
        cursor: "pointer",
        boxShadow: "var(--shadow-card)",
        transition: "background-color 120ms ease, border-color 120ms ease",
      }}
    >
      {highlight && <Icon name="arrows-clockwise" size={14} />}
      {pool.label}
      <span style={{ color: "var(--color-text-3)", fontWeight: 400, fontVariantNumeric: "tabular-nums" }}>
        {pool.concepts.length}
      </span>
    </button>
  );
}

// ── Board ────────────────────────────────────────────────────────────────────

type Selection = { side: "term" | "def"; id: string } | null;

function Board({
  pool,
  round,
  signedIn,
  onAgain,
  onChoose,
}: {
  pool: MatchPool;
  round: Round;
  signedIn: boolean;
  onAgain: () => void;
  onChoose: () => void;
}) {
  const [selected, setSelected] = useState<Selection>(null);
  const [matched, setMatched] = useState<Set<string>>(() => new Set());
  const [missed, setMissed] = useState<Set<string>>(() => new Set());
  const [wrongFlash, setWrongFlash] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [announce, setAnnounce] = useState("");
  const done = matched.size === round.concepts.length;
  const saved = useRef(false);

  // Clock runs from the first pick until the last pair.
  useEffect(() => {
    if (startedAt === null || done) return;
    const t = setInterval(() => setElapsed(Date.now() - startedAt), 200);
    return () => clearInterval(t);
  }, [startedAt, done]);

  useEffect(() => {
    if (!done || saved.current || !signedIn) return;
    saved.current = true;
    void fetch("/api/practice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "match",
        results: round.concepts.map((c) => ({
          conceptId: c.id,
          result: missed.has(c.id) ? "incorrect" : "correct",
        })),
      }),
    }).catch(() => {});
  }, [done, signedIn, round.concepts, missed]);

  const byId = useMemo(() => new Map(round.concepts.map((c) => [c.id, c])), [round.concepts]);

  const pick = (side: "term" | "def", id: string) => {
    if (matched.has(id) || done) return;
    if (startedAt === null) setStartedAt(Date.now());
    if (!selected || selected.side === side) {
      setSelected(selected?.side === side && selected.id === id ? null : { side, id });
      return;
    }
    const termId = side === "term" ? id : selected.id;
    const defId = side === "def" ? id : selected.id;
    setSelected(null);
    if (termId === defId) {
      setMatched((m) => new Set(m).add(termId));
      setAnnounce(`Matched ${byId.get(termId)?.name}.`);
    } else {
      // The term is what's being answered, so the miss goes on the term's concept.
      setMissed((m) => new Set(m).add(termId));
      setMistakes((n) => n + 1);
      setWrongFlash([`term-${termId}`, `def-${defId}`]);
      setTimeout(() => setWrongFlash([]), 450);
      setAnnounce(`Not a match for ${byId.get(termId)?.name}.`);
    }
  };

  const seconds = Math.floor(elapsed / 1000);
  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="animate-fade-in">
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "var(--space-3)",
          marginBottom: "var(--space-5)",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "var(--text-xs)",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--color-text-3)",
            }}
          >
            Match · {pool.label}
          </div>
          <div style={{ fontSize: "var(--text-lg)", fontWeight: 600, color: "var(--color-text)", marginTop: 2 }}>
            {done ? "All matched" : `${matched.size} of ${round.concepts.length} matched`}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: "var(--space-4)",
            fontSize: "var(--text-sm)",
            color: "var(--color-text-2)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <span>{clock}</span>
          <span>
            {mistakes} miss{mistakes === 1 ? "" : "es"}
          </span>
        </div>
      </div>

      <p aria-live="polite" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
        {announce}
      </p>

      {!done ? (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 3fr)", gap: "var(--space-3)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {round.terms.map((c) => (
              <Tile
                key={c.id}
                label={c.name}
                strong
                state={tileState("term", c.id, selected, matched, wrongFlash)}
                onClick={() => pick("term", c.id)}
              />
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {round.defs.map((c) => (
              <Tile
                key={c.id}
                label={c.definition}
                state={tileState("def", c.id, selected, matched, wrongFlash)}
                onClick={() => pick("def", c.id)}
              />
            ))}
          </div>
        </div>
      ) : (
        <Summary
          round={round}
          missed={missed}
          clock={clock}
          mistakes={mistakes}
          signedIn={signedIn}
          onAgain={onAgain}
          onChoose={onChoose}
        />
      )}
    </div>
  );
}

type TileState = "idle" | "selected" | "matched" | "wrong";

function tileState(
  side: "term" | "def",
  id: string,
  selected: Selection,
  matched: Set<string>,
  wrongFlash: string[],
): TileState {
  if (matched.has(id)) return "matched";
  if (wrongFlash.includes(`${side}-${id}`)) return "wrong";
  if (selected?.side === side && selected.id === id) return "selected";
  return "idle";
}

function Tile({
  label,
  strong,
  state,
  onClick,
}: {
  label: string;
  strong?: boolean;
  state: TileState;
  onClick: () => void;
}) {
  const [hov, setHov] = useState(false);
  const palette: Record<TileState, { bg: string; border: string; color: string }> = {
    idle: {
      bg: hov ? "var(--color-surface-2)" : "var(--color-surface)",
      border: hov ? "var(--color-accent)" : "var(--color-border)",
      color: "var(--color-text)",
    },
    selected: { bg: "var(--color-accent-soft)", border: "var(--color-accent)", color: "var(--color-accent-on-soft)" },
    matched: { bg: "var(--color-correct-dim)", border: "var(--color-correct-border)", color: "var(--color-text-3)" },
    wrong: { bg: "var(--color-incorrect-dim)", border: "var(--color-incorrect-border)", color: "var(--color-text)" },
  };
  const p = palette[state];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={state === "matched"}
      aria-pressed={state === "selected"}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        minHeight: 56,
        padding: "10px 14px",
        textAlign: "left",
        borderRadius: "var(--radius-2)",
        border: `1px solid ${p.border}`,
        backgroundColor: p.bg,
        color: p.color,
        fontFamily: "inherit",
        fontSize: "var(--text-sm)",
        fontWeight: strong ? 600 : 450,
        lineHeight: 1.4,
        cursor: state === "matched" ? "default" : "pointer",
        boxShadow: state === "idle" ? "var(--shadow-card)" : "none",
        transition: "background-color 140ms ease, border-color 140ms ease, color 140ms ease",
      }}
    >
      {label}
    </button>
  );
}

// ── Summary ──────────────────────────────────────────────────────────────────

function Summary({
  round,
  missed,
  clock,
  mistakes,
  signedIn,
  onAgain,
  onChoose,
}: {
  round: Round;
  missed: Set<string>;
  clock: string;
  mistakes: number;
  signedIn: boolean;
  onAgain: () => void;
  onChoose: () => void;
}) {
  const missedConcepts = round.concepts.filter((c) => missed.has(c.id));
  const perfect = missedConcepts.length === 0;
  return (
    <div className="animate-fade-in">
      <div
        style={{
          padding: "28px",
          textAlign: "center",
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-3)",
          boxShadow: "var(--shadow-card)",
          marginBottom: "var(--space-5)",
        }}
      >
        <div
          style={{
            fontSize: "var(--text-display)",
            fontWeight: 700,
            letterSpacing: "-0.035em",
            lineHeight: 1,
            color: perfect ? "var(--color-correct)" : "var(--color-text)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {clock}
        </div>
        <div style={{ marginTop: "var(--space-3)", fontSize: "var(--text-sm)", color: "var(--color-text-2)" }}>
          {perfect
            ? "Perfect round, no misses."
            : `${round.concepts.length - missedConcepts.length} of ${round.concepts.length} on the first try, ${mistakes} miss${mistakes === 1 ? "" : "es"}.`}
          {!signedIn && " Sign in to save your progress."}
        </div>
      </div>

      {missedConcepts.length > 0 && (
        <div style={{ marginBottom: "var(--space-5)" }}>
          <h2
            style={{
              margin: "0 0 12px",
              fontSize: "var(--text-xs)",
              fontWeight: 650,
              color: "var(--color-text-3)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {signedIn ? "Added to your review" : "Worth another look"}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {missedConcepts.map((c) => (
              <Link
                key={c.id}
                href={`/concepts/${c.slug}`}
                style={{
                  display: "block",
                  padding: "12px 16px",
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-2)",
                  textDecoration: "none",
                }}
              >
                <div style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-text)" }}>{c.name}</div>
                <div style={{ marginTop: 2, fontSize: "var(--text-sm)", color: "var(--color-text-2)", lineHeight: 1.5 }}>
                  {c.definition}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
        <Button variant="secondary" size="md" onClick={onChoose} fullWidth>
          Choose another set
        </Button>
        <Button variant="primary" size="md" onClick={onAgain} fullWidth>
          Play again
        </Button>
      </div>
    </div>
  );
}

function BackToPractice() {
  return (
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
  );
}
