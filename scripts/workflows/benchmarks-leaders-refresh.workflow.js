// @ts-nocheck
/* eslint-disable */
//
// Phase 0 leader refresh for the /benchmarks build (run by the Workflow tool).
// Opus-budgeted (~6-7 Opus): Sonnet does all the search/fetch/extract/verify,
// Opus only cracks unreadable boards + makes the contested trust calls, Fable
// does the final QA. See docs/plans/ongoing/BENCHMARKS_PLAN.md section 9.
//
//   Roster    (1 sonnet)  read the research, list the pack + contested flags
//   Discover  (N sonnet)  refresh each board, extract top-3 verbatim
//   HardCrack (<=4 opus)  crack the boards sonnet could not read
//   Verify    (N sonnet)  re-fetch each source, confirm numbers match
//   Judge     (3 opus)    batched adversarial trust calls on the contested set
//   QA        (1 sonnet)  consistency + dash-free publishability check (Fable is unavailable)
//
// Output saved to docs/research/benchmarks-leaders-refresh.json by the caller.

export const meta = {
  name: 'benchmarks-leaders-refresh',
  description:
    'Phase 0 deep-research leader refresh for /benchmarks: roster, sonnet discovery, opus hard-crack of unreadable boards, sonnet source-verify, batched opus trust-judgment, sonnet QA. Opus-budgeted (~6-7).',
  whenToUse:
    'Before authoring prisma/seed-data/benchmarks.ts. Produces current, verified, dated top-3 (or an honest-empty verdict) per benchmark.',
  phases: [
    { title: 'Roster', detail: 'read the research, list the benchmarks + contested flags' },
    { title: 'Discover', detail: 'sonnet: refresh each board, extract top-3 verbatim' },
    { title: 'HardCrack', detail: 'opus: crack the boards sonnet could not read' },
    { title: 'Verify', detail: 'sonnet: re-fetch each source, confirm numbers match' },
    { title: 'Judge', detail: 'opus (batched): the contested trust calls' },
    { title: 'QA', detail: 'sonnet: consistency + dash-free assembly check' },
  ],
};

const CONTEXT = `
You are refreshing the LEADER data for the AISA Atlas /benchmarks ("State of the Models") build.
Audience: university students from mixed, non-technical backgrounds. Today is mid-2026.

This is Phase 0 of docs/plans/ongoing/BENCHMARKS_PLAN.md (its section 9 is the full spec). The
benchmark BODIES (what it measures, why, scoring, criticisms) are already done in
docs/research/benchmarks-research.json and benchmarks-research-round2.json. Your job is ONLY the
current top-3 leaderboards.

Non-negotiable rules:
- Copy every score VERBATIM as the board states it. Keep intervals ("1510 +/- 11") and any
  split-name caveat ("79.2% resolved (500-instance Verified split)"). Never round or invent.
- A hallucinated or outdated "current" leaderboard is the failure we guard against. If you cannot
  find a trustworthy current board, say so (honestEmpty true) and give the single most-cited DATED
  anchor figure instead. Never guess a top-3.
- Mark each leader selfReported (the lab's own claim) vs independently evaluated, and disputed.
- Distinguish a near-tie (a statistical tie at the very top) from "contested" (a methodology
  dispute). They are different.
- Never use em dashes or en dashes. Use commas, periods, parentheses, or a plain hyphen for ranges.

You can Read repo files and use web search / fetch. Ground every number in a source URL.
`.trim();

// ─── Schemas ────────────────────────────────────────────────────────────────
const LEADER = {
  type: 'object',
  additionalProperties: false,
  required: ['rank', 'model', 'lab', 'score', 'asOfDate', 'selfReported', 'disputed'],
  properties: {
    rank: { type: 'number' },
    model: { type: 'string' },
    lab: { type: 'string' },
    score: { type: 'string' }, // VERBATIM
    asOfDate: { type: 'string' },
    sourceUrl: { type: 'string' },
    selfReported: { type: 'boolean' },
    disputed: { type: 'boolean' },
  },
};

const RECORD_PROPS = {
  slug: { type: 'string' },
  name: { type: 'string' },
  boardUrl: { type: 'string' },
  boardLastUpdated: { type: 'string' },
  gotCurrentBoard: { type: 'boolean' },
  honestEmpty: { type: 'boolean' },
  hardToRead: { type: 'boolean' },
  nearTie: { type: 'boolean' },
  confidence: { type: 'string' }, // high | medium | low
  leaders: { type: 'array', items: LEADER },
  datedAnchor: { type: 'string' }, // used when honestEmpty
  baselineAnchor: { type: 'string' },
  notes: { type: 'string' },
};

const ROSTER_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['benchmarks'],
  properties: {
    benchmarks: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['slug', 'name', 'domain', 'contested'],
        properties: {
          slug: { type: 'string' },
          name: { type: 'string' },
          domain: { type: 'string' },
          scoreType: { type: 'string' },
          contested: { type: 'boolean' },
          reason: { type: 'string' },
          existingLeaderNote: { type: 'string' },
        },
      },
    },
  },
};

