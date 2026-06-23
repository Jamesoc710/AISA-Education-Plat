// @ts-nocheck
/* eslint-disable */
//
// Benchmarks design judge-panel (run by the Workflow tool, NOT the app build).
// Reusable design-exploration harness for a new editorial DATA surface. It:
//   1. Represent  - parallel agents research how this CLASS of info is shown well
//   2. Propose    - diverse design personas each argue one full direction
//   3. Critique   - each proposal is stress-tested adversarially
//   4. Synthesize - one director picks a winner and grafts the best of the rest
// Output: a locked design language + reference picks, handed to a code-grounded
// plan (docs/plans/.../BENCHMARKS_PLAN.md). Same shape that produced the Trends
// "Pulse Index" redesign, finally captured as a runnable file.
//
// The globals `agent`, `parallel`, `pipeline`, `phase`, `log` are injected by the
// workflow runtime. No build-time use; safe to keep in the repo.

export const meta = {
  name: 'benchmarks-design-panel',
  description:
    'Design judge-panel for the /benchmarks editorial surface: research how this info-class is represented, diverse persona proposals, adversarial critique, then synthesize one locked design direction with reference picks.',
  whenToUse:
    'Before writing a design/build plan for a new editorial data surface (benchmarks, deal teardowns, field guides). Produces a locked design language + reference picks for a code-grounded plan.',
  phases: [
    { title: 'Represent', detail: 'parallel agents research how this info-class is presented well' },
    { title: 'Propose', detail: 'diverse design personas each argue a full direction' },
    { title: 'Critique', detail: 'each proposal stress-tested for repo fit, buildability, audience' },
    { title: 'Synthesize', detail: 'one director picks the winner and grafts the best of the rest' },
  ],
};

// ─── Shared context every agent receives ────────────────────────────────────
const CONTEXT = `
PRODUCT: TCO (Tech Collective Org), a university tech club. The app (AISA Atlas) is
an AI-literacy education site. Audience: students from mixed, often non-technical
backgrounds. Assume no prior knowledge, plain English, no hype.

SURFACE TO DESIGN: a new "/benchmarks" page, internal name "State of the Models". An
editorial literacy surface for the AI benchmarks people argue about. Spec:
- A LIST surface: one row per benchmark (~8 to 14 benchmarks in v1).
- A DETAIL page per benchmark with: what it measures, why it matters, how scoring
  works, what to watch out for (contamination / saturation), a live top-3 LEADER
  panel (which models lead, with dated numbers), and a cross-link to the related
  concept in the catalog.
- v1 ships STATIC with DATED leader numbers (zero infra). A weekly leader-line
  refresh cron is a later, purely additive step. Design for both, but v1 is static.

DATA WE ALREADY HAVE (verified, docs/research/benchmarks-research*.json): ~13
benchmarks (MMLU-Pro, GPQA Diamond, SWE-bench Verified, HumanEval / LiveCodeBench,
ARC-AGI-2, MMMU, LMArena / Chatbot Arena Elo, Humanity's Last Exam, FrontierMath,
AIME, TAU-bench, and a few more). For each: a one-line "what it measures", why it
matters, approximate current SOTA score plus leading model/lab, known criticisms /
saturation, and a "why a normal person should care" line. Several carry caveats
(SWE-bench Verified was publicly dropped by OpenAI over flawed tests, HLE has a high
answer-error rate, FrontierMath numbers need recheck). The design MUST make "this
number is contested or dated" legible, not just show a clean leaderboard.

DESIGN SYSTEM (must fit it): the app has an "editorial" surface language used on
/home, /dashboard, the This-Week digest, and the Trends "Pulse Index". It is: Hanken
Grotesk type, one accent (Quizlet blue #4255FF) via data-surface="editorial", a warm
#FAF9F5 ground, #1F1F22 text, hairline 1px rules, NO cards and no boxes around
content, hierarchy from size + weight + opacity (not extra grays). Shared primitives:
HairRule, SectionEyebrow (uppercase 11px label), editorial-link (underline sweep plus
arrow nudge on hover), ThinBar (2px accent fill on a track), a 2-column split with a
1px vertical rule. The Trends redesign ("The Pulse Index") is a Typewolf-style two-up
index: a soft numbered badge, the name as the hero, a small metadata line, crisp 1px
rules. /benchmarks should feel cohesive with this family but earn its own treatment
for ranked, contested, numeric data.

HARD CONSTRAINT: never use em dashes or en dashes anywhere in any copy you write. Use
commas, periods, parentheses, or a plain hyphen for ranges (like 5-7).

GROUNDING FILES you may Read for accuracy: app/globals.css (the editorial tokens),
components/trends-client.tsx and components/digest-client.tsx (editorial surfaces in
real code), docs/research/benchmarks-research.json (the data shape), and
docs/plans/ongoing/EXPANSION.md section 7.3 (the spec).
`.trim();

