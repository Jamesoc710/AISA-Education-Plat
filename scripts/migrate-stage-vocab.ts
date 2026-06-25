/**
 * One-shot Build Board stage vocabulary migration (5 values to 4).
 *
 *   completed -> shipped
 *   polishing -> building
 *
 * This is NOT a seeder re-run. The seeder is idempotent and writes whatever the
 * seed file says; it cannot move live rows from an old spelling to a new one.
 * This script does the data move once, against the live DB, by stage VALUE (not
 * by slug), so it also covers any row the seed file does not own.
 *
 * It is deliberately decoupled from lib/project-stages.ts: the from/to strings
 * are literals here, so the order of running this vs. deploying the code edits
 * does not matter. Run it once; running it again is a no-op (the old values are
 * already gone).
 *
 * Modes:
 *   --check   read-only. The mandatory provenance check: prints the live stage
 *             distribution, cross-checks every seeded row against the seed file
 *             (after applying the same mapping to both sides), flags any row the
 *             seed file does not own (self-serve posts or hand-created rows), and
 *             reports what --apply WOULD change. No writes. Safe to run anytime.
 *   --apply   re-runs the check, refuses on a FAIL unless --force, then runs the
 *             two updateMany calls in one transaction and prints before/after.
 *
 *   npx tsx --env-file=.env scripts/migrate-stage-vocab.ts --check
 *   npx tsx --env-file=.env scripts/migrate-stage-vocab.ts --apply
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { PROJECT_SEEDS } from "../prisma/seed-data/projects";

// The migration, as data. Keep these as raw literals (not imported from
// project-stages.ts) so the script runs the same before or after the code edit.
const STAGE_MIGRATIONS: { from: string; to: string }[] = [
  { from: "completed", to: "shipped" },
  { from: "polishing", to: "building" },
];

// Every stage spelling this migration knows about, old and new, for the
// "unrecognized value" guard below.
const KNOWN_STAGES = new Set<string>([
  "idea",
  "building",
  "polishing",
  "completed",
  "shipped",
  "paused",
]);

/** Apply the migration mapping to a single stage string (identity if unmapped). */
function migrate(stage: string): string {
  return STAGE_MIGRATIONS.find((m) => m.from === stage)?.to ?? stage;
}

function connect(): PrismaClient {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DIRECT_URL or DATABASE_URL must be set");
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}

type LiveRow = {
  slug: string;
  stage: string;
  status: string;
  createdById: string | null;
};

type CheckResult = {
  rows: LiveRow[];
  distribution: Map<string, number>;
  willChange: { from: string; to: string; count: number }[];
  problems: string[];
  pass: boolean;
};

/** Read-only provenance check. Returns the live picture plus PASS/FAIL. */
async function runCheck(prisma: PrismaClient): Promise<CheckResult> {
  const rows: LiveRow[] = await prisma.project.findMany({
    select: { slug: true, stage: true, status: true, createdById: true },
    orderBy: { createdAt: "asc" },
  });

  const seedBySlug = new Map(PROJECT_SEEDS.map((p) => [p.slug, p] as const));

  // Stage distribution across all live rows.
  const distribution = new Map<string, number>();
  for (const r of rows) {
    distribution.set(r.stage, (distribution.get(r.stage) ?? 0) + 1);
  }

  // What --apply would change, per mapping.
  const willChange = STAGE_MIGRATIONS.map((m) => ({
    from: m.from,
    to: m.to,
    count: rows.filter((r) => r.stage === m.from).length,
  }));

  // Provenance: is the seed file the sole source of stage truth for live rows?
  const problems: string[] = [];

  for (const r of rows) {
    // 1. A self-serve post is a second writer: its stage came from the poster,
    //    not the seed file. Should be zero today (the modal is brand new).
    if (r.createdById !== null) {
      problems.push(
        `self-serve row "${r.slug}" (createdById set): stage "${r.stage}" was chosen by the poster, not the seed file`,
      );
    }

    // 2. A row whose slug is not in the seed file is not seed-owned.
    const seed = seedBySlug.get(r.slug);
    if (!seed) {
      if (r.createdById === null) {
        problems.push(
          `orphan row "${r.slug}" (no createdById, not in seed file): hand-created? stage "${r.stage}" has no seed-file source`,
        );
      }
      continue;
    }

    // 3. A seeded row whose stored stage disagrees with the seed file (after the
    //    same mapping is applied to both) was hand-edited in the DB. This is the
    //    exact "future hand-edit silently overwritten" risk the plan flags.
    if (migrate(r.stage) !== migrate(seed.stage)) {
      problems.push(
        `seeded row "${r.slug}" drift: DB stage "${r.stage}" (maps to "${migrate(r.stage)}") != seed-file stage "${seed.stage}" (maps to "${migrate(seed.stage)}")`,
      );
    }

    // 4. A stage spelling this migration does not recognize at all.
    if (!KNOWN_STAGES.has(r.stage)) {
      problems.push(`row "${r.slug}" has an unrecognized stage "${r.stage}"`);
    }
  }

  return { rows, distribution, willChange, problems, pass: problems.length === 0 };
}

