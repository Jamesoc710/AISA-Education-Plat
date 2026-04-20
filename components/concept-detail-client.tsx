"use client";

import { useEffect, useMemo, useState } from "react";
import { ConceptBody } from "@/components/concept-body";
import { ConceptSectionNav } from "@/components/concept-section-nav";
import { ConceptPager } from "@/components/concept-pager";
import type { ConceptDetail, SidebarSection } from "@/lib/concepts";

const BOOKMARKS_KEY = "aisa-atlas-bookmarks";

/**
 * Concept detail client.
 *
 * Lives inside the (main) shell — so the global sidebar + top chrome are
 * supplied by MainShell. This component owns the content card + the
 * right-rail "More in section" nav + bottom prev/next pager.
 */
export function ConceptDetailClient({
  concept,
  sections,
}: {
  concept: ConceptDetail;
  sections: SidebarSection[];
}) {
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());

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

  const { siblings, prev, next } = useMemo(() => {
    const section = sections.find((s) => s.id === concept.section.id);
    const list = section?.concepts ?? [];
    const idx = list.findIndex((c) => c.slug === concept.slug);
    return {
      siblings: list,
      prev: idx > 0 ? list[idx - 1] : null,
      next: idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null,
    };
  }, [sections, concept.section.id, concept.slug]);

  return (
    <div
      className="concept-shell concept-shell-padding"
      style={{
        maxWidth: 1320,
        margin: "0 auto",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <ConceptBody
          concept={concept}
          bookmarked={bookmarks.has(concept.id)}
          onToggleBookmark={() => toggleBookmark(concept.id)}
        />
        <ConceptPager prev={prev} next={next} />
      </div>

      <ConceptSectionNav
        sectionName={concept.section.name}
        sectionSlug={concept.section.slug}
        siblings={siblings}
        currentSlug={concept.slug}
      />
    </div>
  );
}
