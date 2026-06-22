/**
 * Seed the Trend Tracker trends (docs/plans/ongoing/EXPANSION.md §7.2).
 *
 * Surgical + idempotent: upserts prisma/seed-data/trends.ts by slug.
 * New trends are ALWAYS created as drafts (member-invisible); updates never
 * touch status, curatedAt, or contentHash, so an admin publish/curate and the
 * Phase 4 cron's hash state survive re-runs. Each trend's TrendUpdate rows are
 * replaced per re-run to mirror the seed file. Nothing outside the seeded
 * slugs is ever modified.
 *
 * Modes:
 *   --check            static validation of the seed file only (no DB)
 *   --verify           static + read-only DB cross-check (concept-slug coverage)
 *   --delete a,b,c     delete those trend slugs (TrendUpdate rows cascade)
 *   (default)          validate, cross-check, then upsert
 *
 *   npx tsx --env-file=.env scripts/seed-trends.ts [--check|--verify|--delete slugs]
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { TREND_SEEDS, type TrendSeed } from "../prisma/seed-data/trends";

// Em dash, en dash, figure dash, horizontal bar: banned in member-facing text.
const BANNED_DASHES = /[‒–—―]/;
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const CATEGORIES = new Set(["AI", "Tech", "Capital"]);
const MOMENTUM_LABELS = new Set(["emerging", "accelerating", "mainstreaming", "cooling"]);
const DIRECTIONS = new Set(["heating", "cooling"]);

/** All member-facing strings, for the no-dash check. */
function textFields(t: TrendSeed): string[] {
  return [
    t.name,
    t.whatItIs,
    t.whatsHappening,
    ...t.relatedConcepts.map((c) => c.label),
    ...t.topStories.flatMap((s) => [s.headline, s.whyItMatters]),
  ];
}

