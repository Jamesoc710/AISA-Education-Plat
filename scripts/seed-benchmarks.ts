/**
 * Seed the Benchmarks surface ("The Standings"; docs/plans/ongoing/BENCHMARKS_PLAN.md).
 *
 * Surgical + idempotent: upserts prisma/seed-data/benchmarks.ts by slug.
 * New benchmarks are ALWAYS created as drafts (member-invisible); updates never
 * touch status, curatedAt, or contentHash, so an admin publish/curate and the
 * PR2 cron's hash state survive re-runs. Leaders live inline as a Json column,
 * so there is no child table to reconcile. Nothing outside the seeded slugs is
 * ever modified.
 *
 * Modes:
 *   --check            static validation of the seed file only (no DB)
 *   --verify           static + read-only DB cross-check (concept-slug coverage)
 *   --delete a,b,c     delete those benchmark slugs
 *   (default)          validate, cross-check, then upsert
 *
 *   npx tsx --env-file=.env scripts/seed-benchmarks.ts [--check|--verify|--delete slugs]
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { BENCHMARK_SEEDS, type BenchmarkSeed } from "../prisma/seed-data/benchmarks";

// Em dash, en dash, figure dash, horizontal bar: banned in member-facing text.
const BANNED_DASHES = /[‒–—―]/;
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DOMAINS = new Set([
  "Reasoning", "Coding", "Math", "Multimodal", "Human preference", "Agents",
  // v2 use-case roster additions
  "Writing", "Long context", "Multilingual", "Document AI", "Factuality", "Frontend",
]);
const SCORE_TYPES = new Set(["Accuracy", "Elo", "Pass rate", "Composite", "Similarity"]);
const TRUSTS = new Set(["live", "near_ceiling", "contested", "dated"]);

/** All member-facing strings, for the no-dash check (URLs excluded; hyphens are fine). */
function textFields(b: BenchmarkSeed): string[] {
  return [
    b.name,
    b.caveat,
    b.whatItMeasures,
    b.exampleTask ?? "",
    b.whyCare,
    b.scoring,
    b.calibration ?? "",
    b.watchOut,
    b.datedAnchor ?? "",
    ...b.leaders.flatMap((l) => [l.model, l.lab, l.score, l.baselineGloss]),
    ...b.relatedConcepts.map((c) => c.label),
  ];
}

