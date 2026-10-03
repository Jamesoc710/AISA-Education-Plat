// One-shot backfill: insert reviewed digest-edition JSON files as draft rows.
//
// Usage:
//   npx tsx --env-file=.env scripts/backfill-digest.ts <edition.json> [more.json ...]
//
// Input file shape: { weekOf: "YYYY-MM-DD" (a Monday), headline, items, quiz,
// bigPicture: { narrative, watchFor } } — the same shape the LLM pipeline emits.
// A multi-week recap adds periodEnd: "YYYY-MM-DD" (the last Sunday it covers)
// and may carry up to RECAP_MAX_ITEMS items.
//
// Mirrors the post-generation half of generateDigest() in lib/digest-sync.ts:
// same sanitizer, URL verification (sourceDomain from the RESOLVED url, never
// input), catalog slug validation, item caps, closer-safe rule, and content
// hash, so backfilled rows are contract-identical to pipeline output. Always
// writes status=draft and never touches a published edition.
import { readFileSync } from "fs";
import { createHash } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { cleanDigestText } from "../lib/text";
import { verifyUrl } from "../lib/url";
import type {
  DigestCategory,
  DigestItem,
  DigestItemResource,
  DigestQuizQuestion,
} from "../lib/digest-sync";

// Caps mirrored from lib/digest-sync.ts
const MIN_ITEMS = 3;
const MAX_ITEMS = 7;
const RECAP_MAX_ITEMS = 10;
const RAW_ITEM_CAP = 10;
const MAX_RESOURCES_PER_ITEM = 2;
const VIDEO_HOST_RE = /(^|\.)(youtube\.com|youtu\.be|vimeo\.com)$/i;

interface ParsedResource {
  title: string;
  url: string;
  type: "article" | "video";
}

interface ParsedItem {
  title: string;
  summary: string;
  whyItMatters: string;
  url: string;
  category: DigestCategory | null;
  relatedConceptSlugs: string[];
  resources: ParsedResource[];
}

function parseQuiz(raw: unknown): DigestQuizQuestion[] | null {
  if (!Array.isArray(raw)) return null;
  const out: DigestQuizQuestion[] = [];
  for (const entry of raw.slice(0, 5)) {
    const q = entry as { question?: unknown; options?: unknown; explanation?: unknown };
    const question = cleanDigestText(String(q.question ?? "").trim().slice(0, 300));
    const explanation = cleanDigestText(String(q.explanation ?? "").trim().slice(0, 400));
    const options = (Array.isArray(q.options) ? q.options : []).slice(0, 4).map((o) => {
      const oo = o as { text?: unknown; isCorrect?: unknown };
      return {
        text: cleanDigestText(String(oo.text ?? "").trim().slice(0, 200)),
        isCorrect: oo.isCorrect === true,
      };
    });
    if (!question || !explanation || options.length !== 4) continue;
    if (options.some((o) => !o.text)) continue;
    if (options.filter((o) => o.isCorrect).length !== 1) continue;
    out.push({ question, options, explanation });
  }
  return out.length >= 3 ? out.slice(0, 4) : null;
}

