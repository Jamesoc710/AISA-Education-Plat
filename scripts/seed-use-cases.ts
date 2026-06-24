/**
 * Seed the Use Cases surface ("By Task, with Receipts";
 * docs/plans/ongoing/BENCHMARKS_USE_CASES_BUILD_PLAN.md).
 *
 * Surgical + idempotent: upserts prisma/seed-data/use-cases.ts by slug. New use
 * cases are ALWAYS created as drafts (member-invisible); updates never touch
 * status, so an admin publish survives re-runs. Nothing outside the seeded slugs
 * is ever modified.
 *
 * Verify cross-checks (the five locked by the adversarial verifier, section 5.5):
 *   (a) every yardstick / pick / howToChoose / bottomLineBenchmarkSlug exists in BENCHMARK_SEEDS
 *   (b) every pick leaderRank / leaderRanks resolves on that board, or the pick is empty=true
 *   (c) every scaffold=true pick carries a non-empty whatWasTested
 *   (d) every pick carries a non-empty caveat
 *   (e) every honestEmpty=true use case carries a non-empty gapReason
 * plus: slug kebab-case + in USE_CASE_SLUGS, no banned dashes, and (DB) every
 * relatedConcept slug resolves against the live catalog.
 *
 *   npx tsx --env-file=.env scripts/seed-use-cases.ts [--check|--verify|--delete slugs]
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  USE_CASE_SEEDS,
  USE_CASE_SLUGS,
  type UseCaseSeed,
} from "../prisma/seed-data/use-cases";
import { BENCHMARK_SEEDS, type BenchmarkSeed } from "../prisma/seed-data/benchmarks";

// Em dash, en dash, figure dash, horizontal bar: banned in member-facing text.
const BANNED_DASHES = /[‒–—―]/;
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// Benchmark catalog (static, from the seed file) for the (a) and (b) cross-checks.
const BENCH_BY_SLUG = new Map<string, BenchmarkSeed>(
  BENCHMARK_SEEDS.map((b) => [b.slug, b] as const),
);
const BENCH_RANKS = new Map<string, Set<number>>(
  BENCHMARK_SEEDS.map((b) => [b.slug, new Set(b.leaders.map((l) => l.rank))] as const),
);

/** Ranks a pick cites: leaderRanks if set, else [leaderRank], else []. */
function citedRanks(p: UseCaseSeed["picks"][number]): number[] {
  if (Array.isArray(p.leaderRanks)) return p.leaderRanks;
  if (typeof p.leaderRank === "number") return [p.leaderRank];
  return [];
}

/** All member-facing strings, for the no-dash check (URLs excluded; hyphens are fine). */
function textFields(u: UseCaseSeed): string[] {
  return [
    u.name,
    u.audienceLine,
    u.taskLead,
    u.bottomLine,
    u.evidenceLine,
    u.watchOut,
    u.datedAnchor ?? "",
    u.gapReason ?? "",
    ...u.yardsticks.map((y) => y.trustGloss),
    ...u.picks.flatMap((p) => [p.label, p.caveat, p.datedAnchor ?? "", p.whatWasTested ?? ""]),
    ...u.howToChoose.flatMap((h) => [h.goal, h.guidance, h.reason ?? ""]),
    ...(u.judgeCriteria ?? []),
    ...(u.relatedConcepts ?? []).map((c) => c.label),
  ];
}

