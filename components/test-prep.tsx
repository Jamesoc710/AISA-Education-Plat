import Link from "next/link";
import { PageFrame } from "@/components/ui/page-frame";
import {
  ANSWER_ADVICE,
  LAST_YEARS_TEST,
  TEST_PREP_DECK_PREFIX,
  TEST_PREP_FORMAT,
  TEST_PREP_GROUPS,
  type TestPrepPriority,
} from "@/lib/test-prep";

export type AreaView = {
  slug: string;
  title: string;
  priority: TestPrepPriority;
  summary: string;
  outcomes: string[];
  concepts: { slug: string; name: string }[];
  hasQuestions: boolean;
  /** How many of this area's concepts the member has practiced at least once. */
  practicedCount: number;
};

const h2Style = {
  margin: "0 0 var(--space-2)",
  fontSize: "var(--text-xl)",
  fontWeight: 600,
  letterSpacing: "-0.02em",
  color: "var(--color-text)",
} as const;

const leadStyle = {
  margin: "0 0 var(--space-5)",
  maxWidth: 640,
  fontSize: "var(--text-md)",
  lineHeight: 1.55,
  color: "var(--color-text-2)",
} as const;

const cardStyle = {
  backgroundColor: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-3)",
  boxShadow: "var(--shadow-card)",
} as const;

