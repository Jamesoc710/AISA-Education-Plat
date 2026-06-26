"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SectionEyebrow, ArrowRight } from "@/components/ui/editorial";
import { DropRow } from "@/components/team-hq/drop-row";
import type { DropView } from "@/lib/team-data";

/**
 * Worth a read: a team bulletin. Members post a link from the team's world with
 * a one-line take; the module blends in a system trend/news auto-floor so it is
 * never blank. The full reverse-chron archive lives at /teams/[slug]/drops.
 */
export function WorthARead({
  teamSlug,
  drops,
  hasMore,
  memberDropCount,
  isLoggedIn,
}: {
  teamSlug: string;
  drops: DropView[];
  hasMore: boolean;
  memberDropCount: number;
  isLoggedIn: boolean;
}) {
  const [composerOpen, setComposerOpen] = useState(false);

  return (
    <section>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: "var(--space-4)",
        }}
      >
        <SectionEyebrow>Worth a read</SectionEyebrow>
        {isLoggedIn ? (
          <button
            type="button"
            onClick={() => setComposerOpen((v) => !v)}
            style={triggerStyle}
          >
            {composerOpen ? "Close" : "+ add a link"}
          </button>
        ) : (
          <Link href={`/login?redirect=/teams/${teamSlug}`} style={triggerStyle}>
            + add a link
          </Link>
        )}
      </div>

      {composerOpen && (
        <Composer
          teamSlug={teamSlug}
          onPosted={() => setComposerOpen(false)}
          onCancel={() => setComposerOpen(false)}
        />
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-3)",
          marginTop: "var(--space-4)",
        }}
      >
        {drops.map((d) => (
          <DropRow key={d.id} drop={d} teamSlug={teamSlug} isLoggedIn={isLoggedIn} />
        ))}
      </div>

      {memberDropCount === 0 && (
        <p
          style={{
            margin: "var(--space-4) 0 0",
            fontSize: "var(--text-base)",
            color: "var(--color-text-2)",
            lineHeight: 1.5,
          }}
        >
          Be the first to share a link this week.
        </p>
      )}

      {hasMore && (
        <div style={{ marginTop: "var(--space-4)" }}>
          <Link
            href={`/teams/${teamSlug}/drops`}
            className="editorial-link"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--space-2)",
              fontSize: "var(--text-base)",
              fontWeight: 600,
              color: "var(--color-accent)",
              textDecoration: "none",
            }}
          >
            See all reads
            <ArrowRight />
          </Link>
        </div>
      )}
    </section>
  );
}

const triggerStyle = {
  border: "none",
  background: "none",
  padding: 0,
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: "var(--text-base)",
  fontWeight: 600,
  color: "var(--color-accent)",
  textDecoration: "none",
  whiteSpace: "nowrap",
} as const;

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-2)",
  backgroundColor: "var(--color-surface)",
  color: "var(--color-text)",
  fontFamily: "inherit",
  fontSize: "var(--text-base)",
} as const;

function Composer({
  teamSlug,
  onPosted,
  onCancel,
}: {
  teamSlug: string;
  onPosted: () => void;
  onCancel: () => void;
}) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const post = async () => {
    setErr(null);
    if (!url.trim() || !title.trim() || !note.trim()) {
      setErr("Add a link, a headline, and your take.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/teams/${teamSlug}/drops`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, title, note }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(j.error || "Could not post that.");
        return;
      }
      setUrl("");
      setTitle("");
      setNote("");
      onPosted();
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-3)",
        marginTop: "var(--space-4)",
        padding: "18px",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-3)",
        backgroundColor: "var(--color-surface)",
      }}
    >
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Paste a link (https://...)"
        style={inputStyle}
      />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Headline"
        style={inputStyle}
      />
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="What's the take?"
        style={inputStyle}
      />
      {err && (
        <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-incorrect)" }}>
          {err}
        </p>
      )}
      <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center" }}>
        <button
          type="button"
          onClick={post}
          disabled={busy}
          style={{
            padding: "9px 18px",
            borderRadius: "var(--radius-2)",
            border: "none",
            cursor: busy ? "default" : "pointer",
            fontFamily: "inherit",
            fontSize: "var(--text-base)",
            fontWeight: 600,
            color: "#fff",
            backgroundColor: "var(--color-accent)",
            opacity: busy ? 0.7 : 1,
          }}
        >
          {busy ? "Posting" : "Post"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            border: "none",
            background: "none",
            padding: 0,
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: "var(--text-base)",
            fontWeight: 500,
            color: "var(--color-text-2)",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