function printCheck(result: CheckResult): void {
  const seedSlugs = new Set(PROJECT_SEEDS.map((p) => p.slug));

  console.log(`\n  Live projects (${result.rows.length}):`);
  for (const r of result.rows) {
    const origin = r.createdById
      ? "self-serve"
      : seedSlugs.has(r.slug)
        ? "seeded"
        : "orphan";
    console.log(`    - ${r.slug}: stage "${r.stage}", ${r.status}, ${origin}`);
  }

  console.log("\n  Stage distribution:");
  for (const [stage, count] of [...result.distribution].sort()) {
    console.log(`    ${stage}: ${count}`);
  }

  console.log("\n  --apply would change:");
  let total = 0;
  for (const c of result.willChange) {
    total += c.count;
    console.log(`    ${c.from} -> ${c.to}: ${c.count} row(s)`);
  }
  console.log(`    total: ${total} row(s)`);

  console.log("\n  Provenance (seed file is the sole source of stage truth):");
  if (result.pass) {
    console.log("    PASS: every live row is seed-owned with no self-serve or hand-edit drift.");
  } else {
    console.log(`    FAIL (${result.problems.length}):`);
    for (const p of result.problems) console.log(`      - ${p}`);
    console.log(
      "    The migration still maps by stage value, so the data move is correct regardless;",
    );
    console.log(
      "    a FAIL only means the seed file is not the sole writer. Review before --apply.",
    );
  }
}

async function runApply(prisma: PrismaClient, force: boolean): Promise<void> {
  const before = await runCheck(prisma);
  printCheck(before);

  if (!before.pass && !force) {
    console.error(
      "\n  Refusing to apply: provenance check FAILED. Re-run with --apply --force to override.",
    );
    process.exit(1);
  }

  const totalToChange = before.willChange.reduce((n, c) => n + c.count, 0);
  if (totalToChange === 0) {
    console.log("\n  Nothing to migrate (no completed/polishing rows). No-op.");
    return;
  }

  console.log("\n  Applying migration in a transaction...");
  const results = await prisma.$transaction(
    STAGE_MIGRATIONS.map((m) =>
      prisma.project.updateMany({ where: { stage: m.from }, data: { stage: m.to } }),
    ),
  );
  STAGE_MIGRATIONS.forEach((m, i) => {
    console.log(`    ${m.from} -> ${m.to}: ${results[i].count} row(s) updated`);
  });

  const after = await prisma.project.groupBy({
    by: ["stage"],
    _count: { stage: true },
  });
  console.log("\n  Stage distribution after:");
  for (const g of after.sort((a, b) => a.stage.localeCompare(b.stage))) {
    console.log(`    ${g.stage}: ${g._count.stage}`);
  }

  const leftover = after.filter((g) => g.stage === "completed" || g.stage === "polishing");
  if (leftover.length > 0) {
    console.error("\n  WARNING: completed/polishing rows still present after apply. Investigate.");
    process.exit(1);
  }
  console.log("\n  Done. Stage vocabulary migrated to 4 values.");
}

async function main() {
  const argv = process.argv.slice(2);
  const apply = argv.includes("--apply");
  const force = argv.includes("--force");
  const mode = apply ? "apply" : "check";

  console.log(`Build Board stage vocabulary migration: ${mode}`);

  const prisma = connect();
  try {
    if (mode === "check") {
      const result = await runCheck(prisma);
      printCheck(result);
      console.log("\n  Read-only. No writes performed. Run --apply to migrate.");
    } else {
      await runApply(prisma, force);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
