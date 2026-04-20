"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onClose: () => void;
};

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/png", "image/jpeg", "image/gif", "image/webp"]);

export function FeedbackDialog({ open, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => textareaRef.current?.focus(), 40);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setContent("");
      setFile(null);
      setError(null);
      setSuccess(false);
      setSubmitting(false);
    }
  }, [open]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const attachFile = useCallback((f: File) => {
    if (!ALLOWED.has(f.type)) {
      setError("Only PNG, JPG, GIF, or WebP images are allowed.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("Image is larger than 5MB.");
      return;
    }
    setError(null);
    setFile(f);
  }, []);

  const onPaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.kind === "file") {
          const f = item.getAsFile();
          if (f) {
            attachFile(f);
            e.preventDefault();
            return;
          }
        }
      }
    },
    [attachFile],
  );

  async function handleSubmit() {
    const trimmed = content.trim();
    if (!trimmed) {
      setError("Please describe your feedback.");
      textareaRef.current?.focus();
      return;
    }
    if (trimmed.length > 5000) {
      setError("Feedback is too long (max 5000 characters).");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      let imagePath: string | null = null;
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        const upRes = await fetch("/api/feedback/upload", {
          method: "POST",
          body: fd,
        });
        const upBody = (await upRes.json().catch(() => ({}))) as {
          path?: string;
          error?: string;
        };
        if (!upRes.ok) {
          throw new Error(upBody.error || "Upload failed");
        }
        imagePath = upBody.path ?? null;
      }

      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: trimmed,
          imagePath,
          pageContext: pathname ?? null,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || "Submission failed");
      }
      setSuccess(true);
      setTimeout(onClose, 1400);
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
        padding: 20,
      }}
      onClick={submitting ? undefined : onClose}
    >
      <div
        className="animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 14,
          padding: 24,
          maxWidth: 520,
          width: "100%",
          boxShadow: "var(--shadow-popover)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 600,
              color: "var(--color-text)",
              letterSpacing: "-0.015em",
            }}
          >
            Leave feedback
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
              padding: 4,
              borderRadius: 6,
              display: "flex",
            }}
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        {success ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "32px 12px 8px",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "var(--color-correct-bg, #d9f0e0)",
                color: "var(--color-correct, #1f7a4a)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="check-circle" size={22} />
            </div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "var(--color-text)",
              }}
            >
              Thanks — feedback sent.
            </div>
          </div>
        ) : (
          <>
            <p
              style={{
                margin: "0 0 14px",
                fontSize: 13,
                color: "var(--color-text-2)",
                lineHeight: 1.55,
              }}
            >
              Found a bug, have a suggestion, or something confusing? Share it
              here. You can paste or attach a screenshot.
            </p>

            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onPaste={onPaste}
              placeholder="What's on your mind?"
              rows={5}
              disabled={submitting}
              style={{
                width: "100%",
                minHeight: 120,
                padding: 12,
                borderRadius: 10,
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface-2)",
                color: "var(--color-text)",
                fontSize: 14,
                fontFamily: "inherit",
                lineHeight: 1.5,
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box",
              }}
            />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 10,
                fontSize: 12,
                color: "var(--color-text-3, var(--color-text-2))",
              }}
            >
              <span>{content.length} / 5000</span>
              <span>Tip: you can paste an image directly</span>
            </div>

            {previewUrl ? (
              <div
                style={{
                  marginTop: 14,
                  position: "relative",
                  border: "1px solid var(--color-border)",
                  borderRadius: 10,
                  overflow: "hidden",
                  backgroundColor: "var(--color-surface-2)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="attachment preview"
                  style={{
                    display: "block",
                    maxHeight: 220,
                    width: "100%",
                    objectFit: "contain",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  disabled={submitting}
                  aria-label="Remove attachment"
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    background: "rgba(0,0,0,0.55)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 16,
                    width: 26,
                    height: 26,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: submitting ? "default" : "pointer",
                  }}
                >
                  <Icon name="x" size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={submitting}
                style={{
                  marginTop: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px dashed var(--color-border)",
                  backgroundColor: "transparent",
                  color: "var(--color-text-2)",
                  fontSize: 13,
                  cursor: submitting ? "default" : "pointer",
                }}
              >
                <Icon name="image" size={15} />
                Attach screenshot
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) attachFile(f);
                e.target.value = "";
              }}
            />

            {error ? (
              <div
                style={{
                  marginTop: 12,
                  padding: "8px 10px",
                  borderRadius: 8,
                  backgroundColor: "var(--color-incorrect-bg, #fbe5e5)",
                  color: "var(--color-incorrect, #a33)",
                  fontSize: 12.5,
                  lineHeight: 1.5,
                }}
              >
                {error}
              </div>
            ) : null}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                marginTop: 18,
              }}
            >
              <Button
                variant="secondary"
                size="md"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleSubmit}
                disabled={submitting || !content.trim()}
              >
                {submitting ? "Sending…" : "Send feedback"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