function validateStatic(): string[] {
  const errors: string[] = [];
  const seenSlugs = new Set<string>();

  USE_CASE_SEEDS.forEach((u, i) => {
    const label = `UseCase ${i + 1} (${u.slug || "no slug"})`;

    if (!SLUG_RE.test(u.slug)) errors.push(`${label}: slug must be kebab-case`);
    if (!USE_CASE_SLUGS.has(u.slug)) errors.push(`${label}: slug not in USE_CASE_SLUGS`);
    if (seenSlugs.has(u.slug)) errors.push(`${label}: duplicate slug`);
    seenSlugs.add(u.slug);

    if (!u.name.trim()) errors.push(`${label}: empty name`);
    if (!u.audienceLine.trim()) errors.push(`${label}: empty audienceLine`);
    if (!u.taskLead.trim()) errors.push(`${label}: empty taskLead`);
    if (!u.bottomLine.trim()) errors.push(`${label}: empty bottomLine`);
    if (!u.evidenceLine.trim()) errors.push(`${label}: empty evidenceLine`);
    if (!u.watchOut.trim()) errors.push(`${label}: empty watchOut`);
    if (typeof u.honestEmpty !== "boolean") errors.push(`${label}: honestEmpty must be boolean`);
    if (typeof u.order !== "number") errors.push(`${label}: order must be a number`);
    if (u.watchOutUrl && !/^https?:\/\//.test(u.watchOutUrl)) {
      errors.push(`${label}: invalid watchOutUrl ${u.watchOutUrl}`);
    }

    // (e) honest-empty requires a gapReason; the bottom line binds to no board.
    if (u.honestEmpty) {
      if (!u.gapReason || !u.gapReason.trim()) {
        errors.push(`${label}: honestEmpty requires a non-empty gapReason`);
      }
      if (u.bottomLineBenchmarkSlug) {
        errors.push(`${label}: honestEmpty must not set bottomLineBenchmarkSlug`);
      }
      if (!u.judgeCriteria || u.judgeCriteria.length === 0) {
        errors.push(`${label}: honestEmpty should author judge-it-yourself criteria`);
      }
    } else if (!u.bottomLineBenchmarkSlug) {
      errors.push(`${label}: a non-honestEmpty use case must bind bottomLineBenchmarkSlug to one board`);
    }

    // (a) bottomLineBenchmarkSlug resolves.
    if (u.bottomLineBenchmarkSlug && !BENCH_BY_SLUG.has(u.bottomLineBenchmarkSlug)) {
      errors.push(`${label}: bottomLineBenchmarkSlug "${u.bottomLineBenchmarkSlug}" not in BENCHMARK_SEEDS`);
    }

    // Yardsticks: ordered, resolve (a), non-empty gloss.
    if (u.yardsticks.length === 0) errors.push(`${label}: needs at least one yardstick`);
    u.yardsticks.forEach((y, j) => {
      const yl = `${label} yardstick ${j + 1}`;
      if (!BENCH_BY_SLUG.has(y.benchmarkSlug)) {
        errors.push(`${yl}: benchmarkSlug "${y.benchmarkSlug}" not in BENCHMARK_SEEDS`);
      }
      if (!y.trustGloss.trim()) errors.push(`${yl}: empty trustGloss`);
    });

    // Picks: (a) slug resolves, (b) ranks resolve or empty, (c) scaffold whatWasTested, (d) caveat.
    u.picks.forEach((p, j) => {
      const pl = `${label} pick ${j + 1}`;
      if (!p.label.trim()) errors.push(`${pl}: empty label`);
      if (!p.caveat.trim()) errors.push(`${pl}: empty caveat (every pick needs one)`); // (d)
      if (!BENCH_BY_SLUG.has(p.benchmarkSlug)) {
        errors.push(`${pl}: benchmarkSlug "${p.benchmarkSlug}" not in BENCHMARK_SEEDS`); // (a)
      }
      if (p.scaffold && !(p.whatWasTested && p.whatWasTested.trim())) {
        errors.push(`${pl}: scaffold pick requires a non-empty whatWasTested`); // (c)
      }
      const ranks = citedRanks(p);
      if (p.empty) {
        if (ranks.length > 0) errors.push(`${pl}: empty pick must not cite a leader rank`);
      } else {
        if (ranks.length === 0) {
          errors.push(`${pl}: non-empty pick must cite leaderRank or leaderRanks (or set empty=true)`);
        }
        const boardRanks = BENCH_RANKS.get(p.benchmarkSlug);
        for (const r of ranks) {
          if (!boardRanks || !boardRanks.has(r)) {
            errors.push(`${pl}: leader rank ${r} does not exist on "${p.benchmarkSlug}"`); // (b)
          }
        }
      }
    });

    // How-to-choose branches: (a) slug resolves; noCleanAnswer needs a reason.
    u.howToChoose.forEach((h, j) => {
      const hl = `${label} howToChoose ${j + 1}`;
      if (!h.goal.trim()) errors.push(`${hl}: empty goal`);
      if (!h.guidance.trim()) errors.push(`${hl}: empty guidance`);
      if (h.benchmarkSlug && !BENCH_BY_SLUG.has(h.benchmarkSlug)) {
        errors.push(`${hl}: benchmarkSlug "${h.benchmarkSlug}" not in BENCHMARK_SEEDS`); // (a)
      }
      if (h.noCleanAnswer && !(h.reason && h.reason.trim())) {
        errors.push(`${hl}: noCleanAnswer branch needs a reason`);
      }
    });

    (u.relatedConcepts ?? []).forEach((c, j) => {
      if (!c.label.trim()) errors.push(`${label}: relatedConcept ${j + 1} has empty label`);
      if (c.slug !== undefined && !SLUG_RE.test(c.slug)) {
        errors.push(`${label}: relatedConcept ${c.slug} is not a kebab-case slug`);
      }
    });

    if (textFields(u).some((s) => BANNED_DASHES.test(s))) {
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
    const row = await prisma.useCase.findUnique({
      where: { slug },
      select: { id: true, name: true, status: true },
    });
    if (!row) {
      console.warn(`  - ${slug}: not in DB, skipped`);
      continue;
    }
    await prisma.useCase.delete({ where: { id: row.id } });
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
  for (const u of USE_CASE_SEEDS) {
    const withSlug = (u.relatedConcepts ?? []).filter((c) => c.slug);
    for (const c of withSlug) {
      if (!catalog.has(c.slug!)) {
        errors.push(`${u.slug}: relatedConcept slug "${c.slug}" does not exist in the catalog`);
      }
    }
    const valid = withSlug.filter((c) => catalog.has(c.slug!));
    if (valid.length > 0) linked++;
    linkSlots += valid.length;
  }

  if (errors.length === 0) {
    console.log(
      `  concept-link coverage: ${linked}/${USE_CASE_SEEDS.length} use cases link >=1 concept (${linkSlots} links total, all resolve)`,
    );
  }
  return errors;
}

// ── Json builders (strip undefined keys so the value is pure JSON) ─────────────

function yardsticksJson(u: UseCaseSeed) {
  return u.yardsticks.map((y) => ({ benchmarkSlug: y.benchmarkSlug, trustGloss: y.trustGloss }));
}

function picksJson(u: UseCaseSeed) {
  return u.picks.map((p) => ({
    label: p.label,
    benchmarkSlug: p.benchmarkSlug,
    ...(typeof p.leaderRank === "number" ? { leaderRank: p.leaderRank } : {}),
    ...(Array.isArray(p.leaderRanks) ? { leaderRanks: p.leaderRanks } : {}),
    ...(p.scaffold ? { scaffold: true } : {}),
    ...(p.selfReported ? { selfReported: true } : {}),
    ...(p.empty ? { empty: true } : {}),
    ...(p.datedAnchor ? { datedAnchor: p.datedAnchor } : {}),
    caveat: p.caveat,
    ...(p.whatWasTested ? { whatWasTested: p.whatWasTested } : {}),
  }));
}

function howToChooseJson(u: UseCaseSeed) {
  return u.howToChoose.map((h) => ({
    goal: h.goal,
    ...(h.benchmarkSlug ? { benchmarkSlug: h.benchmarkSlug } : {}),
    guidance: h.guidance,
    ...(h.noCleanAnswer ? { noCleanAnswer: true } : {}),
    ...(h.reason ? { reason: h.reason } : {}),
  }));
}

function relatedConceptsJson(u: UseCaseSeed) {
  return (u.relatedConcepts ?? []).map((c) =>
    c.slug ? { label: c.label, slug: c.slug } : { label: c.label },
  );
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

  console.log("Use cases (By Task, with Receipts):", mode);

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
  const honestEmpty = USE_CASE_SEEDS.filter((u) => u.honestEmpty).length;
  const pickCount = USE_CASE_SEEDS.reduce((n, u) => n + u.picks.length, 0);
  console.log(`  ${USE_CASE_SEEDS.length} use cases in seed file (${pickCount} authored picks)`);
  console.log(`  ${honestEmpty} ship honest-empty (no backing board has a usable live leader)`);
  console.log(
    "  static validation passed (slugs, the five cross-checks, leader/rank resolution, dash-free)",
  );
  if (mode === "check") return;

  const prisma = connect();
  try {
    const dbErrors = await crossCheck(prisma);
    if (dbErrors.length > 0) {
      console.error(`x DB cross-check failed (${dbErrors.length}):`);
      for (const e of dbErrors) console.error(`    ${e}`);
      process.exit(1);
    }

    const existing = await prisma.useCase.findMany({
      where: { slug: { in: USE_CASE_SEEDS.map((u) => u.slug) } },
      select: { slug: true, status: true },
    });
    const existingBySlug = new Map(
      existing.map((e: { slug: string; status: string }) => [e.slug, e] as const),
    );

    if (mode === "verify") {
      for (const u of USE_CASE_SEEDS) {
        const row = existingBySlug.get(u.slug);
        console.log(`  ${u.slug}: ${row ? `in DB (${row.status})` : "not in DB yet"}`);
      }
      console.log("verify complete, no writes performed");
      return;
    }

    // Upsert by slug. status set only on create (never demotes a published row).
    let created = 0;
    let updated = 0;
    for (const u of USE_CASE_SEEDS) {
      const common = {
        name: u.name,
        audienceLine: u.audienceLine,
        taskLead: u.taskLead,
        bottomLine: u.bottomLine,
        bottomLineBenchmarkSlug: u.bottomLineBenchmarkSlug ?? null,
        evidenceLine: u.evidenceLine,
        yardsticks: yardsticksJson(u),
        picks: picksJson(u),
        howToChoose: howToChooseJson(u),
        judgeCriteria: u.judgeCriteria ?? [],
        watchOut: u.watchOut,
        watchOutUrl: u.watchOutUrl ?? null,
        relatedConcepts: relatedConceptsJson(u),
        honestEmpty: u.honestEmpty,
        datedAnchor: u.datedAnchor ?? null,
        gapReason: u.gapReason ?? null,
        order: u.order,
      };
      const row = await prisma.useCase.upsert({
        where: { slug: u.slug },
        create: { slug: u.slug, status: "draft", ...common },
        update: common, // never touches status
        select: { status: true },
      });
      if (existingBySlug.has(u.slug)) updated++;
      else created++;
      console.log(
        `  ${u.slug} (${row.status}, ${u.picks.length} picks${u.honestEmpty ? ", honest-empty" : ""})`,
      );
    }

    console.log(`Use cases seeded: ${created} created, ${updated} updated.`);
    const drafts = await prisma.useCase.count({ where: { status: "draft" } });
    const published = await prisma.useCase.count({ where: { status: "published" } });
    console.log(`   Surface now holds ${published} published + ${drafts} draft use cases.`);
    if (created > 0) {
      console.log("   New use cases are drafts: publish them from the admin card when ready.");
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
