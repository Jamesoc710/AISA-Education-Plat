import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

/**
 * Trend Tracker data layer.
 *
 * Visibility rule: members and logged-out visitors only ever see PUBLISHED
 * trends. ADMINs also see drafts (so they can spot-check before publishing);
 * drafts carry a Draft chip on the card + detail page. Trends are global
 * (categorized AI/Tech/Capital), not Track-scoped.
 */

const STALE_AFTER_MS = 36 * 60 * 60 * 1000; // staleness banner threshold (spec 7.2)

export type TrendViewer = { isAdmin: boolean };

export type TrendRelatedConcept = {
  label: string;
  slug: string | null;
};

export type TrendStory = {
  headline: string;
  whyItMatters: string;
  sourceUrl: string | null;
  sourceDomain: string | null;
  date: string; // ISO
};

export type TrendCardData = {
  slug: string;
  name: string;
  category: string;
  momentum: number;
  momentumLabel: string;
  direction: string;
  whatsHappening: string;
  status: string; // draft | published
  conceptCount: number; // # of related concepts that link to the catalog
  syncedAt: string; // ISO; drives the list staleness banner
};

export type TrendDetailData = TrendCardData & {
  whatItIs: string;
  confidence: string;
  syncedAt: string; // ISO
  isStale: boolean;
  relatedConcepts: TrendRelatedConcept[];
  topStories: TrendStory[];
};

/** Parse the relatedConcepts Json column ([{ label, slug? }]) defensively. */
function asRelatedConcepts(value: unknown): TrendRelatedConcept[] {
  if (!Array.isArray(value)) return [];
  const out: TrendRelatedConcept[] = [];
  for (const v of value) {
    if (v && typeof v === "object") {
      const rec = v as { label?: unknown; slug?: unknown };
      if (typeof rec.label === "string" && rec.label.trim()) {
        out.push({
          label: rec.label,
          slug: typeof rec.slug === "string" && rec.slug.trim() ? rec.slug : null,
        });
      }
    }
  }
  return out;
}

function countLinked(value: unknown): number {
  return asRelatedConcepts(value).filter((c) => c.slug).length;
}

/** Resolve whether the signed-in user is an ADMIN (false when logged out). */
export async function getTrendViewer(): Promise<TrendViewer> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return { isAdmin: false };

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { role: true },
  });
  return { isAdmin: user?.role === "ADMIN" };
}

type TrendRow = {
  slug: string;
  name: string;
  category: string;
  momentum: number;
  momentumLabel: string;
  direction: string;
  whatsHappening: string;
  status: string;
  relatedConcepts: unknown;
  syncedAt: Date;
};

/** All trends the viewer may see, strongest momentum first. */
export async function getTrends(viewer: TrendViewer): Promise<TrendCardData[]> {
  const trends = await prisma.trend.findMany({
    where: viewer.isAdmin ? {} : { status: "published" },
    orderBy: [{ momentum: "desc" }, { name: "asc" }],
    select: {
      slug: true,
      name: true,
      category: true,
      momentum: true,
      momentumLabel: true,
      direction: true,
      whatsHappening: true,
      status: true,
      relatedConcepts: true,
      syncedAt: true,
    },
  });
  return trends.map((t: TrendRow) => ({
    slug: t.slug,
    name: t.name,
    category: t.category,
    momentum: t.momentum,
    momentumLabel: t.momentumLabel,
    direction: t.direction,
    whatsHappening: t.whatsHappening,
    status: t.status,
    conceptCount: countLinked(t.relatedConcepts),
    syncedAt: t.syncedAt.toISOString(),
  }));
}

/**
 * One trend by slug, or null when it doesn't exist or the viewer isn't allowed
 * to see it (drafts are admin-only). Top stories newest first.
 */
export async function getTrendDetail(
  slug: string,
  viewer: TrendViewer,
): Promise<TrendDetailData | null> {
  const trend = await prisma.trend.findUnique({
    where: { slug },
    include: { updates: { orderBy: { date: "desc" } } },
  });
  if (!trend) return null;
  if (trend.status !== "published" && !viewer.isAdmin) return null;

  type UpdateRow = (typeof trend.updates)[number];
  const syncedAt = trend.syncedAt;
  return {
    slug: trend.slug,
    name: trend.name,
    category: trend.category,
    momentum: trend.momentum,
    momentumLabel: trend.momentumLabel,
    direction: trend.direction,
    whatsHappening: trend.whatsHappening,
    status: trend.status,
    conceptCount: countLinked(trend.relatedConcepts),
    whatItIs: trend.whatItIs,
    confidence: trend.confidence,
    syncedAt: syncedAt.toISOString(),
    isStale: Date.now() - syncedAt.getTime() > STALE_AFTER_MS,
    relatedConcepts: asRelatedConcepts(trend.relatedConcepts),
    topStories: trend.updates.map((u: UpdateRow) => ({
      headline: u.headline,
      whyItMatters: u.whyItMatters,
      sourceUrl: u.sourceUrl,
      sourceDomain: u.sourceDomain,
      date: u.date.toISOString(),
    })),
  };
}
