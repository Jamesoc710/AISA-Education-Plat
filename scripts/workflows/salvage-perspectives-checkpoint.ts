/**
 * Salvage completed Perspectives work from a workflow output file into a durable,
 * disk-backed checkpoint, so the expensive research is never lost to a context reset
 * or a flaky workflow resume cache.
 *
 * Merges one or more output files (later files win when more complete) and the
 * canonical input (for name/category/whatItIs/whatsHappening). For each trend it
 * keeps: the gate decision (shape, stances, leans, rationale, contestedness), the
 * full researched `camps`, the `campVerify`, and the finished `perspectives` +
 * `finalVerify` when synth already succeeded.
 *
 *   npx tsx scripts/workflows/salvage-perspectives-checkpoint.ts <out1> [out2 ...]
 *
 * Output: docs/research/perspectives-checkpoint.json
 *   { generatedFrom: [...], trends: { <slug>: { ...everything needed to finish } } }
 */
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const root = process.cwd();
const INPUT = join(root, "docs/research/perspectives-input.json");
const OUT = join(root, "docs/research/perspectives-checkpoint.json");

const outFiles = process.argv.slice(2);
if (outFiles.length === 0) throw new Error("pass at least one workflow output file path");

const input: any[] = JSON.parse(readFileSync(INPUT, "utf8"));
const inputBySlug = new Map(input.map((t) => [t.slug, t]));

function loadResults(path: string): any[] {
  const parsed = JSON.parse(readFileSync(path, "utf8"));
  const arr = Array.isArray(parsed) ? parsed : parsed.result;
  if (!Array.isArray(arr)) throw new Error(`no result array in ${path}`);
  return arr;
}

// completeness score: a synth'd trend beats a research-only trend beats nothing
function score(r: any): number {
  if (!r) return -1;
  const hasPersp = r.perspectives && Array.isArray(r.perspectives.stances) && r.perspectives.stances.length > 0;
  const hasCamps = Array.isArray(r.camps) && r.camps.length > 0 || hasPersp;
  let s = 0;
  if (hasCamps) s += 1;
  if (r.campVerify) s += 1;
  if (hasPersp) s += 4;
  if (r.finalVerify) s += 2;
  return s;
}

// Per-FIELD best-of across all output versions of a trend. We cannot pick one
// version wholesale: the synth-success return path does not re-emit `camps`, while
// the synth-failed path does. finalVerify needs the source camps, so we union the
// best non-empty value of each field independently across versions.
const versions = new Map<string, any[]>();
for (const path of outFiles) {
  for (const r of loadResults(path)) {
    if (!r || !r.slug) continue;
    if (!versions.has(r.slug)) versions.set(r.slug, []);
    versions.get(r.slug)!.push(r);
  }
}

const best = new Map<string, any>();
for (const [slug, vs] of versions) {
  const ranked = [...vs].sort((a, b) => score(b) - score(a));
  const merged: any = { slug };
  const pick = (key: string, ok: (v: any) => boolean) => {
    for (const v of ranked) if (v[key] != null && ok(v[key])) return v[key];
    return null;
  };
  merged.name = pick("name", () => true);
  merged.shape = pick("shape", () => true);
  merged.contestedness = pick("contestedness", () => true);
  merged.rationale = pick("rationale", (v) => String(v).length > 0);
  merged.leans = pick("leans", (v) => String(v).length > 0);
  merged.camps = pick("camps", (v) => Array.isArray(v) && v.length > 0);
  merged.campVerify = pick("campVerify", () => true);
  merged.perspectives = pick("perspectives", (v) => v && Array.isArray(v.stances) && v.stances.length > 0);
  merged.finalVerify = pick("finalVerify", () => true);
  best.set(slug, merged);
}

const trends: Record<string, any> = {};
let done = 0;
let researchOnly = 0;
let missing = 0;

for (const slug of inputBySlug.keys()) {
  const r = best.get(slug);
  const inp = inputBySlug.get(slug)!;
  if (!r) {
    missing++;
    trends[slug] = { slug, name: inp.name, category: inp.category, status: "missing-from-outputs" };
    continue;
  }
  const hasPersp = r.perspectives && Array.isArray(r.perspectives.stances) && r.perspectives.stances.length > 0;
  // camps may live on r.camps (synth-failed) — when synth succeeded the raw camps
  // are not re-emitted, so carry whatever is present.
  const camps = Array.isArray(r.camps) ? r.camps : null;
  const status = hasPersp ? (r.finalVerify ? "done" : "synth-done-no-final") : (camps ? "research-only" : "incomplete");
  if (hasPersp) done++;
  else if (camps) researchOnly++;
  else missing++;

  trends[slug] = {
    slug,
    name: inp.name,
    category: inp.category,
    whatItIs: inp.whatItIs,
    whatsHappening: inp.whatsHappening,
    status,
    shape: r.shape ?? null,
    contestedness: r.contestedness ?? null,
    leans: r.leans ?? (r.perspectives ? r.perspectives.leans : null),
    rationale: r.rationale ?? null,
    camps, // full researched camps (evidence + sources); null if only synth survived
    campVerify: r.campVerify ?? null,
    perspectives: hasPersp ? r.perspectives : null,
    finalVerify: r.finalVerify ?? null,
  };
}

writeFileSync(OUT, JSON.stringify({ generatedFrom: outFiles, trends }, null, 2));
console.log(`wrote ${OUT}`);
console.log(`  done (synth complete):     ${done}`);
console.log(`  research-only (need synth): ${researchOnly}`);
console.log(`  missing/incomplete:        ${missing}`);
console.log(`  total:                     ${Object.keys(trends).length}`);

const needSynth = Object.values(trends).filter((t: any) => t.status === "research-only" || t.status === "incomplete");
if (needSynth.length) {
  console.log("\n  need synth+final:");
  for (const t of needSynth as any[]) console.log(`    - ${t.slug} (${t.shape}, camps=${t.camps ? t.camps.length : 0})`);
}
