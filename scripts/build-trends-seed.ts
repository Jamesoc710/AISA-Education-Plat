/**
 * Generate prisma/seed-data/trends.ts from docs/research/trend-map-research.json.
 *
 * This is a DEV-TIME generator (no DB). It turns the adversarially-verified
 * research record into a committed, reviewable seed file, applying:
 *   - field rename whatsHappeningNow -> whatsHappening
 *   - dash strip (em/en dashes banned in member-facing text) + leaked-tag strip
 *   - the malformed </whatItIs> artifact strip on ai-drug-discovery
 *   - per-record synthNote fixes as FAIL-LOUD find/replace edits (throws if a
 *     find string is missing, so a fix never silently no-ops)
 *   - authored content for the 3 records whose research fields are empty/broken
 *     (inference-time whatsHappening placeholder; power-grid + mech-interp empty
 *     topStories)
 *   - the hand-authored concept alias map (free-text label -> /concepts/[slug])
 *     plus a few bullseye extra links the research labels missed
 *
 * Run:  npx tsx scripts/build-trends-seed.ts
 * Then review + commit prisma/seed-data/trends.ts. Re-run after any research
 * refresh. Slug targets are validated against the live catalog by seed-trends.ts.
 */
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const SRC = join(process.cwd(), "docs/research/trend-map-research.json");
const OUT = join(process.cwd(), "prisma/seed-data/trends.ts");

// ─── text cleaning (mirrors lib/digest-sync cleanDigestText/stripDashes) ──────

function stripDashes(s: string): string {
  return s
    .replace(/(\d)\s*[–—]\s*(\d)/g, "$1-$2") // number ranges -> plain hyphen
    .replace(/\s*[–—]\s*/g, ", ") // any other em/en dash -> comma pause
    .replace(/,\s*,/g, ", ")
    .replace(/^,\s*/, "")
    .replace(/[,\s]+$/, "");
}

function cleanText(s: string): string {
  // Strip leaked pseudo-tags (the drug-discovery whatItIs ends with a literal
  // </whatItIs></invoke> artifact) and any <cite> markup, collapse runs of
  // spaces, then enforce the no-dash rule.
  const noTags = s
    .replace(/<\/?(whatItIs|whatsHappeningNow|invoke|parameter|cite)\b[^>]*>/gi, "")
    .replace(/[ \t]{2,}/g, " ");
  return stripDashes(noTags).trim();
}

// ─── concept alias map: research free-text label -> catalog Concept.slug ──────
// Lookup is by lower-cased label. Labels absent here render as plain text (no
// link), which is expected for Capital/infra terms (catalog is AI-literacy).
// Every slug here is validated against the live DB by seed-trends.ts --verify.

const CONCEPT_MAP: Record<string, string> = {
  "agents and tool use": "agentic-capabilities",
  "ai agents and tool use": "agentic-capabilities",
  "prompting": "prompt-engineering",
  "chain-of-thought prompting": "prompt-engineering",
  "ai compute and chips": "gpus",
  "gpus and ai accelerators": "gpus",
  "compute and gpus": "gpus",
  "gpus and ai hardware": "gpus",
  "training vs inference": "training-vs-inference",
  "ai training versus inference": "training-vs-inference",
  "transformer architecture": "transformers",
  "transformer architecture and attention": "attention-mechanisms",
  "compute and scaling laws": "scaling-laws",
  "scaling laws": "scaling-laws",
  "ai scaling laws": "scaling-laws",
  "ai infrastructure and scaling": "scaling-laws",
  "foundation models": "base-models",
  "the ai bubble debate": "filtering-ai-hype",
  "prompt injection and ai security": "jailbreaking",
  "apis and integration": "api-basics",
  "open weights vs closed source": "open-source-vs-open-weights",
  "benchmarks and evaluation": "benchmarking-llms",
  "evaluation and benchmarking": "benchmarking-llms",
  "mixture-of-experts and context windows": "context-windows",
  "prompt engineering and context management": "context-windows",
  "embodied ai": "robotics-embodied-ai",
  "multimodality": "multimodality",
  "reasoning": "reasoning-models",
  "chain-of-thought reasoning": "reasoning-models",
  "reinforcement learning from human feedback (rlhf)": "rlhf",
  "ai governance and safety": "ai-alignment",
  "ai alignment and safety": "ai-alignment",
  "ai alignment": "ai-alignment",
  "ai alignment and fine-tuning": "fine-tuning",
  "data privacy and local inference": "privacy-implications",
  "tokens and tokenization": "tokens",
  "retrieval-augmented generation (rag)": "rag",
  "neural network features and circuits": "interpretability",
  "training data and data scarcity": "synthetic-data",
};

