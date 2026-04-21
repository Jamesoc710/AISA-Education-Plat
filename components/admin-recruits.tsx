"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { IconTile } from "@/components/ui/icon-tile";
import { StatusTag, type StatusTagTone } from "@/components/ui/status-tag";

type Recruit = {
  id: string;
  name: string;
  email: string;
  role: string;
  cohort: string | null;
  createdAt: string;
  quizScore: number | null;
  questionsAnswered: number;
  homeworkSubmitted: number;
  lastActive: string | null;
};

type SortKey =
  | "name"
  | "email"
  | "role"
  | "quizScore"
  | "questionsAnswered"
  | "homeworkSubmitted"
  | "createdAt"
  | "lastActive";

const VALID_ROLES = [
  "RECRUIT",
  "MENTOR",
  "ADMIN",
  "CURRICULUM_LEAD",
  "PROJECT_LEAD",
];

function relativeTime(iso: string | null): string {
  if (!iso) return "—";
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

function scoreTone(score: number | null): StatusTagTone | null {
  if (score === null) return null;
  if (score >= 80) return "green";
  if (score >= 50) return "gold";
  return "red";
}

function roleBadgeTone(role: string): StatusTagTone {
  if (role === "ADMIN") return "accent";
  if (role === "MENTOR") return "blue";
  if (role === "CURRICULUM_LEAD" || role === "PROJECT_LEAD") return "gold";
  return "neutral";
}

export function AdminRecruits({ recruits }: { recruits: Recruit[] }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("lastActive");
  const [sortAsc, setSortAsc] = useState(false);
  const [roles, setRoles] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const r of recruits) map[r.id] = r.role;
    return map;
  });
  const [updating, setUpdating] = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return recruits.filter(
      (r) =>
        r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q),
    );
  }, [recruits, search]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let aVal: string | number | null;
      let bVal: string | number | null;
      switch (sortKey) {
        case "name":
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case "email":
          aVal = a.email.toLowerCase();
          bVal = b.email.toLowerCase();
          break;
        case "role":
          aVal = (roles[a.id] || a.role).toLowerCase();
          bVal = (roles[b.id] || b.role).toLowerCase();
          break;
        case "quizScore":
          aVal = a.quizScore ?? -1;
          bVal = b.quizScore ?? -1;
          break;
        case "questionsAnswered":
          aVal = a.questionsAnswered;
          bVal = b.questionsAnswered;
          break;
        case "homeworkSubmitted":
          aVal = a.homeworkSubmitted;
          bVal = b.homeworkSubmitted;
          break;
        case "createdAt":
          aVal = a.createdAt;
          bVal = b.createdAt;
          break;
        case "lastActive":
          aVal = a.lastActive ?? "";
          bVal = b.lastActive ?? "";
          break;
        default:
          return 0;
      }
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortKey, sortAsc, roles]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  async function handleRoleChange(userId: string, newRole: string) {
    setUpdating(userId);
    try {
      const res = await fetch("/api/admin/recruits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (res.ok) setRoles((prev) => ({ ...prev, [userId]: newRole }));
    } finally {
      setUpdating(null);
    }
  }

  const columns: { label: string; key: SortKey }[] = [
    { label: "Name", key: "name" },
    { label: "Email", key: "email" },
    { label: "Role", key: "role" },
    { label: "Score", key: "quizScore" },
    { label: "Questions", key: "questionsAnswered" },
    { label: "Homework", key: "homeworkSubmitted" },
    { label: "Joined", key: "createdAt" },
    { label: "Last active", key: "lastActive" },
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-3)",
          marginBottom: "var(--space-4)",
        }}
      >
        <h2
          style={{
            fontSize: "var(--text-md)",
            fontWeight: 600,
            color: "var(--color-text)",
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          Recruits
        </h2>
        <StatusTag tone="neutral">{recruits.length}</StatusTag>
        <div style={{ flex: 1 }} />
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Icon
            name="search"
            size={14}
            strokeWidth={2}
            style={{
              position: "absolute",
              left: "var(--space-3)",
              color: "var(--color-text-3)",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={{
              fontSize: "var(--text-sm)",
              padding: "8px 12px 8px 34px",
              borderRadius: "var(--radius-2)",
              border: `1px solid ${searchFocused ? "var(--color-accent)" : "var(--color-border)"}`,
              backgroundColor: "var(--color-surface)",
              color: "var(--color-text)",
              outline: "none",
              width: 280,
              boxShadow: searchFocused
                ? "0 0 0 3px var(--color-accent-dim)"
                : "none",
              transition: "border-color 150ms ease, box-shadow 150ms ease",
            }}
          />
        </div>
      </div>

      <div
        style={{
          overflowX: "auto",
          borderRadius: "var(--radius-3)",
          border: "1px solid var(--color-border)",
          backgroundColor: "var(--color-surface)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: 0,
          }}
        >
          <thead>
            <tr>
              {columns.map((col) => {
                const isActive = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    style={{
                      fontSize: "var(--text-xs)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: isActive
                        ? "var(--color-text)"
                        : "var(--color-text-3)",
                      fontWeight: 600,
                      padding: "12px 16px",
                      backgroundColor: "var(--color-surface-2)",
                      borderBottom: "1px solid var(--color-border)",
                      textAlign: "left",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      userSelect: "none",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "var(--space-1)",
                      }}
                    >
                      {col.label}
                      {isActive && (
                        <span style={{ fontSize: "var(--text-xs)" }}>
                          {sortAsc ? "↑" : "↓"}
                        </span>
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, idx) => {
              const currentRole = roles[r.id] || r.role;
              const badgeTone = roleBadgeTone(currentRole);
              const tone = scoreTone(r.quizScore);
              return (
                <tr
                  key={r.id}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor =
                      "var(--color-surface-2)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor =
                      "transparent";
                  }}
                  style={{ transition: "background-color 100ms ease" }}
                >
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: "var(--text-sm)",
                      fontWeight: 500,
                      color: "var(--color-text)",
                      borderTop:
                        idx === 0
                          ? "none"
                          : "1px solid var(--color-border-subtle)",
                    }}
                  >
                    <Link
                      href={`/admin/recruits?detail=${r.id}`}
                      style={{ color: "inherit", textDecoration: "none" }}
                    >
                      {r.name}
                    </Link>
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: "var(--text-sm)",
                      color: "var(--color-text-2)",
                      borderTop:
                        idx === 0
                          ? "none"
                          : "1px solid var(--color-border-subtle)",
                    }}
                  >
                    {r.email}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      borderTop:
                        idx === 0
                          ? "none"
                          : "1px solid var(--color-border-subtle)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-2)",
                      }}
                    >
                      <StatusTag tone={badgeTone}>{currentRole}</StatusTag>
                      <select
                        value={currentRole}
                        disabled={updating === r.id}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) =>
                          handleRoleChange(r.id, e.target.value)
                        }
                        style={{
                          fontSize: "var(--text-xs)",
                          padding: "2px 6px",
                          borderRadius: "var(--radius-1)",
                          border: "1px solid var(--color-border)",
                          backgroundColor: "var(--color-surface)",
                          color: "var(--color-text-3)",
                          cursor: "pointer",
                          opacity: updating === r.id ? 0.5 : 1,
                        }}
                      >
                        {VALID_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      borderTop:
                        idx === 0
                          ? "none"
                          : "1px solid var(--color-border-subtle)",
                    }}
                  >
                    {tone ? (
                      <StatusTag tone={tone}>{r.quizScore}%</StatusTag>
                    ) : (
                      <span
                        style={{
                          fontSize: "var(--text-sm)",
                          color: "var(--color-text-3)",
                        }}
                      >
                        —
                      </span>
                    )}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: "var(--text-sm)",
                      color: "var(--color-text-2)",
                      fontVariantNumeric: "tabular-nums",
                      borderTop:
                        idx === 0
                          ? "none"
                          : "1px solid var(--color-border-subtle)",
                    }}
                  >
                    {r.questionsAnswered}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: "var(--text-sm)",
                      color: "var(--color-text-2)",
                      fontVariantNumeric: "tabular-nums",
                      borderTop:
                        idx === 0
                          ? "none"
                          : "1px solid var(--color-border-subtle)",
                    }}
                  >
                    {r.homeworkSubmitted}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: "var(--text-sm)",
                      color: "var(--color-text-2)",
                      whiteSpace: "nowrap",
                      borderTop:
                        idx === 0
                          ? "none"
                          : "1px solid var(--color-border-subtle)",
                    }}
                  >
                    {new Date(r.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: "var(--text-sm)",
                      color: "var(--color-text-2)",
                      whiteSpace: "nowrap",
                      borderTop:
                        idx === 0
                          ? "none"
                          : "1px solid var(--color-border-subtle)",
                    }}
                  >
                    {relativeTime(r.lastActive)}
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: 0 }}>
                  <EmptyState />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 24px",
        gap: "var(--space-3)",
        textAlign: "center",
      }}
    >
      <IconTile icon="users" color="indigo" size="lg" />
      <div>
        <div
          style={{
            fontSize: "var(--text-base)",
            fontWeight: 600,
            color: "var(--color-text)",
            marginBottom: "var(--space-1)",
          }}
        >
          No recruits found
        </div>
        <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-3)" }}>
          Try a different search term.
        </div>
      </div>
    </div>
  );
}
