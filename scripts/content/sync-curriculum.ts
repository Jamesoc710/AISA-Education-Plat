/**
 * Sync the AI curriculum from prisma/seed-data/ into the database.
 *
 * The seed files are the source of truth for sections, concepts (including
 * the simple explanation and both flashcard texts), concept relations and
 * questions. This script brings a database in line with them.
 *
 * Idempotent and additive: it creates what is missing and updates what
 * changed. It never deletes. Questions are keyed by (concept slug, question
 * text), so editing a question's text creates a new row and leaves the old
 * one in place as a "stray" (quiz attempts may reference it); strays are
 * listed so they can be removed by hand. Capital Markets (cm-*) content and
 * resources are out of scope; they have their own scripts.
 *
 * Modes:
 *   --check       validate the seed files only, no database connection
 *   (default)     validate, then print what would change. No writes.
 *   --apply       validate, print the changes, then write them
 *   --bootstrap   with --apply on an empty local database: also create the
 *                 "ai" track and the tiers. Refused for non-local databases.
 *
 *   npx tsx --env-file=.env.local scripts/content/sync-curriculum.ts [--check|--apply]
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { TIERS, SECTIONS, CONCEPTS, CONCEPT_RELATIONS } from "../../prisma/seed-data/curriculum";
import { QUESTIONS } from "../../prisma/seed-data/questions";
import { SIMPLE_EXPLANATIONS } from "../../prisma/seed-data/simple-explanations";
import { FLASHCARD_SHORTS } from "../../prisma/seed-data/flashcard-shorts";
import { FLASHCARD_DEFINITIONS } from "../../prisma/seed-data/flashcard-definitions";

// Em dash, en dash, figure dash, horizontal bar: not allowed in member-facing text.
const BANNED_DASHES = /[‒–—―]/;
const DIFFICULTIES = ["FUNDAMENTALS", "INTERMEDIATE", "ADVANCED"];

type ConceptSeed = (typeof CONCEPTS)[number];
type QuestionSeed = (typeof QUESTIONS)[number];

/** The concept columns this script owns, built from the seed files. */
function conceptFields(c: ConceptSeed) {
  return {
    name: c.name,
    subtitle: c.subtitle,
    difficulty: c.difficulty,
    whatItIs: c.whatItIs,
    whyItMatters: c.whyItMatters,
    goDeeper: c.goDeeper ?? null,
    simpleExplanation: SIMPLE_EXPLANATIONS[c.slug] ?? null,
    flashcardShort: FLASHCARD_SHORTS[c.slug] ?? null,
    flashcardDefinition: FLASHCARD_DEFINITIONS[c.slug] ?? null,
    sortOrder: c.sortOrder,
  };
}

function questionFields(q: QuestionSeed) {
  return {
    type: q.type,
    options: q.options ? JSON.stringify(q.options) : null,
    answerExplanation: q.answerExplanation,
    difficulty: q.difficulty,
  };
}

