import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

/**
 * Benchmarks data layer ("The Standings"). Mirrors lib/trends.ts plus the
 * digest-view serialization pattern: thin server-side view models with Dates
 * converted to ISO strings, leaders parsed defensively from the inline Json
 * column, and relatedConcepts validated against the live catalog at render time
 * so a deleted concept never leaves a dead cross-link.
 *
 * Visibility rule: members and logged-out visitors only ever see PUBLISHED
 * benchmarks. ADMINs also see drafts (with a Draft chip) so they can spot-check
 * before publishing. Benchmarks are global, not Track-scoped.
 *
 * Freshness in static v1 is a per-benchmark date-vs-date comparison (the board's
 * own last-updated date against the render date), NOT the cron staleness banner
 * (there is no live syncedAt to trust yet; that arrives with PR2).
 */

// Canonical trust-axis order: the single live board, then the saturated cluster,
// then the contested numbers, then the boards with no trustworthy current data.
const TRUST_ORDER: Record<string, number> = {
  live: 0,
  near_ceiling: 1,
  contested: 2,
  dated: 3,
};

// A board counts as "may be behind" when its last-updated date is more than this
// far before the render date. Used only for benchmarks with a live leader panel.
const STALE_BOARD_MS = 30 * 24 * 60 * 60 * 1000;

export type BenchmarkViewer = { isAdmin: boolean };

export type BenchmarkLeaderView = {
  rank: number;
  model: string;
  lab: string;
  score: string; // verbatim free-text (intervals, cost caveats preserved)
  baselineGloss: string;
  asOfDate: string; // ISO
  sourceUrl: string;
  selfReported: boolean;
  disputed: boolean;
};

export type BenchmarkRelatedConcept = {
  label: string;
  slug: string | null;
};

export type BenchmarkCardData = {
  slug: string;
  name: string;
  domain: string;
  scoreType: string;
  trust: string;
  nearTie: boolean;
  caveat: string;
  whatItMeasures: string; // full text; the list row shows the first sentence
  honestEmpty: boolean;
  status: string; // draft | published
};

export type BenchmarkDetailData = BenchmarkCardData & {
  exampleTask: string | null;
  whyCare: string;
  scoring: string;
  calibration: string | null;
  watchOut: string;
  watchOutUrl: string | null;
  needsRecheck: boolean;
  leaders: BenchmarkLeaderView[];
  leaderboardUrl: string | null;
  boardLastUpdated: string | null; // ISO; null when the board shows no date
  boardBehind: boolean; // board last-updated is well before the render date
  datedAnchor: string | null; // honest-empty single anchor
  relatedConcepts: BenchmarkRelatedConcept[];
  sources: string[];
};

/** Parse the leaders Json column ([{ rank, model, lab, score, ... }]) defensively. */
function asLeaders(value: unknown): BenchmarkLeaderView[] {
  if (!Array.isArray(value)) return [];
  const out: BenchmarkLeaderView[] = [];
  for (const v of value) {
    if (!v || typeof v !== "object") continue;
    const r = v as Record<string, unknown>;
    if (typeof r.model !== "string" || typeof r.score !== "string") continue;
    out.push({
      rank: typeof r.rank === "number" ? r.rank : 0,
      model: r.model,
      lab: typeof r.lab === "string" ? r.lab : "",
      score: r.score,
      baselineGloss: typeof r.baselineGloss === "string" ? r.baselineGloss : "",
      asOfDate: typeof r.asOfDate === "string" ? r.asOfDate : "",
      sourceUrl: typeof r.sourceUrl === "string" ? r.sourceUrl : "",
      selfReported: r.selfReported === true,
      disputed: r.disputed === true,
    });
  }
  return out;
}

