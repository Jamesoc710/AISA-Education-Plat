/**
 * Remove em dashes from user-facing content.
 *
 * Rules (applied in order):
 *   1. Paired em-dashes (parenthetical)      " — X — "    →  " (X) "
 *   2. Acronym expansion  "XYZ — Full Name"               →  "XYZ (Full Name)"
 *   3. Remaining single em-dashes " — "                    →  ", "
 *   4. Em-dash with no surrounding spaces (defensive)      →  " - "
 *
 * Run with --check to dry-run (exits 1 if any em dashes remain).
 */

import { readFileSync, writeFileSync } from "node:fs";

// Only files whose em dashes reach users (rendered content or LLM prompts
// that shape AI-written feedback). Pure code-comment files are excluded.
const TARGETS = [
  "prisma/seed-data/curriculum.ts",
  "prisma/seed-data/questions.ts",
  "prisma/seed-data/simple-explanations.ts",
  "prisma/seed-data/simple-explanations-review.json",
  "prisma/seed-data/resources.ts",
  "lib/schedule-sync.ts",
  "lib/grading.ts",
];

// Files where an em dash is intentional and must be preserved.
// We rewrite the specific approved string to a sentinel, dedash the rest,
// then restore the sentinel.
const PROTECTED: Array<{ file: string; match: string; sentinel: string }> = [
  // Calendar: "Spring 2026 — synced from TCO Master Calendar"
  // Handled at UI layer (components/calendar-client.tsx) — listed here for parity
  // if that string is ever moved into content data.
];

const RULES: Array<{ name: string; pattern: RegExp; replace: string | ((m: string, ...g: string[]) => string) }> = [
  {
    name: "paired em-dash → parens",
    pattern: / — ([^—\n]{1,200}?) — /g,
    replace: " ($1) ",
  },
  {
    name: "acronym — Full Name → acronym (Full Name)",
    // e.g. "BPE — Byte Pair Encoding", "RAG — Retrieval Augmented Generation"
    pattern: /\b([A-Z]{2,5}) — ([A-Z][A-Za-z]+(?:\s+[A-Za-z]+){0,4})(?=[,.)\s])/g,
    replace: "$1 ($2)",
  },
  {
    name: "single em-dash → comma",
    pattern: / — /g,
    replace: ", ",
  },
  {
    name: "defensive: any remaining em-dash → hyphen",
    pattern: /—/g,
    replace: "-",
  },
];

function dedash(content: string): { result: string; counts: Record<string, number> } {
  const counts: Record<string, number> = {};
  let result = content;
  for (const rule of RULES) {
    const matches = result.match(rule.pattern);
    counts[rule.name] = matches?.length ?? 0;
    result = result.replace(rule.pattern, rule.replace as string);
  }
  return { result, counts };
}

function main() {
  const check = process.argv.includes("--check");
  let totalChanged = 0;
  const fileReports: Array<{ file: string; total: number; per: Record<string, number> }> = [];

  for (const file of TARGETS) {
    let content: string;
    try {
      content = readFileSync(file, "utf8");
    } catch (e) {
      console.error(`SKIP ${file}: ${(e as Error).message}`);
      continue;
    }
    const { result, counts } = dedash(content);
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    if (total > 0) {
      fileReports.push({ file, total, per: counts });
      totalChanged += total;
      if (!check) writeFileSync(file, result);
    }
  }

  // Print per-file summary
  for (const r of fileReports) {
    const perStr = Object.entries(r.per)
      .filter(([, n]) => n > 0)
      .map(([k, n]) => `${k.split(" → ")[0]}: ${n}`)
      .join(", ");
    console.log(`${r.file}  (${r.total})  ${perStr}`);
  }

  console.log(`\n${check ? "[dry-run] " : ""}Total rewrites: ${totalChanged}`);

  if (check && totalChanged > 0) {
    console.error("\nEm dashes still present. Run without --check to fix.");
    process.exit(1);
  }
}

main();
