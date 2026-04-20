"use client";

import { useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ConceptDetail } from "@/lib/concepts";
import { Icon } from "@/components/ui/icon";
import { TierBadge } from "@/components/ui/tier-badge";

/**
 * Resource-type tag colors — reuse the section pastel tokens.
 * Maps each resource type to a `--tile-{color}` pair.
 */
const RESOURCE_PALETTE: Record<string, string> = {
  VIDEO:    "coral",
  ARTICLE:  "blue",
  PAPER:    "mauve",
  TUTORIAL: "indigo",
  COURSE:   "mint",
};

export function ConceptBody({
  concept,
  bookmarked,
  onToggleBookmark,
}: {
  concept: ConceptDetail;
  bookmarked: boolean;
  onToggleBookmark: () => void;
}) {
  const [deeperOpen, setDeeperOpen] = useState(false);
  const [explanationMode, setExplanationMode] = useState<"detailed" | "simple">(
    "detailed"
  );
  const hasSimple = Boolean(concept.simpleExplanation);

  return (
    <article
      className="concept-body-padding"
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 16,
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* ── Breadcrumb ─────────────────────────────────────── */}
      <nav
        aria-label="Breadcrumb"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 18,
          fontSize: 12.5,
          color: "var(--color-text-3)",
        }}
      >
        <Link
          href="/browse"
          style={{
            color: "var(--color-text-3)",
            textDecoration: "none",
            transition: "color 100ms ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text-2)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-3)")}
        >
          Browse
        </Link>
        <Icon name="chevron-right" size={11} strokeWidth={2} />
        <Link
          href={`/browse?tier=${concept.section.tier.slug}`}
          style={{
            color: "var(--color-text-3)",
            textDecoration: "none",
            transition: "color 100ms ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text-2)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-3)")}
        >
          {concept.section.tier.name}
        </Link>
        <Icon name="chevron-right" size={11} strokeWidth={2} />
        <span style={{ color: "var(--color-text-2)" }}>{concept.section.name}</span>
      </nav>

      {/* ── Header ─────────────────────────────────────────── */}
      <header style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <TierBadge slug={concept.section.tier.slug} size="xs" />
          <span style={{ fontSize: 12, color: "var(--color-text-3)" }}>·</span>
          <span style={{ fontSize: 12.5, color: "var(--color-text-2)", fontWeight: 500 }}>
            {concept.section.name}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 32,
              fontWeight: 600,
              color: "var(--color-text)",
              lineHeight: 1.2,
              letterSpacing: "-0.025em",
              flex: 1,
            }}
          >
            {concept.name}
          </h1>
          <BookmarkButton bookmarked={bookmarked} onClick={onToggleBookmark} />
        </div>

        <p
          style={{
            margin: "12px 0 0",
            fontSize: 16,
            color: "var(--color-text-2)",
            lineHeight: 1.6,
            maxWidth: "62ch",
          }}
        >
          {concept.subtitle}
        </p>
      </header>

      <div style={{ height: 1, backgroundColor: "var(--color-border-subtle)", marginBottom: 32 }} />

      {/* ── What it is ──────────────────────────────────────── */}
      <section style={{ marginBottom: 36 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <SectionLabel>What it is</SectionLabel>
          {hasSimple && (
            <ModeToggle mode={explanationMode} setMode={setExplanationMode} />
          )}
        </div>
        <div key={explanationMode} className="animate-fade-in">
          <MarkdownBody
            content={
              explanationMode === "simple" && concept.simpleExplanation
                ? concept.simpleExplanation
                : concept.whatItIs
            }
          />
        </div>
      </section>

      {/* ── Why it matters ──────────────────────────────────── */}
      <section style={{ marginBottom: 36 }}>
        <SectionLabel>Why it matters</SectionLabel>
        <div
          style={{
            position: "relative",
            margin: "10px 0 0",
            padding: "18px 22px 18px 26px",
            backgroundColor: "var(--color-accent-soft)",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <span
            aria-hidden
            style={{
              position: "absolute",
              left: 0,
              top: 14,
              bottom: 14,
              width: 3,
              borderRadius: 1.5,
              backgroundColor: "var(--color-accent)",
            }}
          />
          <MarkdownBody content={concept.whyItMatters} variant="callout" />
        </div>
      </section>

      {/* ── Go Deeper ───────────────────────────────────────── */}
      {concept.goDeeper && (
        <section style={{ marginBottom: 36 }}>
          <button
            onClick={() => setDeeperOpen((v) => !v)}
            aria-expanded={deeperOpen}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 16px",
              width: "100%",
              backgroundColor: deeperOpen ? "var(--color-surface-2)" : "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 12,
              borderBottomLeftRadius: deeperOpen ? 0 : 12,
              borderBottomRightRadius: deeperOpen ? 0 : 12,
              cursor: "pointer",
              fontFamily: "inherit",
              textAlign: "left",
              transition: "background-color 120ms ease",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                transform: deeperOpen ? "rotate(90deg)" : "rotate(0deg)",
                transition: "transform 150ms ease",
                color: "var(--color-text-2)",
                flexShrink: 0,
              }}
            >
              <Icon name="chevron-right" size={14} strokeWidth={2} />
            </span>
            <span
              style={{
                fontSize: 13.5,
                fontWeight: 600,
                color: "var(--color-text)",
                letterSpacing: "-0.005em",
              }}
            >
              Go deeper
            </span>
            <span
              style={{
                fontSize: 12.5,
                color: "var(--color-text-3)",
                marginLeft: "auto",
              }}
            >
              {deeperOpen ? "Hide" : "Show technical detail"}
            </span>
          </button>
          {deeperOpen && (
            <div
              className="animate-fade-in"
              style={{
                padding: "20px 22px",
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderTop: "none",
                borderBottomLeftRadius: 12,
                borderBottomRightRadius: 12,
              }}
            >
              <MarkdownBody content={concept.goDeeper} />
            </div>
          )}
        </section>
      )}

      {/* ── Related concepts ────────────────────────────────── */}
      {concept.relatedFrom.length > 0 && (
        <section style={{ marginBottom: 36 }}>
          <SectionLabel>Related concepts</SectionLabel>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginTop: 10,
            }}
          >
            {concept.relatedFrom.map((r) => (
              <RelatedChip
                key={r.relatedConcept.slug}
                href={`/concepts/${r.relatedConcept.slug}`}
                name={r.relatedConcept.name}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Resources ───────────────────────────────────────── */}
      {concept.resources.length > 0 && (
        <section>
          <SectionLabel>Resources</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
            {concept.resources.map((resource) => (
              <ResourceRow key={resource.id} resource={resource} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

// ── Section label ──────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        margin: 0,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--color-text-3)",
      }}
    >
      {children}
    </h2>
  );
}

// ── Bookmark button ────────────────────────────────────────────────────────────

function BookmarkButton({
  bookmarked,
  onClick,
}: {
  bookmarked: boolean;
  onClick: () => void;
}) {
  const [hov, setHov] = useState(false);
  const baseColor = bookmarked
    ? "var(--color-gold)"
    : hov
    ? "var(--color-text)"
    : "var(--color-text-2)";
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={bookmarked ? "Remove bookmark" : "Bookmark this concept"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "7px 12px",
        marginTop: 4,
        backgroundColor: bookmarked
          ? "var(--color-gold-soft)"
          : hov
          ? "var(--color-surface-2)"
          : "var(--color-surface)",
        border: `1px solid ${bookmarked ? "var(--color-gold-soft)" : "var(--color-border)"}`,
        borderRadius: 8,
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 12.5,
        fontWeight: 500,
        color: baseColor,
        flexShrink: 0,
        transition: "background-color 100ms ease, color 100ms ease, border-color 100ms ease",
      }}
    >
      <Icon
        name={bookmarked ? "bookmark-filled" : "bookmark"}
        size={14}
        strokeWidth={1.85}
      />
      {bookmarked ? "Bookmarked" : "Bookmark"}
    </button>
  );
}

// ── Simple/Detailed toggle ─────────────────────────────────────────────────────

function ModeToggle({
  mode,
  setMode,
}: {
  mode: "simple" | "detailed";
  setMode: (m: "simple" | "detailed") => void;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        backgroundColor: "var(--color-surface-2)",
        border: "1px solid var(--color-border-subtle)",
        borderRadius: 8,
        padding: 2,
        gap: 2,
      }}
    >
      {(["simple", "detailed"] as const).map((m) => {
        const active = mode === m;
        return (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            style={{
              padding: "4px 12px",
              fontSize: 12,
              fontWeight: active ? 600 : 500,
              fontFamily: "inherit",
              color: active ? "var(--color-accent-on-soft)" : "var(--color-text-2)",
              backgroundColor: active ? "var(--color-surface)" : "transparent",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              textTransform: "capitalize",
              boxShadow: active ? "0 1px 2px rgba(20,20,30,0.05)" : "none",
              transition: "background-color 120ms ease, color 120ms ease",
            }}
          >
            {m}
          </button>
        );
      })}
    </div>
  );
}

// ── Related concept chip ───────────────────────────────────────────────────────

function RelatedChip({ href, name }: { href: string; name: string }) {
  const [hov, setHov] = useState(false);
  return (
    <Link
      href={href}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "7px 12px 7px 14px",
        backgroundColor: hov ? "var(--color-accent-soft)" : "var(--color-surface)",
        border: `1px solid ${hov ? "var(--color-accent-soft)" : "var(--color-border)"}`,
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 500,
        color: hov ? "var(--color-accent-on-soft)" : "var(--color-text)",
        textDecoration: "none",
        transition: "background-color 120ms ease, color 120ms ease, border-color 120ms ease",
      }}
    >
      {name}
      <Icon name="chevron-right" size={12} strokeWidth={2} />
    </Link>
  );
}

