"use client";

import { useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ConceptDetail } from "@/lib/concepts";

const TIER_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  fundamentals: { color: "#e8b54a", bg: "rgba(232,181,74,0.10)", label: "Fundamentals" },
  intermediate:  { color: "#6b9bd2", bg: "rgba(107,155,210,0.10)", label: "Intermediate" },
  advanced:      { color: "#8b8b9e", bg: "rgba(139,139,158,0.10)", label: "Advanced" },
};

const RESOURCE_BADGE: Record<string, { color: string; bg: string }> = {
  VIDEO:    { color: "#e8b54a", bg: "rgba(232,181,74,0.10)" },
  ARTICLE:  { color: "#6b9bd2", bg: "rgba(107,155,210,0.10)" },
  PAPER:    { color: "#8b8b9e", bg: "rgba(139,139,158,0.10)" },
  TUTORIAL: { color: "#5e6ad2", bg: "rgba(94,106,210,0.12)" },
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
  const [bookmarkHovered, setBookmarkHovered] = useState(false);
  const tier = TIER_STYLES[concept.section.tier.slug] ?? TIER_STYLES.fundamentals;

  return (
    <div
      style={{
        maxWidth: "760px",
        margin: "0 auto",
        padding: "48px 40px 80px",
      }}
      className="concept-body-padding"
    >
      {/* ── Breadcrumb ─────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "24px" }}>
        <Link
          href="/browse"
          style={{
            fontSize: "12px",
            color: "var(--color-text-3)",
            textDecoration: "none",
          }}
          onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "var(--color-text-2)")}
          onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "var(--color-text-3)")}
        >
          Browse
        </Link>
        <span style={{ fontSize: "12px", color: "var(--color-text-3)" }}>›</span>
        <span style={{ fontSize: "12px", color: "var(--color-text-3)" }}>
          {concept.section.name}
        </span>
      </div>

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ marginBottom: "32px" }}>
        {/* Tier badge + section label */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "11px",
              fontWeight: 500,
              color: tier.color,
              backgroundColor: tier.bg,
              borderRadius: "4px",
              padding: "2px 8px",
            }}
          >
            <span
              style={{
                width: "5px",
                height: "5px",
                borderRadius: "50%",
                backgroundColor: tier.color,
              }}
            />
            {tier.label}
          </span>
          <span style={{ fontSize: "12px", color: "var(--color-text-3)" }}>
            {concept.section.name}
          </span>
        </div>

        {/* Title row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
          <h1
            style={{
              margin: 0,
              fontSize: "26px",
              fontWeight: 600,
              color: "var(--color-text)",
              lineHeight: "1.25",
              letterSpacing: "-0.02em",
            }}
          >
            {concept.name}
          </h1>

          {/* Bookmark star */}
          <button
            onClick={onToggleBookmark}
            onMouseEnter={() => setBookmarkHovered(true)}
            onMouseLeave={() => setBookmarkHovered(false)}
            title={bookmarked ? "Remove bookmark" : "Bookmark"}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 10px",
              border: `1px solid ${bookmarked ? "rgba(232,181,74,0.3)" : "var(--color-border)"}`,
              borderRadius: "6px",
              background: bookmarked ? "rgba(232,181,74,0.07)" : "none",
              cursor: "pointer",
              color: bookmarked ? "#e8b54a" : bookmarkHovered ? "var(--color-text)" : "var(--color-text-2)",
              fontSize: "12px",
              fontFamily: "inherit",
              flexShrink: 0,
              transition: "all 0.1s",
              marginTop: "4px",
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill={bookmarked ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            {bookmarked ? "Bookmarked" : "Bookmark"}
          </button>
        </div>

        {/* Subtitle */}
        <p
          style={{
            margin: "10px 0 0",
            fontSize: "15px",
            color: "var(--color-text-2)",
            lineHeight: "1.6",
          }}
        >
          {concept.subtitle}
        </p>
      </div>

      {/* ── Divider ──────────────────────────────────────────── */}
      <div style={{ height: "1px", backgroundColor: "var(--color-border)", marginBottom: "36px" }} />

      {/* ── What it is ───────────────────────────────────────── */}
      <Section label="What it is">
        <MarkdownBody content={concept.whatItIs} />
      </Section>

      {/* ── Why it matters ───────────────────────────────────── */}
      <Section label="Why it matters">
        <blockquote
          style={{
            margin: 0,
            padding: "16px 20px",
            borderLeft: `3px solid ${tier.color}`,
            backgroundColor: tier.bg,
            borderRadius: "0 6px 6px 0",
          }}
        >
          <MarkdownBody content={concept.whyItMatters} muted />
        </blockquote>
      </Section>

      {/* ── Go Deeper ────────────────────────────────────────── */}
      {concept.goDeeper && (
        <div style={{ marginBottom: "40px" }}>
          <button
            onClick={() => setDeeperOpen((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              padding: "0 0 14px 0",
              width: "100%",
              textAlign: "left",
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "18px",
                height: "18px",
                borderRadius: "4px",
                backgroundColor: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                fontSize: "9px",
                color: "var(--color-text-3)",
                transform: deeperOpen ? "rotate(0deg)" : "rotate(-90deg)",
                transition: "transform 0.15s",
                flexShrink: 0,
              }}
            >
              ▾
            </span>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--color-text-2)",
              }}
            >
              Go deeper
            </span>
            {!deeperOpen && (
              <span style={{ fontSize: "12px", color: "var(--color-text-3)" }}>
                More technical detail
              </span>
            )}
          </button>

          {deeperOpen && (
            <div
              style={{
                padding: "16px 20px",
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
              }}
            >
              <MarkdownBody content={concept.goDeeper} muted />
            </div>
          )}
        </div>
      )}

      {/* ── Related concepts ─────────────────────────────────── */}
      {concept.relatedFrom.length > 0 && (
        <Section label="Related concepts">
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {concept.relatedFrom.map((r) => (
              <Link
                key={r.relatedConcept.slug}
                href={`/concepts/${r.relatedConcept.slug}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "5px 12px",
                  fontSize: "13px",
                  color: "var(--color-text-2)",
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "6px",
                  textDecoration: "none",
                  transition: "border-color 0.1s, color 0.1s, background-color 0.1s",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.borderColor = "var(--color-border)";
                  el.style.color = "var(--color-text)";
                  el.style.backgroundColor = "var(--color-surface-2)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.borderColor = "var(--color-border)";
                  el.style.color = "var(--color-text-2)";
                  el.style.backgroundColor = "var(--color-surface)";
                }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                {r.relatedConcept.name}
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* ── Resources ────────────────────────────────────────── */}
      {concept.resources.length > 0 && (
        <Section label="Resources">
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {concept.resources.map((resource) => {
              const badge = RESOURCE_BADGE[resource.type] ?? RESOURCE_BADGE.ARTICLE;
              return (
                <a
                  key={resource.id}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "11px 14px",
                    backgroundColor: "var(--color-surface)",
                    border: "1px solid var(--color-border-subtle)",
                    borderRadius: "7px",
                    textDecoration: "none",
                    transition: "border-color 0.1s, background-color 0.1s",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.borderColor = "var(--color-border)";
                    el.style.backgroundColor = "var(--color-surface-2)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.borderColor = "var(--color-border-subtle)";
                    el.style.backgroundColor = "var(--color-surface)";
                  }}
                >
                  {/* Type badge */}
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "2px 7px",
                      fontSize: "10px",
                      fontWeight: 600,
                      letterSpacing: "0.05em",
                      color: badge.color,
                      backgroundColor: badge.bg,
                      borderRadius: "4px",
                      flexShrink: 0,
                      minWidth: "52px",
                      justifyContent: "center",
                    }}
                  >
                    {resource.type}
                  </span>

                  {/* Title + domain */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "13px",
                        color: "var(--color-text)",
                        lineHeight: "1.4",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {resource.title}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--color-text-3)", marginTop: "2px" }}>
                      {resource.sourceDomain}
                      {resource.description && (
                        <span style={{ marginLeft: "6px" }}>· {resource.description}</span>
                      )}
                    </div>
                  </div>

                  {/* Time estimate */}
                  {resource.estimatedMinutes && (
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--color-text-3)",
                        flexShrink: 0,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {resource.estimatedMinutes} min
                    </span>
                  )}

                  {/* External link icon */}
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ color: "var(--color-text-3)", flexShrink: 0 }}
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              );
            })}
          </div>
        </Section>
      )}
    </div>
  );
}

// ── Section wrapper ────────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "40px" }}>
      <h2
        style={{
          margin: "0 0 14px",
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--color-text-3)",
        }}
      >
        {label}
      </h2>
      {children}
    </div>
  );
}

// ── Markdown renderer ──────────────────────────────────────────────────────────

function MarkdownBody({ content, muted }: { content: string; muted?: boolean }) {
  const baseColor = muted ? "var(--color-text-2)" : "var(--color-text)";

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => (
          <p
            style={{
              margin: "0 0 14px",
              fontSize: "14px",
              lineHeight: "1.75",
              color: baseColor,
            }}
          >
            {children}
          </p>
        ),
        strong: ({ children }) => (
          <strong style={{ fontWeight: 600, color: "var(--color-text)" }}>{children}</strong>
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
                padding: "12px 16px",
                backgroundColor: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                borderRadius: "6px",
                fontSize: "12.5px",
                fontFamily: "var(--font-mono)",
                color: "var(--color-text)",
                overflowX: "auto",
                lineHeight: "1.6",
                margin: "0 0 14px",
              }}
            >
              {children}
            </code>
          ) : (
            <code
              style={{
                padding: "1px 5px",
                backgroundColor: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                borderRadius: "3px",
                fontSize: "12px",
                fontFamily: "var(--font-mono)",
                color: "var(--color-text)",
              }}
            >
              {children}
            </code>
          );
        },
        ul: ({ children }) => (
          <ul style={{ margin: "0 0 14px", paddingLeft: "20px", color: baseColor, fontSize: "14px", lineHeight: "1.75" }}>
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol style={{ margin: "0 0 14px", paddingLeft: "20px", color: baseColor, fontSize: "14px", lineHeight: "1.75" }}>
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li style={{ marginBottom: "4px", color: baseColor }}>{children}</li>
        ),
        h3: ({ children }) => (
          <h3 style={{ margin: "20px 0 8px", fontSize: "14px", fontWeight: 600, color: "var(--color-text)", letterSpacing: "-0.01em" }}>
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4 style={{ margin: "16px 0 6px", fontSize: "13px", fontWeight: 600, color: "var(--color-text-2)" }}>
            {children}
          </h4>
        ),
        blockquote: ({ children }) => (
          <blockquote
            style={{
              margin: "0 0 14px",
              paddingLeft: "12px",
              borderLeft: "2px solid var(--color-border)",
              color: "var(--color-text-2)",
              fontSize: "14px",
              lineHeight: "1.75",
            }}
          >
            {children}
          </blockquote>
        ),
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-accent)", textDecoration: "none" }}>
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
