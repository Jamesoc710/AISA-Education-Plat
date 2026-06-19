/**
 * Inspect a Perspectives workflow output file and print a per-trend status table:
 * did synth succeed (perspectives present), shape, finalVerify.ok / dashClean,
 * campVerify status, or which stage errored. Read-only.
 *
 *   npx tsx scripts/workflows/analyze-perspectives-output.ts <path-to-output-file>
 */
import { readFileSync } from "fs";

const path = process.argv[2];
if (!path) throw new Error("pass the output file path");

const raw = readFileSync(path, "utf8");
let parsed: any;
try {
  parsed = JSON.parse(raw);
} catch (e) {
  throw new Error("could not JSON.parse output file: " + (e as Error).message);
}
const results: any[] = Array.isArray(parsed) ? parsed : parsed.result;
if (!Array.isArray(results)) throw new Error("no result array found");

let done = 0;
let skip = 0;
let needsWork = 0;
const rows: string[] = [];

for (const r of results) {
  const slug = r.slug;
  const hasPersp = r.perspectives && Array.isArray(r.perspectives.stances) && r.perspectives.stances.length > 0;
  const isSkip = r.shape === "skip" || (r.perspectives === null && !r.error);
  const err = r.error;
  const fv = r.finalVerify;
  const cv = r.campVerify;

  let status: string;
  if (isSkip) {
    status = "SKIP";
    skip++;
  } else if (err) {
    status = `ERROR(${err})`;
    needsWork++;
  } else if (hasPersp) {
    status = "DONE";
    done++;
  } else {
    status = "INCOMPLETE(no perspectives, no error)";
    needsWork++;
  }

  const campsN = Array.isArray(r.camps) ? r.camps.length : (hasPersp ? r.perspectives.stances.length : 0);
  const fvStr = fv ? `fv.ok=${fv.ok} dashClean=${fv.dashClean}` : "fv=null";
  const cvStr = cv ? `cv.ok=${cv.overallOk} falseBal=${cv.falseBalance}` : "cv=null";
  rows.push(`${status.padEnd(28)} ${String(r.shape).padEnd(9)} camps=${campsN}  ${fvStr.padEnd(28)} ${cvStr.padEnd(24)} ${slug}`);
}

console.log(`Total trends in output: ${results.length}`);
console.log(`  DONE (perspectives + ran final verify): ${done}`);
console.log(`  SKIP (gate said skip): ${skip}`);
console.log(`  NEEDS WORK (errored / incomplete): ${needsWork}`);
console.log("");
for (const row of rows) console.log(row);

// Also flag any DONE trend with finalVerify problems
console.log("\n--- FLAGS (finalVerify.ok=false or dashClean=false among DONE) ---");
let flagged = 0;
for (const r of results) {
  const hasPersp = r.perspectives && Array.isArray(r.perspectives.stances) && r.perspectives.stances.length > 0;
  if (!hasPersp) continue;
  const fv = r.finalVerify;
  if (!fv || fv.ok === false || fv.dashClean === false) {
    flagged++;
    console.log(`  ${r.slug}: ${fv ? `ok=${fv.ok} dashClean=${fv.dashClean} issues=${JSON.stringify(fv.issues)}` : "finalVerify MISSING"}`);
  }
}
if (flagged === 0) console.log("  (none)");
