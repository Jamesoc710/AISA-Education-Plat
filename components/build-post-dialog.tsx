"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { LookingForTag } from "@/components/build-client";
import { PROJECT_STAGES, STAGE_META, stageMeta } from "@/lib/project-stages";
import type { BuildTrack } from "@/lib/build";

/**
 * Post a project: a three-step modal that portals to document.body and re-wraps
 * in data-theme="light" (the established dialog pattern, cloned from the
 * request-to-join dialog: animated ancestors trap position:fixed and the body
 * has no theme).
 *
 * Step 1 is the single gate. Title, blurb, and an UNSELECTED stage radio must be
 * filled before the poster can leave it; that gate is how the schema default of
 * "building" is genuinely inverted into an explicit choice. Steps 2 (details)
 * and 3 (review) are optional and freely navigable.
 *
 * Stage options are read from project-stages.ts, so the four-value vocabulary
 * migration needs no change here.
 */

const MAX_TITLE = 120;
const MAX_BLURB = 280;
const MAX_LOOKING_FOR = 8;
const MAX_LOOKING_FOR_LEN = 40;
const URL_RE = /^https?:\/\//;

type Step = 1 | 2 | 3;
const STEPS: { n: Step; label: string }[] = [
  { n: 1, label: "Basics" },
  { n: 2, label: "Details" },
  { n: 3, label: "Review" },
];

const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  fontSize: "var(--text-sm)",
  fontFamily: "inherit",
  lineHeight: 1.5,
  color: "var(--color-text)",
  backgroundColor: "var(--color-bg)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-2)",
  outline: "none",
  boxSizing: "border-box",
};

