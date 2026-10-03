"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/icon";
import { IconTile } from "@/components/ui/icon-tile";
import { PageFrame } from "@/components/ui/page-frame";
import type { ReviewSummary } from "@/lib/review";

const MODES: { href: string; title: string; blurb: string; icon: IconName; tile: string }[] = [
  {
    href: "/quiz",
    title: "Quiz",
    blurb: "Multiple choice and short answer, by concept, section, or a random mix.",
    icon: "help-circle",
    tile: "indigo",
  },
  {
    href: "/practice/match",
    title: "Match",
    blurb: "Pair six terms with their definitions against the clock.",
    icon: "arrows-left-right",
    tile: "sky",
  },
  {
    href: "/practice/explain",
    title: "Explain it back",
    blurb: "Explain a concept in your own words and get feedback on what you missed.",
    icon: "chat-circle-text",
    tile: "lilac",
  },
  {
    href: "/flashcards",
    title: "Flashcards",
    blurb: "Flip through concepts and mark what you know.",
    icon: "cards-three",
    tile: "mint",
  },
];

function formatNextDue(iso: string): string {
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
  if (days <= 1) return "tomorrow";
  return `in ${days} days`;
}

export function PracticeHub({ review }: { review: ReviewSummary | null }) {
  return (
    <PageFrame maxWidth={820}>
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
        Practice
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
        Every way to practice feeds one review queue. Miss something and it comes back tomorrow; get it
        right and it comes back later, right before you&rsquo;d forget it.
      </p>

      <ReviewPanel review={review} />

      <div
        className="quiz-mode-grid"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}
      >
        {MODES.map((m) => (
          <ModeCard key={m.href} {...m} />
        ))}
      </div>
    </PageFrame>
  );
}

function ReviewPanel({ review }: { review: ReviewSummary | null }) {
  let title: string;
  let body: string;
  let action: { href: string; label: string } | null = null;

  if (!review) {
    title = "Your review queue";
    body = "Sign in and everything you practice is tracked, so the right concepts come back at the right time.";
    action = { href: "/login?next=%2Fpractice", label: "Sign in" };
  } else if (review.dueCount > 0) {
    title = `${review.dueCount} concept${review.dueCount === 1 ? "" : "s"} due for review`;
    body = "One question per concept. It takes a few minutes.";
    action = { href: "/quiz?mode=review", label: "Start review" };
  } else if (review.totalCount > 0) {
    title = "All caught up";
    body = review.nextDueAt
      ? `Nothing is due. Your next review is ${formatNextDue(review.nextDueAt)}.`
      : "Nothing is due right now.";
  } else {
    title = "Your review queue is empty";
    body = "Practice anything below, or add a concept from its page, and it starts filling up.";
  }

  return (
    <section
      aria-label="Review queue"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-4)",
        flexWrap: "wrap",
        padding: "20px 22px",
        marginBottom: "var(--space-5)",
        backgroundColor: review?.dueCount ? "var(--color-accent-soft)" : "var(--color-surface)",
        border: `1px solid ${review?.dueCount ? "var(--color-accent)" : "var(--color-border)"}`,
        borderRadius: "var(--radius-3)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <IconTile icon="arrows-clockwise" color="indigo" size="md" />
      <div style={{ flex: "1 1 260px", minWidth: 0 }}>
        <div
          style={{
            fontSize: "var(--text-md)",
            fontWeight: 600,
            color: "var(--color-text)",
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </div>
        <div style={{ marginTop: 4, fontSize: "var(--text-sm)", color: "var(--color-text-2)", lineHeight: 1.5 }}>
          {body}
          {review && review.masteredCount > 0 && (
            <> {review.masteredCount} concept{review.masteredCount === 1 ? "" : "s"} at the top box.</>
          )}
        </div>
      </div>
      {action && (
        <Link
          href={action.href}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            height: 34,
            padding: "0 16px",
            borderRadius: "var(--radius-2)",
            backgroundColor: "var(--color-accent)",
            color: "#fff",
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          {action.label}
          <Icon name="arrow-right" size={14} />
        </Link>
      )}
    </section>
  );
}

function ModeCard({
  href,
  title,
  blurb,
  icon,
  tile,
}: {
  href: string;
  title: string;
  blurb: string;
  icon: IconName;
  tile: string;
}) {
  const [hov, setHov] = useState(false);
  return (
    <Link
      href={href}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "var(--space-5)",
        padding: "24px 22px 22px",
        backgroundColor: "var(--color-surface)",
        border: `1px solid ${hov ? "var(--color-accent)" : "var(--color-border)"}`,
        borderRadius: "var(--radius-3)",
        textDecoration: "none",
        boxShadow: hov ? "var(--shadow-card-hover)" : "var(--shadow-card)",
        transform: hov ? "translateY(-1px)" : "translateY(0)",
        transition: "border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease",
      }}
    >
      <IconTile icon={icon} color={tile} size="md" />
      <div>
        <div
          style={{
            fontSize: "var(--text-md)",
            fontWeight: 600,
            color: "var(--color-text)",
            marginBottom: "var(--space-2)",
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-2)", lineHeight: 1.5 }}>{blurb}</div>
      </div>
    </Link>
  );
}
