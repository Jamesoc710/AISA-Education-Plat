"use client";

import Link from "next/link";
import type { DigestItem } from "@/lib/digest-sync";

interface DigestEditionView {
  headline: string;
  weekOf: string; // ISO — Monday 00:00 UTC
  generatedAt: string; // ISO
  status: string;
  items: DigestItem[];
  bigPicture: string | null; // closer narrative, \n\n-separated paragraphs
  watchFor: string | null;
}

export interface PastEditionRef {
  weekOf: string; // ISO
  headline: string;
}

interface DigestClientProps {
  edition: DigestEditionView | null;
  stale: boolean;
  previewingDraft: boolean;
  archiveView?: boolean; // viewing a past week via /digest/[week]
  pastEditions?: PastEditionRef[];
}

function formatWeekOf(iso: string): string {
  // weekOf is a UTC Monday — force UTC so it doesn't render as Sunday locally
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatUpdated(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * "This Week in Tech" — editorial read surface (the §6.3 language: Hanken,
 * hairline rules, no cards). Renders one published edition.
 */
export function DigestClient({
  edition,
  stale,
  previewingDraft,
  archiveView = false,
  pastEditions = [],
}: DigestClientProps) {
  return (
    <div
      data-surface="editorial"
      style={{ backgroundColor: "var(--color-bg)", minHeight: "100%" }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "56px 48px 96px" }}>
        {archiveView && (
          <div style={{ marginBottom: 22 }}>
            <Link
              href="/digest"
              className="editorial-link"
              style={{
                fontSize: 13.5,
                fontWeight: 500,
                color: "var(--color-text-2)",
                textDecoration: "none",
              }}
            >
              ← Latest edition
            </Link>
          </div>
        )}
        {previewingDraft && edition && (
          <Banner tone="info">
            {edition.status === "draft"
              ? "Draft preview. Members can't see this edition until it's published from the admin console."
              : "Previewing the latest edition (already published)."}
          </Banner>
        )}

        <div
          style={{
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--color-text-3)",
            marginBottom: 18,
          }}
        >
          This Week in Tech
          {edition ? ` · Week of ${formatWeekOf(edition.weekOf)}` : ""}
        </div>

        {!edition ? (
          <EmptyState />
        ) : (
          <>
            <h1
              style={{
                margin: 0,
                maxWidth: 880,
                fontSize: "clamp(34px, 4.8vw, 52px)",
                fontWeight: 600,
                letterSpacing: "-0.03em",
                lineHeight: 1.08,
                color: "var(--color-text)",
              }}
            >
              {edition.headline}
            </h1>

            <div
              style={{
                marginTop: 18,
                fontSize: 14,
                color: "var(--color-text-3)",
              }}
            >
              Last updated {formatUpdated(edition.generatedAt)}
            </div>

            {stale && (
              <Banner tone="warning">
                This edition is more than a week old. A fresh one is on its way.
              </Banner>
            )}

            <HairRule top={40} bottom={8} />

            <div>
              {edition.items.map((item, idx) => (
                <DigestItemRow key={item.url} item={item} index={idx} />
              ))}
            </div>

            {edition.bigPicture && (
              <BigPictureSection narrative={edition.bigPicture} watchFor={edition.watchFor} />
            )}

            {pastEditions.length > 0 && (
              <PastEditionsSection
                editions={pastEditions}
                label={archiveView ? "More editions" : "Past editions"}
              />
            )}

            <HairRule
              top={edition.bigPicture || pastEditions.length > 0 ? 40 : 8}
              bottom={24}
            />
            <div style={{ fontSize: 13, color: "var(--color-text-3)" }}>
              Curated weekly for TCO members. Every link goes to the original source.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Category tag colors echo the track accents (AI blue, tech slate, markets green)
const CATEGORY_META: Record<string, { label: string; color: string }> = {
  ai: { label: "AI", color: "var(--color-accent)" },
  tech: { label: "Tech", color: "var(--color-slate)" },
  markets: { label: "Markets", color: "var(--color-correct)" },
};

function DigestItemRow({ item, index }: { item: DigestItem; index: number }) {
  // Older editions predate whyItMatters/resources/category, so all render conditionally
  const resources = Array.isArray(item.resources) ? item.resources : [];
  const category = item.category ? CATEGORY_META[item.category] : undefined;
  return (
    <article
      style={{
        display: "grid",
        gridTemplateColumns: "56px minmax(0, 1fr)",
        columnGap: 24,
        padding: "28px 0",
        borderTop: index === 0 ? "none" : "1px solid var(--color-border-subtle)",
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: "0.08em",
          color: "var(--color-text-3)",
          paddingTop: 6,
        }}
      >
        {String(index + 1).padStart(2, "0")}
      </div>
      <div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: "-0.015em", lineHeight: 1.25 }}>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="editorial-link"
            style={{ color: "var(--color-text)", textDecoration: "none" }}
          >
            {item.title}
          </a>
        </h2>
        <div
          style={{
            marginTop: 8,
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--color-text-3)",
          }}
        >
          {category && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                color: category.color,
                fontWeight: 600,
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  backgroundColor: "currentColor",
                  flexShrink: 0,
                }}
              />
              {category.label}
            </span>
          )}
          {category && <span aria-hidden>·</span>}
          <span>{item.sourceDomain}</span>
        </div>
        <p
          style={{
            margin: "12px 0 0",
            fontSize: 15.5,
            lineHeight: 1.6,
            color: "var(--color-text-2)",
            maxWidth: 720,
          }}
        >
          {item.summary}
        </p>
        {item.whyItMatters && (
          <div style={{ marginTop: 14, maxWidth: 720 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--color-accent)",
                marginBottom: 6,
              }}
            >
              Why it matters
            </div>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "var(--color-text-2)" }}>
              {item.whyItMatters}
            </p>
          </div>
        )}
        {resources.length > 0 && (
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            {resources.map((res) => (
              <a
                key={res.url}
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                className="editorial-link"
                style={{
                  alignSelf: "flex-start",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 13.5,
                  fontWeight: 500,
                  color: "var(--color-text-2)",
                  textDecoration: "none",
                }}
              >
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--color-text-3)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 999,
                    padding: "2px 8px",
                    flexShrink: 0,
                  }}
                >
                  {res.type}
                </span>
                {res.title}
              </a>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function weekLabelShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function PastEditionsSection({
  editions,
  label,
}: {
  editions: PastEditionRef[];
  label: string;
}) {
  return (
    <>
      <HairRule top={40} bottom={36} />
      <section>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--color-text-3)",
            marginBottom: 10,
          }}
        >
          {label}
        </div>
        <div>
          {editions.map((e, i) => (
            <Link
              key={e.weekOf}
              href={`/digest/${e.weekOf.slice(0, 10)}`}
              className="editorial-link"
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 20,
                padding: "13px 0",
                borderTop: i === 0 ? "none" : "1px solid var(--color-border-subtle)",
                textDecoration: "none",
              }}
            >
              <span
                style={{
                  width: 110,
                  flexShrink: 0,
                  fontSize: 12,
                  fontWeight: 500,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--color-text-3)",
                }}
              >
                {weekLabelShort(e.weekOf)}
              </span>
              <span style={{ fontSize: 15, fontWeight: 500, color: "var(--color-text)" }}>
                {e.headline}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

function BigPictureSection({
  narrative,
  watchFor,
}: {
  narrative: string;
  watchFor: string | null;
}) {
  const paragraphs = narrative
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <>
      <HairRule top={8} bottom={36} />
      <section style={{ maxWidth: 760 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--color-text-3)",
            marginBottom: 16,
          }}
        >
          The big picture
        </div>
        {paragraphs.map((p, i) => (
          <p
            key={i}
            style={{
              margin: i === 0 ? 0 : "14px 0 0",
              fontSize: 16,
              lineHeight: 1.65,
              color: "var(--color-text-2)",
            }}
          >
            {p}
          </p>
        ))}
        {watchFor && (
          <div style={{ marginTop: 20 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--color-accent)",
                marginBottom: 6,
              }}
            >
              What to watch
            </div>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "var(--color-text-2)" }}>
              {watchFor}
            </p>
          </div>
        )}
      </section>
    </>
  );
}

