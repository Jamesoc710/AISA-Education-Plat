"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { categoryMeta } from "@/lib/trend-categories";
import {
  DraftChip,
  ThemeTags,
  directionMeta,
  normalize,
  usePrefersReducedMotion,
} from "@/components/trends-client";
import type { TrendDetailData, TrendRelatedConcept, TrendStory } from "@/lib/trends";

/**
 * Trend brief detail page, "The Pulse Index" detail. One flowing editorial brief
 * under data-surface="editorial" (Quizlet blue + Hanken): a category kicker, a
 * clamp(40-48px) headline, a lighter deck (the first sentence of whatItIs), then a
 * 2-column split: the article on the left (bold sentence-case subheads + prose
 * divided by HairRule) and a signals rail on the right (oversized momentum hero +
 * ThinBar, the THEMES facet that replaces the old lifecycle stage, the direction
 * glyph, and the accent-soft concept chips). Below the split, a borderless dated
 * "Recent signals" log. The admin Moderation box is the only surviving border.
 *
 * No-JS / mobile / screen-reader backbone: semantic source order (kicker,
 * headline, deck, article, rail, recent signals); the split collapses to one
 * column at <=720px via globals.css .trend-detail-split. Motion is a CSS
 * cross-fade plus a headline scale-up with a 2px blur bridge, gated through
 * usePrefersReducedMotion (reduced motion keeps the plain cross-fade only).
 */
export function TrendDetailClient({
  trend,
  isAdmin,
}: {
  trend: TrendDetailData;
  isAdmin: boolean;
}) {
  const cat = categoryMeta(trend.category);
  const dir = directionMeta(trend.direction);
  const reduced = usePrefersReducedMotion();

  // The deck is the first sentence of whatItIs; the left "What it is" section
  // picks up the remainder, so the lede is not repeated. Hand-tailorable later.
  const [deck, whatItIsRest] = splitFirstSentence(trend.whatItIs);

  return (
    <div data-surface="editorial" style={{ backgroundColor: "var(--color-bg)", minHeight: "100%" }}>
      <div className="trend-detail-enter" style={{ maxWidth: 800, margin: "0 auto", padding: "40px 40px 96px" }}>
        {/* ── Breadcrumb ─────────────────────────────────────── */}
        <nav
          aria-label="Breadcrumb"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 28,
            fontSize: 13,
            color: "var(--color-text-3)",
          }}
        >
          <Link
            href="/trends"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              color: "var(--color-text-3)",
              textDecoration: "none",
              transition: "color 100ms ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text-2)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-3)")}
          >
            <Icon name="arrow-left" size={13} />
            Trends
          </Link>
        </nav>

        {/* ── Staleness banner (Phase 4 cron; fresh seeds never trip it) ── */}
        {trend.isStale && <StaleBanner syncedAt={trend.syncedAt} />}

        {/* ── Kicker ─────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: `var(--tile-${cat.tileColor}-fg)`,
            }}
          >
            {cat.label}
          </span>
          {trend.status === "draft" && <DraftChip />}
        </div>

        {/* ── Headline + deck ────────────────────────────────── */}
        <h1
          className="trend-detail-headline"
          style={{
            margin: 0,
            fontSize: "clamp(40px, 5vw, 48px)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            color: "var(--color-text)",
            animationName: reduced ? "none" : undefined,
          }}
        >
          {trend.name}
        </h1>
        {deck && (
          <p
            style={{
              margin: "20px 0 0",
              fontSize: 19,
              fontWeight: 400,
              color: "var(--color-text-2)",
              lineHeight: 1.5,
              maxWidth: 720,
            }}
          >
            {deck}
          </p>
        )}

        {/* ── The split: article (left) + signals rail (right) ── */}
        <div
          className="trend-detail-split"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.35fr) 1px minmax(0, 1fr)",
            columnGap: 48,
            marginTop: 48,
          }}
        >
          {/* LEFT: the article */}
          <div>
            <ArticleSection title="What's happening now" body={trend.whatsHappening} />
            {whatItIsRest && (
              <>
                <HairRule top={32} bottom={32} />
                <ArticleSection title="What it is" body={whatItIsRest} />
              </>
            )}
          </div>

          {/* The 1px vertical rule (hidden when the split collapses) */}
          <div className="trend-detail-rule" aria-hidden style={{ backgroundColor: "var(--color-border)" }} />

          {/* RIGHT: the signals rail */}
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <MomentumHero momentum={trend.momentum} />

            {trend.themes.length > 0 && (
              <div>
                <SectionEyebrow>Themes</SectionEyebrow>
                <ThemeTags themes={trend.themes} showLabel={false} />
              </div>
            )}

            <div>
              <SectionEyebrow>Direction</SectionEyebrow>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  color: dir.color,
                  fontSize: 15,
                  fontWeight: 600,
                }}
              >
                <Icon name={dir.icon} size={18} />
                {dir.label}
              </span>
            </div>

            {trend.relatedConcepts.length > 0 && (
              <div>
                <SectionEyebrow>Related</SectionEyebrow>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {trend.relatedConcepts.map((c, i) => (
                    <ConceptChip key={i} concept={c} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Recent signals (full width, borderless dated log) ── */}
        {trend.topStories.length > 0 && (
          <div style={{ marginTop: 56 }}>
            <SectionEyebrow>Recent signals</SectionEyebrow>
            <div>
              {trend.topStories.map((s, i) => (
                <div key={i}>
                  {i > 0 && <HairRule top={20} bottom={20} />}
                  <StoryRow story={s} />
                </div>
              ))}
            </div>
          </div>
        )}

        {isAdmin && <TrendModeration trend={trend} />}
      </div>

      {/* List-to-detail motion: a cross-fade plus a headline scale-up with a 2px
          blur bridge. Reduced motion keeps the plain cross-fade only (no scale,
          no blur); no JS is required for either path. */}
      <style>{`
        @keyframes trendDetailFade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes trendHeadlineIn {
          from { opacity: 0; transform: scale(0.55); filter: blur(2px); }
          to   { opacity: 1; transform: none; filter: none; }
        }
        [data-surface="editorial"] .trend-detail-enter {
          animation: trendDetailFade 260ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }
        [data-surface="editorial"] .trend-detail-headline {
          animation: trendHeadlineIn 320ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
          transform-origin: left top;
        }
        @media (prefers-reduced-motion: reduce) {
          [data-surface="editorial"] .trend-detail-headline {
            animation-name: none;
          }
        }
      `}</style>
    </div>
  );
}

// ── Pieces ───────────────────────────────────────────────────────────────────

/** Split prose into [first sentence, remainder]. Lookahead on an uppercase start
 *  avoids splitting on decimals (555.6), abbreviations (U.S.), or "e.g." */
function splitFirstSentence(text: string): [string, string] {
  const m = text.match(/^([\s\S]+?[.!?])\s+(?=[A-Z])([\s\S]*)$/);
  if (m) return [m[1].trim(), m[2].trim()];
  return [text.trim(), ""];
}

/** Left-column reading section: a bold sentence-case subhead over prose. */
function ArticleSection({ title, body }: { title: string; body: string }) {
  return (
    <section>
      <h2
        style={{
          margin: "0 0 12px",
          fontSize: 16,
          fontWeight: 600,
          letterSpacing: "-0.01em",
          color: "var(--color-text)",
        }}
      >
        {title}
      </h2>
      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: "var(--color-text-2)" }}>{body}</p>
    </section>
  );
}

