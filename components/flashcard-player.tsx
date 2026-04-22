"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { PageFrame } from "@/components/ui/page-frame";

const BOOKMARKS_KEY = "aisa-atlas-bookmarks";

type Card = {
  id: string;
  slug: string;
  term: string;
  definition: string;
  expandedDefinition: string;
  tier: string;
  sectionName: string;
};

type Deck = "all" | "bookmarked" | "workshop";

type Props = {
  deck: Deck;
  deckLabel: string;
  cards: Card[];
};

export function FlashcardPlayer({ deck, deckLabel, cards }: Props) {
  // Bookmarks come from localStorage; hydrate once on mount
  const [bookmarks, setBookmarks] = useState<Set<string> | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(BOOKMARKS_KEY);
      const ids = stored ? (JSON.parse(stored) as string[]) : [];
      setBookmarks(new Set(Array.isArray(ids) ? ids : []));
    } catch {
      setBookmarks(new Set());
    }
  }, []);

  // For the bookmarked deck, freeze the initial set of IDs once on mount so
  // unstarring a card during the session doesn't pull it out from under you.
  const frozenBookmarkIds = useRef<Set<string> | null>(null);
  if (deck === "bookmarked" && frozenBookmarkIds.current === null && bookmarks !== null) {
    frozenBookmarkIds.current = new Set(bookmarks);
  }

  const activeCards = useMemo(() => {
    if (deck !== "bookmarked") return cards;
    if (frozenBookmarkIds.current === null) return [];
    const ids = frozenBookmarkIds.current;
    return cards.filter((c) => ids.has(c.id));
  }, [deck, cards, bookmarks]);

  const [order, setOrder] = useState<number[]>(() =>
    Array.from({ length: cards.length }, (_, i) => i),
  );

  useEffect(() => {
    setOrder(Array.from({ length: activeCards.length }, (_, i) => i));
    setIndex(0);
    setFlipped(false);
  }, [activeCards.length]);

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const total = activeCards.length;
  const current = total > 0 ? activeCards[order[index] ?? 0] : null;

  const goPrev = useCallback(() => {
    if (total === 0) return;
    setFlipped(false);
    setExpanded(false);
    setIndex((i) => (i - 1 + total) % total);
  }, [total]);

  const goNext = useCallback(() => {
    if (total === 0) return;
    setFlipped(false);
    setExpanded(false);
    setIndex((i) => (i + 1) % total);
  }, [total]);

  const flip = useCallback(() => {
    if (total === 0) return;
    setFlipped((f) => !f);
  }, [total]);

  const toggleExpand = useCallback(() => {
    if (total === 0) return;
    setExpanded((e) => !e);
  }, [total]);

  const shuffle = useCallback(() => {
    if (total <= 1) return;
    setOrder((prev) => {
      const next = [...prev];
      for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
      }
      return next;
    });
    setIndex(0);
    setFlipped(false);
    setExpanded(false);
  }, [total]);

  const toggleBookmark = useCallback((id: string) => {
    setBookmarks((prev) => {
      const next = new Set(prev ?? []);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === " " || e.key === "f" || e.key === "F") {
        e.preventDefault();
        flip();
      } else if (e.key === "s" || e.key === "S") {
        shuffle();
      } else if (e.key === "b" || e.key === "B") {
        if (current) toggleBookmark(current.id);
      } else if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        toggleExpand();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext, flip, shuffle, toggleBookmark, toggleExpand, current]);

  if (bookmarks === null) {
    return <PageFrame maxWidth={1100}><div style={{ height: 400 }} /></PageFrame>;
  }

  if (total === 0) {
    return (
      <PageFrame maxWidth={1100}>
        <EmptyDeck deck={deck} />
      </PageFrame>
    );
  }

  const isStarred = current ? bookmarks.has(current.id) : false;

  return (
    <PageFrame maxWidth={1100} padding="var(--space-5) var(--pad-page-x) var(--space-6)">
      {/* ── Top bar: back pill · counter + deck label · (empty) ───────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          marginBottom: "var(--space-4)",
          gap: "var(--space-3)",
        }}
      >
        <div>
          <BackPill />
        </div>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "var(--text-md)",
              fontWeight: 600,
              color: "var(--color-text)",
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1.2,
            }}
          >
            {index + 1} / {total}
          </div>
          <div
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--color-text-2)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontWeight: 600,
              marginTop: 2,
            }}
          >
            {deckLabel}
          </div>
        </div>
        <div />
      </div>

      {/* ── Flip card ─────────────────────────────────────────────────────── */}
      {current && (
        <FlipCard
          key={current.id}
          card={current}
          flipped={flipped}
          expanded={expanded}
          starred={isStarred}
          onFlip={flip}
          onStar={() => toggleBookmark(current.id)}
          onToggleExpand={toggleExpand}
        />
      )}

      {/* ── Bottom controls: (spacer) · prev/next · shuffle ──────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          marginTop: "var(--space-5)",
        }}
      >
        <div />
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <CircleButton onClick={goPrev} ariaLabel="Previous card (←)" title="Previous · ←">
            <Icon name="arrow-left" size={18} />
          </CircleButton>
          <CircleButton onClick={goNext} ariaLabel="Next card (→)" title="Next · →">
            <Icon name="arrow-right" size={18} />
          </CircleButton>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <CircleButton onClick={shuffle} ariaLabel="Shuffle (S)" title="Shuffle · S">
            <Icon name="shuffle" size={17} />
          </CircleButton>
        </div>
      </div>
    </PageFrame>
  );
}

// ── Flip card ────────────────────────────────────────────────────────────────

function FlipCard({
  card,
  flipped,
  expanded,
  starred,
  onFlip,
  onStar,
  onToggleExpand,
}: {
  card: Card;
  flipped: boolean;
  expanded: boolean;
  starred: boolean;
  onFlip: () => void;
  onStar: () => void;
  onToggleExpand: () => void;
}) {
  return (
    <div
      onClick={onFlip}
      role="button"
      tabIndex={0}
      aria-label={`${card.term} flashcard. Click to flip.`}
      aria-pressed={flipped}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onFlip();
        }
      }}
      style={{
        perspective: 2000,
        width: "100%",
        aspectRatio: "16 / 10",
        cursor: "pointer",
        outline: "none",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          transformStyle: "preserve-3d",
          transition: "transform 500ms cubic-bezier(0.2, 0.8, 0.2, 1)",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        <CardFace
          side="front"
          card={card}
          expanded={expanded}
          starred={starred}
          onStar={onStar}
          onToggleExpand={onToggleExpand}
        />
        <CardFace
          side="back"
          card={card}
          expanded={expanded}
          starred={starred}
          onStar={onStar}
          onToggleExpand={onToggleExpand}
        />
      </div>
    </div>
  );
}

function CardFace({
  side,
  card,
  expanded,
  starred,
  onStar,
  onToggleExpand,
}: {
  side: "front" | "back";
  card: Card;
  expanded: boolean;
  starred: boolean;
  onStar: () => void;
  onToggleExpand: () => void;
}) {
  const isBack = side === "back";
  const hasExpansion = isBack && card.expandedDefinition !== card.definition;
  const largeFont = "clamp(24px, 3.4vw, 44px)";
  const smallFont = "clamp(18px, 2.2vw, 28px)";
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        transform: isBack ? "rotateY(180deg)" : "rotateY(0deg)",
        backgroundColor: "var(--color-surface)",
        borderRadius: 20,
        boxShadow:
          "0 1px 2px rgba(20, 20, 30, 0.04), 0 10px 30px rgba(20, 20, 30, 0.06), 0 2px 8px rgba(20, 20, 30, 0.03)",
        padding: "var(--space-6) var(--space-7)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Star in top-right */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <StarButton starred={starred} onClick={onStar} />
      </div>

      {/* Centered content — stacked layers for smooth crossfade */}
      <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
        {isBack ? (
          <>
            <CardTextLayer
              text={card.definition}
              fontSize={largeFont}
              visible={!expanded}
            />
            <CardTextLayer
              text={card.expandedDefinition}
              fontSize={smallFont}
              visible={expanded}
            />
          </>
        ) : (
          <CardTextLayer text={card.term} fontSize={largeFont} visible={true} />
        )}
      </div>

      {/* Bottom row: Explain / Show less pill (back only) */}
      {hasExpansion && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <ExplainPill expanded={expanded} onClick={onToggleExpand} />
        </div>
      )}
    </div>
  );
}

