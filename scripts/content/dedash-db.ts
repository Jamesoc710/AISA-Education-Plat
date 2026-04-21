/**
 * Production DB dedash: apply the same em-dash transforms used on seed files
 * (scripts/content/dedash.ts) to every content row currently in the database.
 *
 * Why not just re-seed? prisma/seed.ts is destructive (deleteMany on every
 * user-facing table including QuizAttempt/Bookmark/MentorNote). Running it
 * against prod would wipe all recruit activity. This script UPDATEs content
 * fields in place, leaving user data untouched.
 *
 * Targets (all string-typed content fields):
 *   Tier.description
 *   Section.description
 *   Concept.subtitle, whatItIs, simpleExplanation, whyItMatters, goDeeper
 *   Resource.title, description
 *   Question.questionText, answerExplanation, options (JSON string)
 *
 * Usage:
 *   npx tsx scripts/content/dedash-db.ts --check    # dry-run, reports only
 *   npx tsx scripts/content/dedash-db.ts            # apply updates
 *
 * Requires DIRECT_URL (session-mode pooler) so transactions work.
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const RULES: Array<{ pattern: RegExp; replace: string }> = [
  { pattern: / — ([^—\n]{1,200}?) — /g, replace: " ($1) " },
  // acronym — Full Name (followed by punctuation or whitespace)
  { pattern: /\b([A-Z]{2,5}) — ([A-Z][A-Za-z]+(?:\s+[A-Za-z]+){0,4})(?=[,.)\s])/g, replace: "$1 ($2)" },
  { pattern: / — /g, replace: ", " },
  { pattern: /—/g, replace: "-" },
];

function dedash(s: string): string {
  let out = s;
  for (const r of RULES) out = out.replace(r.pattern, r.replace as string);
  return out;
}

function dedashNullable(s: string | null | undefined): string | null | undefined {
  if (s == null) return s;
  return dedash(s);
}

// Rewrite em dashes inside a JSON-encoded options array: [{text, isCorrect}, ...]
function dedashOptionsJson(json: string | null): string | null {
  if (!json) return json;
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return json;
    const rewritten = parsed.map((opt) =>
      typeof opt?.text === "string" ? { ...opt, text: dedash(opt.text) } : opt,
    );
    return JSON.stringify(rewritten);
  } catch {
    return json;
  }
}

type TableReport = { table: string; scanned: number; changed: number };

async function main() {
  const check = process.argv.includes("--check");

  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DIRECT_URL or DATABASE_URL must be set");
  const adapter = new PrismaPg({ connectionString: url });
  const prisma = new PrismaClient({ adapter });

  const reports: TableReport[] = [];

  // ── Tiers ───────────────────────────────────────────────────────────────
  {
    const rows = await prisma.tier.findMany();
    let changed = 0;
    for (const row of rows) {
      const nextDescription = dedash(row.description);
      if (nextDescription !== row.description) {
        changed++;
        if (!check) await prisma.tier.update({ where: { id: row.id }, data: { description: nextDescription } });
      }
    }
    reports.push({ table: "Tier", scanned: rows.length, changed });
  }

  // ── Sections ────────────────────────────────────────────────────────────
  {
    const rows = await prisma.section.findMany();
    let changed = 0;
    for (const row of rows) {
      const nextDescription = dedash(row.description);
      if (nextDescription !== row.description) {
        changed++;
        if (!check) await prisma.section.update({ where: { id: row.id }, data: { description: nextDescription } });
      }
    }
    reports.push({ table: "Section", scanned: rows.length, changed });
  }

  // ── Concepts ────────────────────────────────────────────────────────────
  {
    const rows = await prisma.concept.findMany();
    let changed = 0;
    for (const row of rows) {
      const next = {
        subtitle: dedash(row.subtitle),
        whatItIs: dedash(row.whatItIs),
        simpleExplanation: dedashNullable(row.simpleExplanation),
        whyItMatters: dedash(row.whyItMatters),
        goDeeper: dedashNullable(row.goDeeper),
      };
      const dirty =
        next.subtitle !== row.subtitle ||
        next.whatItIs !== row.whatItIs ||
        next.simpleExplanation !== row.simpleExplanation ||
        next.whyItMatters !== row.whyItMatters ||
        next.goDeeper !== row.goDeeper;
      if (dirty) {
        changed++;
        if (!check) await prisma.concept.update({ where: { id: row.id }, data: next });
      }
    }
    reports.push({ table: "Concept", scanned: rows.length, changed });
  }

  // ── Resources ───────────────────────────────────────────────────────────
  {
    const rows = await prisma.resource.findMany();
    let changed = 0;
    for (const row of rows) {
      const nextTitle = dedash(row.title);
      const nextDescription = dedashNullable(row.description);
      if (nextTitle !== row.title || nextDescription !== row.description) {
        changed++;
        if (!check) await prisma.resource.update({
          where: { id: row.id },
          data: { title: nextTitle, description: nextDescription },
        });
      }
    }
    reports.push({ table: "Resource", scanned: rows.length, changed });
  }

  // ── Questions ───────────────────────────────────────────────────────────
  {
    const rows = await prisma.question.findMany();
    let changed = 0;
    for (const row of rows) {
      const nextQuestionText = dedash(row.questionText);
      const nextAnswerExplanation = dedash(row.answerExplanation);
      const nextOptions = dedashOptionsJson(row.options);
      const dirty =
        nextQuestionText !== row.questionText ||
        nextAnswerExplanation !== row.answerExplanation ||
        nextOptions !== row.options;
      if (dirty) {
        changed++;
        if (!check) await prisma.question.update({
          where: { id: row.id },
          data: {
            questionText: nextQuestionText,
            answerExplanation: nextAnswerExplanation,
            options: nextOptions,
          },
        });
      }
    }
    reports.push({ table: "Question", scanned: rows.length, changed });
  }

  // ── Report ──────────────────────────────────────────────────────────────
  let totalChanged = 0;
  for (const r of reports) {
    console.log(`${r.table.padEnd(10)}  scanned=${r.scanned}  changed=${r.changed}`);
    totalChanged += r.changed;
  }
  console.log(`\n${check ? "[dry-run] " : ""}Rows with em dashes ${check ? "that would be" : ""} updated: ${totalChanged}`);

  await prisma.$disconnect();

  if (check && totalChanged > 0) {
    console.error("\nRun without --check to apply.");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
