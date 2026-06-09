import { createHash } from "crypto";
import Anthropic from "@anthropic-ai/sdk";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

// ─── "This Week in Tech" digest sync ────────────────────────────────────────
// Clone of the schedule-sync live-data pipeline (docs/EXPANSION.md §6.1):
// one Claude call with web search → strict JSON → URL-verify every item →
// content-hash skip → upsert by weekOf as a DRAFT. Publishing is a separate,
// human admin action — this module never sets status to "published".

const MODEL = "claude-sonnet-4-6";
// 20250305, not 20260209: the newer version's dynamic-filtering rounds pushed a
// live run to ~410s — past any Vercel function ceiling. Plain search is fast.
const WEB_SEARCH_TOOL = "web_search_20250305" as const;
const WEB_SEARCH_MAX_USES = 6; // $10 per 1,000 searches → ≤ $0.06/run hard cap
const MAX_API_CALLS = 4; // pause_turn continuation bound — this run's LLM_CAP
const MAX_TOKENS = 4096;
const MIN_ITEMS = 3; // fewer verified items than this = failed run, no write
const MAX_ITEMS = 7;
const RAW_ITEM_CAP = 10; // accept a few extra pre-verification, trim after
const URL_TIMEOUT_MS = 8000;

export interface DigestItem {
  title: string;
  summary: string;
  url: string;
  sourceDomain: string; // hostname of the URL the fetch actually resolved to
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

const SYSTEM_PROMPT = `You are curating "This Week in Tech" — a weekly news digest for TCO (Tech Collective Org), a university tech club. Members come from mixed, often non-technical backgrounds: assume no prior knowledge, and gloss any jargon in plain English. No hype, no clickbait.

Use web search to find what ACTUALLY happened in the last 7 days. Cover a mix across three areas: AI (2-3 items), broader tech (1-2 items), and capital markets / venture capital (1-2 items).

Pick the 5-7 most notable items. For each item provide:
- "title": a clear, factual headline (max ~15 words).
- "summary": 2-3 plain-English sentences — what happened, and why a student should care.
- "url": the source article's URL copied EXACTLY from a web search result. Never construct, shorten, or guess a URL.

Prefer primary sources — the outlet that actually reported the story — over aggregator "news roundup" pages. Use at most one item from any aggregator/roundup site.

Also provide "headline": one sentence (max ~20 words) capturing the week's overall story.

Output STRICT JSON only — no markdown fences, no prose before or after the object:
{ "headline": string, "items": [ { "title": string, "summary": string, "url": string } ] }`;

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

interface ParsedDigest {
  headline: string;
  items: { title: string; summary: string; url: string }[];
}

function digestFromCandidate(candidate: string): ParsedDigest | null {
  let raw: { headline?: unknown; items?: unknown };
  try {
    raw = JSON.parse(candidate) as { headline?: unknown; items?: unknown };
  } catch {
    return null;
  }
  const headline = String(raw.headline ?? "").trim().slice(0, 300);
  if (!headline || !Array.isArray(raw.items) || raw.items.length === 0) return null;
  const items = raw.items.slice(0, RAW_ITEM_CAP).flatMap((entry) => {
    const e = entry as { title?: unknown; summary?: unknown; url?: unknown };
    const title = String(e.title ?? "").trim().slice(0, 200);
    const summary = String(e.summary ?? "").trim().slice(0, 600);
    const url = String(e.url ?? "").trim();
    if (!title || !summary || !/^https?:\/\//i.test(url)) return [];
    return [{ title, summary, url }];
  });
  if (items.length === 0) return null;
  return { headline, items };
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

function contentHashOf(headline: string, items: DigestItem[]): string {
  const repr = JSON.stringify({
    headline,
    items: items.map((i) => ({
      title: i.title,
      summary: i.summary,
      url: i.url,
      sourceDomain: i.sourceDomain,
    })),
  });
  return createHash("sha256").update(repr).digest("hex");
}

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
  do {
    response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages,
      tools: [
        { type: WEB_SEARCH_TOOL, name: "web_search", max_uses: WEB_SEARCH_MAX_USES },
      ],
    });
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
    throw new Error("Response truncated at max_tokens — digest JSON incomplete");
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
    errors.push("Edition for this week is already published — leaving it untouched");
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

  // 2. URL-verify every item; dedupe by resolved URL.
  const checks = await Promise.all(parsed.items.map((i) => verifyUrl(i.url)));
  const seenUrls = new Set<string>();
  const items: DigestItem[] = [];
  parsed.items.forEach((item, idx) => {
    const check = checks[idx];
    if (!check.ok) {
      errors.push(`Dropped (URL not reachable): ${item.url}`);
      return;
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
    items.push({ title: item.title, summary: item.summary, url: check.finalUrl, sourceDomain });
  });
  const dropped = parsed.items.length - items.length;
  const finalItems = items.slice(0, MAX_ITEMS);

  if (finalItems.length < MIN_ITEMS) {
    errors.push(
      `Only ${finalItems.length}/${MIN_ITEMS} items survived URL verification — not persisting`,
    );
    return fail("failed", searchesUsed, apiCalls);
  }

  // 3. Hash + upsert as draft. Re-fetch first: an admin may have published
  //    during the minute the generation took, and we must not clobber that.
  const contentHash = contentHashOf(parsed.headline, finalItems);
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
    errors.push("Edition was published while generating — leaving it untouched");
    return { ...base, outcome: "skipped_published", durationMs: Date.now() - t0 };
  }

  const data = {
    headline: parsed.headline,
    items: finalItems as unknown as Prisma.InputJsonValue,
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
