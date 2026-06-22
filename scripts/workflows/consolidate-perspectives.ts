/**
 * Consolidate Perspectives workflow output(s) into the committable artifacts:
 *   - prisma/seed-data/trend-perspectives.ts  (slug -> TrendPerspectives | null)
 *   - docs/research/trend-perspectives.raw.json (slug -> rationale/campVerify/finalVerify)
 *
 * Merges any number of output files per-FIELD (best wins), so a later re-synth/fix
 * pass that produces a passing finalVerify supersedes an earlier flagged version
 * without losing camps/rationale. Order in the seed matches TREND_SEEDS.
 *
 * Runs a byte-level em/en dash sweep over the emitted seed (defense in depth on top
 * of the pipeline's finalVerify dashClean) and FAILS LOUD if any dash glyph slips in.
 *
 *   npx tsx scripts/workflows/consolidate-perspectives.ts <out1> [out2 ...]
 */
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { TREND_SEEDS } from "../../prisma/seed-data/trends";

const root = process.cwd();
const SEED_OUT = join(root, "prisma/seed-data/trend-perspectives.ts");
const RAW_OUT = join(root, "docs/research/trend-perspectives.raw.json");

const outFiles = process.argv.slice(2);
if (outFiles.length === 0) throw new Error("pass at least one workflow output file path");

function loadResults(path: string): any[] {
  const parsed = JSON.parse(readFileSync(path, "utf8"));
  const arr = Array.isArray(parsed) ? parsed : parsed.result;
  if (!Array.isArray(arr)) throw new Error(`no result array in ${path}`);
  return arr;
}

// Rank by what actually makes a version authoritative: having perspectives, and a
// PASSING finalVerify. Deliberately NOT by campVerify presence (a repaired re-synth
// drops campVerify, and it must still beat a flawed original that kept it). Ties
// (e.g. two non-passing versions) break by file/arg order via the stable sort, so
// pass fix outputs BEFORE the originals to let repaired copy win.
function score(r: any): number {
  if (!r) return -1;
  const hasPersp = r.perspectives && Array.isArray(r.perspectives.stances) && r.perspectives.stances.length > 0;
  let s = 0;
  if (hasPersp) s += 2;
  if (r.finalVerify && r.finalVerify.ok === true) s += 4; // a passing verify supersedes a flagged one
  return s;
}

const versions = new Map<string, any[]>();
for (const path of outFiles) {
  for (const r of loadResults(path)) {
    if (!r || !r.slug) continue;
    if (!versions.has(r.slug)) versions.set(r.slug, []);
    versions.get(r.slug)!.push(r);
  }
}

function mergeTrend(slug: string): any {
  const ranked = [...(versions.get(slug) || [])].sort((a, b) => score(b) - score(a));
  const pick = (key: string, ok: (v: any) => boolean) => {
    for (const v of ranked) if (v[key] != null && ok(v[key])) return v[key];
    return null;
  };
  return {
    slug,
    shape: pick("shape", () => true),
    contestedness: pick("contestedness", () => true),
    rationale: pick("rationale", (v) => String(v).length > 0),
    perspectives: pick("perspectives", (v) => v && Array.isArray(v.stances) && v.stances.length > 0),
    campVerify: pick("campVerify", () => true),
    finalVerify: pick("finalVerify", () => true),
  };
}

const EM = "—";
const EN = "–";
function dashHits(s: string): number {
  if (typeof s !== "string") return 0;
  return (s.match(/[—–]/g) || []).length;
}
function perspDashHits(p: any): string[] {
  const hits: string[] = [];
  if (!p) return hits;
  if (dashHits(p.intro)) hits.push("intro");
  if (dashHits(p.leans)) hits.push("leans");
  (p.stances || []).forEach((st: any, i: number) => {
    for (const f of ["label", "who", "summary", "body"]) if (dashHits(st[f])) hits.push(`stances[${i}].${f}`);
  });
  return hits;
}

// Build in TREND_SEEDS order.
const seedMap: Record<string, any> = {};
const rawMap: Record<string, any> = {};
const flags: { slug: string; ok: any; dashClean: any; issues: any }[] = [];
const dashProblems: { slug: string; where: string[] }[] = [];
let withPersp = 0;
let nullCount = 0;
let missing = 0;