// Bullseye links the research labels missed (the trend's core topic IS a
// catalog concept). Appended after the mapped labels, deduped by slug.
const EXTRA_CONCEPTS: Record<string, { label: string; slug: string }[]> = {
  "post-training-revolution-rl-over-rlhf": [
    { label: "Reinforcement learning with verifiable rewards", slug: "rlvr" },
  ],
  "ai-drug-discovery-protein-science": [
    { label: "AlphaFold and biomedical AI", slug: "alphafold-biomedical-ai" },
  ],
  "physical-ai-robot-world-models": [{ label: "World models", slug: "world-models" }],
};

// ─── per-record fixes (synthNote application) ────────────────────────────────

interface StorySeed {
  headline: string;
  whyItMatters: string;
  sourceUrl: string;
  date: string;
}
type FR = [find: string, replace: string];
interface StoryEdit {
  index: number;
  date?: string;
  headline?: FR;
  whyItMatters?: FR;
}
interface Patch {
  whatsHappening?: FR[];
  whatsHappeningOverride?: string;
  topStoriesOverride?: StorySeed[];
  storyEdits?: StoryEdit[];
}

const INFERENCE_WHATS_HAPPENING =
  "By mid-2026, paying a model to think longer at the moment you ask it a question, rather than only building a bigger model, has become a central story of the AI industry. At its GTC conference in March 2026, NVIDIA reframed data centers as token factories and argued that reasoning models, which spend extra compute thinking before they answer, now drive compute demand far more than training larger base models, citing growth in some inference workloads of up to about 10,000 times over two years. OpenAI turned the idea into a literal product control on March 5, 2026 with GPT-5.4 Thinking and Pro, which expose five dialable reasoning-effort levels so users and developers can spend more or less thinking compute per request and trade cost against quality. The research is catching up to the slogans: a wave of 2026 scaling-law papers, including Test-Time Scaling Makes Overtraining Compute-Optimal, jointly optimizes model size, training data, and thinking budget so labs can decide when paying for longer thinking beats paying for a bigger model. Analysts at Deloitte and McKinsey describe a broad shift of AI compute from training toward inference, the practical sign that this technique now shapes hardware, products, and budgets across the field. The honest caveat is cost: thinking longer is not free, and on easy questions the extra compute buys little, so the open question is how to spend a thinking budget only where it actually helps.";

const POWER_GRID_STORIES: StorySeed[] = [
  {
    headline: "World Economic Forum names grid connectivity the strategic bottleneck for AI",
    whyItMatters:
      "It reframes the limiting factor for AI from chips to electricity, warning that AI workloads already draw tens of gigawatts and could approach hundreds of gigawatts by the end of the decade while the grid struggles to keep up.",
    sourceUrl:
      "https://www.weforum.org/stories/2026/05/electricity-data-grid-connectivity-strategic-bottleneck-ai-transformation/",
    date: "2026-05-01",
  },
  {
    headline: "Why AI data center projects face years of delays even after approval",
    whyItMatters:
      "Projects that came online in 2025 averaged roughly seven to eight years from grid queue to running, evidence that securing power, not buying chips, is now the slow step that decides who can actually grow.",
    sourceUrl:
      "https://www.datacenterknowledge.com/energy-power-supply/why-ai-data-center-projects-face-years-of-delays-after-approval",
    date: "2026-05-01",
  },
  {
    headline: "Power grid limits start to bend the data center growth trajectory",
    whyItMatters:
      "Fortune reported Q4 2025 capacity additions of just 25 gigawatts, down about half, with analysts estimating only about a third of the announced pipeline will actually get built, the first hard sign the constraint is slowing real growth.",
    sourceUrl: "https://fortune.com/2026/03/18/power-grids-snags-electricity-limits-data-centers/",
    date: "2026-03-18",
  },
];

