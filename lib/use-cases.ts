import { prisma } from "@/lib/prisma";
import type {
  BenchmarkViewer,
  BenchmarkLeaderView,
  BenchmarkRelatedConcept,
} from "@/lib/benchmarks";

/**
 * Use Cases read path ("By Task, with Receipts"). Mirrors lib/benchmarks.ts:
 * thin server-side view models, leaders parsed defensively from the inline Json
 * column, relatedConcepts validated against the live concept catalog at render so
 * a deleted concept never leaves a dead cross-link.
 *
 * The honest-picks-only contract lives here. A pick AUTHORS only (slug, rank(s)),
 * a label, and a caveat; the score / lab / date / flags RESOLVE from the cited
 * Benchmark.leaders by (slug, rank), so a pick can never drift from its board. A
 * pick whose board is not visible to the viewer (a draft board, member-side) or
 * whose ranks fail to resolve DROPS entirely and logs a warning, so absence is
 * never silently presented as authored honesty (the empty=true path is distinct).
 *
 * The explorer group ('answerable' | 'sparse') is derived ONLY from the authored
 * UseCase.honestEmpty flag, never a computed live-board tally, and no "most boards
 * live" string is ever produced. The rail / bottom-line date binds to exactly one
 * named board (bottomLineBenchmarkSlug, or the single yardstick when honestEmpty),
 * never a max-across-picks reduction.
 */

/** The pick verb base map, mirroring TRUST_META. The honest pick's leading verb
 *  is a deterministic function of the cited board's trust tier (plus position and
 *  the self-reported / co-leaders signals resolved at render). */
export const PICK_VERB: Record<string, string> = {
  live: "tops",
  near_ceiling: "leads, but the top is a statistical tie",
  contested: "claims the top of",
  dated: "led as of", // the cited board's MON YYYY is appended at resolve time
};

export type UseCaseBacking = { slug: string; name: string; trust: string };

export type UseCaseCardData = {
  slug: string;
  name: string;
  audienceLine: string;
  honestEmpty: boolean;
  group: "answerable" | "sparse"; // derived ONLY from honestEmpty
  backing: UseCaseBacking[]; // each board's OWN trust (evidence-strip chips), never aggregated
  order: number;
  status: string;
};

export type UseCaseYardstickView = {
  benchmarkSlug: string;
  name: string;
  trust: string;
  trustGloss: string;
  published: boolean; // link only when the board is live
  crossTags: string[]; // names of OTHER use cases this board is central to ("also central to X")
};

export type UseCaseHowToChooseView = {
  goal: string;
  benchmarkSlug: string | null;
  benchmarkName: string | null;
  guidance: string;
  noCleanAnswer: boolean;
  reason: string | null;
};

export type UseCasePickView = {
  label: string;
  benchmarkSlug: string;
  benchmarkName: string;
  trust: string;
  verb: string; // computed from trust tier + position + flags
  empty: boolean; // authored honest-empty pick (no model name)
  datedAnchor: string | null;
  caveat: string;
  whatWasTested: string | null; // required when scaffold
  scaffold: boolean;
  selfReported: boolean;
  coLeaders: boolean; // stamps.length > 1
  stamps: BenchmarkLeaderView[]; // ONE welded ScoreStamp per cited rank
};

export type UseCaseRailAnchor = {
  slug: string;
  name: string;
  trust: string;
  asOfDate: string | null; // ISO; the board's own representative date
};

export type UseCaseDetailData = {
  slug: string;
  name: string;
  audienceLine: string;
  taskLead: string;
  bottomLine: string;
  bottomLineAnchor: UseCaseRailAnchor | null; // the ONE board the bottom line + rail date bind to
  evidenceLine: string;
  yardsticks: UseCaseYardstickView[];
  picks: UseCasePickView[];
  howToChoose: UseCaseHowToChooseView[];
  judgeCriteria: string[];
  watchOut: string;
  watchOutUrl: string | null;
  relatedConcepts: BenchmarkRelatedConcept[];
  honestEmpty: boolean;
  datedAnchor: string | null;
  gapReason: string | null;
  backing: UseCaseBacking[];
  status: string;
};

// ── Defensive Json parsers (the seed authors these shapes; we read them back) ──

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

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

type RawYardstick = { benchmarkSlug: string; trustGloss: string };
function asYardsticks(value: unknown): RawYardstick[] {
  if (!Array.isArray(value)) return [];
  const out: RawYardstick[] = [];
  for (const v of value) {
    if (!v || typeof v !== "object") continue;
    const r = v as Record<string, unknown>;
    if (typeof r.benchmarkSlug !== "string") continue;
    out.push({
      benchmarkSlug: r.benchmarkSlug,
      trustGloss: typeof r.trustGloss === "string" ? r.trustGloss : "",
    });
  }
  return out;
}