function CardTextLayer({
  text,
  fontSize,
  visible,
}: {
  text: string;
  fontSize: string;
  visible: boolean;
}) {
  return (
    <div
      aria-hidden={!visible}
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 var(--space-4)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(6px)",
        transition:
          "opacity 260ms cubic-bezier(0.2, 0.8, 0.2, 1), transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <div
        style={{
          maxWidth: "85%",
          textAlign: "left",
          fontSize,
          fontWeight: 400,
          color: "var(--color-text)",
          letterSpacing: "-0.015em",
          lineHeight: 1.35,
        }}
      >
        {text}
      </div>
    </div>
  );
}

// ── Explain / Show less pill ─────────────────────────────────────────────────

function ExplainPill({ expanded, onClick }: { expanded: boolean; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      aria-label={expanded ? "Show less (E)" : "Explain further (E)"}
      aria-expanded={expanded}
      title={expanded ? "Show less · E" : "Explain · E"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 14px",
        fontSize: "var(--text-sm)",
        fontWeight: 500,
        color: hov ? "var(--color-text)" : "var(--color-text-2)",
        backgroundColor: hov ? "var(--color-surface-2)" : "transparent",
        border: "1px solid var(--color-border)",
        borderRadius: 999,
        cursor: "pointer",
        transition: "color 120ms ease, background-color 120ms ease",
      }}
    >
      {expanded ? "Show less" : "Explain"}
    </button>
  );
}