// ─── Schemas ────────────────────────────────────────────────────────────────
const REF = {
  type: 'object',
  additionalProperties: false,
  required: ['name', 'why'],
  properties: { name: { type: 'string' }, url: { type: 'string' }, why: { type: 'string' } },
};

const REPRESENTATION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['lens', 'patterns', 'references', 'pitfalls', 'audienceFit'],
  properties: {
    lens: { type: 'string' },
    patterns: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'description', 'whyItWorksForUs'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          whyItWorksForUs: { type: 'string' },
        },
      },
    },
    references: { type: 'array', items: REF },
    pitfalls: { type: 'array', items: { type: 'string' } },
    audienceFit: { type: 'string' },
  },
};

const PROPOSAL_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'persona',
    'designLanguageName',
    'bigIdea',
    'listSurface',
    'detailSurface',
    'leaderPanel',
    'referencePick',
    'repoFit',
    'tradeoffs',
    'asciiSketch',
  ],
  properties: {
    persona: { type: 'string' },
    designLanguageName: { type: 'string' },
    bigIdea: { type: 'string' },
    listSurface: { type: 'string' },
    detailSurface: { type: 'string' },
    leaderPanel: { type: 'string' },
    referencePick: REF,
    repoFit: { type: 'string' },
    tradeoffs: { type: 'string' },
    asciiSketch: { type: 'string' },
  },
};

const CRITIQUE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['strengths', 'risks', 'buildabilityScore', 'audienceScore', 'cohesionScore', 'verdict'],
  properties: {
    strengths: { type: 'array', items: { type: 'string' } },
    risks: { type: 'array', items: { type: 'string' } },
    buildabilityScore: { type: 'number' },
    audienceScore: { type: 'number' },
    cohesionScore: { type: 'number' },
    verdict: { type: 'string' },
  },
};

const SYNTHESIS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'designLanguageName',
    'rationale',
    'referencePicks',
    'listSurface',
    'detailSurface',
    'leaderPanel',
    'motionAndAccent',
    'repoGrounding',
    'graftsFromRunnersUp',
    'openQuestions',
  ],
  properties: {
    designLanguageName: { type: 'string' },
    rationale: { type: 'string' },
    referencePicks: { type: 'array', items: REF },
    listSurface: {
      type: 'object',
      additionalProperties: false,
      required: ['concept', 'asciiSketch'],
      properties: { concept: { type: 'string' }, asciiSketch: { type: 'string' } },
    },
    detailSurface: {
      type: 'object',
      additionalProperties: false,
      required: ['concept', 'sections', 'asciiSketch'],
      properties: {
        concept: { type: 'string' },
        sections: { type: 'array', items: { type: 'string' } },
        asciiSketch: { type: 'string' },
      },
    },
    leaderPanel: {
      type: 'object',
      additionalProperties: false,
      required: ['concept', 'treatment'],
      properties: { concept: { type: 'string' }, treatment: { type: 'string' } },
    },
    motionAndAccent: { type: 'string' },
    repoGrounding: { type: 'array', items: { type: 'string' } },
    graftsFromRunnersUp: { type: 'array', items: { type: 'string' } },
    openQuestions: { type: 'array', items: { type: 'string' } },
  },
};

// ─── Panel members ──────────────────────────────────────────────────────────
const LENSES = [
  {
    key: 'data-journalism',
    brief:
      'Data journalism and explainer media: how respected outlets (The Pudding, NYT / Bloomberg graphics, FiveThirtyEight, The Verge, Our World in Data style explainers) present model or benchmark comparisons and "state of AI" stories to a general, non-expert reader. Focus on making contested numbers and methodology legible.',
  },
  {
    key: 'leaderboards',
    brief:
      'Live leaderboard and dashboard products: how ranking and score data is shown (LMArena / Chatbot Arena, Papers With Code, Hugging Face Open LLM Leaderboard, Artificial Analysis, even sports standings). Focus on top-N treatments, dated or changing numbers, and showing uncertainty or movement.',
  },
  {
    key: 'literacy-reference',
    brief:
      'Editorial literacy and reference surfaces: how complex technical topics get a "what it measures / why it matters / how it works / criticism" treatment for newcomers (Our World in Data, Wikipedia infoboxes, Stripe-style explainer docs, good glossary sites). Focus on the per-benchmark DETAIL page structure.',
  },
  {
    key: 'curated-index',
    brief:
      'Curated index and award editorial: how a tasteful curated list reads (Typewolf Top Sites, Awwwards, "best of" indexes, magazine contents pages). Focus on the LIST surface rhythm: numbered badges, a hero name, restrained metadata, crisp rules.',
  },
];

