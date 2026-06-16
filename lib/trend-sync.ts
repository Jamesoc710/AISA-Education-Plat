import { createHash } from "crypto";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "./prisma";
import { cleanDigestText } from "./text";
import { verifyUrl } from "./url";
import { balancedJsonCandidates } from "./llm-json";
import { MOMENTUM_LABELS, TREND_CATEGORIES, type TrendCategory } from "./trend-categories";

// ─── Trend Tracker live refresh ─────────────────────────────────────────────
// Clone of the digest live-data pipeline (lib/digest-sync), adapted to REFRESH
// the existing seeded trends rather than discover new items. One bounded
// web_search call per category (AI / Tech / Capital). Every story URL is
// verified before persist; content-hash skip avoids no-op writes; a curatedAt
// lock skips any human-edited row. A changed trend drops to DRAFT for admin
// review (review-before-publish), and fresh stories MERGE with the existing
// curated ones (dedup by URL, newest first) so depth is never lost. whatItIs /
// relatedConcepts / sources are curated and never touched by the cron.

const MODEL = "claude-opus-4-8";
// 20250305, not 20260209: the newer dynamic-filtering version blew past the
// Vercel function ceiling on the digest. Plain search is fast.
const WEB_SEARCH_TOOL = "web_search_20250305" as const;
const WEB_SEARCH_MAX_USES = 2; // per category call -> a few searches per run, cheap
const MAX_API_CALLS = 3; // pause_turn continuation bound per category call
const MAX_TOKENS = 16000;
const MAX_STORIES_PER_TREND = 3;

export interface TrendSyncResult {
  ok: boolean;
  categoriesSynced: number; // of 3
  trendsUpdated: number;
  trendsCached: number; // returned by the model but content hash unchanged
  trendsSkippedLocked: number; // curatedAt set (human-edited)
  storiesVerified: number;
  storiesDropped: number; // URL did not resolve
  searchesUsed: number;
  apiCalls: number;
  errors: string[];
  durationMs: number;
}

interface ParsedStory {
  headline: string;
  whyItMatters: string;
  url: string;
  date: string;
}
interface ParsedTrendUpdate {
  slug: string;
  whatsHappening: string;
  momentum: number;
  momentumLabel: string;
  direction: string;
  topStories: ParsedStory[];
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function buildSystemPrompt(category: TrendCategory, trendList: string): string {
  return `You maintain the "${category}" section of a technology trend tracker for TCO, a university tech club. Members are non-experts: write plain English, gloss any jargon, no hype.

STYLE RULE: never use em dashes or en dashes anywhere in your output. Use commas, periods, or parentheses instead, and write number ranges with a plain hyphen (like 5-7). Never include citation markup (like <cite> tags) inside any JSON string; write plain text only.

These are the current ${category} trends you track (slug, name, current momentum 0-100):
${trendList}

Use web search (at most 2 searches) to find what has ACTUALLY happened with these trends in roughly the last 1-2 weeks. Then, for EACH trend that has a meaningful update, return refreshed fields. If a trend has no material change, OMIT it entirely (it keeps its current content). It is fine to return only a few trends, or none.

For each updated trend, provide:
- "slug": copied EXACTLY from the list above. Never invent a slug or return one not in the list.
- "whatsHappening": 4-7 plain-English sentences on the current state as of mid-2026, refreshed with the latest developments. Facts only, no hype.
- "momentum": an integer 0-100 recalibrated from how much news velocity and significance this trend has right now (higher means hotter; a fading story should drop).
- "momentumLabel": exactly one of "emerging", "accelerating", "mainstreaming", "cooling".
- "direction": "heating" if it is accelerating, "cooling" if it is losing steam.
- "topStories": 1-3 of the most notable recent items. Each is { "headline": string (max ~15 words), "whyItMatters": 1-2 sentences on why a student should care, "url": the source URL copied EXACTLY from a web search result (never construct, shorten, or guess a URL), "date": "YYYY-MM-DD" }.

Output STRICT JSON only, no markdown fences, no prose before or after the object:
{ "trends": [ { "slug": string, "whatsHappening": string, "momentum": number, "momentumLabel": string, "direction": string, "topStories": [ { "headline": string, "whyItMatters": string, "url": string, "date": string } ] } ] }`;
}

// ─── LLM call per category (bounded streamed pause_turn loop) ────────────────

async function generateForCategory(
  category: TrendCategory,
  trendList: string,
  errors: string[],
): Promise<{ text: string; searchesUsed: number; apiCalls: number }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");
  const client = new Anthropic({ apiKey });