const DISCOVER_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['slug', 'name', 'gotCurrentBoard', 'honestEmpty', 'hardToRead', 'nearTie', 'leaders', 'confidence'],
  properties: RECORD_PROPS,
};

const VERIFY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['slug', 'verified', 'honestEmpty', 'nearTie', 'leaders', 'confidence'],
  properties: { ...RECORD_PROPS, verified: { type: 'boolean' }, corrections: { type: 'string' } },
};

const JUDGMENT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['reviews'],
  properties: {
    reviews: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['slug', 'trustTier', 'nearTie', 'honestEmpty', 'approved'],
        properties: {
          slug: { type: 'string' },
          trustTier: { type: 'string' }, // live | near_ceiling | contested | dated
          nearTie: { type: 'boolean' },
          honestEmpty: { type: 'boolean' },
          rightBoard: { type: 'boolean' },
          approved: { type: 'boolean' },
          issues: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
};

const QA_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['ok', 'issues'],
  properties: {
    ok: { type: 'boolean' },
    issues: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['slug', 'problem'],
        properties: { slug: { type: 'string' }, problem: { type: 'string' } },
      },
    },
    dashViolations: { type: 'array', items: { type: 'string' } },
    notes: { type: 'string' },
  },
};

// ─── 1. Roster (1 sonnet) ───────────────────────────────────────────────────
phase('Roster');
const roster = await agent(
  `${CONTEXT}\n\nROSTER TASK: Read docs/research/benchmarks-research-round2.json and
docs/research/benchmarks-research.json. Return the canonical list of benchmarks in the pack to
refresh (about 13). For each: slug (kebab-case), name, domain (Reasoning, Coding, Math,
Multimodal, Human preference, or similar), scoreType (Accuracy, Elo, Pass rate, or similar),
contested (true if the existing leader data is self-reported, disputed, needsRecheck, has no
readable board, or is months stale), a short reason, and a one-line note on the existing leaders
we are refreshing. Include every benchmark in the pack. No dashes.`,
  { schema: ROSTER_SCHEMA, label: 'roster', phase: 'Roster', model: 'sonnet' },
);
const benchmarks = roster.benchmarks;
log(`Roster: ${benchmarks.length} benchmarks, ${benchmarks.filter((b) => b.contested).length} flagged contested.`);

// ─── 2. Discover (N sonnet) ─────────────────────────────────────────────────
phase('Discover');
const discovered = (
  await parallel(
    benchmarks.map((b) => () =>
      agent(
        `${CONTEXT}\n\nDISCOVER TASK for "${b.name}" (slug ${b.slug}, domain ${b.domain}).` +
          (b.existingLeaderNote ? ` Existing note: ${b.existingLeaderNote}` : '') +
          `\n\nUse web search and fetch the CURRENT (mid-2026) leaderboard. Return the top-3: model,
lab, the score COPIED VERBATIM, each entry's asOfDate and sourceUrl, and selfReported / disputed
flags. Set nearTie true if the top ranks are a statistical tie. Give a one-line baselineAnchor
(random chance, expert level, prior SOTA). If you CANNOT find a trustworthy current board, set
honestEmpty true, gotCurrentBoard false, and give the single most-cited datedAnchor figure (never
guess a top-3). If the board exists but you could not read it (JS-only, needs parsing or a
browser), set hardToRead true so a stronger agent retries. Set confidence high|medium|low. No dashes.`,
        { schema: DISCOVER_SCHEMA, label: `discover:${b.slug}`, phase: 'Discover', model: 'sonnet' },
      ),
    ),
  )
).filter(Boolean);
const bySlug = new Map(discovered.map((d) => [d.slug, d]));
log(`Discover: ${discovered.length}/${benchmarks.length} records, ${discovered.filter((d) => d.hardToRead).length} flagged hard-to-read.`);

// ─── 3. Hard-crack (<=4 opus, only the resistant boards) ────────────────────
phase('HardCrack');
const allHard = discovered.filter((d) => d.hardToRead || (!d.gotCurrentBoard && !d.honestEmpty));
const hardSet = allHard.slice(0, 4);
if (allHard.length > hardSet.length) {
  log(`Note: ${allHard.length} hard boards flagged; capping Opus hard-crack at ${hardSet.length} to hold the budget. Leftovers stay as discovered (honest-empty if unresolved).`);
}
const cracked = (
  await parallel(
    hardSet.map((d) => () =>
      agent(
        `${CONTEXT}\n\nHARD-CRACK TASK for "${d.name}" (slug ${d.slug}). A lighter agent could not
read this board. Use stronger tactics: fetch raw data files directly (for example parse
performances_generation.json from a GitHub Pages repo), or use browser automation (the Playwright
tools via ToolSearch) to render a JavaScript leaderboard. Get the CURRENT top-3 verbatim with
dates and flags, OR conclusively determine no trustworthy current board exists and return
honestEmpty true with the single dated anchor. Same fields as discovery. No dashes.`,
        { schema: DISCOVER_SCHEMA, label: `hardcrack:${d.slug}`, phase: 'HardCrack', model: 'opus' },
      ),
    ),
  )
).filter(Boolean);
for (const c of cracked) bySlug.set(c.slug, c); // overlay cracked over discovered
log(`HardCrack: ${cracked.length} boards re-attempted with Opus.`);

