"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { IconTile } from "@/components/ui/icon-tile";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { getTrackTileColor } from "@/lib/section-icons";
import {
  DraftChip,
  LookingForTag,
  initialsFor,
} from "@/components/build-client";
import type { ProjectDetailData } from "@/lib/build";

export type BuildViewerState = {
  isLoggedIn: boolean;
  isModerator: boolean;
  hasRequested: boolean;
  isOnTeam: boolean;
};

export function BuildDetailClient({
  project,
  viewerState,
}: {
  project: ProjectDetailData;
  viewerState: BuildViewerState;
}) {
  const tileColor = getTrackTileColor(project.track?.slug);
  const [joinOpen, setJoinOpen] = useState(false);
  const [justRequested, setJustRequested] = useState(false);
  const requested = viewerState.hasRequested || justRequested;

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
            href="/build"
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
            Build Board
          </Link>
        </nav>

        {/* ── Header ─────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-4)" }}>
          <IconTile icon="hammer" color={tileColor} size="lg" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-3)",
                flexWrap: "wrap",
              }}
            >
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
                {project.title}
              </h1>
              {project.status === "draft" && <DraftChip />}
            </div>
            {project.track && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 8,
                  fontSize: "var(--text-xs)",
                  fontWeight: 600,
                  color: "var(--color-text-3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 999,
                    backgroundColor: project.track.accentColor,
                  }}
                />
                {project.track.shortName} track
              </span>
            )}
          </div>
        </div>

        {/* ── Lede + actions ─────────────────────────────────── */}
        <p
          style={{
            margin: "20px 0 0 0",
            fontSize: "var(--text-base)",
            color: "var(--color-text-2)",
            lineHeight: 1.6,
            maxWidth: 640,
          }}
        >
          {project.blurb}
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
            flexWrap: "wrap",
            marginTop: "var(--space-5)",
          }}
        >
          <JoinAction
            projectSlug={project.slug}
            viewerState={viewerState}
            requested={requested}
            onOpen={() => setJoinOpen(true)}
          />
          {project.repoUrl && (
            <LinkButton href={project.repoUrl} icon="github-logo" label="View repo" />
          )}
          {project.demoUrl && (
            <LinkButton href={project.demoUrl} icon="arrow-square-out" label="Live demo" />
          )}
        </div>

        {/* ── Looking for ────────────────────────────────────── */}
        {project.lookingFor.length > 0 && (
          <Section title="Looking for">
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
              {project.lookingFor.map((tag) => (
                <LookingForTag key={tag} label={tag} />
              ))}
            </div>
          </Section>
        )}

        {/* ── About ──────────────────────────────────────────── */}
        {project.description && (
          <Section title="About this project">
            <DescriptionMarkdown content={project.description} />
          </Section>
        )}

        {/* ── Team ───────────────────────────────────────────── */}
        {project.contributors.length > 0 && (
          <Section title="Team">
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {project.contributors.map((c, i) => (
                <div
                  key={`${c.name}-${i}`}
                  style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 32,
                      height: 32,
                      borderRadius: 999,
                      backgroundColor: "var(--color-surface-3)",
                      color: "var(--color-text-2)",
                      fontSize: 11,
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {initialsFor(c.name)}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "var(--text-sm)",
                        fontWeight: 550,
                        color: "var(--color-text)",
                      }}
                    >
                      {c.name}
                    </div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-3)" }}>
                      {c.role}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── Moderation (ADMIN / PROJECT_LEAD only) ─────────── */}
        {viewerState.isModerator && <ModerationPanel project={project} />}
      </div>

      <RequestJoinDialog
        open={joinOpen}
        projectId={project.id}
        projectTitle={project.title}
        onClose={() => setJoinOpen(false)}
        onRequested={() => setJustRequested(true)}
      />
    </div>
  );
}

// ── Join action (state machine: login → request → sent → on team) ───────────

