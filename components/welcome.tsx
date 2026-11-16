import Link from "next/link";
import { HairRule, SectionEyebrow, ArrowRight, EditorialLinkStyles } from "@/components/ui/editorial";

const DOORS: { href: string; title: string; body: string; cta: string }[] = [
  {
    href: "/browse",
    title: "Learn",
    body: "Every concept explained twice: once in plain language, once in depth, with the best outside reading attached.",
    cta: "Browse the curriculum",
  },
  {
    href: "/practice",
    title: "Practice",
    body: "Quizzes, flashcards, matching and explain-it-back, with a review queue that brings back what you missed.",
    cta: "See the practice modes",
  },
  {
    href: "/digest",
    title: "Keep up",
    body: "A short weekly digest of what changed in AI, tech and markets, and why it matters.",
    cta: "Read this week's digest",
  },
];

/**
 * What a signed-out visitor sees at the front door (/ redirects to /home).
 * Says what the platform is before asking for an account; the three sections
 * link to pages that are open without one.
 */
export function Welcome() {
  return (
    <div data-surface="editorial" style={{ backgroundColor: "var(--color-bg)", minHeight: "100%" }}>
      <div
        style={{
          maxWidth: 1080,
          margin: "0 auto",
          padding: "var(--pad-page-y) var(--pad-wide-x) 96px",
        }}
      >
        <SectionEyebrow>TCO Education</SectionEyebrow>
        <h1
          style={{
            margin: 0,
            maxWidth: 820,
            fontSize: "clamp(40px, 6.4vw, 68px)",
            fontWeight: 600,
            letterSpacing: "-0.03em",
            lineHeight: 1.04,
            color: "var(--color-text)",
          }}
        >
          Learn how modern AI actually works.
        </h1>
        <p
          style={{
            margin: "20px 0 0",
            maxWidth: 620,
            fontSize: "var(--text-md)",
            lineHeight: 1.55,
            color: "var(--color-text-2)",
          }}
        >
          The study platform for TCO members. Read each concept, practice until it sticks, and
          keep up with the week in tech. An account saves your progress.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", marginTop: "var(--space-6)" }}>
          <Link
            href="/signup?next=%2Fhome"
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: 44,
              padding: "0 20px",
              fontSize: "var(--text-base)",
              fontWeight: 600,
              color: "#fff",
              backgroundColor: "var(--color-accent)",
              borderRadius: "var(--radius-2)",
              textDecoration: "none",
            }}
          >
            Create an account
          </Link>
          <Link
            href="/login?next=%2Fhome"
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: 44,
              padding: "0 20px",
              fontSize: "var(--text-base)",
              fontWeight: 600,
              color: "var(--color-text)",
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-2)",
              textDecoration: "none",
            }}
          >
            Sign in
          </Link>
        </div>

        <HairRule top={48} bottom={36} />

        <div
          className="stack-on-phone"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "var(--space-6)",
          }}
        >
          {DOORS.map((d) => (
            <div key={d.href}>
              <h2
                style={{
                  margin: "0 0 8px",
                  fontSize: "var(--text-lg)",
                  fontWeight: 600,
                  letterSpacing: "-0.015em",
                  color: "var(--color-text)",
                }}
              >
                {d.title}
              </h2>
              <p
                style={{
                  margin: "0 0 14px",
                  fontSize: "var(--text-md)",
                  lineHeight: 1.55,
                  color: "var(--color-text-2)",
                }}
              >
                {d.body}
              </p>
              <Link
                href={d.href}
                className="editorial-link"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                  fontSize: "var(--text-base)",
                  fontWeight: 500,
                  color: "var(--color-accent)",
                  textDecoration: "none",
                }}
              >
                {d.cta}
                <ArrowRight />
              </Link>
            </div>
          ))}
        </div>
      </div>
      <EditorialLinkStyles />
    </div>
  );
}
