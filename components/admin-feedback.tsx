"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { StatusTag, type StatusTagTone } from "@/components/ui/status-tag";
import { FilterTabs, type FilterTabItem } from "@/components/ui/filter-tabs";

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

type FilterKey = "all" | Status;

const FILTERS: readonly { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "read", label: "Read" },
  { key: "resolved", label: "Resolved" },
] as const;

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

function statusTagTone(status: Status): StatusTagTone {
  if (status === "new") return "accent";
  if (status === "resolved") return "green";
  return "neutral";
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
    <div style={{ display: "flex", gap: "var(--space-5)", alignItems: "flex-start" }}>
      <div style={{ flex: "1 1 0", minWidth: 0 }}>
        <FilterTabs<FilterKey>
          tabs={FILTERS.map<FilterTabItem<FilterKey>>((f) => ({
            key: f.key,
            label: f.label,
            count: counts[f.key],
          }))}
          active={filter}
          onChange={setFilter}
          style={{ marginBottom: "var(--space-4)" }}
        />

        {filtered.length === 0 ? (
          <div
            style={{
              padding: "48px 20px",
              textAlign: "center",
              color: "var(--color-text-3)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-3)",
              backgroundColor: "var(--color-surface)",
              fontSize: "var(--text-sm)",
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
              gap: "var(--space-3)",
            }}
          >
            {filtered.map((r) => {
              const chipTone = statusTagTone(r.status);
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
                    borderRadius: "var(--radius-3)",
                    backgroundColor: "var(--color-surface)",
                    padding: "var(--space-4)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-2)",
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
                      gap: "var(--space-3)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-3)",
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "var(--text-sm)",
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
                          fontSize: "var(--text-xs)",
                          color: "var(--color-text-3)",
                        }}
                      >
                        {relativeTime(r.createdAt)}
                      </span>
                    </div>
                    <StatusTag tone={chipTone} uppercase>
                      {r.status}
                    </StatusTag>
                  </div>
                  <div
                    style={{
                      fontSize: "var(--text-sm)",
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
                      gap: "var(--space-3)",
                      fontSize: "var(--text-xs)",
                      color: "var(--color-text-3)",
                    }}
                  >
                    {r.pageContext ? (
                      <span
                        style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-1)" }}
                      >
                        <Icon name="file-text" size={11} />
                        {r.pageContext}
                      </span>
                    ) : null}
                    {r.imageUrl ? (
                      <span
                        style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-1)" }}
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
          top: "var(--space-5)",
          width: 380,
          flex: "0 0 380px",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-3)",
          backgroundColor: "var(--color-surface)",
          padding: "var(--space-5)",
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
                gap: "var(--space-3)",
                marginBottom: "var(--space-3)",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "var(--text-base)",
                    fontWeight: 600,
                    color: "var(--color-text)",
                  }}
                >
                  {selected.userName}
                </div>
                <div
                  style={{
                    fontSize: "var(--text-xs)",
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
                  padding: "var(--space-1)",
                  borderRadius: "var(--radius-1)",
                  display: "flex",
                }}
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            <div
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--color-text-3)",
                marginBottom: "var(--space-4)",
                display: "flex",
                flexWrap: "wrap",
                gap: "var(--space-2)",
              }}
            >
              <span>{new Date(selected.createdAt).toLocaleString()}</span>
              {selected.pageContext ? (
                <span>· on {selected.pageContext}</span>
              ) : null}
            </div>

            <div
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--color-text)",
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                marginBottom: "var(--space-4)",
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
                  borderRadius: "var(--radius-2)",
                  overflow: "hidden",
                  marginBottom: "var(--space-4)",
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
                gap: "var(--space-2)",
                flexWrap: "wrap",
                paddingTop: "var(--space-3)",
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
              fontSize: "var(--text-sm)",
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
