/**
 * Build the input for the Perspectives generation workflow.
 *
 * Reads the canonical TREND_SEEDS and writes the minimal fields the workflow needs
 * ({ slug, name, category, whatItIs, whatsHappening }) to a JSON file. No DB. The
 * orchestrating chat then passes the file's contents as the Workflow `args`.
 *
 *   npx tsx scripts/extract-trends-for-perspectives.ts [--only slug,slug]
 *
 * Output: docs/research/perspectives-input.json
 */
import { writeFileSync } from "fs";
import { join } from "path";
import { TREND_SEEDS } from "../prisma/seed-data/trends";

const OUT = join(process.cwd(), "docs/research/perspectives-input.json");

function main() {
  const argv = process.argv.slice(2);
  const onlyIdx = argv.indexOf("--only");
  const only =
    onlyIdx !== -1
      ? new Set((argv[onlyIdx + 1] ?? "").split(",").map((s) => s.trim()).filter(Boolean))
      : null;

  const trends = TREND_SEEDS.filter((t) => (only ? only.has(t.slug) : true)).map((t) => ({
    slug: t.slug,
    name: t.name,
    category: t.category,
    whatItIs: t.whatItIs,
    whatsHappening: t.whatsHappening,
  }));

  if (only && trends.length !== only.size) {
    const missing = [...only].filter((s) => !trends.some((t) => t.slug === s));
    console.warn(`  ! some --only slugs not found: ${missing.join(", ")}`);
  }

  writeFileSync(OUT, JSON.stringify(trends, null, 2));
  console.log(`✅ wrote ${trends.length} trends to ${OUT}`);
  console.log("   Pass this file's contents as the Workflow `args`.");
}

main();
