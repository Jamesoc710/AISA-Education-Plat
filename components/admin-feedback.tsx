"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

type Status = "new" | "read" | "resolved";

type FeedbackItem = {
  id: string;
  content: string;
  pageContext: string | null;
  status: Status;
  createdAt: string;
  resolvedAt: string | null;
  userName: string;
  userEmail: string;
  imageUrl: string | null;
};

const FILTERS: { key: "all" | Status; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "read", label: "Read" },
  { key: "resolved", label: "Resolved" },
];

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const min = 60_000,
    hr = 60 * min,
    day = 24 * hr;
  if (diff < min) return "just now";
  if (diff < hr) return `${Math.floor(diff / min)}m ago`;
  if (diff < day) return `${Math.floor(diff / hr)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function statusTone(status: Status): { bg: string; fg: string } {
  if (status === "new")
    return { bg: "var(--color-accent-dim)", fg: "var(--color-accent)" };
  if (status === "resolved")
    return { bg: "var(--color-correct-dim)", fg: "var(--color-correct)" };
  return { bg: "var(--color-surface-2)", fg: "var(--color-text-2)" };
}

export function AdminFeedback({ items }: { items: FeedbackItem[] }) {
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [selected, setSelected] = useState<FeedbackItem | null>(null);
  const [rows, setRows] = useState<FeedbackItem[]>(items);
  const [busy, setBusy] = useState(false);

  const counts = useMemo(() => {
    const c: Record<"all" | Status, number> = {
      all: rows.length,
      new: 0,
      read: 0,
      resolved: 0,
    };
    for (const r of rows) c[r.status]++;
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    if (filter === "all") return rows;
    return rows.filter((r) => r.status === filter);
  }, [rows, filter]);

  async function updateStatus(id: string, next: Status) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error("Update failed");
      const body = (await res.json()) as {
        status: Status;
        resolvedAt: string | null;
      };
      setRows((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, status: body.status, resolvedAt: body.resolvedAt }
            : r,
        ),
      );
      setSelected((s) =>
        s && s.id === id
          ? { ...s, status: body.status, resolvedAt: body.resolvedAt }
          : s,
      );
    } finally {
      setBusy(false);
    }
  }

  function openItem(item: FeedbackItem) {
    setSelected(item);
    if (item.status === "new") {
      void updateStatus(item.id, "read");
    }
  }

  return (
    <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
      <div style={{ flex: "1 1 0", minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          {FILTERS.map((f) => {
            const isActive = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 999,
                  border: `1px solid ${isActive ? "var(--color-accent)" : "var(--color-border)"}`,
                  backgroundColor: isActive
                    ? "var(--color-accent-dim)"
                    : "var(--color-surface)",
                  color: isActive
                    ? "var(--color-accent)"
                    : "var(--color-text-2)",
                  fontSize: 12.5,
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {f.label}
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: isActive
                      ? "var(--color-accent)"
                      : "var(--color-text-3)",
                  }}
                >
                  {counts[f.key]}
                </span>
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <div
            style={{
              padding: "48px 20px",
              textAlign: "center",
              color: "var(--color-text-3)",
              border: "1px solid var(--color-border)",
              borderRadius: 12,
              backgroundColor: "var(--color-surface)",
              fontSize: 13.5,
            }}
          >
            {filter === "all"
              ? "No feedback submitted yet."
              : `No ${filter} feedback.`}
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {filtered.map((r) => {
              const tone = statusTone(r.status);
              const isSelected = selected?.id === r.id;
              const preview = r.content.length > 140
                ? r.content.slice(0, 140).trim() + "…"
                : r.content;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => openItem(r)}
                  style={{
                    textAlign: "left",
                    border: `1px solid ${isSelected ? "var(--color-accent)" : "var(--color-border)"}`,
                    borderRadius: 12,
                    backgroundColor: "var(--color-surface)",
                    padding: 16,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    cursor: "pointer",
                    transition: "border-color 120ms ease, background-color 120ms ease",
                    boxShadow: isSelected
                      ? "0 0 0 3px var(--color-accent-dim)"
                      : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected)
                      e.currentTarget.style.borderColor =
                        "var(--color-border-strong, var(--color-text-3))";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected)
                      e.currentTarget.style.borderColor = "var(--color-border)";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13.5,
                          fontWeight: 600,
                          color: "var(--color-text)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {r.userName}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          color: "var(--color-text-3)",
                        }}
                      >
                        {relativeTime(r.createdAt)}
                      </span>
                    </div>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "2px 8px",
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "0.03em",
                        textTransform: "uppercase",
                        backgroundColor: tone.bg,
                        color: tone.fg,
                      }}
                    >
                      {r.status}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 13.5,
                      color: "var(--color-text-2)",
                      lineHeight: 1.5,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {preview}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      fontSize: 11.5,
                      color: "var(--color-text-3)",
                    }}
                  >
                    {r.pageContext ? (
                      <span
                        style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                      >
                        <Icon name="file-text" size={11} />
                        {r.pageContext}
                      </span>
                    ) : null}
                    {r.imageUrl ? (
                      <span
                        style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                      >
                        <Icon name="image" size={11} />
                        Attachment
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <aside
        style={{
          position: "sticky",
          top: 24,
          width: 380,
          flex: "0 0 380px",
          border: "1px solid var(--color-border)",
          borderRadius: 12,
          backgroundColor: "var(--color-surface)",
          padding: 18,
          maxHeight: "calc(100vh - 48px)",
          overflowY: "auto",
        }}
      >
        {selected ? (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 10,
                marginBottom: 12,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--color-text)",
                  }}
                >
                  {selected.userName}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--color-text-3)",
                    wordBreak: "break-all",
                  }}
                >
                  {selected.userEmail}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--color-text-3)",
                  cursor: "pointer",
                  padding: 4,
                  borderRadius: 6,
                  display: "flex",
                }}
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            <div
              style={{
                fontSize: 11,
                color: "var(--color-text-3)",
                marginBottom: 14,
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <span>{new Date(selected.createdAt).toLocaleString()}</span>
              {selected.pageContext ? (
                <span>· on {selected.pageContext}</span>
              ) : null}
            </div>

            <div
              style={{
                fontSize: 13.5,
                color: "var(--color-text)",
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                marginBottom: 14,
              }}
            >
              {selected.content}
            </div>

            {selected.imageUrl ? (
              <a
                href={selected.imageUrl}
                target="_blank"
                rel="noreferrer noopener"
                style={{
                  display: "block",
                  border: "1px solid var(--color-border)",
                  borderRadius: 10,
                  overflow: "hidden",
                  marginBottom: 14,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selected.imageUrl}
                  alt="feedback attachment"
                  style={{
                    display: "block",
                    width: "100%",
                    maxHeight: 260,
                    objectFit: "contain",
                    backgroundColor: "var(--color-surface-2)",
                  }}
                />
              </a>
            ) : null}

            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                paddingTop: 12,
                borderTop: "1px solid var(--color-border)",
              }}
            >
              {selected.status !== "resolved" ? (
                <Button
                  size="sm"
                  variant="primary"
                  disabled={busy}
                  onClick={() => updateStatus(selected.id, "resolved")}
                >
                  Mark resolved
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => updateStatus(selected.id, "read")}
                >
                  Reopen
                </Button>
              )}
              {selected.status === "read" ? (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => updateStatus(selected.id, "new")}
                >
                  Mark unread
                </Button>
              ) : null}
            </div>
          </>
        ) : (
          <div
            style={{
              color: "var(--color-text-3)",
              fontSize: 13,
              padding: "32px 8px",
              textAlign: "center",
            }}
          >
            Select a feedback entry to read it.
          </div>
        )}
      </aside>
    </div>
  );
}
