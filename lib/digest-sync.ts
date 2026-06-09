import { createHash } from "crypto";
import Anthropic from "@anthropic-ai/sdk";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

// ─── "This Week in Tech" digest sync ────────────────────────────────────────
// Clone of the schedule-sync live-data pipeline (docs/EXPANSION.md §6.1):
// one Claude call with web search → strict JSON → URL-verify every item →
// content-hash skip → upsert by weekOf as a DRAFT. Publishing is a separate,
// human admin action — this module never sets status to "published".

const MODEL = "claude-opus-4-8";
// 20250305, not 20260209: the newer version's dynamic-filtering rounds pushed a
// live run to ~410s, past any Vercel function ceiling. Plain search is fast.
const WEB_SEARCH_TOOL = "web_search_20250305" as const;
const WEB_SEARCH_MAX_USES = 10; // $10 per 1,000 searches → ≤ $0.10/run hard cap
const MAX_API_CALLS = 4; // pause_turn continuation bound — this run's LLM_CAP
// Adaptive thinking shares this budget with the ~4K JSON output, and thinking
// depth varies run to run (12000 truncated once). Streaming lifts the SDK's
// non-streaming cap; this is now mostly a per-run output-cost ceiling (~$0.60).
const MAX_TOKENS = 24000;
const MIN_ITEMS = 3; // fewer verified items than this = failed run, no write
const MAX_ITEMS = 7;
const RAW_ITEM_CAP = 10; // accept a few extra pre-verification, trim after
const MAX_RESOURCES_PER_ITEM = 2;
const URL_TIMEOUT_MS = 8000;

export interface DigestItemResource {
  title: string;
  url: string;
  type: "article" | "video";
  sourceDomain: string;
}

export interface DigestItem {
  title: string;
  summary: string;
  whyItMatters: string;
  url: string;
  sourceDomain: string; // hostname of the URL the fetch actually resolved to
  resources: DigestItemResource[]; // go-deeper links, URL-verified like the source
}

export interface DigestSyncResult {
  ok: boolean;
  weekOf: string; // ISO — Monday 00:00 UTC of the digest week
  outcome: "created" | "updated" | "cached" | "skipped_published" | "failed";
  headline: string | null;
  itemCount: number;
  dropped: number; // items removed by URL verification / dedupe
  searchesUsed: number;
  apiCalls: number;
  errors: string[];
  durationMs: number;
}

/** Monday 00:00 UTC of the week containing `now` (calendar weeks are Mon-anchored). */
export function getDigestWeekOf(now: Date = new Date()): Date {
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  return monday;
}

// NOTE: deliberately dash-free. Models mirror prompt style, and the digest's
// style rule bans em and en dashes in output.
const SYSTEM_PROMPT = `You are curating "This Week in Tech", a weekly news digest for TCO (Tech Collective Org), a university tech club. Members come from mixed, often non-technical backgrounds: assume no prior knowledge, and gloss any jargon in plain English. No hype, no clickbait.

Use web search to find what ACTUALLY happened in the last 7 days. Cover a mix across three areas: AI (2-3 items), broader tech (1-2 items), and capital markets / venture capital (1-2 items).

Pick the 5-7 most notable items. For each item provide:
- "title": a clear, factual headline (max ~15 words).
- "summary": 2-3 plain-English sentences on what happened. Facts only; save the significance for the next field.
- "whyItMatters": 1-2 sentences on why a student or club member should care about this.
- "url": the source article's URL copied EXACTLY from a web search result. Never construct, shorten, or guess a URL.
- "resources": 1-2 supplementary links that help a member go deeper. Prefer one accessible explainer article, plus one video when a good one exists. Each resource is { "title": string, "url": string, "type": "article" | "video" }. Resource URLs must also be copied EXACTLY from web search results, never invented.

Prefer primary sources, meaning the outlet that actually reported the story, over aggregator "news roundup" pages. Use at most one item from any aggregator or roundup site.

Style rule: never use em dashes or en dashes anywhere in your output. Use commas, periods, or parentheses instead, and write number ranges with a plain hyphen (like 5-7). Never include citation markup (like <cite> tags or reference indexes) inside any JSON string; write plain text only.

Also provide "headline": one sentence (max ~20 words) capturing the week's overall story.

Finally provide "bigPicture", the digest's closing section:
- "narrative": 1-2 short paragraphs (separated by a blank line) that connect this week's stories into a larger story: the through-line, where the stories reinforce or cut against each other, and what they signal about where AI, tech, and the markets are heading. Synthesize, never recap. Refer to stories in passing (like "the IPO wave"), never re-summarize them. Ground every claim in the items above and introduce no new facts.
- "watchFor": one sentence pointing at the most concrete upcoming thing from these stories that a member should watch (a date, a decision, a launch).

Output STRICT JSON only, no markdown fences, no prose before or after the object:
{ "headline": string, "items": [ { "title": string, "summary": string, "whyItMatters": string, "url": string, "resources": [ { "title": string, "url": string, "type": "article" | "video" } ] } ], "bigPicture": { "narrative": string, "watchFor": string } }`;

