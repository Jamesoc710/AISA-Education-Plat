// Use cases ("By Task, with Receipts") seed data.
//
// The task-first door at /benchmarks: 11 student-facing use cases, each a
// decision walk whose spine is how-to-choose guidance and whose honest picks
// are welded ScoreStamps citing exactly one benchmark, one date, one caveat.
//
// Authored from docs/research/benchmarks-usecases-research.json + the verified
// leader extractions in docs/research/benchmarks-usecases-leaders-extracted.md,
// mapped onto the 22 records in ./benchmarks.ts. House rules (enforced by
// scripts/seed-use-cases.ts): zero em dashes or en dashes anywhere (hyphens,
// commas, colons only); every cited benchmarkSlug exists in BENCHMARK_SEEDS;
// every pick leaderRank / leaderRanks resolves on that board OR the pick is
// empty=true; every pick carries a non-empty caveat; every scaffold pick carries
// a whatWasTested line; every honestEmpty use case carries a gapReason. Picks
// AUTHOR the (slug, rank) + label + caveat only; the score / lab / date / flags
// RESOLVE from Benchmark.leaders at render, so a pick can never drift. Seeded as
// drafts. See docs/plans/ongoing/BENCHMARKS_USE_CASES_BUILD_PLAN.md.

/** One authored honest pick. The receipt resolves from the cited board's leaders. */
export type PickSeed = {
  /** "Best for {sub-goal}" */
  label: string;
  /** the ONE board this pick cites; must exist in BENCHMARK_SEEDS */
  benchmarkSlug: string;
  /** cite one leader row for a single-leader pick */
  leaderRank?: number;
  /** cite multiple rows for a co-leaders near-tie pick (each gets its own welded ScoreStamp) */
  leaderRanks?: number[];
  /** the cited leader is an agent scaffold, not a bare model (drives the SCAFFOLD chip) */
  scaffold?: boolean;
  /** force the self-reported framing even when the board's tier is not contested */
  selfReported?: boolean;
  /** AUTHORED honest-empty pick: emits no model name, renders the judge-it-yourself body */
  empty?: boolean;
  /** shown when empty */
  datedAnchor?: string;
  /** REQUIRED on every pick */
  caveat: string;
  /** REQUIRED when scaffold=true: what system actually produced the score */
  whatWasTested?: string;
};

/** One backing benchmark in "the tests that matter", ordered. */
export type YardstickSeed = {
  benchmarkSlug: string;
  /** one-line how-far-to-trust gloss */
  trustGloss: string;
};

/** One branch of the how-to-choose spine. */
export type HowToChooseSeed = {
  goal: string;
  /** the one board this branch points to */
  benchmarkSlug?: string;
  guidance: string;
  /** honest "no clean answer yet" branch */
  noCleanAnswer?: boolean;
  /** why, when noCleanAnswer */
  reason?: string;
};

export type UseCaseRelatedConcept = {
  label: string;
  /** when set, links to /concepts/[slug] (validated against the live catalog) */
  slug?: string;
};

export type UseCaseSeed = {
  slug: string;
  name: string;
  audienceLine: string;
  taskLead: string;
  bottomLine: string;
  /** the ONE board the bottom line + rail date bind to; omit when honestEmpty */
  bottomLineBenchmarkSlug?: string;
  evidenceLine: string;
  yardsticks: YardstickSeed[];
  picks: PickSeed[];
  howToChoose: HowToChooseSeed[];
  /** the honest-empty "judge it yourself on these two things" */
  judgeCriteria?: string[];
  watchOut: string;
  watchOutUrl?: string;
  relatedConcepts?: UseCaseRelatedConcept[];
  /** AUTHORED: no backing board has a usable live leader; drives explorer grouping */
  honestEmpty: boolean;
  /** the single anchor shown first when honestEmpty */
  datedAnchor?: string;
  /** why no trustworthy board exists; REQUIRED when honestEmpty */
  gapReason?: string;
  /** editorial sort within a group */
  order: number;
};

/** The 11 use-case slugs. Single source of truth, imported by both seeders. */
export const USE_CASE_SLUGS = new Set<string>([
  "coding-and-building-apps",
  "math-and-reasoning",
  "science-and-expert-knowledge",
  "novel-problem-reasoning",
  "images-charts-and-documents",
  "agents-tools-and-automation",
  "factual-accuracy",
  "long-documents-and-context",
  "what-people-prefer",
  "writing-and-communication",
  "languages-and-translation",
]);

