"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

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
  if (!iso) return "--";
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

function scoreColor(score: number | null): string {
  if (score === null) return "var(--color-text-3)";
  if (score >= 80) return "#4ade80";
  if (score >= 50) return "#e8b54a";
  return "#e5716f";
}

function roleBadge(role: string): { bg: string; color: string } {
  if (role === "ADMIN") {
    return { bg: "var(--color-accent-dim)", color: "var(--color-accent)" };
  }
  return {
    bg: "var(--color-surface-2)",
    color: "var(--color-text-3)",
  };
}

export function AdminRecruits({ recruits }: { recruits: Recruit[] }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("lastActive");
  const [sortAsc, setSortAsc] = useState(false);
  const [roles, setRoles] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const r of recruits) {
      map[r.id] = r.role;
    }
    return map;
  });
  const [updating, setUpdating] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return recruits.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q),
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
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
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
      if (res.ok) {
        setRoles((prev) => ({ ...prev, [userId]: newRole }));
      }
    } finally {
      setUpdating(null);
    }
  }

  const columns: { label: string; key: SortKey }[] = [
    { label: "Name", key: "name" },
    { label: "Email", key: "email" },
    { label: "Role", key: "role" },
    { label: "Quiz Score", key: "quizScore" },
    { label: "Questions Answered", key: "questionsAnswered" },
    { label: "Homework Submitted", key: "homeworkSubmitted" },
    { label: "Joined", key: "createdAt" },
    { label: "Last Active", key: "lastActive" },
  ];

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return "";
    return sortAsc ? " ↑" : " ↓";
  };

  return (
    <div style={{ padding: "0 0 40px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <h1
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: "var(--color-text)",
            margin: 0,
          }}
        >
          Recruits
        </h1>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--color-text-3)",
            backgroundColor: "var(--color-surface-2)",
            padding: "2px 8px",
            borderRadius: 10,
          }}
        >
          {recruits.length}
        </span>
        <div style={{ flex: 1 }} />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            fontSize: 13,
            padding: "6px 12px",
            borderRadius: 6,
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-surface)",
            color: "var(--color-text)",
            outline: "none",
            width: 240,
          }}
        />
      </div>

      {/* Table */}
      <div
        style={{
          overflowX: "auto",
          borderRadius: 8,
          border: "1px solid var(--color-border)",
          backgroundColor: "var(--color-surface)",
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
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  style={{
                    fontSize: 12,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    color: "var(--color-text-3)",
                    fontWeight: 600,
                    padding: "10px 14px",
                    borderBottom: "1px solid var(--color-border)",
                    textAlign: "left",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    userSelect: "none",
                  }}
                >
                  {col.label}
                  {sortIndicator(col.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => {
              const currentRole = roles[r.id] || r.role;
              const badge = roleBadge(currentRole);
              return (
                <tr
                  key={r.id}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor =
                      "var(--color-surface-2)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor =
                      "transparent";
                  }}
                >
                  <td style={{ padding: "10px 14px", fontSize: 13, color: "var(--color-text)", borderBottom: "1px solid var(--color-border)" }}>
                    <Link
                      href={`/admin/recruits?detail=${r.id}`}
                      style={{ color: "inherit", textDecoration: "none" }}
                    >
                      {r.name}
                    </Link>
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: "var(--color-text-2)", borderBottom: "1px solid var(--color-border)" }}>
                    {r.email}
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 13, borderBottom: "1px solid var(--color-border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          display: "inline-block",
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: 10,
                          backgroundColor: badge.bg,
                          color: badge.color,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {currentRole}
                      </span>
                      <select
                        value={currentRole}
                        disabled={updating === r.id}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleRoleChange(r.id, e.target.value)}
                        style={{
                          fontSize: 11,
                          padding: "1px 4px",
                          borderRadius: 4,
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
                      padding: "10px 14px",
                      fontSize: 13,
                      fontWeight: 600,
                      color: scoreColor(r.quizScore),
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    {r.quizScore !== null ? `${r.quizScore}%` : "--"}
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: "var(--color-text-2)", borderBottom: "1px solid var(--color-border)" }}>
                    {r.questionsAnswered}
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: "var(--color-text-2)", borderBottom: "1px solid var(--color-border)" }}>
                    {r.homeworkSubmitted}
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: "var(--color-text-2)", borderBottom: "1px solid var(--color-border)", whiteSpace: "nowrap" }}>
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: "var(--color-text-2)", borderBottom: "1px solid var(--color-border)", whiteSpace: "nowrap" }}>
                    {relativeTime(r.lastActive)}
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  style={{
                    padding: "40px 14px",
                    fontSize: 13,
                    color: "var(--color-text-3)",
                    textAlign: "center",
                  }}
                >
                  No recruits found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