function validate(): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  const tierSlugs = new Set(TIERS.map((t) => t.slug));
  const sectionSlugs = new Set<string>();
  for (const s of SECTIONS) {
    if (sectionSlugs.has(s.slug)) errors.push(`section ${s.slug}: duplicate slug`);
    sectionSlugs.add(s.slug);
    if (!tierSlugs.has(s.tierSlug)) errors.push(`section ${s.slug}: unknown tier ${s.tierSlug}`);
  }

  const conceptSlugs = new Set<string>();
  for (const c of CONCEPTS) {
    if (conceptSlugs.has(c.slug)) errors.push(`concept ${c.slug}: duplicate slug`);
    conceptSlugs.add(c.slug);
    if (c.slug.startsWith("cm-")) errors.push(`concept ${c.slug}: cm- slugs belong to Capital Markets`);
    if (!sectionSlugs.has(c.sectionSlug)) errors.push(`concept ${c.slug}: unknown section ${c.sectionSlug}`);
    if (!DIFFICULTIES.includes(c.difficulty)) errors.push(`concept ${c.slug}: bad difficulty ${c.difficulty}`);
    const fields = conceptFields(c);
    for (const key of ["name", "subtitle", "whatItIs", "whyItMatters"] as const) {
      if (!fields[key].trim()) errors.push(`concept ${c.slug}: empty ${key}`);
    }
    for (const key of ["simpleExplanation", "flashcardShort", "flashcardDefinition"] as const) {
      if (!fields[key]) warnings.push(`concept ${c.slug}: no ${key}`);
    }
    const text = Object.values(fields).filter((v): v is string => typeof v === "string");
    if (text.some((t) => BANNED_DASHES.test(t))) warnings.push(`concept ${c.slug}: contains an em or en dash`);
  }

  for (const [from, to] of CONCEPT_RELATIONS) {
    if (!conceptSlugs.has(from) || !conceptSlugs.has(to)) {
      errors.push(`relation ${from} -> ${to}: unknown concept`);
    }
  }

  const seen = new Set<string>();
  QUESTIONS.forEach((q, i) => {
    const label = `question ${i + 1} (${q.conceptSlug})`;
    if (!conceptSlugs.has(q.conceptSlug)) errors.push(`${label}: unknown concept`);
    if (!DIFFICULTIES.includes(q.difficulty)) errors.push(`${label}: bad difficulty ${q.difficulty}`);
    if (!q.questionText.trim()) errors.push(`${label}: empty questionText`);
    if (!q.answerExplanation.trim()) errors.push(`${label}: empty answerExplanation`);
    const key = `${q.conceptSlug}::${q.questionText}`;
    if (seen.has(key)) errors.push(`${label}: duplicate questionText`);
    seen.add(key);

    if (q.type === "MC") {
      const options = q.options ?? [];
      if (options.length !== 4) errors.push(`${label}: ${options.length} options, need exactly 4`);
      const correct = options.filter((o) => o.isCorrect).length;
      if (correct !== 1) errors.push(`${label}: ${correct} correct options, need exactly 1`);
      if (new Set(options.map((o) => o.text.trim())).size !== options.length) {
        errors.push(`${label}: duplicate option text`);
      }
      if (options.some((o) => !o.text.trim())) errors.push(`${label}: empty option text`);
    } else if (q.type === "SHORT_ANSWER") {
      if (q.options) errors.push(`${label}: short answers take no options`);
    } else {
      errors.push(`${label}: unknown type ${String(q.type)}`);
    }

    const text = [q.questionText, q.answerExplanation, ...(q.options ?? []).map((o) => o.text)];
    if (text.some((t) => BANNED_DASHES.test(t))) warnings.push(`${label}: contains an em or en dash`);
  });

  return { errors, warnings };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const checkOnly = args.has("--check");
  const apply = args.has("--apply");
  const bootstrap = args.has("--bootstrap");

  const { errors, warnings } = validate();
  const perConcept = new Map<string, number>();
  for (const q of QUESTIONS) perConcept.set(q.conceptSlug, (perConcept.get(q.conceptSlug) ?? 0) + 1);
  const thin = CONCEPTS.filter((c) => (perConcept.get(c.slug) ?? 0) < 3).length;

  console.log(
    `Seed files: ${SECTIONS.length} sections, ${CONCEPTS.length} concepts, ${QUESTIONS.length} questions ` +
      `(${thin} concepts with fewer than 3), ${CONCEPT_RELATIONS.length} relations`,
  );
  if (warnings.length > 0) {
    console.log(`${warnings.length} warning(s):`);
    for (const w of warnings) console.log(`  warn  ${w}`);
  }
  if (errors.length > 0) {
    console.error(`Validation failed (${errors.length}):`);
    for (const e of errors) console.error(`  error ${e}`);
    process.exit(1);
  }
  console.log("Validation passed.");
  if (checkOnly) return;

  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DIRECT_URL or DATABASE_URL must be set");
  const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
  if (bootstrap && !local) throw new Error("--bootstrap is only for local databases");
  console.log(`Database: ${local ? "local" : "REMOTE"} (${apply ? "APPLY" : "dry run, no writes"})`);

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
  try {
    // ── Tiers (never edited here; created only by --bootstrap) ──────────────
    if (bootstrap && apply) {
      const track = await prisma.track.upsert({
        where: { slug: "ai" },
        create: {
          slug: "ai",
          name: "Artificial Intelligence",
          shortName: "AI",
          description: "How modern AI works, from the fundamentals to the frontier.",
          accentColor: "#5E6AD2",
          isPrimary: true,
          sortOrder: 1,
        },
        update: {},
      });
      for (const t of TIERS) {
        await prisma.tier.upsert({ where: { slug: t.slug }, create: { ...t, trackId: track.id }, update: {} });
      }
    }
    const tiers = await prisma.tier.findMany({ select: { id: true, slug: true } });
    const tierId = new Map<string, string>(tiers.map((t: (typeof tiers)[number]) => [t.slug, t.id]));
    const missingTiers = TIERS.filter((t) => !tierId.has(t.slug)).map((t) => t.slug);
    if (missingTiers.length > 0) {
      throw new Error(`Tiers missing from the database: ${missingTiers.join(", ")} (local: add --bootstrap)`);
    }

    // ── Sections ────────────────────────────────────────────────────────────
    const dbSections = await prisma.section.findMany({
      select: { id: true, slug: true, name: true, description: true, sortOrder: true, tierId: true },
    });
    type SectionRow = (typeof dbSections)[number];
    const sectionBySlug = new Map<string, SectionRow>(dbSections.map((s: SectionRow) => [s.slug, s]));
    let sectionsCreated = 0;
    let sectionsUpdated = 0;
    for (const s of SECTIONS) {
      const data = { name: s.name, description: s.description, sortOrder: s.sortOrder, tierId: tierId.get(s.tierSlug)! };
      const row = sectionBySlug.get(s.slug);
      if (!row) {
        console.log(`  + section ${s.slug}`);
        sectionsCreated++;
        if (apply) {
          const created = await prisma.section.create({ data: { slug: s.slug, ...data }, select: { id: true, slug: true, name: true, description: true, sortOrder: true, tierId: true } });
          sectionBySlug.set(s.slug, created);
        }
      } else {
        const changed = (Object.keys(data) as (keyof typeof data)[]).filter((k) => row[k] !== data[k]);
        if (changed.length > 0) {
          console.log(`  ~ section ${s.slug}: ${changed.join(", ")}`);
          sectionsUpdated++;
          if (apply) await prisma.section.update({ where: { id: row.id }, data });
        }
      }
    }

    // ── Concepts ────────────────────────────────────────────────────────────
    const dbConcepts = await prisma.concept.findMany({
      where: { slug: { in: CONCEPTS.map((c) => c.slug) } },
      select: {
        id: true, slug: true, sectionId: true, name: true, subtitle: true, difficulty: true,
        whatItIs: true, whyItMatters: true, goDeeper: true, simpleExplanation: true,
        flashcardShort: true, flashcardDefinition: true, sortOrder: true,
      },
    });
    type ConceptRow = (typeof dbConcepts)[number];
    const conceptBySlug = new Map<string, ConceptRow>(dbConcepts.map((c: ConceptRow) => [c.slug, c]));
    const conceptId = new Map<string, string>(dbConcepts.map((c: ConceptRow) => [c.slug, c.id]));
    let conceptsCreated = 0;
    let conceptsUpdated = 0;
    for (const c of CONCEPTS) {
      const fields = conceptFields(c);
      const sectionId = sectionBySlug.get(c.sectionSlug)?.id;
      const row = conceptBySlug.get(c.slug);
      if (!row) {
        console.log(`  + concept ${c.slug} (${c.sectionSlug})`);
        conceptsCreated++;
        if (apply) {
          const created = await prisma.concept.create({
            data: { slug: c.slug, sectionId: sectionId!, ...fields },
            select: { id: true },
          });
          conceptId.set(c.slug, created.id);
        }
        continue;
      }
      const changed: string[] = (Object.keys(fields) as (keyof typeof fields)[]).filter((k) => row[k] !== fields[k]);
      if (sectionId && row.sectionId !== sectionId) changed.push("section");
      if (changed.length > 0) {
        console.log(`  ~ concept ${c.slug}: ${changed.join(", ")}`);
        conceptsUpdated++;
        if (apply) {
          await prisma.concept.update({ where: { id: row.id }, data: { ...fields, sectionId: sectionId! } });
        }
      }
    }

    // ── Relations (add missing only) ────────────────────────────────────────
    const dbRelations = await prisma.conceptRelation.findMany({
      select: { conceptId: true, relatedConceptId: true },
    });
    const relationKeys = new Set<string>(
      dbRelations.map((r: (typeof dbRelations)[number]) => `${r.conceptId}>${r.relatedConceptId}`),
    );
    let relationsCreated = 0;
    for (const [from, to] of CONCEPT_RELATIONS) {
      const a = conceptId.get(from);
      const b = conceptId.get(to);
      // Ids are unknown for concepts a dry run would create; count them as new.
      if (a && b && relationKeys.has(`${a}>${b}`)) continue;
      relationsCreated++;
      if (apply && a && b) {
        await prisma.conceptRelation.create({ data: { conceptId: a, relatedConceptId: b } });
      }
    }
    if (relationsCreated > 0) console.log(`  + ${relationsCreated} concept relation(s)`);

    // ── Questions ───────────────────────────────────────────────────────────
    const dbQuestions = await prisma.question.findMany({
      where: { concept: { slug: { in: CONCEPTS.map((c) => c.slug) } } },
      select: {
        id: true, questionText: true, type: true, options: true, answerExplanation: true,
        difficulty: true, concept: { select: { slug: true } },
      },
    });
    type QuestionRow = (typeof dbQuestions)[number];
    const questionByKey = new Map<string, QuestionRow>(
      dbQuestions.map((q: QuestionRow) => [`${q.concept.slug}::${q.questionText}`, q]),
    );
    const seedKeys = new Set<string>();
    let questionsCreated = 0;
    let questionsUpdated = 0;
    for (const q of QUESTIONS) {
      const key = `${q.conceptSlug}::${q.questionText}`;
      seedKeys.add(key);
      const data = questionFields(q);
      const row = questionByKey.get(key);
      if (!row) {
        questionsCreated++;
        const id = conceptId.get(q.conceptSlug);
        if (apply && id) {
          await prisma.question.create({ data: { conceptId: id, questionText: q.questionText, ...data } });
        }
      } else {
        const changed = (Object.keys(data) as (keyof typeof data)[]).filter((k) => row[k] !== data[k]);
        if (changed.length > 0) {
          console.log(`  ~ question [${q.conceptSlug}] ${q.questionText.slice(0, 60)}: ${changed.join(", ")}`);
          questionsUpdated++;
          if (apply) await prisma.question.update({ where: { id: row.id }, data });
        }
      }
    }
    if (questionsCreated > 0) console.log(`  + ${questionsCreated} question(s)`);
    const strays = dbQuestions.filter((q: QuestionRow) => !seedKeys.has(`${q.concept.slug}::${q.questionText}`));
    for (const s of strays) {
      console.log(`  ? stray question, in the database but not the seed file: [${s.concept.slug}] ${s.questionText.slice(0, 70)}`);
    }

    console.log(
      `${apply ? "Applied" : "Would apply"}: sections +${sectionsCreated} ~${sectionsUpdated}, ` +
        `concepts +${conceptsCreated} ~${conceptsUpdated}, relations +${relationsCreated}, ` +
        `questions +${questionsCreated} ~${questionsUpdated}, strays ${strays.length}`,
    );
    if (!apply) console.log("Dry run only. Re-run with --apply to write.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
