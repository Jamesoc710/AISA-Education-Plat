/**
 * Seed the Trend Tracker Themes facet (docs/plans/complete/TREND_TRACKER_REDESIGN_PLAN.md step 0).
 *
 * Surgical + idempotent: writes ONLY the `themes` column on each of the 22
 * trends, matched by slug. It never touches status, curatedAt, contentHash,
 * momentumLabel, direction, momentum, the TrendUpdate rows, the publish gate,
 * the cron, or the sync pipeline. Re-running is a no-op once values are in sync.
 *
 * The curated values live in prisma/seed-data/trend-themes.ts (a slug-keyed side
 * map, since prisma/seed-data/trends.ts is generated and has no themes field).
 *
 * Modes:
 *   --check    static validation of the themes map only (vocab, count, slug
 *              coverage against TREND_SEEDS); no DB connection
 *   --verify   static + read-only DB diff (shows current vs desired per slug)
 *   (default)  validate, then update `themes` on the matched rows
 *
 *   npx tsx scripts/seed-trend-themes.ts [--check|--verify]
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { TREND_SEEDS } from "../prisma/seed-data/trends";
import { TREND_THEMES, THEME_VOCAB, type Theme } from "../prisma/seed-data/trend-themes";

const VOCAB = new Set<string>(THEME_VOCAB);
const SEED_SLUGS = new Set(TREND_SEEDS.map((t) => t.slug));

/** Fail-loud static checks: vocabulary, 1-2 tags each, two-way slug coverage. */
function validateStatic(): string[] {
  const errors: string[] = [];
  const entries = Object.entries(TREND_THEMES);

  for (const [slug, themes] of entries) {
    const label = `themes[${slug}]`;
    if (!SEED_SLUGS.has(slug)) {
      errors.push(`${label}: slug is not in TREND_SEEDS (typo or stale slug)`);
    }
    if (!Array.isArray(themes) || themes.length < 1 || themes.length > 2) {
      errors.push(`${label}: must have one or two tags (got ${themes.length})`);
    }
    if (new Set(themes).size !== themes.length) {
      errors.push(`${label}: duplicate tag`);
    }
    for (const tag of themes) {
      if (!VOCAB.has(tag)) errors.push(`${label}: "${tag}" is not in the locked vocabulary`);
    }
  }

  // Every seeded trend must carry themes, so no cell renders blank.
  for (const t of TREND_SEEDS) {
    if (!(t.slug in TREND_THEMES)) {
      errors.push(`TREND_SEEDS slug "${t.slug}" has no themes assignment`);
    }
  }

  return errors;
}

function connect(): PrismaClient {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DIRECT_URL or DATABASE_URL must be set");
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}

const sameThemes = (a: string[], b: string[]): boolean =>
  a.length === b.length && a.every((v, i) => v === b[i]);

async function main() {
  const argv = process.argv.slice(2);
  const mode = argv.includes("--check") ? "check" : argv.includes("--verify") ? "verify" : "seed";

  console.log("🏷️  Trend Themes:", mode);

  const errors = validateStatic();
  if (errors.length > 0) {
    console.error(`✗ static validation failed (${errors.length}):`);
    for (const e of errors) console.error(`    ${e}`);
    process.exit(1);
  }

  const tagSpread = Object.values(TREND_THEMES)
    .flat()
    .reduce<Record<string, number>>((acc, tag) => {
      acc[tag] = (acc[tag] ?? 0) + 1;
      return acc;
    }, {});
  console.log(
    `  ✓ ${Object.keys(TREND_THEMES).length} trends mapped, all tags in the 11-tag vocabulary, 1-2 each`,
  );
  console.log(`  tag spread: ${JSON.stringify(tagSpread)}`);
  if (mode === "check") return;

  const prisma = connect();
  try {
    const rows = await prisma.trend.findMany({ select: { slug: true, themes: true } });
    const bySlug = new Map(rows.map((r: { slug: string; themes: string[] }) => [r.slug, r.themes]));

    let updated = 0;
    let unchanged = 0;
    const missing: string[] = [];

    for (const [slug, themes] of Object.entries(TREND_THEMES) as [string, Theme[]][]) {
      const current = bySlug.get(slug);
      if (current === undefined) {
        missing.push(slug);
        continue;
      }
      if (sameThemes(current, themes)) {
        unchanged++;
        if (mode === "verify") console.log(`  = ${slug}: ${themes.join(", ")} (in sync)`);
        continue;
      }
      if (mode === "verify") {
        console.log(`  ~ ${slug}: [${current.join(", ")}] -> [${themes.join(", ")}]`);
        continue;
      }
      // Surgical write: themes only. Nothing else on the row is read or set.
      await prisma.trend.update({ where: { slug }, data: { themes } });
      updated++;
      console.log(`  ✓ ${slug}: ${themes.join(", ")}`);
    }

    if (missing.length > 0) {
      console.warn(`  ! not in DB (run scripts/seed-trends.ts first): ${missing.join(", ")}`);
    }

    // Informational: cron-added trends with no curated themes are expected to
    // stay empty (they render no THEMES line until curated). Never an error.
    const orphans = rows
      .filter((r: { slug: string }) => !(r.slug in TREND_THEMES))
      .map((r: { slug: string }) => r.slug);
    if (orphans.length > 0) {
      console.log(`  (${orphans.length} DB trend(s) outside the curated set, left with empty themes)`);
    }

    if (mode === "verify") {
      console.log("✅ verify complete, no writes performed");
      return;
    }
    console.log(`✅ Themes seeded: ${updated} updated, ${unchanged} already in sync.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
