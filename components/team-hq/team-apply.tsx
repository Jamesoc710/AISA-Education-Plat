"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

/**
 * The masthead "Apply" action. Getting on a team is application-based and
 * differs per team (Tech is interview-gated, Capital opens applications), and
 * applications are not open right now, so the button explains that in a popup
 * instead of writing membership. When applications open this becomes the real
 * entry point; the dormant TeamMembership table and join routes are ready for it.
 *
 * The button sits inside the team page root, so it carries the team accent. The
 * popup portals to the body (per the dialog convention) and is neutral-themed.
 */
export function TeamApply({ teamName }: { teamName: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} style={applyBtn}>
        Apply
      </button>
      <ApplyDialog teamName={teamName} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

const applyBtn = {
  display: "inline-flex",
  alignItems: "center",
  padding: "10px 20px",
  borderRadius: "var(--radius-2)",
  border: "none",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: "var(--text-base)",
  fontWeight: 600,
  color: "#fff",
  backgroundColor: "var(--color-accent)",
  whiteSpace: "nowrap",
} as const;

function ApplyDialog({
  teamName,
  open,
  onClose,
}: {
  teamName: string;
  open: boolean;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      data-theme="light"
      onClick={onClose}
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
    >
      <div
        className="animate-fade-in"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-3)",
          padding: "var(--space-6)",
          maxWidth: 420,
          width: "100%",
          boxShadow: "var(--shadow-popover)",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "var(--text-lg)",
            fontWeight: 600,
            letterSpacing: "-0.015em",
            color: "var(--color-text)",
          }}
        >
          Applications aren&apos;t open yet
        </h2>
        <p
          style={{
            margin: "var(--space-3) 0 0",
            fontSize: "var(--text-base)",
            color: "var(--color-text-2)",
            lineHeight: 1.55,
          }}
        >
          {`Applications to ${teamName} aren't open right now. We'll announce when they open.`}
        </p>
        <button type="button" onClick={onClose} style={okBtn}>
          Got it
        </button>
      </div>
    </div>,
    document.body,
  );
}

const okBtn = {
  marginTop: "var(--space-5)",
  padding: "9px 18px",
  borderRadius: "var(--radius-2)",
  border: "none",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: "var(--text-base)",
  fontWeight: 600,
  color: "#fff",
  backgroundColor: "var(--color-accent)",
} as const;
