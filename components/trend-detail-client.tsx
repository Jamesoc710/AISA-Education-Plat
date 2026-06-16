"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { IconTile } from "@/components/ui/icon-tile";
import { Icon } from "@/components/ui/icon";
import { categoryMeta } from "@/lib/trend-categories";
import { CategoryBadge, DraftChip, MomentumChip, directionMeta } from "@/components/trends-client";
import type { TrendDetailData, TrendRelatedConcept, TrendStory } from "@/lib/trends";

/**
 * Trend brief detail page. Build-detail template (820px, breadcrumb, IconTile
 * header, bordered Sections): What it is / What's happening now / Top stories
 * (dated rows + source chips) / Related in the catalog (concept links).
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

  return (
    <div style={{ padding: "32px 32px 80px" }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        {/* ── Breadcrumb ─────────────────────────────────────── */}
        <nav
          aria-label="Breadcrumb"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            marginBottom: "var(--space-5)",
            fontSize: "var(--text-sm)",
            color: "var(--color-text-3)",
          }}
        >
          <Link
            href="/trends"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--space-2)",
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

        {/* ── Header ─────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-4)" }}>
          <IconTile icon={cat.icon} color={cat.tileColor} size="lg" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: "var(--text-2xl)",
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  color: "var(--color-text)",
                  lineHeight: 1.15,
                }}
              >
                {trend.name}
              </h1>
              <MomentumChip label={trend.momentumLabel} />
              {trend.status === "draft" && <DraftChip />}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-4)",
                flexWrap: "wrap",
                marginTop: 10,
                fontSize: "var(--text-xs)",
                color: "var(--color-text-3)",
              }}
            >
              <CategoryBadge category={trend.category} />
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontWeight: 600, color: "var(--color-text-2)" }}>Momentum {trend.momentum}</span>
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: dir.color }}>
                <Icon name={dir.icon} size={13} />
                {dir.label}
              </span>
            </div>
          </div>
        </div>

        {/* ── What it is ─────────────────────────────────────── */}
        <Section title="What it is">
          <Prose>{trend.whatItIs}</Prose>
        </Section>

        {/* ── What's happening now ───────────────────────────── */}
        <Section title="What's happening now">
          <Prose>{trend.whatsHappening}</Prose>
        </Section>

        {/* ── Top stories ────────────────────────────────────── */}
        {trend.topStories.length > 0 && (
          <Section title="Top stories">
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
              {trend.topStories.map((s, i) => (
                <StoryRow key={i} story={s} />
              ))}
            </div>
          </Section>
        )}

        {/* ── Related in the catalog ─────────────────────────── */}
        {trend.relatedConcepts.length > 0 && (
          <Section title="Related in the catalog">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
              {trend.relatedConcepts.map((c, i) => (
                <ConceptChip key={i} concept={c} />
              ))}
            </div>
            <p style={{ margin: "14px 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-3)", lineHeight: 1.5 }}>
              Linked concepts open in the catalog. Items without a link are background terms not yet
              covered there.
            </p>
          </Section>
        )}

        {isAdmin && <TrendModeration trend={trend} />}
      </div>
    </div>
  );
}

// ── Pieces ───────────────────────────────────────────────────────────────────

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

function Prose({ children }: { children: string }) {
  return (
    <p style={{ margin: 0, maxWidth: 680, fontSize: 15, lineHeight: 1.7, color: "var(--color-text)" }}>
      {children}
    </p>
  );
}

function StoryRow({ story }: { story: TrendStory }) {
  const dateLabel = new Date(story.date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  return (
    <div style={{ maxWidth: 680 }}>
      <div
        style={{
          fontSize: "var(--text-xs)",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          color: "var(--color-text-3)",
        }}
      >
        {dateLabel}
      </div>
      <div style={{ margin: "4px 0 0", fontSize: 15, fontWeight: 600, color: "var(--color-text)", lineHeight: 1.4 }}>
        {story.headline}
      </div>
      <p style={{ margin: "6px 0 0", fontSize: "var(--text-sm)", color: "var(--color-text-2)", lineHeight: 1.6 }}>
        {story.whyItMatters}
      </p>
      {story.sourceUrl && (
        <div style={{ marginTop: 8 }}>
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
  const when = new Date(syncedAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-3)",
        padding: "10px 14px",
        marginBottom: "var(--space-5)",
        borderRadius: "var(--radius-2)",
        backgroundColor: "var(--color-gold-soft)",
        border: "1px solid var(--color-border)",
        fontSize: "var(--text-sm)",
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

// ── Admin moderation (per-trend publish gate; ADMIN only) ────────────────────

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