// ─── 4. Source-verify (N sonnet) ────────────────────────────────────────────
phase('Verify');
const merged = Array.from(bySlug.values());
const verified = (
  await parallel(
    merged.map((d) => () =>
      agent(
        `${CONTEXT}\n\nSOURCE-VERIFY TASK for "${d.name}" (slug ${d.slug}). The extracted record
(JSON):\n${JSON.stringify(d, null, 2)}\n\nRe-fetch each leader's sourceUrl and the boardUrl.
Confirm the model, the verbatim score, and the asOfDate actually appear at the source as stated.
Drop or correct anything that does not match (a hallucinated leaderboard is the failure we guard
against). Confirm selfReported and disputed. If honestEmpty, confirm the datedAnchor is real and
cited. Return the FINAL corrected record, verified=true if it holds up (false if you had to gut
it), and a one-line corrections note. No dashes.`,
        { schema: VERIFY_SCHEMA, label: `verify:${d.slug}`, phase: 'Verify', model: 'sonnet' },
      ),
    ),
  )
).filter(Boolean);
log(`Verify: ${verified.length} records source-checked (${verified.filter((v) => v.verified === false).length} gutted).`);

// ─── 5. Trust judgment (3 opus, batched over the contested set) ─────────────
phase('Judge');
const contestedSlugs = new Set(benchmarks.filter((b) => b.contested).map((b) => b.slug));
for (const v of verified) {
  if (v.honestEmpty || v.nearTie || (v.confidence && v.confidence.toLowerCase().includes('low'))) {
    contestedSlugs.add(v.slug);
  }
}
const contested = verified.filter((v) => contestedSlugs.has(v.slug));
const BATCHES = 3;
const batches = Array.from({ length: BATCHES }, (_, i) =>
  contested.filter((_, idx) => idx % BATCHES === i),
).filter((g) => g.length);
const judgments = (
  await parallel(
    batches.map((group, i) => () =>
      agent(
        `${CONTEXT}\n\nTRUST-JUDGMENT TASK (batch ${i + 1}). For each record below, make the hard
editorial calls a non-expert depends on. Records (JSON):\n${JSON.stringify(group, null, 2)}\n\nFor
each benchmark: assign the dominant trustTier (exactly one of live, near_ceiling, contested,
dated); confirm nearTie (a real statistical tie at the top) SEPARATELY from contested; confirm
honestEmpty is the honest call versus a usable dated board; confirm rightBoard (is this the
canonical, most trustworthy board for this benchmark, not an off-brand aggregator); list issues;
set approved true only if the record is safe to publish. Be adversarial: if a "current" number
looks too clean or uncited, say so. No dashes.`,
        { schema: JUDGMENT_SCHEMA, label: `judge:batch${i + 1}`, phase: 'Judge', model: 'opus' },
      ),
    ),
  )
).filter(Boolean);
const reviewBySlug = new Map();
for (const j of judgments) for (const r of j.reviews || []) reviewBySlug.set(r.slug, r);
log(`Judge: ${reviewBySlug.size} contested calls reviewed by Opus across ${batches.length} batches.`);

// ─── 6. Assemble (code) + QA (1 sonnet; Fable 5 is currently unavailable) ───
const assembled = verified.map((v) => ({ ...v, judgment: reviewBySlug.get(v.slug) || null }));
phase('QA');
const qa = await agent(
  `${CONTEXT}\n\nFINAL QA. The assembled leader-refresh dataset (JSON):\n${JSON.stringify(
    assembled,
    null,
    2,
  )}\n\nReview for publishability: any em or en dashes anywhere (list them under dashViolations);
any benchmark whose trustTier contradicts its data (for example tier "live" but honestEmpty true,
or a near-tie not flagged); any suspicious or uncited number; any missing baselineAnchor. Set
ok=true only if it is clean enough to author a seed from. Return issues as {slug, problem}. Do NOT
re-emit the dataset, only the findings. No dashes.`,
  { schema: QA_SCHEMA, label: 'qa', phase: 'QA', model: 'sonnet' },
);

return {
  benchmarks: assembled,
  roster: benchmarks,
  qa,
  meta: {
    count: assembled.length,
    contested: contested.length,
    hardCracked: cracked.length,
    judgeBatches: batches.length,
  },
};