// ── Resource row ───────────────────────────────────────────────────────────────

function ResourceRow({
  resource,
}: {
  resource: ConceptDetail["resources"][number];
}) {
  const [hov, setHov] = useState(false);
  const palette = RESOURCE_PALETTE[resource.type] ?? "stone";
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 14px",
        backgroundColor: hov ? "var(--color-surface-2)" : "var(--color-surface)",
        border: `1px solid ${hov ? "var(--color-border)" : "var(--color-border-subtle)"}`,
        borderRadius: 10,
        textDecoration: "none",
        transition:
          "background-color 120ms ease, border-color 120ms ease, transform 120ms ease",
        transform: hov ? "translateY(-1px)" : "translateY(0)",
      }}
    >
      <span
        aria-hidden
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "3px 9px",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.06em",
          color: `var(--tile-${palette}-fg)`,
          backgroundColor: `var(--tile-${palette}-bg)`,
          borderRadius: 6,
          minWidth: 56,
          flexShrink: 0,
        }}
      >
        {resource.type}
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 550,
            color: "var(--color-text)",
            lineHeight: 1.4,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            letterSpacing: "-0.005em",
          }}
        >
          {resource.title}
        </div>
        <div
          style={{
            fontSize: 11.5,
            color: "var(--color-text-3)",
            marginTop: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={
            resource.description
              ? `${resource.sourceDomain} · ${resource.description}`
              : resource.sourceDomain
          }
        >
          {resource.sourceDomain}
          {resource.description && (
            <span style={{ marginLeft: 6 }}>· {resource.description}</span>
          )}
        </div>
      </div>

      {resource.estimatedMinutes && (
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 500,
            color: "var(--color-text-3)",
            flexShrink: 0,
            whiteSpace: "nowrap",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {resource.estimatedMinutes} min
        </span>
      )}

      <span
        style={{
          color: hov ? "var(--color-text-2)" : "var(--color-text-3)",
          flexShrink: 0,
          display: "inline-flex",
          transition: "color 120ms ease",
        }}
      >
        <Icon name="chevron-right" size={14} strokeWidth={2} />
      </span>
    </a>
  );
}