const MECH_INTERP_STORIES: StorySeed[] = [
  {
    headline:
      "MIT Technology Review names mechanistic interpretability a 2026 Breakthrough Technology",
    whyItMatters:
      "Putting interpretability on the annual breakthrough list marks the moment the effort to read a model's inner workings crossed from a research curiosity into mainstream, fundable science.",
    sourceUrl:
      "https://www.technologyreview.com/2026/01/12/1130003/mechanistic-interpretability-ai-research-models-2026-breakthrough-technologies/",
    date: "2026-01-12",
  },
  {
    headline: "Anthropic maps 171 emotion concept vectors inside Claude and steers behavior",
    whyItMatters:
      "Locating specific internal patterns and showing that turning them up or down causally changes what the model does is direct evidence the black box can be read and even edited, not just observed from the outside.",
    sourceUrl: "https://www.infoq.com/news/2026/04/anthropic-paper-llms/",
    date: "2026-04-01",
  },
  {
    headline: "Goodfire launches Silico, an off-the-shelf tool to inspect and debug a model's neurons",
    whyItMatters:
      "A 150 million dollar-backed startup shipping a product that lets ordinary developers debug a model's internal circuits shows interpretability is being commercialized, not kept inside frontier labs.",
    sourceUrl:
      "https://www.technologyreview.com/2026/04/30/1136721/this-startups-new-mechanistic-interpretability-tool-lets-you-debug-llms/",
    date: "2026-04-30",
  },
];