function JoinAction({
  projectSlug,
  viewerState,
  requested,
  onOpen,
}: {
  projectSlug: string;
  viewerState: BuildViewerState;
  requested: boolean;
  onOpen: () => void;
}) {
  if (viewerState.isOnTeam) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: "var(--text-sm)",
          fontWeight: 500,
          color: "var(--color-text-3)",
        }}
      >
        <Icon name="users" size={14} />
        You are on this team
      </span>
    );
  }

  if (requested) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "0 14px",
          height: 34,
          borderRadius: "var(--radius-2)",
          fontSize: "var(--text-sm)",
          fontWeight: 500,
          color: "var(--color-correct)",
          backgroundColor: "var(--color-correct-dim)",
        }}
      >
        <Icon name="check-circle" size={14} />
        Request sent
      </span>
    );
  }

  if (!viewerState.isLoggedIn) {
    return (
      <Link href={`/login?redirect=/build/${projectSlug}`} style={{ textDecoration: "none" }}>
        <Button leftIcon={<Icon name="paper-plane-tilt" size={14} />}>
          Sign in to request to join
        </Button>
      </Link>
    );
  }

  return (
    <Button onClick={onOpen} leftIcon={<Icon name="paper-plane-tilt" size={14} />}>
      Request to join
    </Button>
  );
}

function LinkButton({
  href,
  icon,
  label,
}: {
  href: string;
  icon: "github-logo" | "arrow-square-out";
  label: string;
}) {
  const [hov, setHov] = useState(false);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-2)",
        height: 34,
        padding: "0 var(--space-4)",
        fontSize: "var(--text-sm)",
        fontWeight: 500,
        textDecoration: "none",
        color: "var(--color-text)",
        backgroundColor: hov ? "var(--color-surface-2)" : "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-2)",
        transition: "background-color 120ms ease",
      }}
    >
      <Icon name={icon} size={14} />
      {label}
    </a>
  );
}

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

