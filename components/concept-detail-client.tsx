"use client";

import { useState, useEffect } from "react";
import { ConceptSidebar } from "@/components/concept-sidebar";
import { ConceptBody } from "@/components/concept-body";
import type { ConceptDetail, SidebarSection } from "@/lib/concepts";

const BOOKMARKS_KEY = "aisa-atlas-bookmarks";

export function ConceptDetailClient({
  concept,
  sections,
}: {
  concept: ConceptDetail;
  sections: SidebarSection[];
}) {
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(BOOKMARKS_KEY);
      if (stored) setBookmarks(new Set(JSON.parse(stored)));
    } catch {}
  }, []);

  const toggleBookmark = (id: string) => {
    setBookmarks((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      try {
        localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "var(--color-bg)",
      }}
    >
      {/* ── Sidebar ───────────────────────────────────────────── */}
      <ConceptSidebar
        sections={sections}
        currentSlug={concept.slug}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* ── Mobile backdrop ───────────────────────────────────── */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            zIndex: 30,
          }}
        />
      )}

      {/* ── Main content ──────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {/* Top bar — only visible on mobile/tablet */}
        <MobileTopBar
          conceptName={concept.name}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <div style={{ flex: 1, overflowY: "auto" }}>
          <ConceptBody
            concept={concept}
            bookmarked={bookmarks.has(concept.id)}
            onToggleBookmark={() => toggleBookmark(concept.id)}
          />
        </div>
      </div>
    </div>
  );
}

function MobileTopBar({
  conceptName,
  onMenuClick,
}: {
  conceptName: string;
  onMenuClick: () => void;
}) {
  return (
    <div
      className="concept-mobile-bar"
      style={{
        display: "none",
        alignItems: "center",
        gap: "12px",
        padding: "0 16px",
        height: "48px",
        borderBottom: "1px solid var(--color-border)",
        backgroundColor: "var(--color-bg)",
        flexShrink: 0,
      }}
    >
      <button
        onClick={onMenuClick}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "4px",
          color: "var(--color-text-2)",
        }}
        aria-label="Open navigation"
      >
        <span style={{ display: "block", width: "16px", height: "1.5px", backgroundColor: "currentColor" }} />
        <span style={{ display: "block", width: "16px", height: "1.5px", backgroundColor: "currentColor" }} />
        <span style={{ display: "block", width: "16px", height: "1.5px", backgroundColor: "currentColor" }} />
      </button>
      <span style={{ fontSize: "13px", color: "var(--color-text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {conceptName}
      </span>
    </div>
  );
}