type RawPick = {
  label: string;
  benchmarkSlug: string;
  leaderRank?: number;
  leaderRanks?: number[];
  scaffold?: boolean;
  selfReported?: boolean;
  empty?: boolean;
  datedAnchor?: string;
  caveat: string;
  whatWasTested?: string;
};
function asPicks(value: unknown): RawPick[] {
  if (!Array.isArray(value)) return [];
  const out: RawPick[] = [];
  for (const v of value) {
    if (!v || typeof v !== "object") continue;
    const r = v as Record<string, unknown>;
    if (typeof r.benchmarkSlug !== "string" || typeof r.label !== "string") continue;
    out.push({
      label: r.label,
      benchmarkSlug: r.benchmarkSlug,
      leaderRank: typeof r.leaderRank === "number" ? r.leaderRank : undefined,
      leaderRanks: Array.isArray(r.leaderRanks)
        ? r.leaderRanks.filter((n): n is number => typeof n === "number")
        : undefined,
      scaffold: r.scaffold === true,
      selfReported: r.selfReported === true,
      empty: r.empty === true,
      datedAnchor: typeof r.datedAnchor === "string" ? r.datedAnchor : undefined,
      caveat: typeof r.caveat === "string" ? r.caveat : "",
      whatWasTested: typeof r.whatWasTested === "string" ? r.whatWasTested : undefined,
    });
  }
  return out;
}

type RawHowTo = {
  goal: string;
  benchmarkSlug?: string;
  guidance: string;
  noCleanAnswer?: boolean;
  reason?: string;
};
function asHowToChoose(value: unknown): RawHowTo[] {
  if (!Array.isArray(value)) return [];
  const out: RawHowTo[] = [];
  for (const v of value) {
    if (!v || typeof v !== "object") continue;
    const r = v as Record<string, unknown>;
    if (typeof r.goal !== "string" || typeof r.guidance !== "string") continue;
    out.push({
      goal: r.goal,
      benchmarkSlug: typeof r.benchmarkSlug === "string" ? r.benchmarkSlug : undefined,
      guidance: r.guidance,
      noCleanAnswer: r.noCleanAnswer === true,
      reason: typeof r.reason === "string" ? r.reason : undefined,
    });
  }
  return out;
}

// ── Verb + date helpers ───────────────────────────────────────────────────────

const ORDINALS = ["", "first", "second", "third", "fourth", "fifth", "sixth"];
function ordinal(n: number): string {
  return ORDINALS[n] ?? `number ${n}`;
}

/** ISO date -> "MON YYYY" (UTC, uppercased). Empty in, empty out. */
function monYear(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d
    .toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" })
    .toUpperCase();
}

/** The verb is deterministic: co-leaders share, a stale board is past tense, a
 *  self-reported or contested top is a claim, a non-top cite is a plain rank. */
function computeVerb(args: {
  trust: string;
  stamps: BenchmarkLeaderView[];
  coLeaders: boolean;
  isTop: boolean;
  selfReported: boolean;
}): string {
  if (args.coLeaders) return "share the top of";
  const l = args.stamps[0];
  if (!args.isTop) return `ranks ${ordinal(l.rank)} on`;
  if (args.trust === "dated") return `${PICK_VERB.dated} ${monYear(l.asOfDate)}`.trim();
  if (args.selfReported) return PICK_VERB.contested;
  return PICK_VERB[args.trust] ?? "tops";
}

// ── Resolved benchmark shape used internally ──────────────────────────────────

type ResolvedBench = {
  slug: string;
  name: string;
  trust: string;
  status: string;
  leaders: BenchmarkLeaderView[];
  boardLastUpdated: Date | null;
  useCases: string[];
};

/** The board's own representative date: newest leader as-of, else board-last-updated. */
function railDate(b: ResolvedBench): string | null {
  const newest = b.leaders.reduce<string>((acc, l) => (l.asOfDate > acc ? l.asOfDate : acc), "");
  if (newest) return newest;
  return b.boardLastUpdated ? b.boardLastUpdated.toISOString() : null;
}

async function resolveBenches(
  slugs: Set<string>,
  viewer: BenchmarkViewer,
): Promise<Map<string, ResolvedBench>> {
  if (slugs.size === 0) return new Map();
  const rows = await prisma.benchmark.findMany({
    where: { slug: { in: [...slugs] }, ...(viewer.isAdmin ? {} : { status: "published" }) },
    select: {
      slug: true,
      name: true,
      trust: true,
      status: true,
      leaders: true,
      boardLastUpdated: true,
      useCases: true,
    },
  });
  return new Map(
    rows.map((b) => [
      b.slug,
      {
        slug: b.slug,
        name: b.name,
        trust: b.trust,
        status: b.status,
        leaders: asLeaders(b.leaders).sort((x, y) => x.rank - y.rank),
        boardLastUpdated: b.boardLastUpdated,
        useCases: asStringArray(b.useCases),
      } as ResolvedBench,
    ]),
  );
}

