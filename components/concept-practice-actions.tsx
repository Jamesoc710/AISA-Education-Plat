"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/icon";

export type ConceptReviewState = { inReview: boolean; dueAt: string | null };

function dueLabel(iso: string | null): string {
  if (!iso) return "";
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
  if (days <= 0) return "due now";
  if (days === 1) return "due tomorrow";
  return `due in ${days} days`;
}

/**
 * Practice actions under a concept's title: add it to the review queue, quiz
 * on it, or explain it back. The review toggle needs an account; the links
 * work for anyone (a signed-out quiz just isn't saved).
 */
export function ConceptPracticeActions({
  conceptId,
  conceptSlug,
  hasQuestions,
  signedIn,
  initialReview,
}: {
  conceptId: string;
  conceptSlug: string;
  hasQuestions: boolean;
  signedIn: boolean;
  initialReview: ConceptReviewState;
}) {
  const [review, setReview] = useState(initialReview);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/review", {
        method: review.inReview ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conceptId }),
      });
      if (res.ok) {
        const data = await res.json();
        setReview({ inReview: data.inReview, dueAt: data.dueAt ?? null });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", marginTop: "var(--space-4)" }}>
      {signedIn && (
        <ActionButton
          icon={review.inReview ? "check-circle" : "arrows-clockwise"}
          label={review.inReview ? `In your review, ${dueLabel(review.dueAt)}` : "Add to review"}
          title={review.inReview ? "Remove from your review queue" : "Bring this back at spaced intervals"}
          active={review.inReview}
          disabled={busy}
          onClick={toggle}
        />
      )}
      {hasQuestions && (
        <ActionLink icon="help-circle" label="Quiz me" href={`/quiz?mode=concept&id=${conceptId}`} />
      )}
      <ActionLink icon="chat-circle-text" label="Explain it back" href={`/practice/explain?concept=${conceptSlug}`} />
    </div>
  );
}

const pill = (active: boolean, hov: boolean) =>
  ({
    display: "inline-flex",
    alignItems: "center",
    gap: "var(--space-2)",
    padding: "7px 12px",
    borderRadius: "var(--radius-2)",
    border: `1px solid ${active ? "var(--color-accent)" : "var(--color-border)"}`,
    backgroundColor: active ? "var(--color-accent-soft)" : hov ? "var(--color-surface-2)" : "var(--color-surface)",
    color: active ? "var(--color-accent-on-soft)" : hov ? "var(--color-text)" : "var(--color-text-2)",
    fontFamily: "inherit",
    fontSize: "var(--text-sm)",
    fontWeight: 500,
    textDecoration: "none",
    cursor: "pointer",
    transition: "background-color 100ms ease, color 100ms ease, border-color 100ms ease",
  }) as const;

function ActionButton({
  icon,
  label,
  title,
  active,
  disabled,
  onClick,
}: {
  icon: IconName;
  label: string;
  title: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      title={title}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ ...pill(active, hov), opacity: disabled ? 0.6 : 1 }}
    >
      <Icon name={icon} size={14} strokeWidth={1.85} />
      {label}
    </button>
  );
}

function ActionLink({ icon, label, href }: { icon: IconName; label: string; href: string }) {
  const [hov, setHov] = useState(false);
  return (
    <Link
      href={href}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={pill(false, hov)}
    >
      <Icon name={icon} size={14} strokeWidth={1.85} />
      {label}
    </Link>
  );
}