for (const t of TREND_SEEDS) {
  const slug = t.slug;
  if (!versions.has(slug)) {
    missing++;
    seedMap[slug] = null;
    rawMap[slug] = { status: "missing-from-outputs" };
    continue;
  }
  const m = mergeTrend(slug);
  const isSkip = m.shape === "skip";
  const persp = isSkip ? null : m.perspectives;
  seedMap[slug] = persp ?? null;
  if (persp) {
    withPersp++;
    const dh = perspDashHits(persp);
    if (dh.length) dashProblems.push({ slug, where: dh });
  } else {
    nullCount++;
  }
  rawMap[slug] = {
    shape: m.shape,
    contestedness: m.contestedness,
    rationale: m.rationale,
    campVerify: m.campVerify,
    finalVerify: m.finalVerify,
  };
  const fv = m.finalVerify;
  if (persp && (!fv || fv.ok === false || fv.dashClean === false)) {
    flags.push({ slug, ok: fv ? fv.ok : "MISSING", dashClean: fv ? fv.dashClean : "MISSING", issues: fv ? fv.issues : [] });
  }
}

// Emit the seed .ts
// NOTE: this header preserves the prototype file's exported type surface
// (PerspectiveSource / PerspectiveStance / Perspectives), because
// scripts/seed-trend-perspectives.ts imports `{ TREND_PERSPECTIVES, type Perspectives }`.
const header = `// Curated Trend "Perspectives" (the detail-page accordion content).
// Source of truth + how this is produced: docs/plans/complete/PERSPECTIVES_PLAN.md.
//
// GENERATED by scripts/workflows/consolidate-perspectives.ts from the verified
// multi-agent pipeline (survey -> shape gate -> per-camp research -> camp verify ->
// synthesize -> final-copy verify), then curated. Each trend's rationale / campVerify
// / finalVerify live in the sibling docs/research/trend-perspectives.raw.json for the
// curation pass. scripts/seed-trend-perspectives.ts writes these to the \`perspectives\`
// column by slug and touches nothing else. A value of null means the shape gate said
// "skip" (no real debate), so no section renders for that trend. Zero em dashes and en
// dashes in any member-facing copy.

export type PerspectiveSource = { title: string; url: string };

export type PerspectiveStance = {
  label: string; // trend-specific stance label
  who: string; // attribution: camp / archetype / verified orgs
  summary: string; // ONE sentence, shown in the collapsed box
  body: string; // the fuller reasoning, shown when expanded
  sources: PerspectiveSource[]; // 0-2 real "further reading" links
};

export type Perspectives = {
  shape: "binary" | "multiple" | "tradeoff";
  intro: string; // one-sentence framing of the fight (may be empty)
  stances: PerspectiveStance[];
  leans: string; // honest synthesis, or "genuinely contested"
};

export const TREND_PERSPECTIVES: Record<string, Perspectives | null> = ${JSON.stringify(seedMap, null, 2)};
`;

writeFileSync(SEED_OUT, header);
writeFileSync(RAW_OUT, JSON.stringify(rawMap, null, 2));

console.log(`wrote ${SEED_OUT}`);
console.log(`wrote ${RAW_OUT}`);
console.log(`  trends with perspectives: ${withPersp}`);
console.log(`  null (skip/missing):      ${nullCount}`);
console.log(`  missing from outputs:     ${missing}`);
console.log(`  flagged (finalVerify):    ${flags.length}`);

if (dashProblems.length) {
  console.error(`\n✗ DASH SWEEP FAILED on emitted seed (${dashProblems.length} trends):`);
  for (const d of dashProblems) console.error(`    ${d.slug}: ${d.where.join(", ")}`);
  process.exitCode = 2;
} else {
  console.log(`\n✓ dash sweep clean: no em/en dashes in any emitted perspectives copy`);
}

if (flags.length) {
  console.log(`\n--- FLAGS (finalVerify.ok=false or dashClean=false) ---`);
  for (const f of flags) {
    console.log(`  ${f.slug}: ok=${f.ok} dashClean=${f.dashClean} (${Array.isArray(f.issues) ? f.issues.length : 0} issues)`);
  }
}