/** Raw [{ label, slug? }] from the Json column, before catalog validation. */
function asRawRelatedConcepts(value: unknown): { label: string; slug: string | null }[] {
  if (!Array.isArray(value)) return [];
  const out: { label: string; slug: string | null }[] = [];
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

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

/** Resolve whether the signed-in user is an ADMIN (false when logged out). */
export async function getBenchmarkViewer(): Promise<BenchmarkViewer> {
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

type BenchmarkCardRow = {
  slug: string;
  name: string;
  domain: string;
  scoreType: string;
  trust: string;
  nearTie: boolean;
  caveat: string;
  whatItMeasures: string;
  honestEmpty: boolean;
  status: string;
};

/** All benchmarks the viewer may see, ordered down the trust axis then by name. */
export async function getBenchmarks(viewer: BenchmarkViewer): Promise<BenchmarkCardData[]> {
  const rows = await prisma.benchmark.findMany({
    where: viewer.isAdmin ? {} : { status: "published" },
    select: {
      slug: true,
      name: true,
      domain: true,
      scoreType: true,
      trust: true,
      nearTie: true,
      caveat: true,
      whatItMeasures: true,
      honestEmpty: true,
      status: true,
    },
  });
  return rows
    .map((b: BenchmarkCardRow) => ({
      slug: b.slug,
      name: b.name,
      domain: b.domain,
      scoreType: b.scoreType,
      trust: b.trust,
      nearTie: b.nearTie,
      caveat: b.caveat,
      whatItMeasures: b.whatItMeasures,
      honestEmpty: b.honestEmpty,
      status: b.status,
    }))
    .sort((a, b) => {
      const ta = TRUST_ORDER[a.trust] ?? 99;
      const tb = TRUST_ORDER[b.trust] ?? 99;
      if (ta !== tb) return ta - tb;
      return a.name.localeCompare(b.name);
    });
}

/**
 * One benchmark by slug, or null when it doesn't exist or the viewer isn't
 * allowed to see it (drafts are admin-only). Leaders are sorted by rank; tied
 * ranks keep their authored order. relatedConcepts are validated against the
 * live catalog so a deleted concept drops out instead of dead-linking.
 */
export async function getBenchmarkDetail(
  slug: string,
  viewer: BenchmarkViewer,
): Promise<BenchmarkDetailData | null> {
  const b = await prisma.benchmark.findUnique({ where: { slug } });
  if (!b) return null;
  if (b.status !== "published" && !viewer.isAdmin) return null;

  const leaders = asLeaders(b.leaders).sort((x, y) => x.rank - y.rank);

  // Resolve relatedConcepts against the live catalog: keep label-only entries,
  // drop slug entries whose concept has been deleted, keep the rest with a link.
  const raw = asRawRelatedConcepts(b.relatedConcepts);
  const slugs = raw.map((c) => c.slug).filter((s): s is string => Boolean(s));
  const live =
    slugs.length > 0
      ? await prisma.concept.findMany({ where: { slug: { in: slugs } }, select: { slug: true } })
      : [];
  const liveSlugs = new Set(live.map((c: { slug: string }) => c.slug));
  const relatedConcepts = raw.flatMap<BenchmarkRelatedConcept>((c) => {
    if (!c.slug) return [{ label: c.label, slug: null }];
    return liveSlugs.has(c.slug) ? [{ label: c.label, slug: c.slug }] : [];
  });

  // Static-v1 freshness: compare the board's own last-updated date to the render
  // date. Computed server-side (force-dynamic) so the client never runs Date.now.
  const boardLastUpdated = b.boardLastUpdated ?? null;
  const boardBehind =
    !b.honestEmpty && boardLastUpdated
      ? Date.now() - boardLastUpdated.getTime() > STALE_BOARD_MS
      : false;

  return {
    slug: b.slug,
    name: b.name,
    domain: b.domain,
    scoreType: b.scoreType,
    trust: b.trust,
    nearTie: b.nearTie,
    caveat: b.caveat,
    whatItMeasures: b.whatItMeasures,
    honestEmpty: b.honestEmpty,
    status: b.status,
    exampleTask: b.exampleTask,
    whyCare: b.whyCare,
    scoring: b.scoring,
    calibration: b.calibration,
    watchOut: b.watchOut,
    watchOutUrl: b.watchOutUrl,
    needsRecheck: b.needsRecheck,
    leaders,
    leaderboardUrl: b.leaderboardUrl,
    boardLastUpdated: boardLastUpdated ? boardLastUpdated.toISOString() : null,
    boardBehind,
    datedAnchor: b.datedAnchor,
    relatedConcepts,
    sources: asStringArray(b.sources),
  };
}