export function TestPrep({ areas }: { areas: AreaView[] }) {
  let number = 0;
  return (
    <PageFrame maxWidth={860}>
      <h1
        style={{
          margin: "0 0 var(--space-2)",
          fontSize: "var(--text-2xl)",
          fontWeight: 600,
          letterSpacing: "-0.025em",
          color: "var(--color-text)",
        }}
      >
        Test prep
      </h1>
      <p style={{ ...leadStyle, marginBottom: "var(--space-6)" }}>
        What the tech team test covers, what to study first, and what last year&apos;s test looked
        like. This year&apos;s questions are worded differently and some topics have changed, so
        study the ideas, not the wording.
      </p>

      {/* ── How the test works ─────────────────────────────────────── */}
      <section aria-labelledby="prep-format" style={{ marginBottom: "var(--space-7)" }}>
        <h2 id="prep-format" style={h2Style}>
          How the test works
        </h2>
        <div
          className="stack-on-phone"
          style={{
            ...cardStyle,
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "var(--space-4)",
            padding: "var(--space-5)",
            marginTop: "var(--space-4)",
          }}
        >
          {TEST_PREP_FORMAT.facts.map((f) => (
            <div key={f.label}>
              <div
                style={{
                  fontSize: "var(--text-xs)",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "var(--color-text-2)",
                  marginBottom: "var(--space-1)",
                }}
              >
                {f.label}
              </div>
              <div style={{ fontSize: "var(--text-md)", fontWeight: 600, color: "var(--color-text)" }}>
                {f.value}
              </div>
            </div>
          ))}
        </div>
        <p style={{ ...leadStyle, margin: "var(--space-3) 0 0", fontSize: "var(--text-base)" }}>
          {TEST_PREP_FORMAT.note}
        </p>
      </section>

      {/* ── What to study ──────────────────────────────────────────── */}
      {TEST_PREP_GROUPS.map((group) => (
        <section
          key={group.priority}
          aria-labelledby={`prep-${group.priority}`}
          style={{ marginBottom: "var(--space-7)" }}
        >
          <h2 id={`prep-${group.priority}`} style={h2Style}>
            {group.title}
          </h2>
          <p style={leadStyle}>{group.lead}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            {areas
              .filter((a) => a.priority === group.priority)
              .map((area) => (
                <AreaCard key={area.slug} area={area} number={++number} />
              ))}
          </div>
        </section>
      ))}

      {/* ── How to answer ──────────────────────────────────────────── */}
      <section aria-labelledby="prep-answers" style={{ marginBottom: "var(--space-7)" }}>
        <h2 id="prep-answers" style={h2Style}>
          Writing a strong answer
        </h2>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)",
            marginTop: "var(--space-4)",
          }}
        >
          {ANSWER_ADVICE.map((a) => (
            <div key={a.title}>
              <h3
                style={{
                  margin: "0 0 var(--space-1)",
                  fontSize: "var(--text-md)",
                  fontWeight: 600,
                  color: "var(--color-text)",
                }}
              >
                {a.title}
              </h3>
              <p
                style={{
                  margin: 0,
                  maxWidth: 680,
                  fontSize: "var(--text-base)",
                  lineHeight: 1.6,
                  color: "var(--color-text-2)",
                }}
              >
                {a.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Last year's test ───────────────────────────────────────── */}
      <section aria-labelledby="prep-last-year">
        <h2 id="prep-last-year" style={h2Style}>
          Last year&apos;s test
        </h2>
        <p style={leadStyle}>
          The full test from last year, so you can see the style and depth. Expect different
          wording this year, and some different topics.
        </p>
        <div style={{ ...cardStyle, padding: "var(--space-2) var(--space-5)" }}>
          {LAST_YEARS_TEST.map((group, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: "var(--space-4)",
                padding: "var(--space-4) 0",
                borderTop: i === 0 ? "none" : "1px solid var(--color-border)",
              }}
            >
              <div
                aria-hidden
                style={{
                  flexShrink: 0,
                  width: 28,
                  fontSize: "var(--text-base)",
                  fontWeight: 600,
                  color: "var(--color-text-2)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {i + 1}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                {group.map((q) => (
                  <p
                    key={q}
                    style={{
                      margin: 0,
                      fontSize: "var(--text-md)",
                      lineHeight: 1.55,
                      color: "var(--color-text)",
                    }}
                  >
                    {q}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </PageFrame>
  );
}

function AreaCard({ area, number }: { area: AreaView; number: number }) {
  const total = area.concepts.length;
  return (
    <article style={{ ...cardStyle, padding: "var(--space-5)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "var(--space-2)",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "var(--text-lg)",
            fontWeight: 600,
            letterSpacing: "-0.015em",
            color: "var(--color-text)",
          }}
        >
          <span style={{ color: "var(--color-text-2)", fontVariantNumeric: "tabular-nums" }}>
            {number}.
          </span>{" "}
          {area.title}
        </h3>
        {total > 0 && (
          <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-2)" }}>
            {area.practicedCount} of {total} practiced
          </span>
        )}
      </div>
      <p
        style={{
          margin: "var(--space-1) 0 var(--space-4)",
          fontSize: "var(--text-base)",
          lineHeight: 1.55,
          color: "var(--color-text-2)",
        }}
      >
        {area.summary}
      </p>

      <div
        style={{
          fontSize: "var(--text-sm)",
          fontWeight: 600,
          color: "var(--color-text)",
          marginBottom: "var(--space-2)",
        }}
      >
        You should be able to
      </div>
      <ul
        className="prep-outcomes"
        style={{
          margin: "0 0 var(--space-4)",
          paddingLeft: "var(--space-5)",
          fontSize: "var(--text-base)",
          lineHeight: 1.55,
          color: "var(--color-text)",
        }}
      >
        {area.outcomes.map((o) => (
          <li key={o}>{o}</li>
        ))}
      </ul>

      {total > 0 && (
        <>
          <div
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: 600,
              color: "var(--color-text)",
              marginBottom: "var(--space-2)",
            }}
          >
            Read
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
            {area.concepts.map((c) => (
              <Link key={c.slug} href={`/concepts/${c.slug}`} className="prep-chip">
                {c.name}
              </Link>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "var(--space-2)",
              marginTop: "var(--space-4)",
              paddingTop: "var(--space-4)",
              borderTop: "1px solid var(--color-border)",
            }}
          >
            {area.hasQuestions && (
              <Link href={`/quiz?mode=topic&id=${area.slug}`} className="prep-action prep-action-primary">
                Quiz this area
              </Link>
            )}
            <Link href={`/flashcards/${TEST_PREP_DECK_PREFIX}${area.slug}`} className="prep-action">
              Flashcards
            </Link>
          </div>
        </>
      )}
    </article>
  );
}
