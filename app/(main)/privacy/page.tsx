import type { Metadata } from "next";
import { PageFrame } from "@/components/ui/page-frame";
import { APP_NAME, ORG_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Privacy",
  description: `What ${APP_NAME} collects, why, and who can see it.`,
};

// Update this date whenever the text below changes.
const LAST_UPDATED = "November 15, 2026";

const SECTIONS: { title: string; body: (string | string[])[] }[] = [
  {
    title: "What this is",
    body: [
      `${APP_NAME} is a study platform run by ${ORG_NAME}, a student organization, for its members. This page explains what the platform stores about you and what it is used for. It is written to be read, not to be legal cover.`,
    ],
  },
  {
    title: "What we collect",
    body: [
      [
        "Your account: your name and email address, and a password that is stored in scrambled form we cannot read.",
        "If you sign in with Google: your name, email address and basic profile from Google. We never see your Google password and cannot access anything else in your Google account.",
        "Your study activity: quiz answers, the short answers and explanations you write, flashcard and matching results, and the review schedule built from them.",
        "Things you post: links and notes on team pages, and requests to join projects on the build board.",
        "Feedback you send: your message, an optional screenshot, and which page you were on.",
      ],
      "The site uses two kinds of cookie: one that keeps you signed in and one that remembers which subject you were browsing. There are no advertising cookies and no third-party analytics trackers.",
    ],
  },
  {
    title: "How it is used",
    body: [
      `Only to run the platform: saving your progress, deciding what to bring back for review, grading written answers, and showing you your own results. ${ORG_NAME} leads who run the education program can see member names, email addresses, progress and feedback so they can support members and improve the material.`,
      "We do not sell your information, share it with advertisers, or use it for anything unrelated to the club's education program.",
    ],
  },
  {
    title: "Services that handle your data",
    body: [
      [
        "Supabase stores accounts, the database and uploaded screenshots.",
        "Vercel hosts the site and keeps standard server logs, such as IP addresses, for security and debugging.",
        "Anthropic: when you submit a written answer, the text of your answer is sent to Anthropic's Claude to be graded. It is sent with the question, not with your name or email.",
        "Google, only if you choose to sign in with Google.",
      ],
    ],
  },
  {
    title: "Keeping and deleting",
    body: [
      `Your information is kept for as long as you have an account. To have your account and everything tied to it deleted, or to ask what is stored about you, use the Feedback button in the app or talk to an ${ORG_NAME} lead.`,
    ],
  },
  {
    title: "Changes",
    body: ["If what we collect or how we use it changes, this page will be updated and the date below will change."],
  },
];

export default function PrivacyPage() {
  return (
    <PageFrame maxWidth={720}>
      <h1
        style={{
          margin: "0 0 var(--space-2)",
          fontSize: "var(--text-2xl)",
          fontWeight: 600,
          letterSpacing: "-0.025em",
          color: "var(--color-text)",
        }}
      >
        Privacy
      </h1>
      <p style={{ margin: "0 0 var(--space-6)", fontSize: "var(--text-base)", color: "var(--color-text-2)" }}>
        Last updated {LAST_UPDATED}
      </p>

      {SECTIONS.map((section) => (
        <section key={section.title} style={{ marginBottom: "var(--space-6)" }}>
          <h2
            style={{
              margin: "0 0 var(--space-2)",
              fontSize: "var(--text-lg)",
              fontWeight: 600,
              letterSpacing: "-0.015em",
              color: "var(--color-text)",
            }}
          >
            {section.title}
          </h2>
          {section.body.map((block, i) =>
            Array.isArray(block) ? (
              <ul
                key={i}
                className="prep-outcomes"
                style={{
                  margin: "0 0 var(--space-3)",
                  paddingLeft: "var(--space-5)",
                  fontSize: "var(--text-md)",
                  lineHeight: 1.6,
                  color: "var(--color-text)",
                }}
              >
                {block.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p
                key={i}
                style={{
                  margin: "0 0 var(--space-3)",
                  fontSize: "var(--text-md)",
                  lineHeight: 1.6,
                  color: "var(--color-text)",
                }}
              >
                {block}
              </p>
            ),
          )}
        </section>
      ))}
    </PageFrame>
  );
}
