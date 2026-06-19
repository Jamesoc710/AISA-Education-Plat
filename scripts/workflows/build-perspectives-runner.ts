/**
 * One-shot generator: produce a self-contained Perspectives workflow runner with the
 * 22 trends embedded, so the Workflow tool does not depend on the (size-limited) `args`
 * channel. Reads the canonical perspectives.workflow.js and swaps the single
 * `const TRENDS = Array.isArray(args) ? args : []` line for an embedded JSON literal
 * taken verbatim from docs/research/perspectives-input.json (no transcription).
 *
 *   npx tsx scripts/workflows/build-perspectives-runner.ts
 *
 * Output: scripts/workflows/perspectives.run.generated.js
 */
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const root = process.cwd();
const SRC = join(root, "scripts/workflows/perspectives.workflow.js");
const INPUT = join(root, "docs/research/perspectives-input.json");
const OUT = join(root, "scripts/workflows/perspectives.run.generated.js");

const src = readFileSync(SRC, "utf8");
const trends = JSON.parse(readFileSync(INPUT, "utf8"));
if (!Array.isArray(trends) || trends.length === 0) {
  throw new Error("perspectives-input.json is empty or not an array");
}

const needle = "const TRENDS = Array.isArray(args) ? args : []";
if (!src.includes(needle)) {
  throw new Error(`could not find the TRENDS line to replace in ${SRC}`);
}

const embedded =
  `const TRENDS = ${JSON.stringify(trends, null, 2)} // embedded by build-perspectives-runner.ts`;

const out = src.replace(needle, embedded);
writeFileSync(OUT, out);
console.log(`wrote ${OUT} with ${trends.length} trends embedded`);
