"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * The masthead Join / Member state. Joining and leaving are intentional and
 * write a TeamMembership row; this is decoupled from the content-lens cookie
 * (setting the lens is a separate action and is not joining).
 */
export function TeamJoinButton({
  teamSlug,
  isMember,
  isLoggedIn,
}: {
  teamSlug: string;
  isMember: boolean;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const act = async (path: "join" | "leave") => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/teams/${teamSlug}/${path}`, { method: "POST" });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <Link href={`/login?redirect=/teams/${teamSlug}`} style={solidBtn}>
        Sign in to join
      </Link>
    );
  }

  if (isMember) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "6px 14px",
            borderRadius: 999,
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            color: "var(--color-accent)",
            border: "1px solid var(--color-accent)",
            whiteSpace: "nowrap",
          }}
        >
          Member
        </span>
        <button type="button" onClick={() => act("leave")} disabled={busy} style={quietBtn}>
          Leave
        </button>
      </div>
    );
  }

  return (
    <button type="button" onClick={() => act("join")} disabled={busy} style={solidBtn}>
      Join this team
    </button>
  );
}

const solidBtn = {
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
  textDecoration: "none",
  whiteSpace: "nowrap",
} as const;

const quietBtn = {
  border: "none",
  background: "none",
  padding: 0,
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: "var(--text-sm)",
  fontWeight: 500,
  color: "var(--color-text-2)",
} as const;