const PATCHES: Record<string, Patch> = {
  "ai-coding-agents-replace-autocomplete": {
    whatsHappening: [
      [
        "Roughly 84 to 85% of developers now use AI for coding (JetBrains and Stack Overflow surveys).",
        "Around 80 to 84% of developers now use or plan to use AI for coding (JetBrains and Stack Overflow surveys).",
      ],
      [
        "GitHub made its autonomous Copilot coding agent generally available and unveiled an agent-native Copilot desktop app at Microsoft Build on June 2, 2026;",
        "GitHub unveiled an agent-native Copilot desktop app in technical preview at Microsoft Build on June 2, 2026, while its Copilot coding-agent SDK and Workspace features reached general availability;",
      ],
    ],
  },
  "trillion-dollar-ai-ipo-pipeline": {
    whatsHappening: [
      [
        "pushing its value above 2 trillion dollars and making it one of the most valuable public companies in the United States.",
        "pushing its value above 2 trillion dollars after the first-day pop, up from an IPO pricing that valued it closer to 1.8 trillion dollars, and making it one of the most valuable public companies in the United States.",
      ],
      [
        "That single raise was larger than the combined total of every other 2026 IPO",
        "SpaceX is AI-adjacent mainly through its merger with xAI rather than being a pure AI lab. That single raise was larger than the combined total of every other 2026 IPO",
      ],
    ],
  },
  "ai-chip-supercycle-custom-silicon": {
    whatsHappening: [
      [
        "guided to about 56 billion dollars in fiscal-2026 AI revenue, roughly tripling year over year.",
        "guided to about 56 billion dollars in fiscal-2026 AI revenue, up roughly 1.8 times year over year from about 20 billion dollars.",
      ],
    ],
    storyEdits: [
      {
        index: 0,
        whyItMatters: [
          "for Google, Anthropic, and OpenAI, so its near-tripling AI revenue",
          "for hyperscalers like Google and OpenAI, so its sharply rising AI revenue",
        ],
      },
    ],
  },
  "model-context-protocol-standard": {
    whatsHappening: [
      [
        "a push toward stateless transport, and MCP Apps, a new extension that turns AI replies into interactive interfaces.",
        "an emphasis on gateways, gRPC, and observability, with stateless transport attributed to the forthcoming July 2026 spec release candidate, plus MCP Apps, a new extension that turns AI replies into interactive interfaces.",
      ],
    ],
  },
  "big-tech-ai-capex-versus-revenue-mismatch": {
    whatsHappening: [
      [
        "Microsoft's AI business hit a roughly $37 billion annual run rate in its Q1 2026 report",
        "Microsoft's AI business hit a roughly $37 billion annual run rate in its late-April 2026 (fiscal Q3) earnings",
      ],
    ],
    storyEdits: [{ index: 1, date: "2026-04-30" }],
  },
  "open-weight-models-frontier-quality": {
    whatsHappening: [
      [
        "DeepSeek V4-Pro (April 24, MIT license, weights on Hugging Face)",
        "DeepSeek V4-Pro (April 24, permissive license, weights on Hugging Face)",
      ],
    ],
    storyEdits: [
      {
        index: 2,
        whyItMatters: ["as open weights under an MIT license", "as open weights under a permissive license"],
      },
    ],
  },
  "humanoid-robots-leave-the-lab": {
    whatsHappening: [
      [
        "committed its entire 2026 build to Hyundai factories (starting at the Metaplant near Savannah, Georgia) and to Google DeepMind",
        "committed much of its 2026 build to Hyundai factories and to Google DeepMind",
      ],
    ],
  },
  "agentic-ai-goes-production": {
    whatsHappening: [
      [
        "in annual recurring revenue at its fiscal Q3 2026 (up roughly 330 percent year over year)",
        "in annual recurring revenue at its fiscal Q3 2026, a growth rate of roughly 330 percent year over year",
      ],
      [
        "then roughly 800 million dollars by Q4 (reported late February 2026)",
        "then roughly 800 million dollars by Q4 (up about 169 percent year over year, reported late February 2026)",
      ],
    ],
  },
  "inference-time-scaling-reasoning-models": {
    whatsHappeningOverride: INFERENCE_WHATS_HAPPENING,
    storyEdits: [{ index: 2, date: "2026-04-03" }],
  },
  "power-grid-binding-constraint-ai": {
    whatsHappening: [
      [
        "added a 20-year Constellation agreement in June 2026",
        "added a 20-year Constellation agreement in June 2025",
      ],
    ],
    topStoriesOverride: POWER_GRID_STORIES,
  },
  "long-context-windows-1m-10m-tokens": {
    whatsHappening: [
      [
        "plus OpenAI's GPT-5.5, also sit at 1M",
        "plus OpenAI's GPT-5.5 (1M in the API, though 400K in Codex), also sit at 1M",
      ],
    ],
  },
  "mechanistic-interpretability-goes-mainstream": {
    topStoriesOverride: MECH_INTERP_STORIES,
  },
  "physical-ai-robot-world-models": {
    storyEdits: [
      {
        index: 1,
        headline: [
          "hitting 98% gauge-reading accuracy for autonomous inspection",
          "reaching about 98% gauge-reading accuracy in deployment for autonomous inspection",
        ],
        whyItMatters: [
          "read analog dials roughly four times more accurately than before",
          "read analog dials in the field about four times more accurately than before (DeepMind's own benchmark puts gauge reading near 93 percent)",
        ],
      },
    ],
  },
  "synthetic-data-default-pipeline": {
    whatsHappening: [
      [
        "Nvidia folding its acquired startup Gretel (a deal valued above 320 million dollars) into its Omniverse platform",
        "Nvidia folding its acquired startup Gretel (which had a prior valuation above 320 million dollars) into its Omniverse platform",
      ],
      [
        "The research firm Gartner has projected that roughly 75% of the data used in AI projects would be synthetically generated by the end of 2026, and current adoption suggests that estimate is on track.",
        "The research firm Gartner has projected, as an estimate rather than a measured result, that roughly 75% of the data used in AI projects would be synthetically generated by the end of 2026.",
      ],
    ],
    storyEdits: [
      {
        index: 2,
        headline: [
          "Nvidia reportedly acquires synthetic data startup Gretel for over 320 million dollars",
          "Nvidia reportedly acquires synthetic data startup Gretel to strengthen its AI training tools",
        ],
      },
    ],
  },
  "ai-smart-glasses-race": {
    whatsHappening: [
      [
        "in March 2026 Meta filed two new glasses models (codenamed Scriber and Blazer) with the FCC",
        "in March 2026 Meta and its eyewear partner EssilorLuxottica filed two new glasses models (codenamed Scriber and Blazer) with the FCC",
      ],
    ],
  },
  "magnificent-seven-concentration-and-rotation": {
    whatsHappening: [
      [
        "with the seven down around 7% through February while the other 493 stocks were up about 4%.",
        "with the seven lagging sharply through February while the other 493 stocks held up better.",
      ],
    ],
  },
};