function Banner({ tone, children }: { tone: "warning" | "info"; children: React.ReactNode }) {
  return (
    <div
      role="status"
      style={{
        margin: "20px 0 8px",
        padding: "12px 16px",
        borderRadius: "var(--radius-2)",
        fontSize: 14,
        fontWeight: 500,
        color: "var(--color-text)",
        backgroundColor: tone === "warning" ? "var(--color-gold-soft)" : "var(--color-blue-soft)",
        border: `1px solid ${tone === "warning" ? "var(--color-gold)" : "var(--color-border)"}`,
      }}
    >
      {children}
    </div>
  );
}

function EmptyState() {
  return (
    <div>
      <h1
        style={{
          margin: 0,
          fontSize: "clamp(34px, 4.8vw, 52px)",
          fontWeight: 600,
          letterSpacing: "-0.03em",
          lineHeight: 1.08,
          color: "var(--color-text)",
        }}
      >
        The first edition is on its way.
      </h1>
      <p style={{ margin: "18px 0 0", fontSize: 16, lineHeight: 1.6, color: "var(--color-text-2)", maxWidth: 560 }}>
        Every week we round up the five to seven stories that matter across AI, tech,
        and the markets, in plain English. Check back soon.
      </p>
    </div>
  );
}

function HairRule({ top = 32, bottom = 32 }: { top?: number; bottom?: number }) {
  return (
    <div
      aria-hidden
      style={{
        height: 1,
        backgroundColor: "var(--color-border)",
        margin: `${top}px 0 ${bottom}px`,
      }}
    />
  );
}