// ── Star button ──────────────────────────────────────────────────────────────

function StarButton({ starred, onClick }: { starred: boolean; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      aria-label={starred ? "Remove bookmark (B)" : "Bookmark (B)"}
      title={starred ? "Bookmarked · B" : "Bookmark · B"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 36,
        height: 36,
        border: "none",
        background: hov ? "var(--color-surface-2)" : "transparent",
        borderRadius: "50%",
        cursor: "pointer",
        color: starred ? "var(--color-gold, #D4A94C)" : "var(--color-text-2)",
        transition: "color 120ms ease, background-color 120ms ease",
      }}
    >
      <Icon name={starred ? "star-filled" : "star"} size={20} />
    </button>
  );
}

// ── Circular control button ──────────────────────────────────────────────────

function CircleButton({
  onClick,
  ariaLabel,
  title,
  children,
}: {
  onClick: () => void;
  ariaLabel: string;
  title?: string;
  children: React.ReactNode;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      aria-label={ariaLabel}
      title={title}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 52,
        height: 52,
        backgroundColor: hov ? "var(--color-surface-3)" : "var(--color-surface-2)",
        border: "none",
        borderRadius: "50%",
        cursor: "pointer",
        color: "var(--color-text)",
        transition: "background-color 120ms ease",
        padding: 0,
      }}
    >
      {children}
    </button>
  );
}

// ── Back pill ────────────────────────────────────────────────────────────────

function BackPill() {
  const [hov, setHov] = useState(false);
  return (
    <Link
      href="/flashcards"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-2)",
        padding: "8px 14px 8px 10px",
        fontSize: "var(--text-sm)",
        fontWeight: 500,
        color: hov ? "var(--color-text)" : "var(--color-text-2)",
        backgroundColor: hov ? "var(--color-surface-2)" : "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 999,
        textDecoration: "none",
        transition: "color 120ms ease, background-color 120ms ease",
      }}
    >
      <Icon name="arrow-left" size={14} />
      Decks
    </Link>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────────

function EmptyDeck({ deck }: { deck: Deck }) {
  const title =
    deck === "bookmarked"
      ? "No bookmarked concepts yet"
      : deck === "workshop"
      ? "No concepts tagged for this session"
      : "No cards in this deck";
  const body =
    deck === "bookmarked"
      ? "Bookmark concepts from the Browse page to build your review deck."
      : deck === "workshop"
      ? "This session doesn't have any related concepts yet. Check the calendar for others."
      : "Try picking a different deck.";
  const ctaHref = deck === "bookmarked" ? "/browse" : deck === "workshop" ? "/calendar" : "/flashcards";
  const ctaLabel =
    deck === "bookmarked" ? "Go to Browse" : deck === "workshop" ? "Open calendar" : "Back to decks";
  return (
    <>
      <div style={{ marginBottom: "var(--space-5)" }}>
        <BackPill />
      </div>
      <div
        style={{
          textAlign: "center",
          padding: "var(--space-8) var(--space-4)",
          border: "1px dashed var(--color-border)",
          borderRadius: "var(--radius-3)",
          color: "var(--color-text-2)",
        }}
      >
        <Icon name="bookmark" size={28} style={{ margin: "0 auto var(--space-3)" }} />
        <h2 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 600, color: "var(--color-text)" }}>
          {title}
        </h2>
        <p style={{ margin: "var(--space-2) 0 var(--space-4)", fontSize: "var(--text-sm)" }}>{body}</p>
        <Link
          href={ctaHref}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-2)",
            padding: "8px 14px",
            fontSize: "var(--text-sm)",
            fontWeight: 500,
            color: "#fff",
            backgroundColor: "var(--color-accent)",
            borderRadius: "var(--radius-2)",
            textDecoration: "none",
          }}
        >
          {ctaLabel}
        </Link>
      </div>
    </>
  );
}