/** Oversized momentum hero (StreakStat-style, copy-and-modified) + single-fill
 *  ThinBar. Fill normalizes momentum over the 65-95 band the seed clusters in. */
function MomentumHero({ momentum }: { momentum: number }) {
  return (
    <div>
      <SectionEyebrow>Momentum</SectionEyebrow>
      <div
        style={{
          fontSize: "clamp(48px, 5.6vw, 64px)",
          fontWeight: 600,
          color: "var(--color-accent)",
          letterSpacing: "-0.02em",
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {momentum}
      </div>
      <ThinBar
        touchedPct={normalize(momentum, 65, 95)}
        masteredPct={0}
        touchedColor="var(--color-accent)"
        masteredColor="transparent"
        style={{ marginTop: 16 }}
      />
    </div>
  );
}

/** Recent-signals entry: ISO date eyebrow, headline, why-it-matters, source chip. */
function StoryRow({ story }: { story: TrendStory }) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--color-text-3)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {story.date.slice(0, 10)}
      </div>
      <div style={{ margin: "6px 0 0", fontSize: 15, fontWeight: 600, color: "var(--color-text)", lineHeight: 1.4 }}>
        {story.headline}
      </div>
      <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--color-text-2)", lineHeight: 1.6 }}>
        {story.whyItMatters}
      </p>
      {story.sourceUrl && (
        <div style={{ marginTop: 10 }}>
          <SourceChip url={story.sourceUrl} domain={story.sourceDomain} />
        </div>
      )}
    </div>
  );
}