  const system = buildSystemPrompt(category, trendList);
  const userPrompt = `Today is ${new Date().toUTCString()}. Refresh the ${category} trends now: search for the latest, then return the JSON.`;
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: userPrompt }];

  let searchesUsed = 0;
  let apiCalls = 0;
  let response: Anthropic.Message;

  do {
    response = await client.messages
      .stream({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        thinking: { type: "adaptive" },
        system,
        messages,
        tools: [{ type: WEB_SEARCH_TOOL, name: "web_search", max_uses: WEB_SEARCH_MAX_USES }],
      })
      .finalMessage();
    apiCalls++;
    searchesUsed += response.usage.server_tool_use?.web_search_requests ?? 0;

    for (const block of response.content) {
      if (block.type === "web_search_tool_result" && !Array.isArray(block.content)) {
        errors.push(`[${category}] web_search error: ${block.content.error_code}`);
      }
    }
    if (response.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: response.content });
    }
  } while (response.stop_reason === "pause_turn" && apiCalls < MAX_API_CALLS);

  if (response.stop_reason === "max_tokens") {
    throw new Error(`[${category}] response truncated at max_tokens`);
  }

  const textOf = (r: Anthropic.Message) =>
    r.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

  let text = textOf(response);

  // Same recovery as the digest: a run can exhaust search budget and end with
  // narration but no JSON. One forced text-only continuation reuses what it found.
  if (!hasTrendsJson(text) && apiCalls < MAX_API_CALLS) {
    errors.push(`[${category}] turn ended without JSON; forcing a text-only continuation`);
    messages.push({ role: "assistant", content: response.content });
    messages.push({
      role: "user",
      content:
        "Output the strict JSON object now, exactly per the schema in the system prompt, based on what you already found. No prose before or after it.",
    });
    response = await client.messages
      .stream({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        thinking: { type: "adaptive" },
        system,
        messages,
        tools: [{ type: WEB_SEARCH_TOOL, name: "web_search", max_uses: WEB_SEARCH_MAX_USES }],
        tool_choice: { type: "none" },
      })
      .finalMessage();
    apiCalls++;
    searchesUsed += response.usage.server_tool_use?.web_search_requests ?? 0;
    text = textOf(response);
  }

  return { text, searchesUsed, apiCalls };
}

function hasTrendsJson(text: string): boolean {
  for (const candidate of balancedJsonCandidates(text)) {
    try {
      const raw = JSON.parse(candidate) as { trends?: unknown };
      if (Array.isArray(raw.trends)) return true;
    } catch {
      /* keep scanning */
    }
  }
  return false;
}

