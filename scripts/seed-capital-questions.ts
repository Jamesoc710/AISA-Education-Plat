/**
 * Seed the Capital Markets quiz questions (TCO expansion).
 *
 * Surgical + idempotent: upserts the authored MC questions onto the 42 cm-*
 * Concepts, keyed by (conceptSlug, questionText). Touches ONLY questions on
 * cm-* concepts; never deletes anything (QuizAttempt / FormalQuiz rows may
 * reference existing questions). Prisma 7 createMany has no skipDuplicates,
 * so this is an explicit find-then-update-or-create loop. Safe to re-run.
 *
 * Modes:
 *   --check    static validation of the seed file only (no DB connection)
 *   --verify   static validation + read-only DB cross-check (no writes)
 *   (default)  validate, cross-check, then upsert
 *
 *   npx tsx --env-file=.env scripts/seed-capital-questions.ts [--check|--verify]
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  CAPITAL_MARKETS_QUESTIONS,
  type CapitalQuestionSeed,
} from "../prisma/seed-data/capital-markets-questions";
import { CAPITAL_MARKETS_VOCAB } from "../prisma/seed-data/capital-markets-vocab";

const PREFIX = "cm-";
// Em dash, en dash, figure dash, horizontal bar: banned in all member-facing text.
const BANNED_DASHES = /[‒–—―]/;

function validateStatic(): string[] {
  const errors: string[] = [];
  const vocabBySlug = new Map(
    CAPITAL_MARKETS_VOCAB.map((t) => [PREFIX + t.slug, t] as const),
  );
  const seenTexts = new Set<string>();
  const perConcept = new Map<string, number>();

  CAPITAL_MARKETS_QUESTIONS.forEach((q: CapitalQuestionSeed, i: number) => {
    const label = `Q${i + 1} (${q.conceptSlug})`;

    const term = vocabBySlug.get(q.conceptSlug);
    if (!term) errors.push(`${label}: unknown concept slug`);
    else if (q.difficulty !== term.difficulty) {
      errors.push(
        `${label}: difficulty ${q.difficulty} != concept's ${term.difficulty}`,
      );
    }

    if (q.type !== "MC") errors.push(`${label}: type must be "MC"`);
    if (!q.questionText.trim()) errors.push(`${label}: empty questionText`);
    if (!q.answerExplanation.trim()) errors.push(`${label}: empty answerExplanation`);

    if (q.options.length !== 4) {
      errors.push(`${label}: ${q.options.length} options, need exactly 4`);
    }
    const correct = q.options.filter((o) => o.isCorrect).length;
    if (correct !== 1) errors.push(`${label}: ${correct} correct options, need exactly 1`);
    const optionTexts = new Set(q.options.map((o) => o.text.trim()));
    if (optionTexts.size !== q.options.length) {
      errors.push(`${label}: duplicate option text`);
    }
    if (q.options.some((o) => !o.text.trim())) errors.push(`${label}: empty option text`);

    const allText = [q.questionText, q.answerExplanation, ...q.options.map((o) => o.text)];
    if (allText.some((t) => BANNED_DASHES.test(t))) {
      errors.push(`${label}: contains a banned em/en dash`);
    }

    if (seenTexts.has(q.questionText)) errors.push(`${label}: duplicate questionText`);
    seenTexts.add(q.questionText);
    perConcept.set(q.conceptSlug, (perConcept.get(q.conceptSlug) ?? 0) + 1);
  });

  for (const [cmSlug] of vocabBySlug) {
    const n = perConcept.get(cmSlug) ?? 0;
    if (n < 2) errors.push(`${cmSlug}: only ${n} question(s), need at least 2`);
  }

  return errors;
}

function summarize(): void {
  const byDifficulty = new Map<string, number>();
  for (const q of CAPITAL_MARKETS_QUESTIONS) {
    byDifficulty.set(q.difficulty, (byDifficulty.get(q.difficulty) ?? 0) + 1);
  }
  const counts = [...byDifficulty.entries()]
    .map(([d, n]: [string, number]) => `${d} ${n}`)
    .join(", ");
  const concepts = new Set(CAPITAL_MARKETS_QUESTIONS.map((q) => q.conceptSlug)).size;
  console.log(
    `  ${CAPITAL_MARKETS_QUESTIONS.length} MC questions across ${concepts} concepts (${counts})`,
  );
}

async function main() {
  const mode = process.argv.includes("--check")
    ? "check"
    : process.argv.includes("--verify")
      ? "verify"
      : "seed";

  console.log("🌱 Capital Markets quiz questions:", mode);

  const errors = validateStatic();
  if (errors.length > 0) {
    console.error(`✗ static validation failed (${errors.length}):`);
    for (const e of errors) console.error(`    ${e}`);
    process.exit(1);
  }
  summarize();
  console.log("  ✓ static validation passed");
  if (mode === "check") return;

  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DIRECT_URL or DATABASE_URL must be set");
  const adapter = new PrismaPg({ connectionString: url });
  const prisma = new PrismaClient({ adapter });

  try {
    // Read-only cross-check against the live cm-* concepts.
    const concepts = await prisma.concept.findMany({
      where: { slug: { startsWith: PREFIX } },
      select: { id: true, slug: true, difficulty: true },
    });
    const conceptBySlug = new Map(concepts.map((c) => [c.slug, c] as const));
    console.log(`  ${concepts.length} cm-* concepts in DB`);

    const dbErrors: string[] = [];
    for (const q of CAPITAL_MARKETS_QUESTIONS) {
      const c = conceptBySlug.get(q.conceptSlug);
      if (!c) dbErrors.push(`${q.conceptSlug}: concept not found in DB`);
      else if (c.difficulty !== q.difficulty) {
        dbErrors.push(
          `${q.conceptSlug}: DB difficulty ${c.difficulty} != seed ${q.difficulty}`,
        );
      }
    }
    if (dbErrors.length > 0) {
      console.error(`✗ DB cross-check failed (${[...new Set(dbErrors)].length}):`);
      for (const e of [...new Set(dbErrors)]) console.error(`    ${e}`);
      process.exit(1);
    }
    console.log("  ✓ DB cross-check passed (all slugs exist, difficulties match)");

    // Report existing questions on cm-* concepts that are NOT in the seed file
    // (e.g. left behind by a questionText edit). Never auto-deleted.
    const existing = await prisma.question.findMany({
      where: { concept: { slug: { startsWith: PREFIX } } },
      select: { id: true, questionText: true, concept: { select: { slug: true } } },
    });
    const seedTexts = new Set(
      CAPITAL_MARKETS_QUESTIONS.map((q) => `${q.conceptSlug}::${q.questionText}`),
    );
    const strays = existing.filter(
      (e: (typeof existing)[number]) =>
        !seedTexts.has(`${e.concept.slug}::${e.questionText}`),
    );
    console.log(`  ${existing.length} existing cm-* questions in DB, ${strays.length} stray`);
    for (const s of strays) {
      console.warn(`    stray (not in seed file): [${s.concept.slug}] ${s.questionText.slice(0, 70)}...`);
    }

    if (mode === "verify") {
      console.log("✅ verify complete, no writes performed");
      return;
    }

    // Upsert loop, keyed by (conceptId, questionText).
    let created = 0;
    let updated = 0;
    for (const q of CAPITAL_MARKETS_QUESTIONS) {
      const concept = conceptBySlug.get(q.conceptSlug)!;
      const data = {
        type: q.type,
        options: JSON.stringify(q.options),
        answerExplanation: q.answerExplanation,
        difficulty: q.difficulty,
      };
      const found = await prisma.question.findFirst({
        where: { conceptId: concept.id, questionText: q.questionText },
        select: { id: true },
      });
      if (found) {
        await prisma.question.update({ where: { id: found.id }, data });
        updated++;
      } else {
        await prisma.question.create({
          data: { conceptId: concept.id, questionText: q.questionText, ...data },
        });
        created++;
      }
    }
    console.log(`  ✓ upserted: ${created} created, ${updated} updated`);

    const total = await prisma.question.count({
      where: { concept: { slug: { startsWith: PREFIX } } },
    });
    console.log(`✅ Capital Markets questions seeded. ${total} questions now live on cm-* concepts.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