function SourceChip({ url, domain }: { url: string; domain: string | null }) {
  const [hov, setHov] = useState(false);
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: "var(--text-xs)",
        fontWeight: 600,
        textDecoration: "none",
        color: hov ? "var(--color-text)" : "var(--color-text-2)",
        backgroundColor: hov ? "var(--color-surface-3)" : "var(--color-surface-2)",
        border: "1px solid var(--color-border)",
        transition: "background-color 120ms ease, color 120ms ease",
      }}
    >
      <Icon name="arrow-square-out" size={12} />
      {domain ?? "Source"}
    </a>
  );
}

function ConceptChip({ concept }: { concept: TrendRelatedConcept }) {
  const [hov, setHov] = useState(false);

  if (!concept.slug) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "5px 12px",
          borderRadius: 999,
          fontSize: "var(--text-sm)",
          fontWeight: 500,
          color: "var(--color-text-3)",
          backgroundColor: "var(--color-surface-2)",
          border: "1px solid var(--color-border-subtle)",
        }}
      >
        {concept.label}
      </span>
    );
  }

  return (
    <Link
      href={`/concepts/${concept.slug}`}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 12px",
        borderRadius: 999,
        fontSize: "var(--text-sm)",
        fontWeight: 600,
        textDecoration: "none",
        color: "var(--color-accent-on-soft)",
        backgroundColor: "var(--color-accent-soft)",
        border: "1px solid transparent",
        transition: "filter 120ms ease",
        filter: hov ? "brightness(0.97)" : "none",
      }}
    >
      {concept.label}
      <Icon name="arrow-right" size={13} />
    </Link>
  );
}

function StaleBanner({ syncedAt }: { syncedAt: string }) {
  const when = syncedAt.slice(0, 10);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        marginBottom: 28,
        borderRadius: "var(--radius-2)",
        backgroundColor: "var(--color-gold-soft)",
        border: "1px solid var(--color-border)",
        fontSize: 13,
        color: "var(--color-text-2)",
      }}
    >
      <span style={{ color: "var(--color-gold)", display: "flex" }}>
        <Icon name="info" size={16} />
      </span>
      This brief was last refreshed {when} and may be behind the latest news.
    </div>
  );
}

// ── Copied editorial primitives (inlined by value) ───────────────────────────

function HairRule({ top = 32, bottom = 32 }: { top?: number; bottom?: number }) {
  return (
    <div
      aria-hidden
      style={{ height: 1, backgroundColor: "var(--color-border)", margin: `${top}px 0 ${bottom}px` }}
    />
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
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
      {children}
    </div>
  );
}

/** Single-/double-fill progress bar, copied by value from dashboard-client. */
function ThinBar({
  touchedPct,
  masteredPct,
  touchedColor,
  masteredColor,
  style,
}: {
  touchedPct: number;
  masteredPct: number;
  touchedColor: string;
  masteredColor: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        position: "relative",
        height: 3,
        width: "100%",
        backgroundColor: "var(--color-border-subtle)",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: `${Math.min(touchedPct * 100, 100)}%`,
          backgroundColor: touchedColor,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: `${Math.min(masteredPct * 100, 100)}%`,
          backgroundColor: masteredColor,
        }}
      />
    </div>
  );
}

// ── Admin moderation (per-trend publish gate; ADMIN only) ────────────────────
// Unchanged: the only bordered box that survives (chrome, not content).

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: "var(--space-7, 40px)" }}>
      <h2
        style={{
          margin: "0 0 var(--space-4) 0",
          paddingTop: "var(--space-5)",
          borderTop: "1px solid var(--color-border-subtle)",
          fontSize: "var(--text-xs)",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--color-text-3)",
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function TrendModeration({ trend }: { trend: TrendDetailData }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const published = trend.status === "published";
  const syncedLabel = new Date(trend.syncedAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/trends", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: trend.slug, action: published ? "unpublish" : "publish" }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || "Update failed");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section title="Moderation">
      <div
        style={{
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-2)",
          padding: "var(--space-4) var(--space-5)",
          backgroundColor: "var(--color-surface)",
          display: "flex",
          alignItems: "center",
          gap: "var(--space-4)",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)" }}>
            {published ? "Live for members" : "Draft, hidden from members"}
          </div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-3)", marginTop: 2 }}>
            Confidence {trend.confidence}. Last synced {syncedLabel}.
          </div>
        </div>
        <Button variant={published ? "secondary" : "primary"} disabled={busy} onClick={toggle}>
          {busy ? "Saving..." : published ? "Unpublish" : "Publish"}
        </Button>
        {error && (
          <p style={{ margin: 0, width: "100%", fontSize: "var(--text-sm)", color: "var(--color-incorrect)" }}>
            {error}
          </p>
        )}
      </div>
    </Section>
  );
}
