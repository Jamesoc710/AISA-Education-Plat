import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { RESOURCES } from "../prisma/seed-data/resources";

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error("DIRECT_URL or DATABASE_URL must be set");
const adapter = new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });

const DRY_RUN = process.argv.includes("--dry-run");

class DryRunRollback extends Error {}

async function main() {
  console.log(`📚 Importing resources${DRY_RUN ? " [DRY RUN]" : ""} (user data untouched)...\n`);

  const allConcepts = await prisma.concept.findMany({
    select: { id: true, slug: true, _count: { select: { resources: true } } },
  });
  const slugToId: Record<string, string> = {};
  const oldCounts: Record<string, number> = {};
  for (const c of allConcepts) {
    slugToId[c.slug] = c.id;
    oldCounts[c.slug] = c._count.resources;
  }

  const bySlug: Record<string, typeof RESOURCES> = {};
  const unknownSlugs: string[] = [];
  for (const r of RESOURCES) {
    if (!slugToId[r.conceptSlug]) {
      unknownSlugs.push(r.conceptSlug);
      continue;
    }
    (bySlug[r.conceptSlug] ||= []).push(r);
  }

  if (unknownSlugs.length) {
    console.error("❌ Unknown slugs in RESOURCES:", [...new Set(unknownSlugs)]);
    process.exit(1);
  }

  const touchedSlugs = Object.keys(bySlug);
  console.log(`  Concepts touched: ${touchedSlugs.length}`);
  console.log(`  Total resources to insert: ${RESOURCES.length}\n`);

  try {
    await prisma.$transaction(async (tx) => {
      const touchedIds = touchedSlugs.map((s) => slugToId[s]);
      const deleted = await tx.resource.deleteMany({
        where: { conceptId: { in: touchedIds } },
      });
      console.log(`  ✓ Cleared ${deleted.count} old resources`);

      let inserted = 0;
      for (const slug of touchedSlugs) {
        const rows = bySlug[slug].map((r) => {
          const { conceptSlug, ...rest } = r;
          return { ...rest, conceptId: slugToId[slug] };
        });
        await tx.resource.createMany({ data: rows });
        inserted += rows.length;
      }
      console.log(`  ✓ Inserted ${inserted} new resources\n`);

      if (DRY_RUN) {
        console.log("  ⏪ DRY RUN: rolling back transaction\n");
        throw new DryRunRollback();
      }
    });
  } catch (e) {
    if (!(e instanceof DryRunRollback)) throw e;
  }

  console.log("Per-concept diff:");
  const counts: Record<string, number> = {};
  for (const r of RESOURCES) counts[r.conceptSlug] = (counts[r.conceptSlug] || 0) + 1;
  const sorted = Object.keys(counts).sort();
  for (const slug of sorted) {
    const before = oldCounts[slug] ?? 0;
    const after = counts[slug];
    const arrow = before === after ? "=" : before < after ? "↑" : "↓";
    console.log(`  ${arrow} ${slug}: ${before} → ${after}`);
  }

  console.log("\n✅ Import complete");
}

main()
  .catch((e) => {
    console.error("❌ Import failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
