import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";
import { TIERS, SECTIONS, CONCEPTS, CONCEPT_RELATIONS } from "./seed-data/curriculum";
import { QUESTIONS } from "./seed-data/questions";
import { RESOURCES } from "./seed-data/resources";

const DATABASE_URL = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
// Resolve to absolute path with file: prefix
const resolvedUrl = `file:${path.resolve(DATABASE_URL.replace(/^file:/, ""))}`;
const adapter = new PrismaBetterSqlite3({ url: resolvedUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting seed...");

  // ── Clean existing data (reverse dependency order) ────────────────────────
  console.log("  Clearing existing data...");
  await prisma.quizAttempt.deleteMany();
  await prisma.homeworkSubmission.deleteMany();
  await prisma.mentorNote.deleteMany();
  await prisma.projectAssignment.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.question.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.conceptRelation.deleteMany();
  await prisma.concept.deleteMany();
  await prisma.section.deleteMany();
  await prisma.tier.deleteMany();
  await prisma.user.deleteMany();

  // ── Tiers ─────────────────────────────────────────────────────────────────
  console.log("  Seeding tiers...");
  const tierMap: Record<string, string> = {};
  for (const tier of TIERS) {
    const created = await prisma.tier.create({ data: tier });
    tierMap[tier.slug] = created.id;
    console.log(`    ✓ Tier: ${tier.name}`);
  }

  // ── Sections ──────────────────────────────────────────────────────────────
  console.log("  Seeding sections...");
  const sectionMap: Record<string, string> = {};
  for (const section of SECTIONS) {
    const { tierSlug, ...rest } = section;
    const created = await prisma.section.create({
      data: { ...rest, tierId: tierMap[tierSlug] },
    });
    sectionMap[section.slug] = created.id;
    console.log(`    ✓ Section: ${section.name}`);
  }

  // ── Concepts ──────────────────────────────────────────────────────────────
  console.log("  Seeding concepts...");
  const conceptMap: Record<string, string> = {};
  for (const concept of CONCEPTS) {
    const { sectionSlug, ...rest } = concept;
    const created = await prisma.concept.create({
      data: { ...rest, sectionId: sectionMap[sectionSlug] },
    });
    conceptMap[concept.slug] = created.id;
    console.log(`    ✓ Concept: ${concept.name}`);
  }

  // ── Concept Relations (bidirectional) ─────────────────────────────────────
  console.log("  Seeding concept relations...");
  for (const [slugA, slugB] of CONCEPT_RELATIONS) {
    const idA = conceptMap[slugA];
    const idB = conceptMap[slugB];
    if (!idA) { console.warn(`    ⚠ Unknown slug: ${slugA}`); continue; }
    if (!idB) { console.warn(`    ⚠ Unknown slug: ${slugB}`); continue; }
    for (const [cId, rId] of [[idA, idB], [idB, idA]]) {
      await prisma.conceptRelation.upsert({
        where: { conceptId_relatedConceptId: { conceptId: cId, relatedConceptId: rId } },
        create: { conceptId: cId, relatedConceptId: rId },
        update: {},
      });
    }
  }
  console.log(`    ✓ ${CONCEPT_RELATIONS.length * 2} relations created`);

  // ── Questions ─────────────────────────────────────────────────────────────
  console.log("  Seeding questions...");
  let questionCount = 0;
  for (const q of QUESTIONS) {
    const conceptId = conceptMap[q.conceptSlug];
    if (!conceptId) { console.warn(`    ⚠ Unknown concept slug: ${q.conceptSlug}`); continue; }
    await prisma.question.create({
      data: {
        conceptId,
        type: q.type,
        questionText: q.questionText,
        options: q.options ? JSON.stringify(q.options) : null,
        answerExplanation: q.answerExplanation,
        difficulty: q.difficulty,
      },
    });
    questionCount++;
  }
  console.log(`    ✓ ${questionCount} questions created`);

  // ── Resources ─────────────────────────────────────────────────────────────
  console.log("  Seeding resources...");
  let resourceCount = 0;
  for (const r of RESOURCES) {
    const conceptId = conceptMap[r.conceptSlug];
    if (!conceptId) { console.warn(`    ⚠ Unknown concept slug: ${r.conceptSlug}`); continue; }
    const { conceptSlug, ...rest } = r;
    await prisma.resource.create({ data: { ...rest, conceptId } });
    resourceCount++;
  }
  console.log(`    ✓ ${resourceCount} resources created`);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n✅ Seed complete!");
  console.log(`   Tiers:     ${TIERS.length}`);
  console.log(`   Sections:  ${SECTIONS.length}`);
  console.log(`   Concepts:  ${CONCEPTS.length}`);
  console.log(`   Relations: ${CONCEPT_RELATIONS.length * 2}`);
  console.log(`   Questions: ${questionCount}`);
  console.log(`   Resources: ${resourceCount}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
