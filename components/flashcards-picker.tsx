"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { PageFrame } from "@/components/ui/page-frame";

type Props = {
  totalConcepts: number;
};

export function FlashcardsPicker({ totalConcepts }: Props) {
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
  icon: "cards-three";
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