export const USE_CASE_SEEDS: UseCaseSeed[] = [
  // ── Coding and building apps ───────────────────────────────────────────────
  {
    slug: "coding-and-building-apps",
    name: "Coding and building apps",
    audienceLine: "Will it write code that runs, and fix a real bug in a real project?",
    taskLead:
      "You want a model that does not just produce plausible-looking code, but code that compiles, passes the tests, and resolves the issue you actually filed.",
    bottomLine:
      "The most job-like coding board, SWE-bench Verified, is contested: OpenAI stopped reporting it in early 2026 and its current number one is under an access dispute. As of JUN 2026 the top verified score on it is about 95 percent, but read that as a disputed claim, not a settled winner.",
    bottomLineBenchmarkSlug: "swe-bench-verified",
    evidenceLine:
      "Coding is read mainly through SWE-bench Verified for real bug fixing, with LiveCodeBench and HumanEval as the contamination-aware and the saturated reference points.",
    yardsticks: [
      {
        benchmarkSlug: "swe-bench-verified",
        trustGloss:
          "The closest test to the real job, but contested: OpenAI dropped it and the top score is disputed.",
      },
      {
        benchmarkSlug: "livecodebench",
        trustGloss:
          "Built to defeat memorization with fresh problems, but no trustworthy current board exists.",
      },
      {
        benchmarkSlug: "humaneval",
        trustGloss:
          "The historic default, now saturated: nearly every model clears it, so a high score says little.",
      },
      {
        benchmarkSlug: "design2code",
        trustGloss:
          "Screenshot-to-code similarity, but no trustworthy current board exists, only self-reported aggregator figures.",
      },
    ],
    picks: [
      {
        label: "Best for fixing a real bug in an existing codebase",
        benchmarkSlug: "swe-bench-verified",
        leaderRank: 1,
        caveat:
          "SWE-bench Verified is contested: OpenAI stopped reporting it in February 2026, saying tasks had leaked into training and many tests reject correct fixes, and the number one shown was suspended from public access in June 2026. Read it as a disputed claim, not today's settled best.",
      },
    ],
    howToChoose: [
      {
        goal: "Fixing a real bug in a real repository",
        benchmarkSlug: "swe-bench-verified",
        guidance:
          "Start from SWE-bench Verified, the test closest to a maintainer's pull request, but read its top as contested and lean on a model you can actually access today.",
      },
      {
        goal: "Competition-style problems on fresh, unseen prompts",
        benchmarkSlug: "livecodebench",
        guidance:
          "LiveCodeBench is the right idea because it only grades problems published after a model's training cut-off.",
        noCleanAnswer: true,
        reason:
          "Its official board is frozen at mid-2025 and three aggregators each report a different current top three, so there is no trustworthy live ranking to quote.",
      },
      {
        goal: "Short, self-contained functions",
        benchmarkSlug: "humaneval",
        guidance:
          "HumanEval is effectively retired: nearly every frontier model clears it, so use it only as a floor. Below about 90 percent is a red flag; above that the number does not separate anyone.",
      },
      {
        goal: "Turning a design or screenshot into front-end code",
        benchmarkSlug: "design2code",
        guidance:
          "Design2Code is the named benchmark for screenshot-to-code.",
        noCleanAnswer: true,
        reason:
          "Its only public figures are self-reported through an aggregator with no independent referee, so treat any leader here as an unverified claim and judge the output yourself.",
      },
    ],
    watchOut:
      "Coding scores are the most contaminated on this whole surface: popular problems and their solutions sit in nearly every training set, so a sky-high number can reflect memorization rather than skill. The job-like test, SWE-bench Verified, is the one labs argue about most. Prefer a model you can actually use today over whoever tops a frozen or disputed board.",
    watchOutUrl: "https://openai.com/index/why-we-no-longer-evaluate-swe-bench-verified/",
    relatedConcepts: [
      { label: "Agents and tool use", slug: "agentic-capabilities" },
      { label: "Tool use", slug: "tool-use" },
      { label: "Benchmarking LLMs", slug: "benchmarking-llms" },
    ],
    honestEmpty: false,
    order: 10,
  },

  // ── Math and step-by-step reasoning ────────────────────────────────────────
  {
    slug: "math-and-reasoning",
    name: "Math and step-by-step reasoning",
    audienceLine: "Can it solve a hard problem step by step and get the exact answer?",
    taskLead:
      "You want a model that reasons through a multi-step problem to the right final number, on problems it could not have seen before, not one that pattern-matches a memorized solution.",
    bottomLine:
      "On the freshest contest exam, AIME 2026, the leaders cluster between about 94 and 97 percent, separated by a fraction of a point, so the very top is inside the noise. As of JUN 2026 the cleanest read is that several models are effectively tied; do not over-read whoever is listed first.",
    bottomLineBenchmarkSlug: "aime",
    evidenceLine:
      "Math is read through AIME for contest-style reasoning on a fresh exam, and FrontierMath for research-level problems, with the latter currently under an error review.",
    yardsticks: [
      {
        benchmarkSlug: "aime",
        trustGloss:
          "Independent and refreshed on each new exam, but the leaders are nearly tied and old editions leak into training.",
      },
      {
        benchmarkSlug: "frontiermath",
        trustGloss:
          "Research-level and guess-proof, but scores are pre-correction while the maintainer reviews about a third of the problems.",
      },
    ],
    picks: [
      {
        label: "Best for contest-style math on fresh problems",
        benchmarkSlug: "aime",
        leaderRank: 1,
        caveat:
          "AIME leaders are separated by a fraction of a point, well inside the margin of error, so read the top as a cluster, not a ranking. Scores on older AIME papers run 10 to 20 points higher because those exams leaked into training; this pick uses the fresh 2026 exam.",
      },
      {
        label: "Best for research-level mathematics",
        benchmarkSlug: "frontiermath",
        leaderRank: 1,
        caveat:
          "FrontierMath numbers are contested: Epoch AI found fatal errors in roughly one third of the problems, so every current score is pre-correction, and OpenAI funded the benchmark with access to most problems. Read the standings as provisional.",
      },
    ],
    howToChoose: [
      {
        goal: "Contest-style problems with exact integer answers",
        benchmarkSlug: "aime",
        guidance:
          "AIME on the fresh 2026 exam is the honest signal. Ignore any AIME 2024 number, which is inflated by contamination, and watch for scores quietly run with a calculator or code tool.",
      },
      {
        goal: "Genuinely novel, research-level mathematics",
        benchmarkSlug: "frontiermath",
        guidance:
          "FrontierMath is the only test at this difficulty, but read it as provisional while the error review and the funding conflict are unresolved.",
      },
    ],
    watchOut:
      "Math is where contamination bites hardest. A model can look brilliant on an old exam it memorized and ordinary on a fresh one, so always ask which exam a number came from. At the very top, the leaders are usually a fraction of a point apart, which is a tie, not a ranking.",
    watchOutUrl: "https://matharena.ai/",
    relatedConcepts: [
      { label: "Reasoning models", slug: "reasoning-models" },
      { label: "Learning from verifiable rewards", slug: "rlvr" },
      { label: "Benchmarking LLMs", slug: "benchmarking-llms" },
    ],
    honestEmpty: false,
    order: 20,
  },

  // ── Science and expert knowledge ───────────────────────────────────────────
  {
    slug: "science-and-expert-knowledge",
    name: "Science and expert knowledge",
    audienceLine: "Can it answer graduate-level science questions, and how close is it to the edge of what experts know?",
    taskLead:
      "You want a model that holds up on hard, specialist questions, the kind where a confident wrong answer is worse than useful, across biology, physics, chemistry, and beyond.",
    bottomLine:
      "On Humanity's Last Exam, the test built to be the hardest exam in the world for an AI, the top two models are a genuine statistical tie, their intervals overlap, and even the leaders score under 50 percent. As of MAY 2026 read the top as shared, and remember a meaningful share of the answer key is itself disputed.",
    bottomLineBenchmarkSlug: "humanitys-last-exam",
    evidenceLine:
      "Expert knowledge is read through GPQA Diamond for graduate science, Humanity's Last Exam for the frontier of human knowledge, and MMLU-Pro for broad exam-grade reasoning.",
    yardsticks: [
      {
        benchmarkSlug: "gpqa-diamond",
        trustGloss:
          "Google-proof graduate science, but saturated: the leaders sit within about a point, so the ordering at the top is close to a coin flip.",
      },
      {
        benchmarkSlug: "humanitys-last-exam",
        trustGloss:
          "Still genuinely unsolved at under 50 percent, but the top is a tie and reviewers found many reference answers wrong.",
      },
      {
        benchmarkSlug: "mmlu-pro",
        trustGloss:
          "Broad exam-grade knowledge, but the official board froze in March 2026 and is itself starting to saturate near 90 percent.",
      },
    ],
    picks: [
      {
        label: "Best at the frontier of expert knowledge",
        benchmarkSlug: "humanitys-last-exam",
        leaderRanks: [1],
        caveat:
          "The top two share rank one: their confidence intervals overlap, so naming a single winner overstates the certainty. And read every absolute score with care, independent reviewers estimate 18 to 29 percent of the chemistry and biology reference answers are wrong.",
      },
      {
        label: "Best for graduate-level science questions",
        benchmarkSlug: "gpqa-diamond",
        leaderRank: 1,
        caveat:
          "GPQA Diamond is widely described as saturated: the top models cluster within about one point, smaller than normal run-to-run variation, and different independent evaluators crown different number ones. The ordering at the very top is not meaningful.",
      },
    ],
    howToChoose: [
      {
        goal: "Hard graduate-level science questions",
        benchmarkSlug: "gpqa-diamond",
        guidance:
          "GPQA Diamond is the standard, but it is saturated, so treat the top handful as interchangeable and pick on access and cost.",
      },
      {
        goal: "The genuine frontier of human knowledge",
        benchmarkSlug: "humanitys-last-exam",
        guidance:
          "Humanity's Last Exam still has room to measure, which makes it the best progress gauge, but read the top as a tie and the absolute numbers as approximate given the answer-key issues.",
      },
      {
        goal: "Broad, general exam-grade knowledge",
        benchmarkSlug: "mmlu-pro",
        guidance:
          "MMLU-Pro covers the widest range, but its board is months old and only the top entry was independently evaluated, so newer models may simply be missing.",
      },
    ],
    watchOut:
      "Two traps here. Most of these tests are saturating, so a one or two point gap at the top is noise, not a winner. And a high score is only as trustworthy as the answer key behind it, which on Humanity's Last Exam is itself partly disputed. Prefer the tests that still have room to separate models.",
    watchOutUrl: "https://www.futurehouse.org/research-announcements/hle-exam",
    relatedConcepts: [
      { label: "Reasoning models", slug: "reasoning-models" },
      { label: "Benchmarking LLMs", slug: "benchmarking-llms" },
      { label: "Hallucinations", slug: "hallucinations" },
    ],
    honestEmpty: false,
    order: 30,
  },

  // ── Reasoning on genuinely new problems ────────────────────────────────────
  {
    slug: "novel-problem-reasoning",
    name: "Reasoning on genuinely new problems",
    audienceLine: "Can it solve a puzzle built to defeat memorization, or only recall trained patterns?",
    taskLead:
      "You want a model that learns a brand-new rule on the spot and applies it, the skill that separates real reasoning from sophisticated pattern-matching.",
    bottomLine:
      "On ARC-AGI v2, the test rebuilt to defeat memorization, every headline score in the public ranking is a self-reported lab claim the benchmark's own foundation has not verified. As of JUN 2026 the honest read is that there is no verified leader: the foundation's tracker shows zero independently confirmed public scores.",
    bottomLineBenchmarkSlug: "arc-agi-2",
    evidenceLine:
      "Novel reasoning is read through ARC-AGI v2, the current and unsaturated front line, with ARC-AGI v1 as the now-solved predecessor.",
    yardsticks: [
      {
        benchmarkSlug: "arc-agi-2",
        trustGloss:
          "Built to be immune to memorization, but every public score is a self-reported lab claim, not an ARC Prize verified result.",
      },
      {
        benchmarkSlug: "arc-agi-1",
        trustGloss:
          "The famous test machines could not crack, now effectively solved at 96 to 98 percent, so it no longer separates the top.",
      },
    ],
    picks: [
      {
        label: "Best on novel puzzles built to defeat memorization",
        benchmarkSlug: "arc-agi-2",
        leaderRank: 1,
        caveat:
          "Every number in the public ARC-AGI v2 ranking is a self-reported lab claim, not an ARC Prize verified result, and aggregators disagree on the order. Under the strict, resource-limited competition the best result was only about 24 percent, far below the headline claims.",
      },
    ],
    howToChoose: [
      {
        goal: "Solving genuinely new, compositional puzzles",
        benchmarkSlug: "arc-agi-2",
        guidance:
          "ARC-AGI v2 is the right test, but treat the public leaderboard as unverified claims; the only trustworthy figures are the ARC Prize foundation's own confirmed runs and the constrained competition record.",
      },
      {
        goal: "The classic on-the-spot pattern test",
        benchmarkSlug: "arc-agi-1",
        guidance:
          "ARC-AGI v1 is essentially beaten, so a top score here is table stakes, not a differentiator. The action has moved to v2.",
      },
    ],
    watchOut:
      "This is the sharpest example on the surface of why provenance matters: the impressive public numbers are self-reported and unverified, and the gap between a headline claim near 85 percent and the verified, resource-constrained record near 24 percent is the whole story. Raw, unconstrained scores and efficient, reproducible problem-solving are very different things.",
    watchOutUrl: "https://arcprize.org/leaderboard",
    relatedConcepts: [
      { label: "Reasoning models", slug: "reasoning-models" },
      { label: "AGI", slug: "agi" },
      { label: "Filtering AI hype", slug: "filtering-ai-hype" },
    ],
    honestEmpty: false,
    order: 40,
  },

  // ── Images, charts, and documents ──────────────────────────────────────────
  {
    slug: "images-charts-and-documents",
    name: "Images, charts, and documents",
    audienceLine: "Can it actually read a chart, a diagram, or a scanned page, not just the words around it?",
    taskLead:
      "You want a model that understands what it is looking at, a figure, a table, a form, and reasons about it, which is where consumer AI is heading as assistants handle screenshots and photos.",
    bottomLine:
      "As of JUN 2026 on MMMU-Pro, the independently-run test of college-level image reasoning, the top two slots are the same model at two effort settings, both at 84 percent, and the top three are all Google Gemini variants. Read the lead as a single-lab cluster measured by one evaluator, not a settled ranking across the field.",
    bottomLineBenchmarkSlug: "mmmu-pro",
    evidenceLine:
      "Image and document understanding is read through MMMU-Pro and MMMU for college-level visual reasoning, and OmniDocBench for turning real pages into structured data.",
    yardsticks: [
      {
        benchmarkSlug: "mmmu-pro",
        trustGloss:
          "The harder, de-saturated version with an independent evaluator, but the top is a within-model tie and all-Google.",
      },
      {
        benchmarkSlug: "mmmu",
        trustGloss:
          "The main multimodal yardstick, but every score is self-reported and the leaders are within a point.",
      },
      {
        benchmarkSlug: "omnidocbench",
        trustGloss:
          "The most comprehensive document-parsing test, but the top scores are self-reported and the number one shares a maintainer with the benchmark.",
      },
    ],
    picks: [
      {
        label: "Best for reading images and charts at a college level",
        benchmarkSlug: "mmmu-pro",
        leaderRank: 1,
        caveat:
          "The top two slots are the same model, Gemini 3.5 Flash, at two effort settings, not two different models, and the top three are all Google Gemini variants. These are Artificial Analysis numbers, which can differ from the official MMMU-Pro harness, so treat them as one lab's measurement and cite that board by name.",
      },
      {
        label: "Best for turning PDFs and scans into structured data",
        benchmarkSlug: "omnidocbench",
        leaderRank: 1,
        selfReported: true,
        caveat:
          "Every OmniDocBench score is self-reported in the project's own repository rather than independently re-run, and the number one is maintained by OpenDataLab, the same organization that maintains the benchmark, a direct conflict of interest. There is no independent board to check it against.",
      },
    ],
    howToChoose: [
      {
        goal: "Reading charts, diagrams, and figures",
        benchmarkSlug: "mmmu-pro",
        guidance:
          "MMMU-Pro is the sterner, independently-run test, so prefer it over the original MMMU, but read the top as a single-lab cluster and judge on the images you actually care about.",
      },
      {
        goal: "Turning documents and scans into data",
        benchmarkSlug: "omnidocbench",
        guidance:
          "OmniDocBench is the most complete test, but its numbers are self-reported with a maintainer conflict, so run your own pages before trusting a leader.",
      },
    ],
    watchOut:
      "Multimodal boards are unusually self-reported, and the current leaders are heavily concentrated in one vendor, so a high number can reflect who submitted, or who measured, as much as who is best. Prefer the independently-run board and cite it by name, since different evaluators rank different models on top.",
    watchOutUrl: "https://artificialanalysis.ai/evaluations/mmmu-pro",
    relatedConcepts: [
      { label: "Multimodality", slug: "multimodality" },
      { label: "Benchmarking LLMs", slug: "benchmarking-llms" },
      { label: "Reasoning models", slug: "reasoning-models" },
    ],
    honestEmpty: false,
    order: 50,
  },

  // ── Agents, tools, and automation ──────────────────────────────────────────
  {
    slug: "agents-tools-and-automation",
    name: "Agents, tools, and automation",
    audienceLine: "Can it reliably call the right tool, or drive a real computer to finish a task end to end?",
    taskLead:
      "You want a model you could trust to take actions, call an API, run code, operate an app, and actually complete the job, not just describe how it would.",
    bottomLine:
      "The most-cited independent tool-calling board, BFCL, was last readable as of APR 2026, when Claude Opus 4.5 led at about 77 percent. Read that as past tense: the board predates Opus 4.7 and 4.8, Gemini 3.1, and GPT-5.5, so it does not reflect today's models.",
    bottomLineBenchmarkSlug: "bfcl",
    evidenceLine:
      "Agent ability is read through BFCL for tool and function calling, OSWorld for driving a real computer, and TAU-bench for reliable multi-step service tasks.",
    yardsticks: [
      {
        benchmarkSlug: "bfcl",
        trustGloss:
          "The standard independent tool-calling board, but its only readable data is the April 2026 snapshot, which predates the newest models.",
      },
      {
        benchmarkSlug: "osworld",
        trustGloss:
          "Real desktop tasks graded by execution, but the leaders are agent scaffolds, not the bare model you would call.",
      },
      {
        benchmarkSlug: "tau-bench",
        trustGloss:
          "Grades whether an agent succeeds every time, but the only verified scores are a year stale and cover one task type.",
      },
    ],
    picks: [
      {
        label: "Best for tool and function calling",
        benchmarkSlug: "bfcl",
        leaderRank: 1,
        caveat:
          "This is the April 2026 board, the last readable snapshot, so it predates Opus 4.7 and 4.8, Gemini 3.1, and GPT-5.5. Read the leader as past tense, not today's best, and expect the ranking to have moved.",
      },
      {
        label: "Best for driving a real computer or desktop",
        benchmarkSlug: "osworld",
        leaderRank: 1,
        scaffold: true,
        whatWasTested:
          "The score belongs to Pointer Agent running Opus 4.7, a full agent scaffold, not the bare Opus 4.7 model you would call from an API; you cannot get this number from the model alone.",
        caveat:
          "The top entries are agent scaffolds, and the same scaffold appears twice on different base models, so the ranking partly measures the harness, not the model. The top three are also within about two points, a near-tie.",
      },
    ],
    howToChoose: [
      {
        goal: "Calling APIs and functions correctly",
        benchmarkSlug: "bfcl",
        guidance:
          "BFCL is the most-cited independent measure, but its board is months old, so use it as a prior-generation signal and re-test the current model you plan to use.",
      },
      {
        goal: "Operating real desktop apps end to end",
        benchmarkSlug: "osworld",
        guidance:
          "OSWorld is the closest to a can-it-use-my-laptop test, but the leaders are scaffolds; if you call a bare model, expect less than the headline number.",
      },
      {
        goal: "Reliable, repeatable multi-step service tasks",
        benchmarkSlug: "tau-bench",
        guidance:
          "TAU-bench is the right idea because it grades success on every attempt, not just one.",
        noCleanAnswer: true,
        reason:
          "The only independently verified scores cover one task type and stopped updating in mid-2025, and every current third-party number is self-reported, so there is no trustworthy live ranking.",
      },
    ],
    watchOut:
      "Agent scores are slippery for two reasons: many headline numbers come from full scaffolds rather than the bare model you would call, and the most-cited boards are either months old or self-reported. Treat a single agent number as a rough prior, and reliability across repeated tries matters more than a one-shot success rate.",
    watchOutUrl: "https://gorilla.cs.berkeley.edu/leaderboard.html",
    relatedConcepts: [
      { label: "Agents and tool use", slug: "agentic-capabilities" },
      { label: "Tool use", slug: "tool-use" },
      { label: "Benchmarking LLMs", slug: "benchmarking-llms" },
    ],
    honestEmpty: false,
    order: 60,
  },

  // ── Factual accuracy: not making things up ─────────────────────────────────
  {
    slug: "factual-accuracy",
    name: "Factual accuracy: not making things up",
    audienceLine: "Will it answer a fact wrong with confidence, or admit when it does not know?",
    taskLead:
      "You want a model that gets short, checkable facts right and declines the ones it does not know, instead of inventing a confident, wrong answer.",
    bottomLine:
      "On the Kaggle SimpleQA board, Gemini 3.1 Pro Preview tops it at about 74.8 percent as of JUN 2026, clear of second place beyond the error bars. But the name SimpleQA is overloaded across several different boards, so this figure only means something when you say it came from this specific board.",
    bottomLineBenchmarkSlug: "simpleqa",
    evidenceLine:
      "Factual honesty is read through SimpleQA for short checkable facts, with Humanity's Last Exam as a cross-check on confident wrong answers at the expert frontier.",
    yardsticks: [
      {
        benchmarkSlug: "simpleqa",
        trustGloss:
          "A current, regularly-updated board for short factual recall, but provenance is mixed and the name is shared by several different boards.",
      },
      {
        benchmarkSlug: "humanitys-last-exam",
        trustGloss:
          "A cross-check at the expert frontier: it penalizes confident wrong answers, even though it is not a pure factual-recall test.",
      },
    ],
    picks: [
      {
        label: "Best for short, checkable factual recall",
        benchmarkSlug: "simpleqa",
        leaderRank: 1,
        caveat:
          "The top three are all Google Gemini variants, so the lead rests on one vendor's standing on one board, and provenance is mixed, Kaggle reproduces some scores but others can be publisher-reported. The name SimpleQA is overloaded, so always cite this specific Kaggle OpenAI board.",
      },
    ],
    howToChoose: [
      {
        goal: "Short, single-answer factual questions",
        benchmarkSlug: "simpleqa",
        guidance:
          "The Kaggle SimpleQA board is the live signal, but name it specifically, since the DeepMind and llm-stats boards report very different numbers for tests with the same name.",
      },
      {
        goal: "Whether a model admits what it does not know",
        benchmarkSlug: "simpleqa",
        guidance:
          "Prefer the F-score view where available, since it rewards declining over guessing wrong; the Correct column shown here only counts right answers and does not punish a confident miss as much.",
      },
    ],
    watchOut:
      "Hallucination is the failure mode that most often burns students, and SimpleQA is the best-known test of it, but it is also a lesson in naming: several different boards all called SimpleQA report wildly different numbers, and a multi-model average sits near 21 percent, so a very high figure usually means web search or a generous board, not raw knowledge. Always name the board.",
    watchOutUrl: "https://www.kaggle.com/benchmarks/openai/simpleqa",
    relatedConcepts: [
      { label: "Hallucinations", slug: "hallucinations" },
      { label: "Benchmarking LLMs", slug: "benchmarking-llms" },
      { label: "Filtering AI hype", slug: "filtering-ai-hype" },
    ],
    honestEmpty: false,
    order: 70,
  },

  // ── What people actually prefer ────────────────────────────────────────────
  {
    slug: "what-people-prefer",
    name: "What people actually prefer",
    audienceLine: "Which model do real people pick in a blind, side-by-side comparison?",
    taskLead:
      "You want the model real users prefer when they cannot see the brand, a reality check on exam scores rather than a fixed-test reward.",
    bottomLine:
      "On LMArena, the blind human-preference board, the top three are within about six Elo points with overlapping intervals, so there is no real number one, and all three are Anthropic models. As of JUN 2026 the listed leader is also frozen, suspended from public access, so read the top as a single-lab tie, not a live winner.",
    bottomLineBenchmarkSlug: "lmarena-chatbot-arena",
    evidenceLine:
      "Human preference is read mainly through LMArena, the blind side-by-side vote, with EQ-Bench as a more specific signal for writing quality.",
    yardsticks: [
      {
        benchmarkSlug: "lmarena-chatbot-arena",
        trustGloss:
          "Millions of blind human votes, but the top three are a single-lab statistical tie and the leader is suspended from public access.",
      },
      {
        benchmarkSlug: "eq-bench-creative-writing",
        trustGloss:
          "A more specific signal for one thing people vote on, writing quality, judged by a neutral third party.",
      },
    ],
    picks: [
      {
        label: "Best for overall human preference",
        benchmarkSlug: "lmarena-chatbot-arena",
        leaderRanks: [1, 2, 3],
        caveat:
          "The top three span only about six Elo points with overlapping confidence intervals, so there is no real number one, and all three are Anthropic models, a single-lab cluster rather than a broad field. The listed leader is also frozen, suspended from public access in June 2026, so it can no longer gather new votes.",
      },
    ],
    howToChoose: [
      {
        goal: "A broad sense of which model people like",
        benchmarkSlug: "lmarena-chatbot-arena",
        guidance:
          "LMArena is the best popularity signal, but read the top as a tie and remember it rewards what is pleasant in a short chat, which is not the same as what is correct.",
      },
      {
        goal: "Preference specifically for writing",
        benchmarkSlug: "eq-bench-creative-writing",
        guidance:
          "For writing quality, a judged board like EQ-Bench is more specific than a general-preference vote; see the writing use case.",
      },
    ],
    watchOut:
      "Preference boards measure what feels good in a short blind chat, which is easy to over-read: a near-tie at the top is common, single-lab clusters happen, and scores move week to week, so any snapshot ages fast. Use it as a reality check on exam scores, not as a ranking of correctness.",
    watchOutUrl: "https://arena.ai/leaderboard/text",
    relatedConcepts: [
      { label: "Learning from human feedback", slug: "rlhf" },
      { label: "Benchmarking LLMs", slug: "benchmarking-llms" },
      { label: "Filtering AI hype", slug: "filtering-ai-hype" },
    ],
    honestEmpty: false,
    order: 80,
  },

  // ── Writing and communication ──────────────────────────────────────────────
  {
    slug: "writing-and-communication",
    name: "Writing and communication",
    audienceLine: "Can it write something worth reading, without sliding into cliche and AI slop?",
    taskLead:
      "You want a model that writes with craft, original, varied, and readable across a longer piece, not one that pads with stock phrasing and repeats itself.",
    bottomLine:
      "On EQ-Bench, the independent judged writing board, the top two models are about 12 Elo points apart, close enough to read as a shared lead, as of JUN 2026. And the two metrics disagree: the model with the highest rubric score ranks only third on the head-to-head Elo, so which one wins depends on which column you read.",
    bottomLineBenchmarkSlug: "eq-bench-creative-writing",
    evidenceLine:
      "Writing quality is read mainly through EQ-Bench Creative Writing, judged by a neutral third party, with LMArena as a broader human-preference cross-check.",
    yardsticks: [
      {
        benchmarkSlug: "eq-bench-creative-writing",
        trustGloss:
          "A neutral, LLM-judged writing signal rather than a vendor claim, but the top two are nearly tied and the two metrics disagree.",
      },
      {
        benchmarkSlug: "lmarena-chatbot-arena",
        trustGloss:
          "A broader human-preference signal that includes, but is not specific to, writing.",
      },
    ],
    picks: [
      {
        label: "Best for head-to-head writing preference",
        benchmarkSlug: "eq-bench-creative-writing",
        leaderRanks: [1, 2],
        caveat:
          "The top two are about 12 Elo apart, close enough to read as a shared lead rather than a clean number one. An LLM judge can also share blind spots with the models it grades, an open question for any judged board.",
      },
      {
        label: "Best by writing-quality rubric, not head-to-head",
        benchmarkSlug: "eq-bench-creative-writing",
        leaderRank: 3,
        caveat:
          "This is a metric-split pick: on EQ-Bench's separate 0 to 100 rubric score, the model that ranks third on head-to-head Elo actually scores highest, so if you weight polished craft over head-to-head preference, the ranking flips. Read the two metrics as answering different questions.",
      },
    ],
    howToChoose: [
      {
        goal: "Head-to-head writing preference",
        benchmarkSlug: "eq-bench-creative-writing",
        guidance:
          "Read the EQ-Bench Elo, but treat the top two as a shared lead rather than a clean winner.",
      },
      {
        goal: "Polished craft on a fixed rubric",
        benchmarkSlug: "eq-bench-creative-writing",
        guidance:
          "The separate rubric score ranks models differently; if you care about clean, correct prose more than head-to-head flavor, follow the rubric column instead of the Elo.",
      },
      {
        goal: "A broader sense of what readers like",
        benchmarkSlug: "lmarena-chatbot-arena",
        guidance:
          "LMArena adds a general human-preference signal, but it is not writing-specific; see the what people prefer use case.",
      },
    ],
    watchOut:
      "For the most common student use of AI, writing, a neutral judged board beats a vendor's marketing claim, but two cautions remain: the top is often a near-tie, and the two metrics here can disagree, so the winner depends on which column you read. An LLM judge may also share blind spots with the models it grades.",
    watchOutUrl: "https://eqbench.com/about.html",
    relatedConcepts: [
      { label: "Benchmarking LLMs", slug: "benchmarking-llms" },
      { label: "Choosing a model", slug: "model-selection" },
      { label: "Filtering AI hype", slug: "filtering-ai-hype" },
    ],
    honestEmpty: false,
    order: 90,
  },

  // ── Long documents and big context (HONEST-EMPTY) ──────────────────────────
  {
    slug: "long-documents-and-context",
    name: "Long documents and big context",
    audienceLine: "Can it read a whole report at once and stay coherent, not just find one fact in it?",
    taskLead:
      "You want a model that holds a long document in its head, a contract, a codebase, a book, and reasons across all of it, instead of losing the thread partway through.",
    bottomLine:
      "No board here measures this cleanly, so we are not naming a leader. Here is the yardstick and the dated anchor instead.",
    evidenceLine:
      "Long-context ability is read through LongBench v2, the one test built to require reasoning across a whole document rather than keyword matching.",
    yardsticks: [
      {
        benchmarkSlug: "longbench-v2",
        trustGloss:
          "The one test that requires reasoning across a whole long document, but its board is JavaScript-only with no readable current ranking.",
      },
    ],
    picks: [
      {
        label: "Best for reading a whole long document",
        benchmarkSlug: "longbench-v2",
        empty: true,
        caveat:
          "Long-context scores are very sensitive to exactly how the document is fed in, so cross-model comparisons can be apples to oranges. The official board is JavaScript-rendered and its readable figures are a stale early-2025 snapshot.",
      },
    ],
    howToChoose: [
      {
        goal: "Reasoning across an entire long document",
        benchmarkSlug: "longbench-v2",
        guidance:
          "LongBench v2 is the right test, but there is no trustworthy current ranking to quote.",
        noCleanAnswer: true,
        reason:
          "The official board is JavaScript-only and its readable scores are a stale early-2025 snapshot, so judge a model yourself on documents your own length.",
      },
    ],
    judgeCriteria: [
      "Does it keep facts straight across a long document, or contradict itself partway through?",
      "Does accuracy fall off a cliff once the document nears your real length, or stay steady?",
    ],
    watchOut:
      "A long context window is not the same as using it well: a model can advertise a huge window and still lose the thread in the middle, and a high score on a long-context test can mean the harness, not the model, did the reading. Test on your own document length before trusting a headline number.",
    watchOutUrl: "https://longbench2.github.io/",
    relatedConcepts: [
      { label: "Context windows", slug: "context-windows" },
      { label: "Benchmarking LLMs", slug: "benchmarking-llms" },
      { label: "Reasoning models", slug: "reasoning-models" },
    ],
    honestEmpty: true,
    datedAnchor:
      "Human experts scored 53.7 percent under a 15-minute limit, the best directly-answering model 50.1 percent, and an extended-reasoning model reached 57.7 percent, just above the human number; blind guessing is about 25 percent (LongBench v2 paper, DEC 2024).",
    gapReason:
      "The only board is JavaScript-rendered and cannot be read from the page, and its readable figures are a stale early-2025 snapshot, so there is no trustworthy current ranking to quote.",
    order: 100,
  },

  // ── Languages and translation (HONEST-EMPTY) ───────────────────────────────
  {
    slug: "languages-and-translation",
    name: "Languages and translation",
    audienceLine: "Will it work as well in your language as it does in English, or fall off sharply?",
    taskLead:
      "You want a model that holds its quality outside English, across coursework, translation, and research in lower-resourced languages, not one that only shines in English.",
    bottomLine:
      "No board here measures this cleanly, so we are not naming a leader. The honest finding is structural, not a ranking.",
    evidenceLine:
      "Multilingual ability is read through Global-MMLU, the one test built to expose per-language gaps, but it ships as a dataset with no public ranking.",
    yardsticks: [
      {
        benchmarkSlug: "global-mmlu",
        trustGloss:
          "Built to expose per-language gaps across 42 languages, but it is a dataset for running your own evaluation, with no public leaderboard at all.",
      },
    ],
    picks: [
      {
        label: "Best across many languages",
        benchmarkSlug: "global-mmlu",
        empty: true,
        caveat:
          "There is no public Global-MMLU leaderboard to cite, and a model's ranking can flip depending on whether you score the full set or only the culturally sensitive subset, so any single multilingual number hides large per-language differences.",
      },
    ],
    howToChoose: [
      {
        goal: "Working in a specific non-English language",
        benchmarkSlug: "global-mmlu",
        guidance:
          "Global-MMLU is the right framework, but there is no ranking to quote.",
        noCleanAnswer: true,
        reason:
          "Its primary sources publish the dataset but no leaderboard, so any Global-MMLU top model you see online is a third-party aggregator's self-reported figure. Test the model in your own language.",
      },
    ],
    judgeCriteria: [
      "Does it stay accurate in your specific language, or only in English, when you ask the same question both ways?",
      "Does it handle culturally specific knowledge in your region, not just a translated North-American or European default?",
    ],
    watchOut:
      "A single headline knowledge score hides large per-language gaps: a model can ace a topic in English and fail the same question in a lower-resourced language. There is no public multilingual ranking to lean on, and the dataset's authors flag a geographic skew in the source material, so test in your own language rather than trusting an aggregate.",
    watchOutUrl: "https://arxiv.org/abs/2412.03304",
    relatedConcepts: [
      { label: "Benchmarking LLMs", slug: "benchmarking-llms" },
      { label: "Bias in training data", slug: "bias-training-data" },
      { label: "Filtering AI hype", slug: "filtering-ai-hype" },
    ],
    honestEmpty: true,
    datedAnchor:
      "No public leaderboard exists. The durable, dated finding (ACL 2025) is structural: about 28 percent of Global-MMLU questions need culturally sensitive knowledge, and model rankings shift depending on whether you score the full set or only that subset.",
    gapReason:
      "No public Global-MMLU leaderboard exists at all: the primary sources ship the dataset for you to run yourself but publish no ranking, so there is no trustworthy current top model to name.",
    order: 110,
  },
];