function parseItems(raw: unknown): ParsedItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, RAW_ITEM_CAP).flatMap((entry): ParsedItem[] => {
    const e = entry as Record<string, unknown>;
    const title = cleanDigestText(String(e.title ?? "").trim().slice(0, 200));
    const summary = cleanDigestText(String(e.summary ?? "").trim().slice(0, 600));
    const whyItMatters = cleanDigestText(String(e.whyItMatters ?? "").trim().slice(0, 400));
    const url = String(e.url ?? "").trim();
    const category: DigestCategory | null =
      e.category === "ai" || e.category === "tech" || e.category === "markets"
        ? e.category
        : null;
    if (!title || !summary || !whyItMatters || !/^https?:\/\//i.test(url)) return [];
    const relatedConceptSlugs = (Array.isArray(e.relatedConceptSlugs) ? e.relatedConceptSlugs : [])
      .map((s) => String(s).trim())
      .filter(Boolean)
      .slice(0, 4);
    const resources = (Array.isArray(e.resources) ? e.resources : [])
      .slice(0, MAX_RESOURCES_PER_ITEM)
      .flatMap((res): ParsedResource[] => {
        const r = res as { title?: unknown; url?: unknown; type?: unknown };
        const rTitle = cleanDigestText(String(r.title ?? "").trim().slice(0, 200));
        const rUrl = String(r.url ?? "").trim();
        if (!rTitle || !/^https?:\/\//i.test(rUrl)) return [];
        return [{ title: rTitle, url: rUrl, type: r.type === "video" ? "video" : "article" }];
      });
    return [{ title, summary, whyItMatters, url, category, relatedConceptSlugs, resources }];
  });
}

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

function parseWeekOf(raw: unknown): Date {
  const s = String(raw ?? "").trim();
  const d = new Date(`${s}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(d.getTime())) {
    throw new Error(`Invalid weekOf "${s}" (expected YYYY-MM-DD)`);
  }
  if (d.getUTCDay() !== 1) {
    throw new Error(`weekOf ${s} is not a Monday`);
  }
  return d;
}

function parsePeriodEnd(raw: unknown, weekOf: Date): Date | null {
  if (raw === undefined || raw === null) return null;
  const s = String(raw).trim();
  const d = new Date(`${s}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(d.getTime())) {
    throw new Error(`Invalid periodEnd "${s}" (expected YYYY-MM-DD)`);
  }
  if (d.getUTCDay() !== 0) throw new Error(`periodEnd ${s} is not a Sunday`);
  // A recap spans at least two weeks; one week needs no periodEnd
  if (d.getTime() - weekOf.getTime() < 13 * 86400000) {
    throw new Error(`periodEnd ${s} must be at least two weeks after weekOf`);
  }
  return d;
}

async function backfill(filePath: string, catalogSlugs: Set<string>): Promise<void> {
  console.log(`\n=== ${filePath}`);
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as Record<string, unknown>;
  const weekOf = parseWeekOf(raw.weekOf);
  const periodEnd = parsePeriodEnd(raw.periodEnd, weekOf);
  const maxItems = periodEnd ? RECAP_MAX_ITEMS : MAX_ITEMS;

  const headline = cleanDigestText(String(raw.headline ?? "").trim().slice(0, 300));
  const bp = raw.bigPicture as { narrative?: unknown; watchFor?: unknown } | undefined;
  const narrative = cleanDigestText(String(bp?.narrative ?? "").trim().slice(0, 1500));
  const watchForText = cleanDigestText(String(bp?.watchFor ?? "").trim().slice(0, 300));
  const parsedItems = parseItems(raw.items);
  if (!headline || !narrative || parsedItems.length === 0) {
    throw new Error("File is missing headline, bigPicture.narrative, or items");
  }
  const parsedQuiz = parseQuiz(raw.quiz);

  const [itemChecks, resourceChecks] = await Promise.all([
    Promise.all(parsedItems.map((i) => verifyUrl(i.url))),
    Promise.all(parsedItems.map((i) => Promise.all(i.resources.map((r) => verifyUrl(r.url))))),
  ]);
  const seenUrls = new Set<string>();
  const items: DigestItem[] = [];
  parsedItems.forEach((item, idx) => {
    const rChecks = resourceChecks[idx];
    let check = itemChecks[idx];
    let promotedResourceIdx = -1;
    if (!check.ok) {
      promotedResourceIdx = rChecks.findIndex((rc) => rc.ok);
      if (promotedResourceIdx === -1) {
        console.warn(`  DROPPED (URL not reachable): ${item.url}`);
        return;
      }
      check = rChecks[promotedResourceIdx];
      console.warn(`  Source unreachable, promoted a resource: ${item.url} -> ${check.finalUrl}`);
    }
    if (seenUrls.has(check.finalUrl)) {
      console.warn(`  DROPPED (duplicate URL): ${item.url}`);
      return;
    }
    let sourceDomain: string;
    try {
      sourceDomain = new URL(check.finalUrl).hostname.replace(/^www\./, "");
    } catch {
      console.warn(`  DROPPED (unparseable final URL): ${check.finalUrl}`);
      return;
    }
    seenUrls.add(check.finalUrl);

    const resources: DigestItemResource[] = [];
    item.resources.forEach((res, rIdx) => {
      if (rIdx === promotedResourceIdx) return;
      const rCheck = rChecks[rIdx];
      if (!rCheck.ok) {
        console.warn(`  Dropped resource (URL not reachable): ${res.url}`);
        return;
      }
      if (rCheck.finalUrl === check.finalUrl || resources.some((r) => r.url === rCheck.finalUrl)) {
        return;
      }
      let rDomain: string;
      try {
        rDomain = new URL(rCheck.finalUrl).hostname.replace(/^www\./, "");
      } catch {
        return;
      }
      resources.push({
        title: res.title,
        url: rCheck.finalUrl,
        type: VIDEO_HOST_RE.test(new URL(rCheck.finalUrl).hostname) ? "video" : res.type,
        sourceDomain: rDomain,
      });
    });

    const unknownSlugs = item.relatedConceptSlugs.filter((s) => !catalogSlugs.has(s));
    if (unknownSlugs.length > 0) {
      console.warn(`  Dropped unknown concept slugs: ${unknownSlugs.join(", ")}`);
    }
    items.push({
      title: item.title,
      summary: item.summary,
      whyItMatters: item.whyItMatters,
      url: check.finalUrl,
      sourceDomain,
      category: item.category,
      relatedConceptSlugs: item.relatedConceptSlugs.filter((s) => catalogSlugs.has(s)).slice(0, 2),
      resources: resources.slice(0, MAX_RESOURCES_PER_ITEM),
    });
  });
  const finalItems = items.slice(0, maxItems);
  if (finalItems.length < MIN_ITEMS) {
    throw new Error(`Only ${finalItems.length}/${MIN_ITEMS} items survived URL verification`);
  }

  // Closer-safe rule: the narrative and quiz were written against the full
  // item list, so if verification dropped an item they may reference a story
  // the reader can't see. Omit them rather than persist dangling references.
  const closerSafe = finalItems.length === parsedItems.length;
  const bigPicture = closerSafe ? narrative : null;
  const watchFor = closerSafe ? watchForText || null : null;
  const quiz = closerSafe ? parsedQuiz : null;
  if (!closerSafe) {
    console.warn("  Items were dropped: omitting the big-picture closer and quiz");
  }

  const contentHash = contentHashOf(headline, finalItems, bigPicture ?? "", watchFor ?? "", quiz);
  const current = await prisma.digestEdition.findUnique({ where: { weekOf } });
  if (current && current.status === "published") {
    console.warn("  SKIPPED: edition for this week is already published, leaving it untouched");
    return;
  }
  if (current && current.contentHash === contentHash) {
    console.log("  Unchanged (same content hash), no write");
    return;
  }

  const data = {
    periodEnd,
    headline,
    items: finalItems as unknown as Prisma.InputJsonValue,
    bigPicture,
    watchFor,
    quiz: quiz ? (quiz as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
    contentHash,
    status: "draft",
    generatedAt: new Date(),
    publishedAt: null,
    searchesUsed: null,
    durationMs: null,
  };
  await prisma.digestEdition.upsert({
    where: { weekOf },
    create: { weekOf, ...data },
    update: data,
  });
  console.log(
    `  ${current ? "UPDATED" : "CREATED"} draft weekOf=${weekOf.toISOString().slice(0, 10)} ` +
      (periodEnd ? `periodEnd=${periodEnd.toISOString().slice(0, 10)} ` : "") +
      `items=${finalItems.length} quiz=${quiz ? quiz.length : 0} closer=${bigPicture ? "yes" : "no"}`,
  );
}

async function main() {
  const files = process.argv.slice(2);
  if (files.length === 0) {
    throw new Error("Usage: tsx scripts/backfill-digest.ts <edition.json> [more.json ...]");
  }
  const catalogRows = await prisma.concept.findMany({ select: { slug: true } });
  const catalogSlugs = new Set(catalogRows.map((c: { slug: string }) => c.slug));
  for (const file of files) {
    await backfill(file, catalogSlugs);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