// Surrounding prose can contain braces (a live run emitted text after the
// JSON and broke a naive first-"{"-to-last-"}" slice), so scan for every
// balanced top-level {...} and keep the last one shaped like a digest.
function* balancedJsonCandidates(text: string): Generator<string> {
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      if (depth > 0) inString = true;
    } else if (ch === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === "}" && depth > 0) {
      depth--;
      if (depth === 0 && start !== -1) {
        yield text.slice(start, i + 1);
        start = -1;
      }
    }
  }
}

// Backstop for the prompt's no-dash style rule: em/en dashes between digits
// become hyphens (5-7), every other em/en dash becomes a comma pause.
function stripDashes(s: string): string {
  return s
    .replace(/(\d)\s*[–—]\s*(\d)/g, "$1-$2")
    .replace(/\s*[–—]\s*/g, ", ")
    .replace(/,\s*,/g, ", ")
    .replace(/^,\s*/, "")
    .replace(/[,\s]+$/, "");
}

// With the web_search tool active the model writes internal citation markup
// (<cite index="...">...</cite>). Inside JSON strings the API can't lift it
// into citation metadata, so it leaks through as literal text. Strip it, then
// apply the dash rule. Newlines are preserved (paragraph breaks are real).
export function cleanDigestText(s: string): string {
  // ">?" because a length cap can slice a tag in half, leaving it unclosed
  return stripDashes(
    s.replace(/<\/?cite\b[^>]*>?/gi, "").replace(/[ \t]{2,}/g, " "),
  );
}

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
  resources: ParsedResource[];
}

interface ParsedDigest {
  headline: string;
  items: ParsedItem[];
  bigPicture: { narrative: string; watchFor: string };
}