function DescriptionMarkdown({ content }: { content: string }) {
  return (
    <div style={{ maxWidth: 640 }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p
              style={{
                margin: "0 0 14px",
                fontSize: 15,
                lineHeight: 1.7,
                color: "var(--color-text)",
              }}
            >
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul style={{ margin: "0 0 14px", paddingLeft: 22, listStyle: "disc" }}>{children}</ul>
          ),
          ol: ({ children }) => (
            <ol style={{ margin: "0 0 14px", paddingLeft: 22, listStyle: "decimal" }}>{children}</ol>
          ),
          li: ({ children }) => (
            <li
              style={{
                fontSize: 15,
                lineHeight: 1.7,
                color: "var(--color-text)",
                marginBottom: 4,
              }}
            >
              {children}
            </li>
          ),
          strong: ({ children }) => (
            <strong style={{ fontWeight: 600 }}>{children}</strong>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--color-accent)", textDecoration: "none" }}
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// ── Moderation panel ─────────────────────────────────────────────────────────

function ModerationPanel({ project }: { project: ProjectDetailData }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const approved = project.status === "approved";

  async function setStatus(status: "draft" | "approved") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || "Update failed");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
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
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-4)",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)" }}>
              {approved ? "Live on the board" : "Draft, hidden from members"}
            </div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-3)", marginTop: 2 }}>
              {approved
                ? "Members can see this project. Move it back to draft to hide it."
                : "Only admins and project leads can see this page right now."}
            </div>
          </div>
          <Button
            variant={approved ? "secondary" : "primary"}
            disabled={busy}
            onClick={() => setStatus(approved ? "draft" : "approved")}
          >
            {busy ? "Saving..." : approved ? "Move to draft" : "Approve and publish"}
          </Button>
        </div>
        {error && (
          <p style={{ margin: "10px 0 0", fontSize: "var(--text-sm)", color: "var(--color-incorrect)" }}>
            {error}
          </p>
        )}

        {/* Join requests */}
        <div style={{ marginTop: "var(--space-5)" }}>
          <div
            style={{
              fontSize: "var(--text-xs)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--color-text-3)",
              marginBottom: "var(--space-3)",
            }}
          >
            Join requests ({project.interests.length})
          </div>
          {project.interests.length === 0 ? (
            <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-3)" }}>
              No requests yet. When a member asks to join, their name and email
              show up here so the team can follow up.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {project.interests.map((i) => (
                <div
                  key={i.id}
                  style={{
                    borderTop: "1px solid var(--color-border-subtle)",
                    paddingTop: "var(--space-3)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "var(--space-3)",
                      flexWrap: "wrap",
                    }}
                  >
                    <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)" }}>
                      {i.user.name}
                    </span>
                    <a
                      href={`mailto:${i.user.email}`}
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--color-accent)",
                        textDecoration: "none",
                      }}
                    >
                      {i.user.email}
                    </a>
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-3)" }}>
                      {new Date(i.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  {i.note && (
                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: "var(--text-sm)",
                        color: "var(--color-text-2)",
                        lineHeight: 1.55,
                      }}
                    >
                      {i.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}

// ── Request-to-join dialog ───────────────────────────────────────────────────
// Portals to document.body and re-wraps in data-theme="light" (the established
// pattern: animated ancestors trap position:fixed, and the body has no theme).

function RequestJoinDialog({
  open,
  projectId,
  projectTitle,
  onClose,
  onRequested,
}: {
  open: boolean;
  projectId: string;
  projectTitle: string;
  onClose: () => void;
  onRequested: () => void;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) {
      setNote("");
      setError(null);
      setSuccess(false);
      setSubmitting(false);
      return;
    }
    const t = setTimeout(() => textareaRef.current?.focus(), 40);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function handleSubmit() {
    if (note.length > 500) {
      setError("Keep the note under 500 characters.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/build/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, note: note.trim() || null }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || "Request failed");
      }
      setSuccess(true);
      onRequested();
      setTimeout(() => {
        onClose();
        router.refresh();
      }, 1400);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  if (!mounted || !open) return null;

  return createPortal(
    <div
      data-theme="light"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(20, 20, 30, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: "var(--space-5)",
      }}
      onClick={submitting ? undefined : onClose}
    >
      <div
        className="animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-3)",
          padding: "var(--space-5)",
          maxWidth: 460,
          width: "100%",
          boxShadow: "var(--shadow-popover)",
        }}
      >
        {success ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "24px 12px 16px",
              gap: "var(--space-3)",
              textAlign: "center",
            }}
          >
            <span style={{ color: "var(--color-correct)" }}>
              <Icon name="check-circle" size={28} />
            </span>
            <div style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-text)" }}>
              Request sent
            </div>
            <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-2)" }}>
              The project team can see your name and email and will reach out.
            </p>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "var(--space-3)",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "var(--text-base)",
                  fontWeight: 600,
                  color: "var(--color-text)",
                  letterSpacing: "-0.015em",
                }}
              >
                Request to join
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                disabled={submitting}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--color-text-2)",
                  cursor: submitting ? "default" : "pointer",
                  padding: "var(--space-1)",
                  borderRadius: "var(--radius-1)",
                  display: "flex",
                }}
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <p style={{ margin: "0 0 var(--space-4)", fontSize: "var(--text-sm)", color: "var(--color-text-2)", lineHeight: 1.55 }}>
              Your name and email go to the {projectTitle} team. Add a line about
              what you want to help with, if you like.
            </p>

            <textarea
              ref={textareaRef}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional: what do you want to work on?"
              rows={3}
              maxLength={500}
              disabled={submitting}
              style={{
                width: "100%",
                resize: "vertical",
                padding: "10px 12px",
                fontSize: "var(--text-sm)",
                fontFamily: "inherit",
                lineHeight: 1.55,
                color: "var(--color-text)",
                backgroundColor: "var(--color-bg)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-2)",
                outline: "none",
                boxSizing: "border-box",
              }}
            />

            {error && (
              <p style={{ margin: "8px 0 0", fontSize: "var(--text-sm)", color: "var(--color-incorrect)" }}>
                {error}
              </p>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "var(--space-2)",
                marginTop: "var(--space-4)",
              }}
            >
              <Button variant="ghost" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Sending..." : "Send request"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