export function BuildPostDialog({
  open,
  onClose,
  tracks,
}: {
  open: boolean;
  onClose: () => void;
  tracks: BuildTrack[];
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<Step>(1);

  // Step 1
  const [title, setTitle] = useState("");
  const [blurb, setBlurb] = useState("");
  const [stage, setStage] = useState<string | null>(null);

  // Step 2
  const [trackSlug, setTrackSlug] = useState("");
  const [description, setDescription] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [walkthroughUrl, setWalkthroughUrl] = useState("");

  // Step 3
  const [roleDraft, setRoleDraft] = useState("");
  const [lookingFor, setLookingFor] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  // Reset every time the dialog opens or closes.
  useEffect(() => {
    if (!open) return;
    setStep(1);
    setTitle("");
    setBlurb("");
    setStage(null);
    setTrackSlug("");
    setDescription("");
    setRepoUrl("");
    setDemoUrl("");
    setWalkthroughUrl("");
    setRoleDraft("");
    setLookingFor([]);
    setSubmitting(false);
    setError(null);
    setDone(false);
    const t = setTimeout(() => titleRef.current?.focus(), 40);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, submitting]);

  const step1Valid =
    title.trim().length > 0 &&
    title.length <= MAX_TITLE &&
    blurb.trim().length > 0 &&
    blurb.length <= MAX_BLURB &&
    stage !== null;

  const badUrls = [repoUrl, demoUrl, walkthroughUrl].some(
    (u) => u.trim() !== "" && !URL_RE.test(u.trim()),
  );

  function goTo(target: Step) {
    // Step 1 is the only gate: leaving it requires a valid Step 1.
    if (target > 1 && !step1Valid) {
      setStep(1);
      return;
    }
    setStep(target);
  }

  function addRole() {
    const v = roleDraft.trim().slice(0, MAX_LOOKING_FOR_LEN);
    if (!v) return;
    if (lookingFor.length >= MAX_LOOKING_FOR) return;
    if (lookingFor.some((r) => r.toLowerCase() === v.toLowerCase())) {
      setRoleDraft("");
      return;
    }
    setLookingFor([...lookingFor, v]);
    setRoleDraft("");
  }

  async function handleSubmit() {
    if (!step1Valid) {
      setStep(1);
      return;
    }
    if (badUrls) {
      setError("Links must start with http:// or https://");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/build/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          blurb: blurb.trim(),
          stage,
          trackSlug: trackSlug || null,
          description: description.trim() || null,
          repoUrl: repoUrl.trim() || null,
          demoUrl: demoUrl.trim() || null,
          walkthroughUrl: walkthroughUrl.trim() || null,
          lookingFor,
        }),
      });
      if (!res.ok) {
        const b = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(b.error || "Could not post the project");
      }
      setDone(true);
      router.refresh();
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
          maxWidth: 560,
          width: "100%",
          maxHeight: "calc(100vh - var(--space-7))",
          overflowY: "auto",
          boxShadow: "var(--shadow-popover)",
        }}
      >
        {done ? (
          <DonePanel onClose={onClose} />
        ) : (
          <>
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "var(--space-4)",
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
                Post a project
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

            {/* Progress strip */}
            <ProgressStrip step={step} step1Valid={step1Valid} onGo={goTo} />

            {/* Step body */}
            <div style={{ marginTop: "var(--space-5)" }}>
              {step === 1 && (
                <StepBasics
                  title={title}
                  setTitle={setTitle}
                  blurb={blurb}
                  setBlurb={setBlurb}
                  stage={stage}
                  setStage={setStage}
                  titleRef={titleRef}
                />
              )}
              {step === 2 && (
                <StepDetails
                  tracks={tracks}
                  trackSlug={trackSlug}
                  setTrackSlug={setTrackSlug}
                  description={description}
                  setDescription={setDescription}
                  repoUrl={repoUrl}
                  setRepoUrl={setRepoUrl}
                  demoUrl={demoUrl}
                  setDemoUrl={setDemoUrl}
                  walkthroughUrl={walkthroughUrl}
                  setWalkthroughUrl={setWalkthroughUrl}
                />
              )}
              {step === 3 && (
                <StepReview
                  title={title}
                  blurb={blurb}
                  stage={stage}
                  trackSlug={trackSlug}
                  tracks={tracks}
                  roleDraft={roleDraft}
                  setRoleDraft={setRoleDraft}
                  lookingFor={lookingFor}
                  onAddRole={addRole}
                  onRemoveRole={(r) => setLookingFor(lookingFor.filter((x) => x !== r))}
                />
              )}
            </div>

            {error && (
              <p style={{ margin: "var(--space-4) 0 0", fontSize: "var(--text-sm)", color: "var(--color-incorrect)" }}>
                {error}
              </p>
            )}

            {/* Footer nav */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "var(--space-2)",
                marginTop: "var(--space-5)",
              }}
            >
              <div>
                {step > 1 && (
                  <Button
                    variant="ghost"
                    onClick={() => goTo((step - 1) as Step)}
                    disabled={submitting}
                    leftIcon={<Icon name="arrow-left" size={14} />}
                  >
                    Back
                  </Button>
                )}
              </div>
              <div style={{ display: "flex", gap: "var(--space-2)" }}>
                {step < 3 ? (
                  <Button
                    onClick={() => goTo((step + 1) as Step)}
                    disabled={step === 1 && !step1Valid}
                    rightIcon={<Icon name="arrow-right" size={14} />}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting || !step1Valid || badUrls}
                    leftIcon={<Icon name="paper-plane-tilt" size={14} />}
                  >
                    {submitting ? "Posting..." : "Post project"}
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

// ── Progress strip (green check on done steps) ───────────────────────────────

function ProgressStrip({
  step,
  step1Valid,
  onGo,
}: {
  step: Step;
  step1Valid: boolean;
  onGo: (s: Step) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
      {STEPS.map((s, i) => {
        const isCurrent = s.n === step;
        const isDone = s.n < step || (s.n === 1 && step1Valid && step !== 1);
        const reachable = s.n === 1 || step1Valid;
        return (
          <div key={s.n} style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
            <button
              type="button"
              onClick={() => reachable && onGo(s.n)}
              disabled={!reachable}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--space-2)",
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: reachable ? "pointer" : "default",
                fontFamily: "inherit",
                minWidth: 0,
              }}
            >
              <span
                aria-hidden
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 22,
                  height: 22,
                  borderRadius: 999,
                  flexShrink: 0,
                  fontSize: "var(--text-xs)",
                  fontWeight: 600,
                  color: isDone
                    ? "var(--color-correct)"
                    : isCurrent
                      ? "#fff"
                      : "var(--color-text-3)",
                  backgroundColor: isDone
                    ? "var(--color-correct-dim)"
                    : isCurrent
                      ? "var(--color-accent)"
                      : "var(--color-surface-3)",
                }}
              >
                {isDone ? <Icon name="check-circle" size={14} /> : s.n}
              </span>
              <span
                style={{
                  fontSize: "var(--text-xs)",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                  color: isCurrent ? "var(--color-text)" : "var(--color-text-3)",
                }}
              >
                {s.label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <span
                aria-hidden
                style={{
                  flex: 1,
                  height: 1,
                  margin: "0 var(--space-2)",
                  backgroundColor: "var(--color-border)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Step 1: Basics ───────────────────────────────────────────────────────────

function StepBasics({
  title,
  setTitle,
  blurb,
  setBlurb,
  stage,
  setStage,
  titleRef,
}: {
  title: string;
  setTitle: (v: string) => void;
  blurb: string;
  setBlurb: (v: string) => void;
  stage: string | null;
  setStage: (v: string) => void;
  titleRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <Field label="Project title" required>
        <input
          ref={titleRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={MAX_TITLE}
          placeholder="What is it called?"
          style={fieldStyle}
        />
      </Field>

      <Field label="Blurb" required hint={`${blurb.length}/${MAX_BLURB}`}>
        <textarea
          value={blurb}
          onChange={(e) => setBlurb(e.target.value)}
          maxLength={MAX_BLURB}
          rows={3}
          placeholder="One or two sentences on what it does."
          style={{ ...fieldStyle, resize: "vertical" }}
        />
      </Field>

      <Field label="Stage" required hint="Pick where it is right now">
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
          {PROJECT_STAGES.map((s) => {
            const selected = stage === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStage(s)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 999,
                  fontSize: "var(--text-sm)",
                  fontWeight: 500,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  color: selected ? "#fff" : "var(--color-text-2)",
                  backgroundColor: selected ? "var(--color-accent)" : "var(--color-surface-2)",
                  border: `1px solid ${selected ? "transparent" : "var(--color-border)"}`,
                  transition: "background-color 120ms ease, color 120ms ease",
                }}
              >
                {STAGE_META[s].label}
              </button>
            );
          })}
        </div>
      </Field>
    </div>
  );
}

// ── Step 2: Details ──────────────────────────────────────────────────────────

function StepDetails({
  tracks,
  trackSlug,
  setTrackSlug,
  description,
  setDescription,
  repoUrl,
  setRepoUrl,
  demoUrl,
  setDemoUrl,
  walkthroughUrl,
  setWalkthroughUrl,
}: {
  tracks: BuildTrack[];
  trackSlug: string;
  setTrackSlug: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  repoUrl: string;
  setRepoUrl: (v: string) => void;
  demoUrl: string;
  setDemoUrl: (v: string) => void;
  walkthroughUrl: string;
  setWalkthroughUrl: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-3)" }}>
        Everything here is optional. You can fill it in now or after a moderator approves the post.
      </p>

      {tracks.length > 0 && (
        <Field label="Team">
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
            <TrackChip label="None" selected={trackSlug === ""} onClick={() => setTrackSlug("")} />
            {tracks.map((t) => (
              <TrackChip
                key={t.slug}
                label={t.shortName}
                dot={t.accentColor}
                selected={trackSlug === t.slug}
                onClick={() => setTrackSlug(t.slug)}
              />
            ))}
          </div>
        </Field>
      )}

      <Field label="Description" hint="Markdown supported">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          placeholder="The fuller story: what it does, how it works, the stack."
          style={{ ...fieldStyle, resize: "vertical" }}
        />
      </Field>

      <UrlField label="Repo URL" icon="github-logo" value={repoUrl} onChange={setRepoUrl} placeholder="https://github.com/..." />
      <UrlField label="Demo URL" icon="arrow-square-out" value={demoUrl} onChange={setDemoUrl} placeholder="https://..." />
      <UrlField label="Walkthrough URL" icon="play-circle" value={walkthroughUrl} onChange={setWalkthroughUrl} placeholder="https://loom.com/..." />
    </div>
  );
}

// ── Step 3: Review + help wanted ─────────────────────────────────────────────

function StepReview({
  title,
  blurb,
  stage,
  trackSlug,
  tracks,
  roleDraft,
  setRoleDraft,
  lookingFor,
  onAddRole,
  onRemoveRole,
}: {
  title: string;
  blurb: string;
  stage: string | null;
  trackSlug: string;
  tracks: BuildTrack[];
  roleDraft: string;
  setRoleDraft: (v: string) => void;
  lookingFor: string[];
  onAddRole: () => void;
  onRemoveRole: (r: string) => void;
}) {
  const trackName = tracks.find((t) => t.slug === trackSlug)?.shortName ?? "None";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <Field label="Looking for" hint="Add roles you want help with, then Enter">
        <input
          value={roleDraft}
          onChange={(e) => setRoleDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              onAddRole();
            }
          }}
          maxLength={MAX_LOOKING_FOR_LEN}
          placeholder="e.g. designer, front-end dev"
          style={fieldStyle}
        />
        {lookingFor.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", marginTop: "var(--space-3)" }}>
            {lookingFor.map((r) => (
              <span key={r} style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: "var(--space-2)" }}>
                <LookingForTag label={r} />
                <button
                  type="button"
                  onClick={() => onRemoveRole(r)}
                  aria-label={`Remove ${r}`}
                  style={{
                    display: "flex",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--color-text-3)",
                    padding: 0,
                  }}
                >
                  <Icon name="x" size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </Field>

      {/* Proofread summary */}
      <div
        style={{
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-2)",
          padding: "var(--space-4)",
          backgroundColor: "var(--color-bg)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-3)",
        }}
      >
        <SummaryRow label="Title" value={title || "(none)"} />
        <SummaryRow label="Blurb" value={blurb || "(none)"} />
        <SummaryRow label="Stage" value={stage ? stageMeta(stage).label : "(none)"} />
        <SummaryRow label="Team" value={trackName} />
      </div>

      <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-3)", lineHeight: 1.5 }}>
        Posting submits the project as a draft. A moderator reviews it before it
        goes live on the board.
      </p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: "var(--space-3)" }}>
      <span
        style={{
          flexShrink: 0,
          width: 56,
          fontSize: "var(--text-xs)",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "var(--color-text-3)",
          paddingTop: 1,
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text)", lineHeight: 1.5, minWidth: 0 }}>
        {value}
      </span>
    </div>
  );
}

