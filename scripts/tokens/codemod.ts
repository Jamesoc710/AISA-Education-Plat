/**
 * Token codemod — rewrites inline style magic numbers to design tokens.
 *
 * Targets CSS-like property positions in .ts/.tsx files:
 *   - borderRadius / borderTopLeftRadius / ...
 *   - fontSize
 *   - gap / rowGap / columnGap
 *   - padding / paddingTop / paddingBottom / paddingLeft / paddingRight (single-numeric only)
 *   - marginTop / marginBottom / marginLeft / marginRight (single-numeric, non-zero only)
 *
 * Leaves untouched:
 *   - String values ("14px 16px")
 *   - Non-matching numbers (e.g. borderRadius: 17 — logs as unmatched)
 *   - `999` (pure circles)
 *   - `0` resets
 *   - Non-CSS numeric props (rows={}, minLength={}, etc.)
 *
 * Usage:
 *   npx tsx scripts/tokens/codemod.ts <glob-pattern>
 *   npx tsx scripts/tokens/codemod.ts "components/ui/**\/*.tsx"
 *   npx tsx scripts/tokens/codemod.ts "components/home-client.tsx"
 *
 * Flags:
 *   --dry    Print what would change but do not write.
 *   --quiet  Only print totals, not per-replacement log.
 */

import { readFileSync, writeFileSync, statSync } from "node:fs";
import * as nodeFs from "node:fs";

// globSync is Node 22+ (stable in 23+); @types/node lags. Typed via assertion.
const globSync = (nodeFs as unknown as {
  globSync: (pattern: string, options?: { nodir?: boolean }) => string[];
}).globSync;

// ── Mappings (from docs/design-tokens.md) ────────────────────────────────────

const RADIUS_MAP: Record<string, string | null> = {
  "1": "--radius-1",
  "1.5": "--radius-1",
  "3": "--radius-1",
  "4": "--radius-1",
  "5": "--radius-1",
  "6": "--radius-1",
  "7": "--radius-2",
  "8": "--radius-2",
  "9": "--radius-2",
  "10": "--radius-2",
  "12": "--radius-3",
  "14": "--radius-3",
  "16": "--radius-3",
  "22": "--radius-3",
  "999": null, // literal
};

const TYPE_MAP: Record<string, string> = {
  "10": "--text-xs",
  "10.5": "--text-xs",
  "11": "--text-xs",
  "11.5": "--text-xs",
  "12": "--text-xs",
  "12.5": "--text-sm",
  "13": "--text-sm",
  "13.5": "--text-sm",
  "14": "--text-base",
  "14.5": "--text-base",
  "15": "--text-md",
  "15.5": "--text-md",
  "16": "--text-md",
  "17": "--text-md",
  "18": "--text-md",
  "20": "--text-lg",
  "22": "--text-lg",
  "24": "--text-xl",
  "26": "--text-xl",
  "28": "--text-2xl",
  "30": "--text-2xl",
  "32": "--text-3xl",
  "36": "--text-3xl",
  "56": "--text-display",
};

const SPACE_MAP: Record<string, string | null> = {
  "0": null, // literal
  "2": "--space-1",
  "4": "--space-1",
  "5": "--space-2",
  "6": "--space-2",
  "7": "--space-2",
  "8": "--space-2",
  "9": "--space-3",
  "10": "--space-3",
  "12": "--space-3",
  "14": "--space-4",
  "16": "--space-4",
  "18": "--space-5",
  "20": "--space-5",
  "24": "--space-5",
  "28": "--space-6",
  "32": "--space-6",
  "48": "--space-7",
  "80": "--space-8",
};

// ── Property families ────────────────────────────────────────────────────────

const RADIUS_PROPS = [
  "borderRadius",
  "borderTopLeftRadius",
  "borderTopRightRadius",
  "borderBottomLeftRadius",
  "borderBottomRightRadius",
];

const TYPE_PROPS = ["fontSize"];

const SPACE_PROPS = [
  "gap",
  "rowGap",
  "columnGap",
  "padding",
  "paddingTop",
  "paddingBottom",
  "paddingLeft",
  "paddingRight",
  "paddingInline",
  "paddingBlock",
  "marginTop",
  "marginBottom",
  "marginLeft",
  "marginRight",
  "top",
  "right",
  "bottom",
  "left",
];