function digestFromCandidate(candidate: string): ParsedDigest | null {
  let raw: { headline?: unknown; items?: unknown; bigPicture?: unknown };
  try {
    raw = JSON.parse(candidate) as { headline?: unknown; items?: unknown; bigPicture?: unknown };
  } catch {
    return null;
  }
  const headline = cleanDigestText(String(raw.headline ?? "").trim().slice(0, 300));
  if (!headline || !Array.isArray(raw.items) || raw.items.length === 0) return null;
  const bp = raw.bigPicture as { narrative?: unknown; watchFor?: unknown } | undefined;
  const narrative = cleanDigestText(String(bp?.narrative ?? "").trim().slice(0, 1500));
  const watchFor = cleanDigestText(String(bp?.watchFor ?? "").trim().slice(0, 300));
  if (!narrative) return null; // the closer is part of the contract now
  const items = raw.items.slice(0, RAW_ITEM_CAP).flatMap((entry): ParsedItem[] => {
    const e = entry as {
      title?: unknown;
      summary?: unknown;
      whyItMatters?: unknown;
      url?: unknown;
      resources?: unknown;
    };
    const title = cleanDigestText(String(e.title ?? "").trim().slice(0, 200));
    const summary = cleanDigestText(String(e.summary ?? "").trim().slice(0, 600));
    const whyItMatters = cleanDigestText(String(e.whyItMatters ?? "").trim().slice(0, 400));
    const url = String(e.url ?? "").trim();
    if (!title || !summary || !whyItMatters || !/^https?:\/\//i.test(url)) return [];
    const resources = (Array.isArray(e.resources) ? e.resources : [])
      .slice(0, MAX_RESOURCES_PER_ITEM)
      .flatMap((res): ParsedResource[] => {
        const r = res as { title?: unknown; url?: unknown; type?: unknown };
        const rTitle = cleanDigestText(String(r.title ?? "").trim().slice(0, 200));
        const rUrl = String(r.url ?? "").trim();
        if (!rTitle || !/^https?:\/\//i.test(rUrl)) return [];
        return [{ title: rTitle, url: rUrl, type: r.type === "video" ? "video" : "article" }];
      });
    return [{ title, summary, whyItMatters, url, resources }];
  });
  if (items.length === 0) return null;
  return { headline, items, bigPicture: { narrative, watchFor } };
}

function parseDigest(text: string): ParsedDigest {
  let parsed: ParsedDigest | null = null;
  for (const candidate of balancedJsonCandidates(text)) {
    parsed = digestFromCandidate(candidate) ?? parsed;
  }
  if (!parsed) {
    throw new Error(`No digest-shaped JSON in model output: ${text.slice(0, 120)}`);
  }
  return parsed;
}

// ─── URL verification ──────────────────────────────────────────────────────
// Only persist items whose URL actually fetches OK, and derive sourceDomain
// from the URL the fetch RESOLVED to — never from model output. This is the
// guard against hallucinated headlines (EXPANSION.md §6.1).

async function verifyUrl(url: string): Promise<{ ok: boolean; finalUrl: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), URL_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        // Browser-ish UA: plenty of news sites 403 obvious bot agents
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,*/*;q=0.8",
      },
    });
    void res.body?.cancel().catch(() => {}); // status is all we need
    return { ok: res.ok, finalUrl: res.url || url };
  } catch {
    return { ok: false, finalUrl: url };
  } finally {
    clearTimeout(timer);
  }
}

function contentHashOf(
  headline: string,
  items: DigestItem[],
  bigPicture: string,
  watchFor: string,
): string {
  // All inputs are freshly constructed literals, so key order is deterministic
  return createHash("sha256")
    .update(JSON.stringify({ headline, items, bigPicture, watchFor }))
    .digest("hex");
}

const VIDEO_HOST_RE = /(^|\.)(youtube\.com|youtu\.be|vimeo\.com)$/i;

// ─── LLM call (bounded server-tool loop) ────────────────────────────────────

async function generateWithClaude(
  weekOf: Date,
  errors: string[],
): Promise<{ text: string; searchesUsed: number; apiCalls: number }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");
  const client = new Anthropic({ apiKey });

  const userPrompt = `Today is ${new Date().toUTCString()}. Compile the digest for the week of ${weekOf.toISOString().slice(0, 10)}. Search the web for notable AI / tech / capital-markets news from the past 7 days, then return the JSON.`;

  const messages: Anthropic.MessageParam[] = [{ role: "user", content: userPrompt }];
  let searchesUsed = 0;
  let apiCalls = 0;
  let response: Anthropic.Message;

  // Server-side search loop can pause (stop_reason "pause_turn"); resume by
  // echoing the assistant turn. MAX_API_CALLS bounds total spend per run.
  // Streamed because thinking + search push runs past the SDK's 10-minute
  // non-streaming estimate guard; finalMessage() assembles the full response.
  do {
    response = await client.messages
      .stream({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        thinking: { type: "adaptive" },
        system: SYSTEM_PROMPT,
        messages,
        tools: [
          { type: WEB_SEARCH_TOOL, name: "web_search", max_uses: WEB_SEARCH_MAX_USES },
        ],
      })
      .finalMessage();
    apiCalls++;
    searchesUsed += response.usage.server_tool_use?.web_search_requests ?? 0;

    for (const block of response.content) {
      if (block.type === "web_search_tool_result" && !Array.isArray(block.content)) {
        errors.push(`web_search error: ${block.content.error_code}`);
      }
    }

    if (response.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: response.content });
    }
  } while (response.stop_reason === "pause_turn" && apiCalls < MAX_API_CALLS);

  if (response.stop_reason === "pause_turn") {
    throw new Error(`Hit API call cap (${MAX_API_CALLS}) while still in pause_turn`);
  }
  if (response.stop_reason === "max_tokens") {
    throw new Error("Response truncated at max_tokens, digest JSON incomplete");
  }

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  return { text, searchesUsed, apiCalls };
}

// ─── Main sync ──────────────────────────────────────────────────────────────

export async function generateDigest(opts?: { now?: Date }): Promise<DigestSyncResult> {
  const t0 = Date.now();
  const weekOf = getDigestWeekOf(opts?.now);
  const errors: string[] = [];

  const fail = (outcome: "failed", searchesUsed = 0, apiCalls = 0): DigestSyncResult => ({
    ok: false,
    weekOf: weekOf.toISOString(),
    outcome,
    headline: null,
    itemCount: 0,
    dropped: 0,
    searchesUsed,
    apiCalls,
    errors,
    durationMs: Date.now() - t0,
  });

  // 0. Published editions are immutable to this pipeline — bail before any
  //    LLM spend. An admin must unpublish first to regenerate a week.
  const existing = await prisma.digestEdition.findUnique({ where: { weekOf } });
  if (existing && existing.status === "published") {
    errors.push("Edition for this week is already published, leaving it untouched");
    return {
      ok: true,
      weekOf: weekOf.toISOString(),
      outcome: "skipped_published",
      headline: existing.headline,
      itemCount: Array.isArray(existing.items) ? existing.items.length : 0,
      dropped: 0,
      searchesUsed: 0,
      apiCalls: 0,
      errors,
      durationMs: Date.now() - t0,
    };
  }

  // 1. Generate. Any failure from here on leaves the DB untouched — the
  //    /digest page keeps serving the last published edition (graceful
  //    degradation; the staleness banner covers the gap).
  let text = "";
  let searchesUsed = 0;
  let apiCalls = 0;
  let parsed: ParsedDigest;
  try {
    ({ text, searchesUsed, apiCalls } = await generateWithClaude(weekOf, errors));
    parsed = parseDigest(text);
  } catch (e) {
    errors.push(e instanceof Error ? e.message : String(e));
    return fail("failed", searchesUsed, apiCalls);
  }

  // 2. URL-verify every item AND every resource; dedupe by resolved URL.
  //    A dead resource link only drops that resource, never its item.
  const [itemChecks, resourceChecks] = await Promise.all([
    Promise.all(parsed.items.map((i) => verifyUrl(i.url))),
    Promise.all(parsed.items.map((i) => Promise.all(i.resources.map((r) => verifyUrl(r.url))))),
  ]);
  const seenUrls = new Set<string>();
  const items: DigestItem[] = [];
  parsed.items.forEach((item, idx) => {
    const rChecks = resourceChecks[idx];
    let check = itemChecks[idx];
    let promotedResourceIdx = -1;
    if (!check.ok) {
      // Dead source: promote the item's first verified resource to be the
      // source so the story (and any closer reference to it) survives.
      promotedResourceIdx = rChecks.findIndex((rc) => rc.ok);
      if (promotedResourceIdx === -1) {
        errors.push(`Dropped (URL not reachable): ${item.url}`);
        return;
      }
      check = rChecks[promotedResourceIdx];
      errors.push(`Source unreachable, promoted a resource link: ${item.url} -> ${check.finalUrl}`);
    }
    if (seenUrls.has(check.finalUrl)) {
      errors.push(`Dropped (duplicate URL): ${item.url}`);
      return;
    }
    let sourceDomain: string;
    try {
      sourceDomain = new URL(check.finalUrl).hostname.replace(/^www\./, "");
    } catch {
      errors.push(`Dropped (unparseable final URL): ${check.finalUrl}`);
      return;
    }
    seenUrls.add(check.finalUrl);

    const resources: DigestItemResource[] = [];
    item.resources.forEach((res, rIdx) => {
      if (rIdx === promotedResourceIdx) return; // now serving as the source
      const rCheck = rChecks[rIdx];
      if (!rCheck.ok) {
        errors.push(`Dropped resource (URL not reachable): ${res.url}`);
        return;
      }
      if (rCheck.finalUrl === check.finalUrl || resources.some((r) => r.url === rCheck.finalUrl)) {
        return; // resource duplicates the source or a sibling, silently skip
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
        // Hostname beats the model's claim for the type tag
        type: VIDEO_HOST_RE.test(new URL(rCheck.finalUrl).hostname) ? "video" : res.type,
        sourceDomain: rDomain,
      });
    });

    items.push({
      title: item.title,
      summary: item.summary,
      whyItMatters: item.whyItMatters,
      url: check.finalUrl,
      sourceDomain,
      resources: resources.slice(0, MAX_RESOURCES_PER_ITEM),
    });
  });
  const dropped = parsed.items.length - items.length;
  const finalItems = items.slice(0, MAX_ITEMS);

  if (finalItems.length < MIN_ITEMS) {
    errors.push(
      `Only ${finalItems.length}/${MIN_ITEMS} items survived URL verification, not persisting`,
    );
    return fail("failed", searchesUsed, apiCalls);
  }

  // The closer was written against the model's full item list. If any item
  // failed to survive verification, the narrative may reference a story the
  // reader can't see, so omit it for this run rather than persist it.
  const closerSafe = finalItems.length === parsed.items.length;
  const bigPicture = closerSafe ? parsed.bigPicture.narrative : null;
  const watchFor = closerSafe ? parsed.bigPicture.watchFor || null : null;
  if (!closerSafe) {
    errors.push("Items were dropped, omitting the big-picture closer this run");
  }

  // 3. Hash + upsert as draft. Re-fetch first: an admin may have published
  //    during the minute the generation took, and we must not clobber that.
  const contentHash = contentHashOf(
    parsed.headline,
    finalItems,
    bigPicture ?? "",
    watchFor ?? "",
  );
  const current = await prisma.digestEdition.findUnique({ where: { weekOf } });

  const base = {
    ok: true,
    weekOf: weekOf.toISOString(),
    headline: parsed.headline,
    itemCount: finalItems.length,
    dropped,
    searchesUsed,
    apiCalls,
    errors,
  };

  if (current && current.contentHash === contentHash) {
    return { ...base, outcome: "cached", durationMs: Date.now() - t0 };
  }
  if (current && current.status === "published") {
    errors.push("Edition was published while generating, leaving it untouched");
    return { ...base, outcome: "skipped_published", durationMs: Date.now() - t0 };
  }

  const data = {
    headline: parsed.headline,
    items: finalItems as unknown as Prisma.InputJsonValue,
    bigPicture,
    watchFor,
    contentHash,
    status: "draft",
    generatedAt: new Date(),
    publishedAt: null,
  };
  await prisma.digestEdition.upsert({
    where: { weekOf },
    create: { weekOf, ...data },
    update: data,
  });

  return { ...base, outcome: current ? "updated" : "created", durationMs: Date.now() - t0 };
}
