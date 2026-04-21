/**
 * Apply FLASHCARD_SHORTS and FLASHCARD_DEFINITIONS to every concept row
 * currently in the database.
 *
 * Why not re-seed? prisma/seed.ts is destructive (deleteMany on every
 * user-facing table including QuizAttempt/Bookmark/MentorNote). Running it
 * against prod would wipe all recruit activity. This script UPDATEs only
 * the flashcard fields in place, leaving user data untouched.
 *
 * Usage:
 *   npx tsx scripts/content/set-flashcard-defs.ts --check   # dry-run, reports only
 *   npx tsx scripts/content/set-flashcard-defs.ts           # apply updates
 *
 * Requires DIRECT_URL (session-mode pooler) so transactions work.
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { FLASHCARD_DEFINITIONS } from "../../prisma/seed-data/flashcard-definitions";
import { FLASHCARD_SHORTS } from "../../prisma/seed-data/flashcard-shorts";

async function main() {
  const check = process.argv.includes("--check");

  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DIRECT_URL or DATABASE_URL must be set");
  const adapter = new PrismaPg({ connectionString: url });
  const prisma = new PrismaClient({ adapter });

  const concepts = await prisma.concept.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      flashcardShort: true,
      flashcardDefinition: true,
    },
  });

  let scanned = 0;
  let changed = 0;
  let missingShort = 0;
  let missingDef = 0;
  const unknownShortSlugs: string[] = [];
  const unknownDefSlugs: string[] = [];

  for (const row of concepts) {
    scanned++;
    const nextShort = FLASHCARD_SHORTS[row.slug];
    const nextDef = FLASHCARD_DEFINITIONS[row.slug];

    if (nextShort == null) {
      missingShort++;
      console.warn(`  ⚠ No flashcard short for slug: ${row.slug} (${row.name})`);
    }
    if (nextDef == null) {
      missingDef++;
      console.warn(`  ⚠ No flashcard definition for slug: ${row.slug} (${row.name})`);
    }

    const shortDirty = nextShort != null && nextShort !== row.flashcardShort;
    const defDirty = nextDef != null && nextDef !== row.flashcardDefinition;

    if (shortDirty || defDirty) {
      changed++;
      if (!check) {
        await prisma.concept.update({
          where: { id: row.id },
          data: {
            ...(shortDirty ? { flashcardShort: nextShort } : {}),
            ...(defDirty ? { flashcardDefinition: nextDef } : {}),
          },
        });
      }
    }
  }

  const dbSlugs = new Set(concepts.map((c: { slug: string }) => c.slug));
  for (const slug of Object.keys(FLASHCARD_SHORTS)) {
    if (!dbSlugs.has(slug)) unknownShortSlugs.push(slug);
  }
  for (const slug of Object.keys(FLASHCARD_DEFINITIONS)) {
    if (!dbSlugs.has(slug)) unknownDefSlugs.push(slug);
  }

  console.log(
    `Concepts   scanned=${scanned}  changed=${changed}  missing_short=${missingShort}  missing_def=${missingDef}`,
  );
  if (unknownShortSlugs.length > 0) {
    console.warn(`\n⚠ Shorts exist for slugs not in DB:`);
    for (const s of unknownShortSlugs) console.warn(`   ${s}`);
  }
  if (unknownDefSlugs.length > 0) {
    console.warn(`\n⚠ Definitions exist for slugs not in DB:`);
    for (const s of unknownDefSlugs) console.warn(`   ${s}`);
  }
  console.log(
    `\n${check ? "[dry-run] " : ""}Rows ${check ? "that would be " : ""}updated: ${changed}`,
  );

  await prisma.$disconnect();

  if (check && changed > 0) {
    console.error("\nRun without --check to apply.");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