// Note: `margin:` (shorthand) omitted — it's almost always a string or 0,
// and single-numeric margin: is rare. Same for width/height which are usually
// content-sized, not space-scale-sized.

// ── Codemod ──────────────────────────────────────────────────────────────────

interface Stats {
  byToken: Record<string, number>;
  unmatched: Array<{ file: string; prop: string; value: string; line: number }>;
  filesTouched: string[];
}

function buildPropRegex(props: string[]): RegExp {
  // Matches  `<prop>:\s*<number>,` or `<prop>:\s*<number>\n` etc.
  const alt = props.join("|");
  return new RegExp(
    `(\\b(?:${alt}))(\\s*:\\s*)([0-9]+(?:\\.[0-9]+)?)(\\s*[,;\\n}])`,
    "g",
  );
}

function rewriteFile(filePath: string, stats: Stats): string | null {
  const src = readFileSync(filePath, "utf8");
  let out = src;
  let changed = false;

  const apply = (
    props: string[],
    map: Record<string, string | null>,
    kind: string,
  ) => {
    const re = buildPropRegex(props);
    out = out.replace(re, (match, prop, sep, value, tail) => {
      if (!(value in map)) {
        const line = src.slice(0, src.indexOf(match)).split("\n").length;
        stats.unmatched.push({ file: filePath, prop, value, line });
        return match;
      }
      const token = map[value];
      if (token === null) {
        // Literal pass-through (0, 999)
        return match;
      }
      stats.byToken[token] = (stats.byToken[token] || 0) + 1;
      changed = true;
      return `${prop}${sep}"var(${token})"${tail}`;
    });
  };

  apply(RADIUS_PROPS, RADIUS_MAP, "radius");
  apply(TYPE_PROPS, TYPE_MAP, "type");
  apply(SPACE_PROPS, SPACE_MAP, "space");

  return changed ? out : null;
}

// ── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const dry = args.includes("--dry");
  const quiet = args.includes("--quiet");
  const patterns = args.filter((a) => !a.startsWith("--"));

  if (patterns.length === 0) {
    console.error(
      "Usage: npx tsx scripts/tokens/codemod.ts <glob> [--dry] [--quiet]",
    );
    process.exit(1);
  }

  const files = patterns.flatMap((p) =>
    globSync(p, { nodir: true }).filter(
      (f: string) => /\.(ts|tsx)$/.test(f) && !f.includes("node_modules"),
    ),
  );

  if (files.length === 0) {
    console.error(`No files matched: ${patterns.join(", ")}`);
    process.exit(1);
  }

  const stats: Stats = { byToken: {}, unmatched: [], filesTouched: [] };

  for (const f of files) {
    try {
      if (!statSync(f).isFile()) continue;
    } catch {
      continue;
    }
    const result = rewriteFile(f, stats);
    if (result !== null) {
      stats.filesTouched.push(f);
      if (!dry) writeFileSync(f, result);
    }
  }

  const totalRewrites = Object.values(stats.byToken).reduce((a, b) => a + b, 0);

  console.log(`\n=== Token codemod ${dry ? "(DRY RUN)" : "(applied)"} ===`);
  console.log(`Files scanned:  ${files.length}`);
  console.log(`Files modified: ${stats.filesTouched.length}`);
  console.log(`Total rewrites: ${totalRewrites}`);

  if (!quiet) {
    console.log("\nBy token:");
    const sorted = Object.entries(stats.byToken).sort((a, b) => b[1] - a[1]);
    for (const [tok, n] of sorted) {
      console.log(`  ${tok.padEnd(20)} ${n}`);
    }
  }

  if (stats.unmatched.length) {
    console.log(`\nUnmatched (${stats.unmatched.length} — manual review):`);
    const bucket: Record<string, number> = {};
    for (const u of stats.unmatched) {
      const k = `${u.prop}: ${u.value}`;
      bucket[k] = (bucket[k] || 0) + 1;
    }
    for (const [k, n] of Object.entries(bucket).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${k.padEnd(30)} x ${n}`);
    }
  }

  if (dry) {
    console.log("\n(dry run — no files written)");
  }
}

main();