const PERSONAS = [
  {
    key: 'editorial-minimalist',
    brief:
      'The Editorial Minimalist. Extends the existing Pulse Index / home language with maximum restraint. Type and hairlines do the work, the number is quiet. Cohesion with the rest of the site is the priority.',
  },
  {
    key: 'data-forward',
    brief:
      'The Data-Forward designer. The scores and the top-3 leaders are the hero and must be instantly scannable and comparable across benchmarks, while staying inside the editorial (no-card) system. Believes students come to see who is winning.',
  },
  {
    key: 'teacher',
    brief:
      'The Teacher, literacy-first. The "why it matters" and the criticism / caveats lead, the number is supporting evidence and never the headline, because a contested number shown plainly misleads non-experts. Lowest possible barrier to understanding.',
  },
  {
    key: 'magazine-index',
    brief:
      'The Magazine Index designer. A confident "State of the Models" curated index with strong editorial rhythm (Typewolf-style two-up or a contents-page feel), treating benchmarks like a ranked field worth browsing. Consistent with the Trends index, but its own identity.',
  },
];

// ─── 1. Represent ───────────────────────────────────────────────────────────
phase('Represent');
const research = (
  await parallel(
    LENSES.map((l) => () =>
      agent(
        `${CONTEXT}\n\nYOUR TASK (representation research, lens = ${l.key}):\n${l.brief}\n\n` +
          `Research how this lens presents this CLASS of information well. Use web search if available to ground references in concrete, current sites, otherwise draw on your knowledge. ` +
          `Return: reusable design PATTERNS (what they do, why it would work for our benchmarks surface and non-expert audience), concrete REFERENCE sites worth borrowing from (name, url if known, exactly what to borrow), PITFALLS to avoid for our audience, and a short audience-fit note. Be specific and visual, not generic.`,
        { schema: REPRESENTATION_SCHEMA, label: `represent:${l.key}`, phase: 'Represent', model: 'sonnet' },
      ),
    ),
  )
).filter(Boolean);
log(`Representation research done: ${research.length}/${LENSES.length} lenses.`);
const researchDigest = JSON.stringify(research, null, 2);

// ─── 2 + 3. Propose, then critique each proposal (pipelined) ─────────────────
phase('Propose');
const judged = await pipeline(
  PERSONAS,
  (p) =>
    agent(
      `${CONTEXT}\n\nThe panel first researched how this info-class is represented. Here is ALL of that research as JSON:\n\n${researchDigest}\n\n` +
        `YOUR ROLE: ${p.brief}\n\n` +
        `Propose ONE complete, opinionated design direction for /benchmarks from your point of view, USING the research above and the real editorial repo. Give it a design-language NAME. Describe how the LIST surface reads, how a benchmark DETAIL page reads, and how the live top-3 LEADER panel is shown. Pick ONE concrete reference and say why. Say which existing repo primitives/tokens it reuses (repoFit). State the tradeoffs honestly. Include a rough ASCII sketch of the list plus one detail page. Make it distinct and true to your persona, not a safe average.`,
      { schema: PROPOSAL_SCHEMA, label: `propose:${p.key}`, phase: 'Propose' },
    ),
  (proposal, p) =>
    agent(
      `${CONTEXT}\n\nA design persona proposed this direction for /benchmarks (JSON):\n\n${JSON.stringify(proposal, null, 2)}\n\n` +
        `YOUR ROLE: an adversarial design critic. Stress-test this proposal HARD on three axes: (1) repo fit and buildability in the existing editorial system, (2) audience fit for non-expert students, (3) cohesion with the site's editorial brand. List genuine strengths and genuine risks. Score each axis 1-5 (5 best). Give a one-line verdict. Be skeptical, do not rubber-stamp.`,
      { schema: CRITIQUE_SCHEMA, label: `critique:${p.key}`, phase: 'Critique', model: 'sonnet' },
    ).then((critique) => ({ persona: p.key, proposal, critique })),
);
const panel = judged.filter(Boolean);
log(`Proposals + critiques done: ${panel.length}/${PERSONAS.length}.`);

// ─── 4. Synthesize ──────────────────────────────────────────────────────────
phase('Synthesize');
const synthesis = await agent(
  `${CONTEXT}\n\nThe design panel produced these proposals, each with an adversarial critique (JSON):\n\n${JSON.stringify(
    panel,
    null,
    2,
  )}\n\nAND this upstream representation research:\n\n${researchDigest}\n\n` +
    `YOUR ROLE: the design director. Pick ONE winning direction for /benchmarks and GRAFT the best ideas from the runners-up into it. Produce the LOCKED design language: a name, the rationale (what you took from whom and why), the reference pick(s), and concrete direction for the LIST surface, the DETAIL page, and the live LEADER panel (each with a tight ASCII sketch). Specify motion and accent use, and the exact repo primitives/tokens/files to reuse (repoGrounding). List the best grafts from the runners-up. End with the open questions a human (James) should decide before build. Honor the no-dashes rule and the static-first v1 scope.`,
  { schema: SYNTHESIS_SCHEMA, label: 'synthesize', phase: 'Synthesize', effort: 'high' },
);

return { research, panel, synthesis };