function parseUpdates(text: string, validSlugs: Set<string>, errors: string[]): ParsedTrendUpdate[] {
  let best: ParsedTrendUpdate[] | null = null;
  for (const candidate of balancedJsonCandidates(text)) {
    let raw: { trends?: unknown };
    try {
      raw = JSON.parse(candidate) as { trends?: unknown };
    } catch {
      continue;
    }
    if (!Array.isArray(raw.trends)) continue;
    const parsed: ParsedTrendUpdate[] = [];
    for (const entry of raw.trends) {
      const e = entry as Record<string, unknown>;
      const slug = String(e.slug ?? "").trim();
      if (!validSlugs.has(slug)) continue; // never accept an invented slug
      const whatsHappening = cleanDigestText(String(e.whatsHappening ?? "").trim().slice(0, 2000));
      const momentumRaw = Number(e.momentum);
      if (!whatsHappening || !Number.isFinite(momentumRaw)) continue;
      const momentum = Math.max(0, Math.min(100, Math.round(momentumRaw)));
      const momentumLabel = (MOMENTUM_LABELS as readonly string[]).includes(String(e.momentumLabel))
        ? String(e.momentumLabel)
        : "accelerating";
      const direction = e.direction === "cooling" ? "cooling" : "heating";
      const topStories = (Array.isArray(e.topStories) ? e.topStories : [])
        .slice(0, 6)
        .flatMap((s): ParsedStory[] => {
          const st = s as Record<string, unknown>;
          const headline = cleanDigestText(String(st.headline ?? "").trim().slice(0, 200));
          const whyItMatters = cleanDigestText(String(st.whyItMatters ?? "").trim().slice(0, 400));
          const url = String(st.url ?? "").trim();
          const date = String(st.date ?? "").trim();
          if (!headline || !whyItMatters || !/^https?:\/\//i.test(url) || !ISO_DATE_RE.test(date)) {
            return [];
          }
          return [{ headline, whyItMatters, url, date }];
        });
      parsed.push({ slug, whatsHappening, momentum, momentumLabel, direction, topStories });
    }
    if (parsed.length > 0) best = parsed; // keep the last well-formed candidate
  }
  if (best === null) {
    errors.push(`No trend-shaped JSON in model output: ${text.slice(0, 120)}`);
    return [];
  }
  return best;
}

function contentHashOf(u: {
  whatsHappening: string;
  momentum: number;
  momentumLabel: string;
  direction: string;
  stories: { headline: string; url: string; date: string }[];
}): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        w: u.whatsHappening,
        m: u.momentum,
        l: u.momentumLabel,
        d: u.direction,
        s: u.stories.map((st) => [st.headline, st.url, st.date]),
      }),
    )
    .digest("hex");
}

// ─── Main sync ──────────────────────────────────────────────────────────────