function validateStatic(): string[] {
  const errors: string[] = [];
  const seenSlugs = new Set<string>();

  BENCHMARK_SEEDS.forEach((b, i) => {
    const label = `Benchmark ${i + 1} (${b.slug || "no slug"})`;

    if (!SLUG_RE.test(b.slug)) errors.push(`${label}: slug must be kebab-case`);
    if (seenSlugs.has(b.slug)) errors.push(`${label}: duplicate slug`);
    seenSlugs.add(b.slug);

    if (!b.name.trim()) errors.push(`${label}: empty name`);
    if (!DOMAINS.has(b.domain)) errors.push(`${label}: bad domain ${b.domain}`);
    if (!SCORE_TYPES.has(b.scoreType)) errors.push(`${label}: bad scoreType ${b.scoreType}`);
    if (!TRUSTS.has(b.trust)) errors.push(`${label}: bad trust ${b.trust}`);
    if (typeof b.nearTie !== "boolean") errors.push(`${label}: nearTie must be boolean`);
    if (typeof b.honestEmpty !== "boolean") errors.push(`${label}: honestEmpty must be boolean`);
    if (typeof b.needsRecheck !== "boolean") errors.push(`${label}: needsRecheck must be boolean`);

    if (!b.caveat.trim()) errors.push(`${label}: empty caveat`);
    if (b.caveat.trim().split(/\s+/).length > 5) {
      errors.push(`${label}: caveat should be about four words (got "${b.caveat}")`);
    }
    if (!b.whatItMeasures.trim()) errors.push(`${label}: empty whatItMeasures`);
    if (!b.whyCare.trim()) errors.push(`${label}: empty whyCare`);
    if (!b.scoring.trim()) errors.push(`${label}: empty scoring`);
    if (!b.watchOut.trim()) errors.push(`${label}: empty watchOut`);
    if (b.watchOutUrl && !/^https?:\/\//.test(b.watchOutUrl)) {
      errors.push(`${label}: invalid watchOutUrl ${b.watchOutUrl}`);
    }
    if (b.leaderboardUrl && !/^https?:\/\//.test(b.leaderboardUrl)) {
      errors.push(`${label}: invalid leaderboardUrl ${b.leaderboardUrl}`);
    }
    if (b.boardLastUpdated && !ISO_DATE_RE.test(b.boardLastUpdated)) {
      errors.push(`${label}: boardLastUpdated must be yyyy-mm-dd (got ${b.boardLastUpdated})`);
    }

    // honestEmpty and the leader list are coupled: empty board => a single dated anchor.
    if (b.honestEmpty) {
      if (b.leaders.length > 0) errors.push(`${label}: honestEmpty but leaders is not empty`);
      if (!b.datedAnchor || !b.datedAnchor.trim()) {
        errors.push(`${label}: honestEmpty requires a datedAnchor`);
      }
    } else {
      if (b.leaders.length === 0) errors.push(`${label}: not honestEmpty but has no leaders`);
      if (b.leaders.length > 4) errors.push(`${label}: more than 4 leaders (${b.leaders.length})`);
    }

    b.leaders.forEach((l, j) => {
      const ll = `${label} leader ${j + 1}`;
      if (!Number.isInteger(l.rank) || l.rank < 1) errors.push(`${ll}: rank must be a positive integer`);
      if (!l.model.trim()) errors.push(`${ll}: empty model`);
      if (!l.lab.trim()) errors.push(`${ll}: empty lab`);
      if (!l.score.trim()) errors.push(`${ll}: empty score`);
      if (!l.baselineGloss.trim()) errors.push(`${ll}: empty baselineGloss`);
      if (typeof l.selfReported !== "boolean") errors.push(`${ll}: selfReported must be boolean`);
      if (!ISO_DATE_RE.test(l.asOfDate) || Number.isNaN(Date.parse(l.asOfDate))) {
        errors.push(`${ll}: invalid asOfDate ${l.asOfDate}`);
      }
      if (!/^https?:\/\//.test(l.sourceUrl)) errors.push(`${ll}: invalid sourceUrl ${l.sourceUrl}`);
    });

    b.relatedConcepts.forEach((c, j) => {
      if (!c.label.trim()) errors.push(`${label}: relatedConcept ${j + 1} has empty label`);
      if (c.slug !== undefined && !SLUG_RE.test(c.slug)) {
        errors.push(`${label}: relatedConcept ${c.slug} is not a kebab-case slug`);
      }
    });

    if (textFields(b).some((s) => BANNED_DASHES.test(s))) {
      errors.push(`${label}: contains a banned em/en dash`);
    }
  });

  return errors;
}

function connect(): PrismaClient {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DIRECT_URL or DATABASE_URL must be set");
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}

async function deleteSlugs(prisma: PrismaClient, slugs: string[]): Promise<void> {
  for (const slug of slugs) {
    const row = await prisma.benchmark.findUnique({
      where: { slug },
      select: { id: true, name: true, status: true },
    });
    if (!row) {
      console.warn(`  - ${slug}: not in DB, skipped`);
      continue;
    }
    await prisma.benchmark.delete({ where: { id: row.id } });
    console.log(`  deleted ${slug} ("${row.name}", was ${row.status})`);
  }
}

/** Read-only: validate every mapped concept slug resolves + print coverage. */
async function crossCheck(prisma: PrismaClient): Promise<string[]> {
  const concepts = await prisma.concept.findMany({ select: { slug: true } });
  const catalog = new Set(concepts.map((c: { slug: string }) => c.slug));

  const errors: string[] = [];
  let linked = 0;
  let linkSlots = 0;
  for (const b of BENCHMARK_SEEDS) {
    const withSlug = b.relatedConcepts.filter((c) => c.slug);
    for (const c of withSlug) {
      if (!catalog.has(c.slug!)) {
        errors.push(`${b.slug}: relatedConcept slug "${c.slug}" does not exist in the catalog`);
      }
    }
    const valid = withSlug.filter((c) => catalog.has(c.slug!));
    if (valid.length > 0) linked++;
    linkSlots += valid.length;
  }

  if (errors.length === 0) {
    console.log(
      `  concept-link coverage: ${linked}/${BENCHMARK_SEEDS.length} benchmarks link >=1 concept (${linkSlots} links total, all resolve)`,
    );
  }
  return errors;
}

/** Build the inline leaders Json (strip undefined keys so the value is pure JSON). */
function leadersJson(b: BenchmarkSeed) {
  return b.leaders.map((l) => ({
    rank: l.rank,
    model: l.model,
    lab: l.lab,
    score: l.score,
    baselineGloss: l.baselineGloss,
    asOfDate: l.asOfDate,
    sourceUrl: l.sourceUrl,
    selfReported: l.selfReported,
    ...(l.disputed ? { disputed: true } : {}),
  }));
}

function relatedConceptsJson(b: BenchmarkSeed) {
  return b.relatedConcepts.map((c) => (c.slug ? { label: c.label, slug: c.slug } : { label: c.label }));
}

async function main() {
  const argv = process.argv.slice(2);
  const deleteIdx = argv.indexOf("--delete");
  const mode =
    deleteIdx !== -1
      ? "delete"
      : argv.includes("--check")
        ? "check"
        : argv.includes("--verify")
          ? "verify"
          : "seed";

  console.log("Benchmarks (The Standings):", mode);

  if (mode === "delete") {
    const slugs = (argv[deleteIdx + 1] ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (slugs.length === 0) {
      console.error("x --delete needs a comma-separated slug list");
      process.exit(1);
    }
    const prisma = connect();
    try {
      await deleteSlugs(prisma, slugs);
    } finally {
      await prisma.$disconnect();
    }
    return;
  }

  const errors = validateStatic();
  if (errors.length > 0) {
    console.error(`x static validation failed (${errors.length}):`);
    for (const e of errors) console.error(`    ${e}`);
    process.exit(1);
  }
  const byTrust = BENCHMARK_SEEDS.reduce<Record<string, number>>((acc, b) => {
    acc[b.trust] = (acc[b.trust] ?? 0) + 1;
    return acc;
  }, {});
  const honestEmpty = BENCHMARK_SEEDS.filter((b) => b.honestEmpty).length;
  console.log(`  ${BENCHMARK_SEEDS.length} benchmarks in seed file (trust ${JSON.stringify(byTrust)})`);
  console.log(`  ${honestEmpty} ship honest-empty (no trustworthy current board)`);
  console.log("  static validation passed (enums, leaders/honest-empty coupling, dated leaders, dash-free)");
  if (mode === "check") return;

  const prisma = connect();
  try {
    const dbErrors = await crossCheck(prisma);
    if (dbErrors.length > 0) {
      console.error(`x DB cross-check failed (${dbErrors.length}):`);
      for (const e of dbErrors) console.error(`    ${e}`);
      process.exit(1);
    }

    const existing = await prisma.benchmark.findMany({
      where: { slug: { in: BENCHMARK_SEEDS.map((b) => b.slug) } },
      select: { slug: true, status: true },
    });
    const existingBySlug = new Map(
      existing.map((e: { slug: string; status: string }) => [e.slug, e] as const),
    );

    if (mode === "verify") {
      for (const b of BENCHMARK_SEEDS) {
        const row = existingBySlug.get(b.slug);
        console.log(`  ${b.slug}: ${row ? `in DB (${row.status})` : "not in DB yet"}`);
      }
      console.log("verify complete, no writes performed");
      return;
    }

    // Upsert by slug. status / curatedAt / contentHash set only on create.
    let created = 0;
    let updated = 0;
    for (const b of BENCHMARK_SEEDS) {
      const common = {
        name: b.name,
        domain: b.domain,
        scoreType: b.scoreType,
        trust: b.trust,
        nearTie: b.nearTie,
        caveat: b.caveat,
        whatItMeasures: b.whatItMeasures,
        exampleTask: b.exampleTask ?? null,
        whyCare: b.whyCare,
        scoring: b.scoring,
        calibration: b.calibration ?? null,
        watchOut: b.watchOut,
        watchOutUrl: b.watchOutUrl ?? null,
        leaders: leadersJson(b),
        leaderboardUrl: b.leaderboardUrl ?? null,
        boardLastUpdated: b.boardLastUpdated ? new Date(b.boardLastUpdated) : null,
        honestEmpty: b.honestEmpty,
        datedAnchor: b.datedAnchor ?? null,
        needsRecheck: b.needsRecheck,
        relatedConcepts: relatedConceptsJson(b),
        sources: b.sources,
        syncedAt: new Date(),
      };
      const row = await prisma.benchmark.upsert({
        where: { slug: b.slug },
        create: { slug: b.slug, status: "draft", ...common },
        update: common, // never touches status / curatedAt / contentHash
        select: { status: true },
      });
      if (existingBySlug.has(b.slug)) updated++;
      else created++;
      console.log(
        `  ${b.slug} (${row.status}, ${b.trust}, ${b.leaders.length} leaders${b.honestEmpty ? ", honest-empty" : ""})`,
      );
    }

    console.log(`Benchmarks seeded: ${created} created, ${updated} updated.`);
    const drafts = await prisma.benchmark.count({ where: { status: "draft" } });
    const published = await prisma.benchmark.count({ where: { status: "published" } });
    console.log(`   Surface now holds ${published} published + ${drafts} draft benchmarks.`);
    if (created > 0) {
      console.log("   New benchmarks are drafts: publish them from the admin Benchmarks card when ready.");
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
