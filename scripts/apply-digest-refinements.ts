// Rewrite the TEXT of already-published digest editions from refined JSON.
//
// Usage:
//   npx tsx scripts/apply-digest-refinements.ts <refined.json> [more.json ...]          (dry run)
//   npx tsx scripts/apply-digest-refinements.ts --apply <refined.json> [more.json ...]
//
// Input: the refined-edition shape { weekOf, headline, items, quiz,
// bigPicture: { narrative, watchFor } } with the same items, in the same order,
// as the live row. Only wording changes: headline, item title / summary /
// whyItMatters, resource titles, the closer, and the quiz text. Every URL,
// sourceDomain, category, concept link, the item count and order, status and
// publishedAt stay exactly as stored; any mismatch aborts that file. Unpublished
// editions go through scripts/backfill-digest.ts instead.
import { readFileSync } from "fs";
import { createHash } from "crypto";
import { prisma } from "../lib/prisma";
import { cleanDigestText } from "../lib/text";
import type { DigestItem, DigestQuizQuestion } from "../lib/digest-sync";

type RefinedItem = {
  title: string;
  summary: string;
  whyItMatters: string;
  url: string;
  resources?: { title: string; url: string }[];
};
type Refined = {
  weekOf: string;
  headline: string;
  items: RefinedItem[];
  quiz: DigestQuizQuestion[] | null;
  bigPicture: { narrative: string; watchFor: string };
};

// Mirrors contentHashOf in lib/digest-sync.ts and scripts/backfill-digest.ts.
function contentHashOf(
  headline: string,
  items: DigestItem[],
  bigPicture: string,
  watchFor: string,
  quiz: DigestQuizQuestion[] | null,
): string {
  return createHash("sha256")
    .update(JSON.stringify({ headline, items, bigPicture, watchFor, quiz }))
    .digest("hex");
}

const clean = (s: unknown, max: number) => cleanDigestText(String(s ?? "").trim().slice(0, max));

async function apply(filePath: string, write: boolean): Promise<void> {
  console.log(`\n=== ${filePath}`);
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as Refined;
  const weekOf = new Date(`${raw.weekOf}T00:00:00.000Z`);
  const row = await prisma.digestEdition.findUnique({ where: { weekOf } });
  if (!row) throw new Error(`No edition for weekOf ${raw.weekOf}`);
  if (row.status !== "published") throw new Error(`weekOf ${raw.weekOf} is ${row.status}, not published`);

  const current = row.items as unknown as DigestItem[];
  if (!Array.isArray(raw.items) || raw.items.length !== current.length) {
    throw new Error(`Item count differs (live ${current.length}, refined ${raw.items?.length})`);
  }

  const items: DigestItem[] = current.map((live, i) => {
    const r = raw.items[i];
    if (r.url !== live.url) throw new Error(`Item ${i + 1} url differs: ${r.url} vs ${live.url}`);
    const liveRes = live.resources ?? [];
    const refinedRes = r.resources ?? [];
    if (refinedRes.length !== liveRes.length || refinedRes.some((x, j) => x.url !== liveRes[j].url)) {
      throw new Error(`Item ${i + 1} resources differ from the live row`);
    }
    return {
      ...live,
      title: clean(r.title, 200) || live.title,
      summary: clean(r.summary, 1200) || live.summary,
      whyItMatters: clean(r.whyItMatters, 800) || live.whyItMatters,
      resources: liveRes.map((res, j) => ({ ...res, title: clean(refinedRes[j].title, 200) || res.title })),
    };
  });

  let quiz: DigestQuizQuestion[] | null = null;
  if (Array.isArray(raw.quiz) && raw.quiz.length > 0) {
    quiz = raw.quiz.map((q, i) => {
      const options = q.options.map((o) => ({ text: clean(o.text, 200), isCorrect: Boolean(o.isCorrect) }));
      if (options.length !== 4 || options.filter((o) => o.isCorrect).length !== 1) {
        throw new Error(`Quiz question ${i + 1} needs 4 options with exactly one correct`);
      }
      return { question: clean(q.question, 300), options, explanation: clean(q.explanation, 400) };
    });
  }
  const liveQuizCount = Array.isArray(row.quiz) ? (row.quiz as unknown[]).length : 0;
  if ((quiz?.length ?? 0) !== liveQuizCount) {
    throw new Error(`Quiz length differs (live ${liveQuizCount}, refined ${quiz?.length ?? 0})`);
  }

  const headline = clean(raw.headline, 200);
  const bigPicture = clean(raw.bigPicture?.narrative, 3000);
  const watchFor = clean(raw.bigPicture?.watchFor, 300);
  if (!headline || (row.bigPicture && !bigPicture)) throw new Error("Missing headline or closer");

  const changed = [
    headline !== row.headline && "headline",
    JSON.stringify(items) !== JSON.stringify(current) && "items",
    bigPicture !== (row.bigPicture ?? "") && "closer",
    watchFor !== (row.watchFor ?? "") && "watchFor",
    JSON.stringify(quiz) !== JSON.stringify(row.quiz) && "quiz",
  ].filter(Boolean);
  console.log(`  ${current.length} items, ${quiz?.length ?? 0} quiz questions; changes: ${changed.join(", ") || "none"}`);
  console.log(`  headline: ${headline}`);

  if (!write || changed.length === 0) return;
  await prisma.digestEdition.update({
    where: { weekOf },
    data: {
      headline,
      items: items as unknown as object,
      bigPicture: row.bigPicture === null ? null : bigPicture,
      watchFor: row.watchFor === null ? null : watchFor,
      quiz: quiz === null ? undefined : (quiz as unknown as object),
      contentHash: contentHashOf(headline, items, bigPicture, watchFor, quiz),
    },
  });
  console.log("  UPDATED (still published)");
}

async function main() {
  const args = process.argv.slice(2);
  const write = args.includes("--apply");
  const files = args.filter((a) => a !== "--apply");
  if (files.length === 0) throw new Error("Pass one or more refined edition JSON files");
  console.log(write ? "APPLY" : "Dry run (pass --apply to write)");
  for (const f of files) await apply(f, write);
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