// ── Shared field primitives ──────────────────────────────────────────────────

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  // A plain div, not a label: several fields hold button groups (stage, track),
  // and a label dispatches clicks to its first labelable descendant, which would
  // auto-select the first stage button and defeat the unselected-by-default gate.
  return (
    <div style={{ display: "block" }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: "var(--space-2)",
          marginBottom: "var(--space-2)",
        }}
      >
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)" }}>
          {label}
          {required && <span style={{ color: "var(--color-incorrect)", marginLeft: 3 }}>*</span>}
        </span>
        {hint && <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-3)" }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function UrlField({
  label,
  icon,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  icon: "github-logo" | "arrow-square-out" | "play-circle";
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const invalid = value.trim() !== "" && !URL_RE.test(value.trim());
  return (
    <Field label={label} hint={invalid ? "Must start with http(s)://" : undefined}>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <span style={{ position: "absolute", left: "var(--space-3)", color: "var(--color-text-3)", display: "flex" }}>
          <Icon name={icon} size={14} />
        </span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          inputMode="url"
          style={{
            ...fieldStyle,
            paddingLeft: 34,
            borderColor: invalid ? "var(--color-incorrect)" : "var(--color-border)",
          }}
        />
      </div>
    </Field>
  );
}

function TrackChip({
  label,
  dot,
  selected,
  onClick,
}: {
  label: string;
  dot?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-2)",
        padding: "6px 12px",
        borderRadius: 999,
        fontSize: "var(--text-sm)",
        fontWeight: 500,
        fontFamily: "inherit",
        cursor: "pointer",
        color: selected ? "#fff" : "var(--color-text-2)",
        backgroundColor: selected ? "var(--color-accent)" : "var(--color-surface-2)",
        border: `1px solid ${selected ? "transparent" : "var(--color-border)"}`,
        transition: "background-color 120ms ease, color 120ms ease",
      }}
    >
      {dot && (
        <span
          aria-hidden
          style={{
            width: 7,
            height: 7,
            borderRadius: 999,
            backgroundColor: selected ? "#fff" : dot,
          }}
        />
      )}
      {label}
    </button>
  );
}

// ── Success panel ────────────────────────────────────────────────────────────

function DonePanel({ onClose }: { onClose: () => void }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "24px 12px 12px",
        gap: "var(--space-3)",
        textAlign: "center",
      }}
    >
      <span style={{ color: "var(--color-correct)" }}>
        <Icon name="check-circle" size={28} />
      </span>
      <div style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-text)" }}>
        Submitted for review
      </div>
      <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-2)", lineHeight: 1.55, maxWidth: 360 }}>
        Your project is in as a draft. A moderator reviews it before it appears on
        the board, then you are set as its lead.
      </p>
      <div style={{ marginTop: "var(--space-2)" }}>
        <Button onClick={onClose}>Done</Button>
      </div>
    </div>
  );
}
