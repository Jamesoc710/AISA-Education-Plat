"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { PageFrame } from "@/components/ui/page-frame";

const BOOKMARKS_KEY = "aisa-atlas-bookmarks";

type Props = {
  totalConcepts: number;
};

export function FlashcardsPicker({ totalConcepts }: Props) {
  const [bookmarkedCount, setBookmarkedCount] = useState<number | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(BOOKMARKS_KEY);
      const ids = stored ? (JSON.parse(stored) as string[]) : [];
      setBookmarkedCount(Array.isArray(ids) ? ids.length : 0);
    } catch {
      setBookmarkedCount(0);
    }
  }, []);

  return (
    <PageFrame>
      <header style={{ marginBottom: "var(--space-6)" }}>
        <h1
          style={{
            margin: 0,
            fontSize: "var(--text-2xl)",
            fontWeight: 600,
            color: "var(--color-text)",
            letterSpacing: "-0.02em",
          }}
        >
          Flashcards
        </h1>
        <p
          style={{
            margin: "var(--space-2) 0 0",
            fontSize: "var(--text-md)",
            color: "var(--color-text-2)",
            lineHeight: 1.55,
          }}
        >
          Pick a deck and cycle through at your own pace. Flip each card to reveal the explanation.
        </p>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <DeckRow
          href="/flashcards/all"
          title="All Concepts"
          count={totalConcepts}
          blurb="Every concept in the Atlas, from fundamentals through advanced."
          icon="cards-three"
        />
        {bookmarkedCount === null ? null : bookmarkedCount > 0 ? (
          <DeckRow
            href="/flashcards/bookmarked"
            title="Bookmarked"
            count={bookmarkedCount}
            blurb="Concepts you've saved to study later."
            icon="bookmark-filled"
          />
        ) : (
          <EmptyBookmarksHint />
        )}
      </div>
    </PageFrame>
  );
}

function DeckRow({
  href,
  title,
  count,
  blurb,
  icon,
}: {
  href: string;
  title: string;
  count: number;
  blurb: string;
  icon: "cards-three" | "bookmark-filled";
}) {
  const [hov, setHov] = useState(false);
  return (
    <Link
      href={href}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-4)",
        padding: "var(--space-4) var(--space-5)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-3)",
        backgroundColor: hov ? "var(--color-surface-2)" : "var(--color-surface)",
        textDecoration: "none",
        color: "inherit",
        transition: "background-color 120ms ease",
      }}
    >
      <div
        aria-hidden
        style={{
          width: 44,
          height: 44,
          flexShrink: 0,
          borderRadius: "var(--radius-2)",
          backgroundColor: "var(--color-accent-soft)",
          color: "var(--color-accent-on-soft)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name={icon} size={22} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "var(--space-2)",
            marginBottom: 2,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 600,
              color: "var(--color-text)",
              letterSpacing: "-0.015em",
            }}
          >
            {title}
          </h2>
          <span
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--color-text-3)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {count} {count === 1 ? "card" : "cards"}
          </span>
        </div>
        <p
          style={{
            margin: 0,
            fontSize: "var(--text-sm)",
            color: "var(--color-text-2)",
            lineHeight: 1.5,
          }}
        >
          {blurb}
        </p>
      </div>
      <Icon
        name="chevron-right"
        size={18}
        style={{ color: hov ? "var(--color-text)" : "var(--color-text-3)" }}
      />
    </Link>
  );
}

function EmptyBookmarksHint() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-3)",
        padding: "var(--space-4) var(--space-5)",
        border: "1px dashed var(--color-border)",
        borderRadius: "var(--radius-3)",
        color: "var(--color-text-3)",
        fontSize: "var(--text-sm)",
      }}
    >
      <Icon name="bookmark" size={18} />
      <span>
        Bookmark concepts from the Browse page to build a personal review deck.
      </span>
    </div>
  );
}