// ── Public read functions ─────────────────────────────────────────────────────

/**
 * Every use case the viewer may see, grouped by the authored honestEmpty flag
 * (answerable first, sparse last), then by order then name. Each card's backing
 * chips resolve the yardsticks against benchmarks VISIBLE to the viewer, so a
 * draft board never leaks a chip to a member. No live-board count is ever computed.
 */
export async function getUseCases(viewer: BenchmarkViewer): Promise<UseCaseCardData[]> {
  const rows = await prisma.useCase.findMany({
    where: viewer.isAdmin ? {} : { status: "published" },
    select: {
      slug: true,
      name: true,
      audienceLine: true,
      yardsticks: true,
      honestEmpty: true,
      order: true,
      status: true,
    },
  });

  const parsed = rows.map((r) => ({ row: r, yards: asYardsticks(r.yardsticks) }));
  const slugs = new Set<string>();
  parsed.forEach((p) => p.yards.forEach((y) => slugs.add(y.benchmarkSlug)));
  const benchBySlug = await resolveBenches(slugs, viewer);

  return parsed
    .map(({ row, yards }) => {
      const backing = yards.flatMap<UseCaseBacking>((y) => {
        const b = benchBySlug.get(y.benchmarkSlug);
        return b ? [{ slug: b.slug, name: b.name, trust: b.trust }] : [];
      });
      const group: "answerable" | "sparse" = row.honestEmpty ? "sparse" : "answerable";
      return {
        slug: row.slug,
        name: row.name,
        audienceLine: row.audienceLine,
        honestEmpty: row.honestEmpty,
        group,
        backing,
        order: row.order,
        status: row.status,
      };
    })
    .sort((a, b) => {
      const ga = a.group === "answerable" ? 0 : 1;
      const gb = b.group === "answerable" ? 0 : 1;
      if (ga !== gb) return ga - gb;
      if (a.order !== b.order) return a.order - b.order;
      return a.name.localeCompare(b.name);
    });
}

/**
 * One use case by slug, or null when it does not exist or the viewer cannot see
 * it (drafts are admin-only). Picks resolve their receipts from the cited board's
 * leaders by (slug, rank); a pick that cannot resolve drops and warns. The rail
 * date binds to exactly one named board.
 */