// ── Markdown renderer (light theme) ────────────────────────────────────────────

function MarkdownBody({
  content,
  variant = "default",
}: {
  content: string;
  variant?: "default" | "callout";
}) {
  const baseColor =
    variant === "callout" ? "var(--color-text)" : "var(--color-text)";
  const fontSize = variant === "callout" ? 14.5 : 15;
  const leading = 1.7;

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => (
          <p
            style={{
              margin: "0 0 14px",
              fontSize,
              lineHeight: leading,
              color: baseColor,
            }}
          >
            {children}
          </p>
        ),
        strong: ({ children }) => (
          <strong style={{ fontWeight: 650, color: "var(--color-text)" }}>
            {children}
          </strong>
        ),
        em: ({ children }) => (
          <em style={{ fontStyle: "italic", color: baseColor }}>{children}</em>
        ),
        code: ({ children, className }) => {
          const isBlock = className?.includes("language-");
          return isBlock ? (
            <code
              style={{
                display: "block",
                padding: "14px 16px",
                backgroundColor: "var(--color-surface-2)",
                border: "1px solid var(--color-border-subtle)",
                borderRadius: 8,
                fontSize: 12.5,
                fontFamily: "var(--font-mono)",
                color: "var(--color-text)",
                overflowX: "auto",
                lineHeight: 1.6,
                margin: "0 0 14px",
              }}
            >
              {children}
            </code>
          ) : (
            <code
              style={{
                padding: "1px 6px",
                backgroundColor: "var(--color-surface-2)",
                border: "1px solid var(--color-border-subtle)",
                borderRadius: 4,
                fontSize: 12.5,
                fontFamily: "var(--font-mono)",
                color: "var(--color-accent-on-soft)",
              }}
            >
              {children}
            </code>
          );
        },
        ul: ({ children }) => (
          <ul
            style={{
              margin: "0 0 14px",
              paddingLeft: 22,
              color: baseColor,
              fontSize,
              lineHeight: leading,
            }}
          >
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol
            style={{
              margin: "0 0 14px",
              paddingLeft: 22,
              color: baseColor,
              fontSize,
              lineHeight: leading,
            }}
          >
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li style={{ marginBottom: 4, color: baseColor }}>{children}</li>
        ),
        h3: ({ children }) => (
          <h3
            style={{
              margin: "22px 0 8px",
              fontSize: 15.5,
              fontWeight: 600,
              color: "var(--color-text)",
              letterSpacing: "-0.01em",
            }}
          >
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4
            style={{
              margin: "16px 0 6px",
              fontSize: 13.5,
              fontWeight: 600,
              color: "var(--color-text-2)",
            }}
          >
            {children}
          </h4>
        ),
        blockquote: ({ children }) => (
          <blockquote
            style={{
              margin: "0 0 14px",
              paddingLeft: 14,
              borderLeft: "2px solid var(--color-border)",
              color: "var(--color-text-2)",
              fontSize,
              lineHeight: leading,
            }}
          >
            {children}
          </blockquote>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "var(--color-accent-on-soft)",
              textDecoration: "underline",
              textDecorationColor: "var(--color-accent-soft)",
              textUnderlineOffset: 3,
            }}
          >
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