// ─── transform ───────────────────────────────────────────────────────────────

interface RawStory {
  headline: string;
  whyItMatters: string;
  sourceUrl: string;
  date: string;
}
interface RawTrend {
  name: string;
  slug: string;
  category: string;
  whatItIs: string;
  whatsHappeningNow: string;
  momentum: number;
  momentumLabel: string;
  direction: string;
  topStories: RawStory[];
  relatedConcepts: string[];
  sources: string[];
  confidence: string;
}

function replaceOnce(text: string, [find, replace]: FR, ctx: string): string {
  if (!text.includes(find)) {
    throw new Error(`PATCH MISS [${ctx}]: find string not present:\n  ${find}`);
  }
  return text.split(find).join(replace);
}

function mapConcepts(slug: string, labels: string[]): { label: string; slug?: string }[] {
  const out: { label: string; slug?: string }[] = [];
  const usedSlugs = new Set<string>();
  const seenLabels = new Set<string>();
  const push = (rawLabel: string, mapped?: string) => {
    const label = cleanText(rawLabel);
    const display = label.charAt(0).toUpperCase() + label.slice(1);
    const key = display.toLowerCase();
    if (seenLabels.has(key)) return;
    seenLabels.add(key);
    if (mapped && !usedSlugs.has(mapped)) {
      usedSlugs.add(mapped);
      out.push({ label: display, slug: mapped });
    } else {
      out.push({ label: display }); // plain text (no link)
    }
  };
  for (const raw of labels) push(raw, CONCEPT_MAP[raw.toLowerCase().trim()]);
  for (const extra of EXTRA_CONCEPTS[slug] ?? []) push(extra.label, extra.slug);
  return out;
}