export async function getUseCaseDetail(
  slug: string,
  viewer: BenchmarkViewer,
): Promise<UseCaseDetailData | null> {
  const u = await prisma.useCase.findUnique({ where: { slug } });
  if (!u) return null;
  if (u.status !== "published" && !viewer.isAdmin) return null;

  const yards = asYardsticks(u.yardsticks);
  const picksRaw = asPicks(u.picks);
  const howRaw = asHowToChoose(u.howToChoose);

  // Every referenced board, resolved against what the viewer may see.
  const refSlugs = new Set<string>();
  yards.forEach((y) => refSlugs.add(y.benchmarkSlug));
  picksRaw.forEach((p) => refSlugs.add(p.benchmarkSlug));
  howRaw.forEach((h) => h.benchmarkSlug && refSlugs.add(h.benchmarkSlug));
  if (u.bottomLineBenchmarkSlug) refSlugs.add(u.bottomLineBenchmarkSlug);
  const benchBySlug = await resolveBenches(refSlugs, viewer);

  // Use-case display names (viewer-scoped) for the "also central to X" cross-tags.
  const ucRows = await prisma.useCase.findMany({
    where: viewer.isAdmin ? {} : { status: "published" },
    select: { slug: true, name: true },
  });
  const ucNameBySlug = new Map(ucRows.map((r) => [r.slug, r.name] as const));

  // Backing chips (rail footer): yardsticks joined against visible boards.
  const backing = yards.flatMap<UseCaseBacking>((y) => {
    const b = benchBySlug.get(y.benchmarkSlug);
    return b ? [{ slug: b.slug, name: b.name, trust: b.trust }] : [];
  });

  // Yardstick list (the tests that matter), with the "also central to X" notes.
  const yardsticks = yards.flatMap<UseCaseYardstickView>((y) => {
    const b = benchBySlug.get(y.benchmarkSlug);
    if (!b) return [];
    const crossTags = b.useCases
      .filter((s) => s !== slug)
      .flatMap((s) => {
        const nm = ucNameBySlug.get(s);
        return nm ? [nm] : [];
      });
    return [
      {
        benchmarkSlug: b.slug,
        name: b.name,
        trust: b.trust,
        trustGloss: y.trustGloss,
        published: b.status === "published",
        crossTags,
      },
    ];
  });

  // Picks: resolve one welded stamp per cited rank, or drop (rule 4).
  const picks = picksRaw.flatMap<UseCasePickView>((p) => {
    const b = benchBySlug.get(p.benchmarkSlug);
    if (!b) {
      console.warn(
        `[use-cases] ${slug}: pick "${p.label}" cites board "${p.benchmarkSlug}" that is missing or not visible; dropped`,
      );
      return [];
    }
    if (p.empty) {
      return [
        {
          label: p.label,
          benchmarkSlug: b.slug,
          benchmarkName: b.name,
          trust: b.trust,
          verb: "",
          empty: true,
          datedAnchor: p.datedAnchor ?? null,
          caveat: p.caveat,
          whatWasTested: null,
          scaffold: false,
          selfReported: false,
          coLeaders: false,
          stamps: [],
        },
      ];
    }
    const ranks = Array.isArray(p.leaderRanks)
      ? p.leaderRanks
      : typeof p.leaderRank === "number"
        ? [p.leaderRank]
        : [];
    const stamps = b.leaders.filter((l) => ranks.includes(l.rank));
    if (stamps.length === 0) {
      console.warn(
        `[use-cases] ${slug}: pick "${p.label}" (${p.benchmarkSlug}) resolved no leaders for ranks ${JSON.stringify(ranks)}; dropped`,
      );
      return [];
    }
    const coLeaders = stamps.length > 1;
    const minRank = b.leaders.length ? Math.min(...b.leaders.map((l) => l.rank)) : 1;
    const isTop = stamps.every((s) => s.rank === minRank);
    const selfReported = p.selfReported === true || stamps.some((s) => s.selfReported);
    const verb = computeVerb({ trust: b.trust, stamps, coLeaders, isTop, selfReported });
    return [
      {
        label: p.label,
        benchmarkSlug: b.slug,
        benchmarkName: b.name,
        trust: b.trust,
        verb,
        empty: false,
        datedAnchor: null,
        caveat: p.caveat,
        whatWasTested: p.whatWasTested ?? null,
        scaffold: p.scaffold === true,
        selfReported,
        coLeaders,
        stamps,
      },
    ];
  });

  // How-to-choose branches: a board name only when the board is visible.
  const howToChoose = howRaw.map<UseCaseHowToChooseView>((h) => {
    const b = h.benchmarkSlug ? benchBySlug.get(h.benchmarkSlug) : null;
    return {
      goal: h.goal,
      benchmarkSlug: h.benchmarkSlug ?? null,
      benchmarkName: b ? b.name : null,
      guidance: h.guidance,
      noCleanAnswer: h.noCleanAnswer === true,
      reason: h.reason ?? null,
    };
  });

  // Bottom-line / rail anchor: ONE named board (or the single yardstick when honestEmpty).
  let bottomLineAnchor: UseCaseRailAnchor | null = null;
  const anchorSlug = u.honestEmpty
    ? yards[0]?.benchmarkSlug ?? null
    : u.bottomLineBenchmarkSlug ?? null;
  if (anchorSlug) {
    const b = benchBySlug.get(anchorSlug);
    if (b) {
      bottomLineAnchor = { slug: b.slug, name: b.name, trust: b.trust, asOfDate: railDate(b) };
    }
  }

  // relatedConcepts validated against the live catalog (drop dead links).
  const raw = asRawRelatedConcepts(u.relatedConcepts);
  const conceptSlugs = raw.map((c) => c.slug).filter((s): s is string => Boolean(s));
  const live =
    conceptSlugs.length > 0
      ? await prisma.concept.findMany({ where: { slug: { in: conceptSlugs } }, select: { slug: true } })
      : [];
  const liveSlugs = new Set(live.map((c: { slug: string }) => c.slug));
  const relatedConcepts = raw.flatMap<BenchmarkRelatedConcept>((c) => {
    if (!c.slug) return [{ label: c.label, slug: null }];
    return liveSlugs.has(c.slug) ? [{ label: c.label, slug: c.slug }] : [];
  });

  return {
    slug: u.slug,
    name: u.name,
    audienceLine: u.audienceLine,
    taskLead: u.taskLead,
    bottomLine: u.bottomLine,
    bottomLineAnchor,
    evidenceLine: u.evidenceLine,
    yardsticks,
    picks,
    howToChoose,
    judgeCriteria: asStringArray(u.judgeCriteria),
    watchOut: u.watchOut,
    watchOutUrl: u.watchOutUrl,
    relatedConcepts,
    honestEmpty: u.honestEmpty,
    datedAnchor: u.datedAnchor,
    gapReason: u.gapReason,
    backing,
    status: u.status,
  };
}
