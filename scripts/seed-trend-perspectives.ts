/**
 * Seed the Trend "Perspectives" accordion content (docs/PERSPECTIVES_PLAN.md).
 *
 * Surgical + idempotent: writes ONLY the `perspectives` column on each mapped
 * trend, matched by slug. Never touches status, curatedAt, contentHash, themes,
 * momentumLabel, the TrendUpdate rows, the publish gate, the cron, or the sync
 * pipeline. Re-running is a no-op once values are in sync. A null value clears
 * the column (the shape gate said "skip", so no section renders).
 *
 * Curated values live in prisma/seed-data/trend-perspectives.ts.
 *
 * Modes:
 *   --check    static validation only (shape, stance fields, source urls,
 *              slug coverage against TREND_SEEDS, dash-free); no DB
 *   --verify   static + read-only DB diff (in sync / would change / not in DB)
 *   (default)  validate, then write `perspectives` on the matched rows
 *
 *   npx tsx scripts/seed-trend-perspectives.ts [--check|--verify]
 */
import "dotenv/config";
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { TREND_SEEDS } from "../prisma/seed-data/trends";
import { TREND_PERSPECTIVES, type Perspectives } from "../prisma/seed-data/trend-perspectives";

// Em dash, en dash, figure dash, horizontal bar: banned in member-facing text.
const BANNED_DASHES = /[‒–—―]/;
const SHAPES = new Set(["binary", "multiple", "tradeoff"]);
const SEED_SLUGS = new Set(TREND_SEEDS.map((t) => t.slug));

/** Every member-facing string in a Perspectives object (for the no-dash check). */
function memberText(p: Perspectives): string[] {
  return [
    p.intro,
    p.leans,
    ...p.stances.flatMap((s) => [s.label, s.who, s.summary, s.body, ...s.sources.map((src) => src.title)]),
  ];
}

function validateStatic(): string[] {
  const errors: string[] = [];

  for (const [slug, p] of Object.entries(TREND_PERSPECTIVES)) {
    const label = `perspectives[${slug}]`;
    if (!SEED_SLUGS.has(slug)) errors.push(`${label}: slug is not in TREND_SEEDS (typo or stale slug)`);
    if (p === null) continue; // explicit skip is valid

    if (!SHAPES.has(p.shape)) errors.push(`${label}: bad shape "${p.shape}"`);
    if (!Array.isArray(p.stances) || p.stances.length === 0) {
      errors.push(`${label}: must have at least one stance (or be null to skip)`);
      continue;
    }
    if (p.stances.length > 4) errors.push(`${label}: more than 4 stances (cap is 4)`);

    p.stances.forEach((s, i) => {
      const sl = `${label} stance ${i + 1}`;
      if (!s.label?.trim()) errors.push(`${sl}: empty label`);
      if (!s.summary?.trim()) errors.push(`${sl}: empty summary (the collapsed one-liner)`);
      if (!s.body?.trim()) errors.push(`${sl}: empty body`);
      (s.sources ?? []).forEach((src, j) => {
        if (!src.title?.trim()) errors.push(`${sl} source ${j + 1}: empty title`);
        if (!/^https?:\/\//.test(src.url ?? "")) errors.push(`${sl} source ${j + 1}: invalid url ${src.url}`);
      });
    });

    if (memberText(p).some((t) => BANNED_DASHES.test(t))) {
      errors.push(`${label}: contains a banned em/en dash`);
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

/** Canonical stringify (sorted keys) so jsonb read-back order does not look "changed". */
function canon(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(canon).join(",")}]`;
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj).sort().map((k) => `${JSON.stringify(k)}:${canon(obj[k])}`).join(",")}}`;
}

async function main() {
  const argv = process.argv.slice(2);
  const mode = argv.includes("--check") ? "check" : argv.includes("--verify") ? "verify" : "seed";

  console.log("🗣️  Trend Perspectives:", mode);

  const errors = validateStatic();
  if (errors.length > 0) {
    console.error(`✗ static validation failed (${errors.length}):`);
    for (const e of errors) console.error(`    ${e}`);
    process.exit(1);
  }
  const entries = Object.entries(TREND_PERSPECTIVES);
  const withContent = entries.filter(([, p]) => p !== null).length;
  console.log(
    `  ✓ ${entries.length} mapped (${withContent} with perspectives, ${entries.length - withContent} skip), shapes/stances/urls valid, dash-free`,
  );
  if (mode === "check") return;

  const prisma = connect();
  try {
    const rows = await prisma.trend.findMany({ select: { slug: true, perspectives: true } });
    const bySlug = new Map(rows.map((r: { slug: string; perspectives: unknown }) => [r.slug, r.perspectives]));

    let updated = 0;
    let unchanged = 0;
    const missing: string[] = [];

    for (const [slug, p] of entries) {
      if (!bySlug.has(slug)) {
        missing.push(slug);
        continue;
      }
      const current = bySlug.get(slug) ?? null;
      if (canon(current) === canon(p)) {
        unchanged++;
        if (mode === "verify") console.log(`  = ${slug}: in sync`);
        continue;
      }
      if (mode === "verify") {
        console.log(`  ~ ${slug}: would ${p === null ? "clear" : `set ${p.stances.length} stances (${p.shape})`}`);
        continue;
      }
      await prisma.trend.update({
        where: { slug },
        // Json column: a real object writes jsonb; Prisma.DbNull writes SQL NULL.
        data: { perspectives: p === null ? Prisma.DbNull : (p as unknown as Prisma.InputJsonValue) },
      });
      updated++;
      console.log(`  ✓ ${slug}: ${p === null ? "cleared (skip)" : `${p.stances.length} stances (${p.shape})`}`);
    }

    if (missing.length > 0) {
      console.warn(`  ! not in DB (run scripts/seed-trends.ts first): ${missing.join(", ")}`);
    }
    if (mode === "verify") {
      console.log("✅ verify complete, no writes performed");
      return;
    }
    console.log(`✅ Perspectives seeded: ${updated} updated, ${unchanged} already in sync.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