function validateStatic(): string[] {
  const errors: string[] = [];
  const seenSlugs = new Set<string>();

  TREND_SEEDS.forEach((t, i) => {
    const label = `Trend ${i + 1} (${t.slug || "no slug"})`;

    if (!SLUG_RE.test(t.slug)) errors.push(`${label}: slug must be kebab-case`);
    if (seenSlugs.has(t.slug)) errors.push(`${label}: duplicate slug`);
    seenSlugs.add(t.slug);

    if (!t.name.trim()) errors.push(`${label}: empty name`);
    if (!t.whatItIs.trim()) errors.push(`${label}: empty whatItIs`);
    if (!t.whatsHappening.trim()) errors.push(`${label}: empty whatsHappening`);
    if (!CATEGORIES.has(t.category)) errors.push(`${label}: bad category ${t.category}`);
    if (!MOMENTUM_LABELS.has(t.momentumLabel)) {
      errors.push(`${label}: bad momentumLabel ${t.momentumLabel}`);
    }
    if (!DIRECTIONS.has(t.direction)) errors.push(`${label}: bad direction ${t.direction}`);
    if (!Number.isInteger(t.momentum) || t.momentum < 0 || t.momentum > 100) {
      errors.push(`${label}: momentum must be an integer 0-100 (got ${t.momentum})`);
    }

    if (t.topStories.length === 0) errors.push(`${label}: no topStories`);
    t.topStories.forEach((s, j) => {
      const sl = `${label} story ${j + 1}`;
      if (!s.headline.trim()) errors.push(`${sl}: empty headline`);
      if (!s.whyItMatters.trim()) errors.push(`${sl}: empty whyItMatters`);
      if (!/^https?:\/\//.test(s.sourceUrl)) errors.push(`${sl}: invalid sourceUrl ${s.sourceUrl}`);
      if (!ISO_DATE_RE.test(s.date) || Number.isNaN(Date.parse(s.date))) {
        errors.push(`${sl}: invalid date ${s.date}`);
      }
    });

    t.relatedConcepts.forEach((c, j) => {
      if (!c.label.trim()) errors.push(`${label}: relatedConcept ${j + 1} has empty label`);
      if (c.slug !== undefined && !SLUG_RE.test(c.slug)) {
        errors.push(`${label}: relatedConcept ${c.slug} is not a kebab-case slug`);
      }
    });

    if (textFields(t).some((s) => BANNED_DASHES.test(s))) {
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

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

async function deleteSlugs(prisma: PrismaClient, slugs: string[]): Promise<void> {
  for (const slug of slugs) {
    const trend = await prisma.trend.findUnique({
      where: { slug },
      select: { id: true, name: true, status: true },
    });
    if (!trend) {
      console.warn(`  - ${slug}: not in DB, skipped`);
      continue;
    }
    // TrendUpdate cascades via the schema FK; delete explicitly to report counts.
    const updates = await prisma.trendUpdate.deleteMany({ where: { trendId: trend.id } });
    await prisma.trend.delete({ where: { id: trend.id } });
    console.log(
      `  ✓ deleted ${slug} ("${trend.name}", was ${trend.status}, ${updates.count} updates removed)`,
    );
  }
}

/** Read-only: validate every mapped concept slug resolves + print coverage. */
async function crossCheck(prisma: PrismaClient): Promise<string[]> {
  const concepts = await prisma.concept.findMany({ select: { slug: true } });
  const catalog = new Set(concepts.map((c: { slug: string }) => c.slug));

  const errors: string[] = [];
  let linkedTrends = 0;
  let linkSlots = 0;
  for (const t of TREND_SEEDS) {
    const linked = t.relatedConcepts.filter((c) => c.slug);
    for (const c of linked) {
      if (!catalog.has(c.slug!)) {
        errors.push(`${t.slug}: relatedConcept slug "${c.slug}" does not exist in the catalog`);
      }
    }
    const valid = linked.filter((c) => catalog.has(c.slug!));
    if (valid.length > 0) linkedTrends++;
    linkSlots += valid.length;
  }

  if (errors.length === 0) {
    console.log(
      `  ✓ concept-link coverage: ${linkedTrends}/${TREND_SEEDS.length} trends link >=1 concept (${linkSlots} links total, all resolve)`,
    );
    const orphans = TREND_SEEDS.filter(
      (t) => !t.relatedConcepts.some((c) => c.slug && catalog.has(c.slug)),
    ).map((t) => t.slug);
    if (orphans.length > 0) {
      console.log(`    trends with no catalog link (expected for Capital/infra): ${orphans.join(", ")}`);
    }
  }
  return errors;
}

async function main() {
  const argv = process.argv.slice(2);
  const deleteIdx = argv.indexOf("--delete");
  const mode = deleteIdx !== -1
    ? "delete"
    : argv.includes("--check")
      ? "check"
      : argv.includes("--verify")
        ? "verify"
        : "seed";

  console.log("📈 Trend Tracker trends:", mode);

  if (mode === "delete") {
    const slugs = (argv[deleteIdx + 1] ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (slugs.length === 0) {
      console.error("✗ --delete needs a comma-separated slug list");
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
    console.error(`✗ static validation failed (${errors.length}):`);
    for (const e of errors) console.error(`    ${e}`);
    process.exit(1);
  }
  const byCategory = TREND_SEEDS.reduce<Record<string, number>>((acc, t) => {
    acc[t.category] = (acc[t.category] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`  ${TREND_SEEDS.length} trends in seed file (${JSON.stringify(byCategory)})`);
  console.log("  ✓ static validation passed (enums, momentum 0-100, dated stories, dash-free)");
  if (mode === "check") return;

  const prisma = connect();
  try {
    const dbErrors = await crossCheck(prisma);
    if (dbErrors.length > 0) {
      console.error(`✗ DB cross-check failed (${dbErrors.length}):`);
      for (const e of dbErrors) console.error(`    ${e}`);
      process.exit(1);
    }

    const existing = await prisma.trend.findMany({
      where: { slug: { in: TREND_SEEDS.map((t) => t.slug) } },
      select: { slug: true, status: true },
    });
    const existingBySlug = new Map(
      existing.map((e: { slug: string; status: string }) => [e.slug, e] as const),
    );

    if (mode === "verify") {
      for (const t of TREND_SEEDS) {
        const row = existingBySlug.get(t.slug);
        console.log(`  ${t.slug}: ${row ? `in DB (${row.status})` : "not in DB yet"}`);
      }
      console.log("✅ verify complete, no writes performed");
      return;
    }

    // Upsert by slug. status / curatedAt / contentHash set only on create.
    let created = 0;
    let updated = 0;
    for (const t of TREND_SEEDS) {
      const common = {
        name: t.name,
        category: t.category,
        whatItIs: t.whatItIs,
        whatsHappening: t.whatsHappening,
        momentum: t.momentum,
        momentumLabel: t.momentumLabel,
        direction: t.direction,
        confidence: t.confidence,
        // Json columns: strip undefined slug so the value is pure JSON
        relatedConcepts: t.relatedConcepts.map((c) =>
          c.slug ? { label: c.label, slug: c.slug } : { label: c.label },
        ),
        sources: t.sources,
        syncedAt: new Date(),
      };
      const row = await prisma.trend.upsert({
        where: { slug: t.slug },
        create: { slug: t.slug, status: "draft", ...common },
        update: common, // never touches status / curatedAt / contentHash
        select: { id: true, status: true },
      });
      if (existingBySlug.has(t.slug)) updated++;
      else created++;

      // Replace TrendUpdate rows to mirror the seed file exactly.
      await prisma.trendUpdate.deleteMany({ where: { trendId: row.id } });
      for (const s of t.topStories) {
        await prisma.trendUpdate.create({
          data: {
            trendId: row.id,
            headline: s.headline,
            whyItMatters: s.whyItMatters,
            sourceUrl: s.sourceUrl,
            sourceDomain: domainOf(s.sourceUrl),
            date: new Date(s.date),
          },
        });
      }
      console.log(`  ✓ ${t.slug} (${row.status}, ${t.category} ${t.momentum}, ${t.topStories.length} stories)`);
    }

    console.log(`✅ Trends seeded: ${created} created, ${updated} updated.`);
    const drafts = await prisma.trend.count({ where: { status: "draft" } });
    const published = await prisma.trend.count({ where: { status: "published" } });
    console.log(`   Tracker now holds ${published} published + ${drafts} draft trends.`);
    if (created > 0) {
      console.log("   New trends are drafts: publish them from the admin Trends card when ready.");
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
