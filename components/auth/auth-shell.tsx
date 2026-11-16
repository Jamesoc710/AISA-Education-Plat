"use client";

import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/icon";
import { BrandMark } from "@/components/ui/brand-mark";
import { APP_NAME, ORG_NAME } from "@/lib/brand";

const POINTS: { icon: IconName; text: string }[] = [
  { icon: "book-open", text: "Every concept explained simply, then in depth" },
  { icon: "cards-three", text: "Quizzes, flashcards and explain-it-back practice" },
  { icon: "newspaper", text: "A weekly digest of what changed in tech" },
];

/**
 * Frame for the sign-in, sign-up and password screens: a brand panel beside
 * the form on wide screens, the form alone (with the wordmark) on small ones.
 * These screens sit outside the (main) shell, so there is no app nav.
 * A client component only because the icon set needs React context.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div data-theme="light" className="auth-shell">
      <aside className="auth-brand">
        <BrandMark size={32} onDark />
        <div>
          <p className="auth-brand-title">Learn how modern AI actually works.</p>
          <p className="auth-brand-lead">
            The {ORG_NAME} study platform. Read the ideas, practice until they stick, and keep up
            with the week in tech.
          </p>
          <ul className="auth-brand-points">
            {POINTS.map((p) => (
              <li key={p.text}>
                <Icon name={p.icon} size={18} />
                {p.text}
              </li>
            ))}
          </ul>
        </div>
        <p className="auth-brand-foot">{APP_NAME}</p>
      </aside>

      <main className="auth-main">
        <div className="auth-main-top">
          <BrandMark size={28} />
        </div>
        <div className="auth-card">{children}</div>
      </main>
    </div>
  );
}