export async function syncTrends(): Promise<TrendSyncResult> {
  const t0 = Date.now();
  const errors: string[] = [];
  let searchesUsed = 0;
  let apiCalls = 0;
  let categoriesSynced = 0;
  let trendsUpdated = 0;
  let trendsCached = 0;
  let trendsSkippedLocked = 0;
  let storiesVerified = 0;
  let storiesDropped = 0;

  const allTrends = await prisma.trend.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      category: true,
      momentum: true,
      status: true,
      curatedAt: true,
      contentHash: true,
    },
  });
  const bySlug = new Map(allTrends.map((t: (typeof allTrends)[number]) => [t.slug, t] as const));
  const syncedCategories: TrendCategory[] = [];

  for (const category of TREND_CATEGORIES) {
    const inCat = allTrends.filter((t: (typeof allTrends)[number]) => t.category === category);
    if (inCat.length === 0) continue;
    const validSlugs = new Set(inCat.map((t: (typeof allTrends)[number]) => t.slug));
    const trendList = inCat
      .map((t: (typeof allTrends)[number]) => `- ${t.slug} | ${t.name} | momentum ${t.momentum}`)
      .join("\n");

    let updates: ParsedTrendUpdate[] = [];
    try {
      const gen = await generateForCategory(category, trendList, errors);
      searchesUsed += gen.searchesUsed;
      apiCalls += gen.apiCalls;
      updates = parseUpdates(gen.text, validSlugs, errors);
      categoriesSynced++;
      syncedCategories.push(category);
    } catch (e) {
      errors.push(`[${category}] ${e instanceof Error ? e.message : String(e)}`);
      continue; // leave this category's trends untouched (staleness will surface)
    }

    for (const u of updates) {
      const existing = bySlug.get(u.slug);
      if (!existing) continue;
      if (existing.curatedAt) {
        trendsSkippedLocked++;
        continue;
      }

      // Verify every story URL; derive sourceDomain from the RESOLVED url.
      const checks = await Promise.all(u.topStories.map((s) => verifyUrl(s.url)));
      const seen = new Set<string>();
      const stories: { headline: string; whyItMatters: string; url: string; sourceDomain: string; date: string }[] = [];
      u.topStories.forEach((s, i) => {
        const check = checks[i];
        if (!check.ok) {
          storiesDropped++;
          return;
        }
        if (seen.has(check.finalUrl)) return;
        let domain: string;
        try {
          domain = new URL(check.finalUrl).hostname.replace(/^www\./, "");
        } catch {
          storiesDropped++;
          return;
        }
        seen.add(check.finalUrl);
        stories.push({ headline: s.headline, whyItMatters: s.whyItMatters, url: check.finalUrl, sourceDomain: domain, date: s.date });
      });
      const finalStories = stories.slice(0, MAX_STORIES_PER_TREND);
      storiesVerified += finalStories.length;

      const hash = contentHashOf({
        whatsHappening: u.whatsHappening,
        momentum: u.momentum,
        momentumLabel: u.momentumLabel,
        direction: u.direction,
        stories: finalStories,
      });
      if (existing.contentHash && existing.contentHash === hash) {
        trendsCached++;
        continue; // nothing changed, no write
      }

      // Merge fresh verified stories with the trend's existing ones so a thin
      // news week never strips curated depth: dedup by URL, newest first, capped.
      // Strong seed stories survive alongside new ones.
      const prior = await prisma.trendUpdate.findMany({
        where: { trendId: existing.id },
        orderBy: { date: "desc" },
        select: { headline: true, whyItMatters: true, sourceUrl: true, sourceDomain: true, date: true },
      });
      const combined = [
        ...finalStories,
        ...prior.flatMap((p) =>
          p.sourceUrl
            ? [{
                headline: p.headline,
                whyItMatters: p.whyItMatters,
                url: p.sourceUrl,
                sourceDomain: p.sourceDomain ?? "",
                date: p.date.toISOString().slice(0, 10),
              }]
            : [],
        ),
      ];
      const seenUrls = new Set<string>();
      const merged = combined
        .filter((s) => {
          if (seenUrls.has(s.url)) return false;
          seenUrls.add(s.url);
          return true;
        })
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, MAX_STORIES_PER_TREND);

      // Draft-gate: a content change drops the trend to draft so an admin reviews
      // and republishes before it goes live again. Nothing the cron touches
      // becomes member-visible without a human publish.
      await prisma.trend.update({
        where: { id: existing.id },
        data: {
          whatsHappening: u.whatsHappening,
          momentum: u.momentum,
          momentumLabel: u.momentumLabel,
          direction: u.direction,
          contentHash: hash,
          syncedAt: new Date(),
          status: "draft",
        },
      });
      if (merged.length > 0) {
        await prisma.trendUpdate.deleteMany({ where: { trendId: existing.id } });
        for (const s of merged) {
          await prisma.trendUpdate.create({
            data: {
              trendId: existing.id,
              headline: s.headline,
              whyItMatters: s.whyItMatters,
              sourceUrl: s.url,
              sourceDomain: s.sourceDomain,
              date: new Date(s.date),
            },
          });
        }
      }
      trendsUpdated++;
    }
  }

  // Bump syncedAt for every non-locked trend in a successfully-synced category,
  // so the staleness banner tracks cron health (last successful pass), not just
  // the rows that happened to change this run.
  if (syncedCategories.length > 0) {
    await prisma.trend.updateMany({
      where: { category: { in: syncedCategories }, curatedAt: null },
      data: { syncedAt: new Date() },
    });
  }

  return {
    ok: categoriesSynced > 0,
    categoriesSynced,
    trendsUpdated,
    trendsCached,
    trendsSkippedLocked,
    storiesVerified,
    storiesDropped,
    searchesUsed,
    apiCalls,
    errors,
    durationMs: Date.now() - t0,
  };
}