function buildSeed(raw: RawTrend): Record<string, unknown> {
  const patch = PATCHES[raw.slug] ?? {};

  let whatsHappening = patch.whatsHappeningOverride
    ? cleanText(patch.whatsHappeningOverride)
    : cleanText(raw.whatsHappeningNow);
  for (const fr of patch.whatsHappening ?? []) {
    whatsHappening = replaceOnce(whatsHappening, fr, `${raw.slug}.whatsHappening`);
  }

  let stories: StorySeed[] = (patch.topStoriesOverride ?? raw.topStories).map((s) => ({
    headline: cleanText(s.headline),
    whyItMatters: cleanText(s.whyItMatters),
    sourceUrl: s.sourceUrl.trim(),
    date: s.date.trim(),
  }));
  for (const edit of patch.storyEdits ?? []) {
    const s = stories[edit.index];
    if (!s) throw new Error(`PATCH MISS [${raw.slug}]: no story at index ${edit.index}`);
    if (edit.date) s.date = edit.date;
    if (edit.headline) s.headline = replaceOnce(s.headline, edit.headline, `${raw.slug}.story[${edit.index}].headline`);
    if (edit.whyItMatters)
      s.whyItMatters = replaceOnce(s.whyItMatters, edit.whyItMatters, `${raw.slug}.story[${edit.index}].whyItMatters`);
  }

  if (stories.length === 0) throw new Error(`${raw.slug}: no topStories after transform`);

  return {
    slug: raw.slug,
    name: cleanText(raw.name),
    category: raw.category,
    whatItIs: cleanText(raw.whatItIs),
    whatsHappening,
    momentum: raw.momentum,
    momentumLabel: raw.momentumLabel,
    direction: raw.direction,
    relatedConcepts: mapConcepts(raw.slug, raw.relatedConcepts),
    sources: raw.sources.map((u) => u.trim()),
    confidence: raw.confidence,
    topStories: stories,
  };
}

// ─── run ─────────────────────────────────────────────────────────────────────

const data = JSON.parse(readFileSync(SRC, "utf8").replace(/^﻿/, "")) as { trends: RawTrend[] };
const seeds = data.trends.map(buildSeed);

// Provenance / sanity logging (no DB).
const DASH_RE = /[‒–—―]/;
let dashHits = 0;
let linked = 0;
const unmapped = new Set<string>();
for (const t of data.trends) {
  for (const raw of t.relatedConcepts) {
    if (!CONCEPT_MAP[raw.toLowerCase().trim()]) unmapped.add(raw);
  }
}
for (const s of seeds) {
  const blob = JSON.stringify(s);
  if (DASH_RE.test(blob)) dashHits++;
  if ((s.relatedConcepts as { slug?: string }[]).some((c) => c.slug)) linked++;
}

const header = `// AUTO-GENERATED by scripts/build-trends-seed.ts from
// docs/research/trend-map-research.json. Do not edit by hand: edit the
// generator's PATCHES / CONCEPT_MAP and re-run:
//   npx tsx scripts/build-trends-seed.ts
//
// All prose is dash-free and seeded as drafts. Slug targets in relatedConcepts
// are validated against the live catalog by scripts/seed-trends.ts --verify.

export type TrendCategory = "AI" | "Tech" | "Capital";
export type MomentumLabel = "emerging" | "accelerating" | "mainstreaming" | "cooling";
export type TrendDirection = "heating" | "cooling";

export type TrendStorySeed = {
  headline: string;
  whyItMatters: string;
  sourceUrl: string;
  date: string; // ISO yyyy-mm-dd
};

export type TrendRelatedConcept = {
  label: string;
  /** when set, links to /concepts/[slug] */
  slug?: string;
};

export type TrendSeed = {
  slug: string;
  name: string;
  category: TrendCategory;
  whatItIs: string;
  whatsHappening: string;
  momentum: number;
  momentumLabel: MomentumLabel;
  direction: TrendDirection;
  relatedConcepts: TrendRelatedConcept[];
  sources: string[];
  confidence: string;
  topStories: TrendStorySeed[];
};

export const TREND_SEEDS: TrendSeed[] = `;

writeFileSync(OUT, `${header}${JSON.stringify(seeds, null, 2)};\n`, "utf8");

console.log(`Wrote ${seeds.length} trends to prisma/seed-data/trends.ts`);
console.log(`  dash hits (should be 0): ${dashHits}`);
console.log(`  trends with >=1 concept link: ${linked}/${seeds.length}`);
console.log(`  unmapped labels (render as plain text): ${unmapped.size}`);
for (const u of [...unmapped].sort()) console.log(`    - ${u}`);
