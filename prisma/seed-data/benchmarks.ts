// Benchmarks ("The Standings" / State of the Models) seed data.
//
// Hand-authored from the committed research:
//   docs/research/benchmarks-research.json (Pass 1 findings),
//   docs/research/benchmarks-research-round2.json (four-beat records + fact checks),
//   docs/research/benchmarks-leaders-refresh.json (Phase 0 leader refresh, the
//   authoritative trust tier / nearTie / leader / baseline / dated-anchor source).
//
// House rules: zero em dashes or en dashes anywhere (hyphens, commas, colons only);
// leader score strings are kept VERBATIM from the data (intervals, split-name and
// cost caveats preserved); relatedConcepts slugs are validated against the live
// catalog by scripts/seed-benchmarks.ts --verify. Seeded as drafts.
//
// STATUS taxonomy and dominant-state calls follow each record's Opus judgment in
// the leader refresh. One record needed a human call:
//   arc-agi-2: the refresh judge set approved=false because the public top-3 are
//   all self-reported lab claims. Per BENCHMARKS_PLAN section 9 ("ship honest-empty
//   OR as clearly-labeled self-reported") we ship the three leaders with every row
//   flagged selfReported, trust=contested, nearTie=false, and let WHAT TO WATCH
//   carry the verified-vs-claimed gap. This surfaces the inflated claims WITH the
//   SELF-REPORTED chip, which is more on-thesis than hiding them behind honest-empty.

export type BenchmarkTrust = "live" | "near_ceiling" | "contested" | "dated";

export type BenchmarkDomain =
  | "Reasoning"
  | "Coding"
  | "Math"
  | "Multimodal"
  | "Human preference"
  | "Agents";

export type BenchmarkScoreType = "Accuracy" | "Elo" | "Pass rate";

export type BenchmarkLeader = {
  rank: number;
  model: string;
  lab: string;
  /** VERBATIM from the data: keep intervals ("1508 +/- 9") and caveats ("$0.52/task"). */
  score: string;
  /** Short plain-English reference point shown beside the score in the ScoreStamp. */
  baselineGloss: string;
  asOfDate: string; // ISO yyyy-mm-dd
  sourceUrl: string;
  selfReported: boolean;
  disputed?: boolean;
};

export type BenchmarkRelatedConcept = {
  label: string;
  /** when set, links to /concepts/[slug] */
  slug?: string;
};

export type BenchmarkSeed = {
  slug: string;
  name: string;
  domain: BenchmarkDomain;
  scoreType: BenchmarkScoreType;
  trust: BenchmarkTrust;
  nearTie: boolean;
  /** the four-word list-row caveat */
  caveat: string;
  /** first sentence is the bus-stop lead; the rest fills the WHAT IT MEASURES beat */
  whatItMeasures: string;
  exampleTask?: string;
  whyCare: string;
  scoring: string;
  calibration?: string;
  watchOut: string;
  watchOutUrl?: string;
  leaders: BenchmarkLeader[]; // [] when honestEmpty
  leaderboardUrl?: string;
  boardLastUpdated?: string; // ISO yyyy-mm-dd; omit when the board shows no date
  honestEmpty: boolean;
  /** shown in the honest-empty leader panel as the single dated anchor */
  datedAnchor?: string;
  needsRecheck: boolean;
  relatedConcepts: BenchmarkRelatedConcept[];
  sources: string[];
};

export const BENCHMARK_SEEDS: BenchmarkSeed[] = [
  {
    slug: "mmlu-pro",
    name: "MMLU-Pro",
    domain: "Reasoning",
    scoreType: "Accuracy",
    trust: "near_ceiling",
    nearTie: false,
    caveat: "board frozen since March",
    whatItMeasures:
      "MMLU-Pro asks exam-grade questions across 14 fields, but with 10 answer choices instead of the usual 4, so lucky guessing barely helps. It exists because the original MMLU got too easy: top models had piled up near 90 percent, so the test could no longer tell them apart. Models score roughly 16 to 33 points lower on MMLU-Pro than on the old MMLU.",
    exampleTask:
      "A representative item reads like a hard university final: a multi-step chemistry, law, or economics question with 10 plausible options, where ruling out the obvious wrong answers still leaves several traps that take real domain reasoning to eliminate.",
    whyCare:
      "When you read that a model scores 90 percent on a knowledge test, MMLU-Pro is the reason to ask which test: the original MMLU is so saturated the number is meaningless, while the same models drop sharply on the harder version. It is a clean lesson in how a benchmark stops measuring anything once everyone aces it.",
    scoring:
      "Overall accuracy, the percent of about 12,000 questions answered correctly, ranked on the official TIGER-Lab leaderboard (the team that built the benchmark). The board mixes entries it evaluated itself with scores labs submit themselves, and it ranks by the single Overall column.",
    calibration:
      "Random guessing scores about 10 percent because each question has 10 options. The original MMLU was already saturated near 90 percent, and on MMLU-Pro the leaders now cluster around 89 to 91 percent.",
    watchOut:
      "Two cautions. First, the official board was last updated in March 2026, so the newest frontier models may simply be missing. Second, only the top entry was independently evaluated by TIGER-Lab; the second and third places are scores the submitting labs reported themselves, with no subject-level breakdown, so do not read all three as equally checked. As the leaders crowd into a one-to-two point band near 90 percent, MMLU-Pro is itself starting to saturate, the same fate that retired the original MMLU.",
    watchOutUrl: "https://arxiv.org/abs/2406.01574",
    leaders: [
      {
        rank: 1,
        model: "Gemini-3.1-Pro",
        lab: "Google DeepMind",
        score: "91.16% overall accuracy",
        baselineGloss: "TIGER-Lab evaluated; random guess about 10%",
        asOfDate: "2026-03-11",
        sourceUrl:
          "https://huggingface.co/datasets/TIGER-Lab/mmlu_pro_leaderboard_submission/resolve/main/results.csv",
        selfReported: false,
      },
      {
        rank: 2,
        model: "Gemini-3-Pro(11/25)",
        lab: "Google DeepMind",
        score: "90.1% overall accuracy",
        baselineGloss: "self-reported by the lab",
        asOfDate: "2026-03-11",
        sourceUrl:
          "https://huggingface.co/datasets/TIGER-Lab/mmlu_pro_leaderboard_submission/resolve/main/results.csv",
        selfReported: true,
      },
      {
        rank: 3,
        model: "GPT-o1",
        lab: "OpenAI",
        score: "89.3% overall accuracy",
        baselineGloss: "self-reported; the board's own label",
        asOfDate: "2026-03-11",
        sourceUrl:
          "https://huggingface.co/datasets/TIGER-Lab/mmlu_pro_leaderboard_submission/resolve/main/results.csv",
        selfReported: true,
      },
    ],
    leaderboardUrl: "https://huggingface.co/spaces/TIGER-Lab/MMLU-Pro",
    boardLastUpdated: "2026-03-11",
    honestEmpty: false,
    needsRecheck: false,
    relatedConcepts: [
      { label: "Benchmarking LLMs", slug: "benchmarking-llms" },
      { label: "Reasoning models", slug: "reasoning-models" },
      { label: "Emergent abilities", slug: "emergent-abilities" },
    ],
    sources: [
      "https://arxiv.org/abs/2406.01574",
      "https://github.com/TIGER-AI-Lab/MMLU-Pro",
      "https://huggingface.co/spaces/TIGER-Lab/MMLU-Pro",
    ],
  },

  {
    slug: "gpqa-diamond",
    name: "GPQA Diamond",
    domain: "Reasoning",
    scoreType: "Accuracy",
    trust: "near_ceiling",
    nearTie: true,
    caveat: "leaders within one point",
    whatItMeasures:
      "GPQA Diamond is a set of 198 science questions so hard that PhD-level domain experts answer only about two thirds correctly, and skilled non-experts score around 34 percent even with the whole internet to help. The questions are deliberately Google-proof: you cannot just look them up. It is the go-to test for graduate-level reasoning in biology, physics, and chemistry.",
    exampleTask:
      "A typical question is a graduate-level physics or chemistry problem with four answer choices, written so that searching the web turns up plausible but wrong leads. Even a specialist with unlimited time and access lands around two thirds correct.",
    whyCare:
      "GPQA Diamond is the test people point to when they say AI now reasons at a graduate level in the sciences. It matters because the questions are built so you cannot Google your way out, so a high score is harder to fake than on an open-book trivia test. The catch is that the top models have nearly run out of room at the top.",
    scoring:
      "Accuracy, the percent of the 198 four-choice questions answered correctly. There is no official maintainer-run leaderboard; the figures here come from Artificial Analysis, an independent group that runs its own evaluations rather than accepting lab submissions, so these are independent measurements, not self-reports.",
    calibration:
      "Random chance is 25 percent on these four-choice questions; PhD domain experts score roughly 65 to 70 percent; the prior state of the art before mid-2025 frontier models was around 78 to 80 percent. Today's leaders sit in the low-to-mid 90s, which is why the benchmark is called near saturated.",
    watchOut:
      "GPQA Diamond is widely described as saturated: the leaders cluster within roughly one point of each other, a gap smaller than the normal run-to-run variation, so the ordering at the very top is close to a coin flip. Different independent evaluators (Artificial Analysis, Epoch AI, vals.ai) even crown different number-one models, which is itself a sign the race is inside the noise. Watch out for scores from gated, unreleased lab previews (one aggregator lists a model around 94.6 percent that the public cannot access), and remember no single board is canonical here.",
    watchOutUrl: "https://artificialanalysis.ai/evaluations/gpqa-diamond",
    leaders: [
      {
        rank: 1,
        model: "Gemini 3.1 Pro Preview",
        lab: "Google DeepMind",
        score: "94.1%",
        baselineGloss: "Artificial Analysis, independent eval",
        asOfDate: "2026-06-11",
        sourceUrl: "https://artificialanalysis.ai/evaluations/gpqa-diamond",
        selfReported: false,
      },
      {
        rank: 2,
        model: "GPT-5.5 (xhigh)",
        lab: "OpenAI",
        score: "93.5%",
        baselineGloss: "0.9 points covers the whole top 3",
        asOfDate: "2026-06-11",
        sourceUrl: "https://artificialanalysis.ai/evaluations/gpqa-diamond",
        selfReported: false,
      },
      {
        rank: 3,
        model: "GPT-5.5 (high)",
        lab: "OpenAI",
        score: "93.2%",
        baselineGloss: "inside run-to-run noise",
        asOfDate: "2026-06-11",
        sourceUrl: "https://artificialanalysis.ai/evaluations/gpqa-diamond",
        selfReported: false,
      },
    ],
    leaderboardUrl: "https://artificialanalysis.ai/evaluations/gpqa-diamond",
    honestEmpty: false,
    needsRecheck: false,
    relatedConcepts: [
      { label: "Reasoning models", slug: "reasoning-models" },
      { label: "Benchmarking LLMs", slug: "benchmarking-llms" },
      { label: "Filtering AI hype", slug: "filtering-ai-hype" },
    ],
    sources: [
      "https://arxiv.org/abs/2311.12022",
      "https://artificialanalysis.ai/evaluations/gpqa-diamond",
    ],
  },

  {
    slug: "swe-bench-verified",
    name: "SWE-bench Verified",
    domain: "Coding",
    scoreType: "Pass rate",
    trust: "contested",
    nearTie: false,
    caveat: "dropped by OpenAI 2026",
    whatItMeasures:
      "SWE-bench Verified checks whether a model can fix a real bug that a developer actually filed on GitHub, by editing a real open-source codebase until the project's own tests pass. It is a human-screened set of 500 issues from popular Python projects, built so a passing solution has to genuinely resolve the issue, not just look plausible.",
    exampleTask:
      "The model is handed a real GitHub issue (for example, a reported crash in a popular Python library) and the full repository, and it must edit the code so the hidden fail-to-pass tests for that issue go green, the same bar a human maintainer's pull request has to clear.",
    whyCare:
      "This is the benchmark closest to the job people imagine AI doing: not finishing a line of code, but reading a messy real project and shipping a working fix. It matters because in early 2026 OpenAI publicly stopped reporting it, saying the test had become a memorization exam rather than a measure of real skill, a rare case of a lab walking away from a number it was winning.",
    scoring:
      "Percent of the 500 issues resolved, meaning the project's fail-to-pass tests all pass after the model's edit. The benchmark is maintained by researchers at Princeton (the human-validated Verified subset was built in collaboration with OpenAI). The headline figures here come from a third-party board, vals.ai, since the official board lists self-submitted entries the operators do not independently re-run.",
    calibration:
      "Early agents in 2023 resolved only a low single-digit percentage of issues. The prior high before the June 2026 frontier wave was Claude Mythos at about 93.9 percent (Anthropic, self-reported). Top systems now claim the low-to-mid 90s, but see the warning below about why those numbers are disputed.",
    watchOut:
      "SWE-bench Verified is the clearest case on this page of a contested number. In February 2026 OpenAI announced it would stop reporting the benchmark, saying that at least 59 percent of audited tasks had flawed tests that reject correct fixes, and that every major model had effectively seen the 500 tasks and their solutions during training, so high scores partly reflect memorization. The Princeton maintainers did not retire it; the board is still live, and OpenAI now points to the held-out SWE-bench Pro instead. The current number-one, Claude Fable 5 at 95 percent, is itself disputed: the model was suspended from public access in June 2026 under a US export-control directive, and a newer board ranks a different model first. Treat the top of this board as a moving, contested claim.",
    watchOutUrl: "https://openai.com/index/why-we-no-longer-evaluate-swe-bench-verified/",
    leaders: [
      {
        rank: 1,
        model: "Claude Fable 5",
        lab: "Anthropic",
        score: "95.00%",
        baselineGloss: "vals.ai verified; access since suspended",
        asOfDate: "2026-06-17",
        sourceUrl: "https://www.vals.ai/benchmarks/swebench",
        selfReported: false,
        disputed: true,
      },
      {
        rank: 2,
        model: "Claude Opus 4.8",
        lab: "Anthropic",
        score: "88.60%",
        baselineGloss: "self-reported by the lab",
        asOfDate: "2026-06-17",
        sourceUrl: "https://www.vals.ai/benchmarks/swebench",
        selfReported: true,
      },
      {
        rank: 3,
        model: "GPT 5.5",
        lab: "OpenAI",
        score: "82.60%",
        baselineGloss: "vals.ai independently verified",
        asOfDate: "2026-06-17",
        sourceUrl: "https://www.vals.ai/benchmarks/swebench",
        selfReported: false,
      },
    ],
    leaderboardUrl: "https://www.vals.ai/benchmarks/swebench",
    boardLastUpdated: "2026-06-17",
    honestEmpty: false,
    needsRecheck: false,
    relatedConcepts: [
      { label: "Agents and tool use", slug: "agentic-capabilities" },
      { label: "Tool use", slug: "tool-use" },
      { label: "Benchmarking LLMs", slug: "benchmarking-llms" },
    ],
    sources: [
      "https://www.swebench.com/verified.html",
      "https://openai.com/index/why-we-no-longer-evaluate-swe-bench-verified/",
      "https://www.vals.ai/benchmarks/swebench",
      "https://arxiv.org/abs/2310.06770",
    ],
  },

  {
    slug: "humanitys-last-exam",
    name: "Humanity's Last Exam",
    domain: "Reasoning",
    scoreType: "Accuracy",
    trust: "live",
    nearTie: true,
    caveat: "some reference answers wrong",
    whatItMeasures:
      "Humanity's Last Exam is a 2,500-question test built to be the hardest exam in the world for an AI, spanning math, the humanities, and the natural sciences at the absolute frontier of human knowledge. It was designed so even the best models would fail most of it: the top score today is still under 50 percent.",
    exampleTask:
      "Questions are written by experts to stump frontier models, mixing deep specialist knowledge with multi-step reasoning, and about one in seven requires reading a diagram or figure. A typical item is the kind of question only a working researcher in that exact subfield could answer from memory.",
    whyCare:
      "When labs say their model is approaching the limits of human knowledge, this is the test they mean. It matters because it is one of the few benchmarks the best models still fail badly, so it actually has room to measure progress, unlike the saturated tests where everyone scores in the 90s. It is also a cautionary tale: independent reviewers found a meaningful share of its answer key is wrong.",
    scoring:
      "Accuracy on the 2,500-question set, run independently by Scale AI (the benchmark was built with the Center for AI Safety). The board uses a Rank (Upper Bound) method, so models whose confidence intervals overlap share a rank instead of being forced into a false order.",
    calibration:
      "Random guessing is near zero because most answers are open-ended; the test is designed so even human experts would clear it only within their own specialties. The prior state of the art before mid-2025 frontier models was below 10 percent; the current leaders sit in the mid-40s.",
    watchOut:
      "Two big cautions. First, the top of the board is a genuine statistical tie: the leading two models' confidence intervals overlap, so naming a single winner overstates the certainty. Second, and more serious, independent analyses estimate that 18 to 29 percent of the chemistry and biology reference answers are wrong (one widely cited example marked a synthetic element that existed for milliseconds as the rarest noble gas on Earth), and a separate review flagged over a thousand items needing revision. Every score here is measured against that uncorrected answer key, so read the absolute numbers with care. A corrected version, HLE-Rolling, has been announced.",
    watchOutUrl: "https://www.futurehouse.org/research-announcements/hle-exam",
    leaders: [
      {
        rank: 1,
        model: "gemini-3.1-pro-preview (thinking high)",
        lab: "Google DeepMind",
        score: "46.44 +/- 1.96",
        baselineGloss: "shares rank 1; intervals overlap",
        asOfDate: "2026-05-01",
        sourceUrl: "https://labs.scale.com/leaderboard/humanitys_last_exam",
        selfReported: false,
      },
      {
        rank: 1,
        model: "gpt-5.4-pro-2026-03-05",
        lab: "OpenAI",
        score: "44.32 +/- 1.95",
        baselineGloss: "shares rank 1 with Gemini",
        asOfDate: "2026-05-01",
        sourceUrl: "https://labs.scale.com/leaderboard/humanitys_last_exam",
        selfReported: false,
      },
      {
        rank: 3,
        model: "Muse Spark",
        lab: "Meta Superintelligence Labs",
        score: "40.56 +/- 1.92",
        baselineGloss: "Scale AI independent eval",
        asOfDate: "2026-05-01",
        sourceUrl: "https://labs.scale.com/leaderboard/humanitys_last_exam",
        selfReported: false,
      },
    ],
    leaderboardUrl: "https://labs.scale.com/leaderboard/humanitys_last_exam",
    boardLastUpdated: "2026-05-01",
    honestEmpty: false,
    needsRecheck: false,
    relatedConcepts: [
      { label: "Reasoning models", slug: "reasoning-models" },
      { label: "Benchmarking LLMs", slug: "benchmarking-llms" },
      { label: "Hallucinations", slug: "hallucinations" },
    ],
    sources: [
      "https://agi.safe.ai",
      "https://labs.scale.com/leaderboard/humanitys_last_exam",
      "https://www.futurehouse.org/research-announcements/hle-exam",
      "https://arxiv.org/abs/2501.14249",
    ],
  },

  {
    slug: "frontiermath",
    name: "FrontierMath",
    domain: "Math",
    scoreType: "Accuracy",
    trust: "contested",
    nearTie: false,
    caveat: "scores pending error review",
    whatItMeasures:
      "FrontierMath is a set of original research-level math problems so hard they take specialist mathematicians hours or days to solve, and at launch in late 2024 every leading model scored below 2 percent. The problems are guess-proof (under a 1 percent chance of a lucky correct answer) and checked automatically, spanning everything from number theory to algebraic geometry.",
    exampleTask:
      "A FrontierMath problem looks less like a school exam and more like a research exercise: a precisely stated question whose answer is a specific number or object, requiring the kind of work a math PhD might spend an afternoon on. The hardest tier (Tier 4) is genuine research-mathematician territory.",
    whyCare:
      "FrontierMath is the cleanest test of whether AI can do real, novel mathematical reasoning rather than recite memorized results, and scores have rocketed from under 2 percent to the high 80s on the hardest tier in about eighteen months. It also comes with a built-in lesson about trusting benchmark numbers: the benchmark was quietly funded by OpenAI, which had privileged access to the problems, and its maintainer recently found errors in roughly a third of the questions.",
    scoring:
      "Accuracy, the percent of problems solved, with answers auto-verified by exact match or symbolic computation. It is run by Epoch AI, which evaluates models independently (often with pre-release access). Scores are reported by tier, where Tier 4 is the hardest, research-level band; the figures here are from the LM Council aggregator, which draws on Epoch's evaluations.",
    calibration:
      "All frontier models scored below 2 percent at the November 2024 launch; expert mathematicians sampled on the easier tiers averaged about 19 percent. Today's leaders reach the high 80s on the hardest tier, a jump that is part of why the benchmark is being re-examined.",
    watchOut:
      "FrontierMath carries two disclosed problems that make its numbers contested. First, Epoch AI announced in May 2026 that an AI-assisted review found fatal errors in roughly one third of the problems, so corrected scores are pending and every current figure is pre-correction. Second, OpenAI funded the benchmark and had access to most problems and solutions, a conflict Epoch disclosed after the fact; the often-quoted 25 percent o3 result from December 2024 was self-reported from an internal high-compute run, and Epoch's own test of the public model found closer to 10 percent. Read the standings as provisional.",
    watchOutUrl: "https://epoch.ai/blog/openai-and-frontiermath",
    leaders: [
      {
        rank: 1,
        model: "Claude Fable 5 (max)",
        lab: "Anthropic",
        score: "87.8% +/- 5.2 (FrontierMath Tier 4 v2)",
        baselineGloss: "Epoch eval; experts about 19% on easier tiers",
        asOfDate: "2026-06-14",
        sourceUrl: "https://lmcouncil.ai/benchmarks",
        selfReported: false,
      },
      {
        rank: 2,
        model: "GPT-5.5 Pro (xhigh)",
        lab: "OpenAI",
        score: "78.0% +/- 6.5 (FrontierMath Tier 4 v2)",
        baselineGloss: "hardest tier; about 10 points behind #1",
        asOfDate: "2026-06-14",
        sourceUrl: "https://lmcouncil.ai/benchmarks",
        selfReported: false,
      },
      {
        rank: 3,
        model: "AI co-mathematician",
        lab: "Google",
        score: "75.6% +/- 6.7 (FrontierMath Tier 4 v2)",
        baselineGloss: "v2 re-eval, slightly less certain",
        asOfDate: "2026-06-14",
        sourceUrl: "https://lmcouncil.ai/benchmarks",
        selfReported: false,
      },
    ],
    leaderboardUrl: "https://lmcouncil.ai/benchmarks",
    boardLastUpdated: "2026-06-14",
    honestEmpty: false,
    needsRecheck: true,
    relatedConcepts: [
      { label: "Reasoning models", slug: "reasoning-models" },
      { label: "Learning from verifiable rewards", slug: "rlvr" },
      { label: "Benchmarking LLMs", slug: "benchmarking-llms" },
      { label: "Filtering AI hype", slug: "filtering-ai-hype" },
    ],
    sources: [
      "https://epoch.ai/frontiermath",
      "https://epoch.ai/blog/openai-and-frontiermath",
      "https://lmcouncil.ai/benchmarks",
      "https://arxiv.org/abs/2411.04872",
    ],
  },

  {
    slug: "livecodebench",
    name: "LiveCodeBench",
    domain: "Coding",
    scoreType: "Pass rate",
    trust: "dated",
    nearTie: false,
    caveat: "official board frozen 2025",
    whatItMeasures:
      "LiveCodeBench scores models on competitive-programming problems, but only on ones published after each model's training cut-off, so it measures real problem-solving instead of memorized answers. It continuously pulls fresh problems from sites like LeetCode, AtCoder, and Codeforces and tags each with its release date.",
    exampleTask:
      "A problem is a self-contained competitive-programming challenge, the kind posted weekly on LeetCode or Codeforces, and the model's code must pass all the hidden test cases on the first try. Because each problem is dated, a model can only be graded on ones it could not have seen during training.",
    whyCare:
      "LiveCodeBench is the benchmark built specifically to defeat cheating-by-memorization, which is why it is worth understanding even though it has a messy present. Its current state is itself the lesson: there is no single trustworthy up-to-date scoreboard, so the numbers quoted around the web come from three different aggregators that disagree with each other.",
    scoring:
      "Pass@1, the share of problems solved on the first attempt, reported across difficulty tiers. The original board is a maintainer-run academic project on GitHub Pages; the catch is that it has not been updated since mid-2025.",
    calibration:
      "Weak open models sit around 20 to 40 on Pass@1; on the frozen official board the strongest models reach the mid-80s on the full set and the low-70s on the recent-only window. No 2026 frontier model appears in the official data at all.",
    watchOut:
      "There is no trustworthy current leaderboard for LiveCodeBench, which is why this panel shows a dated anchor instead of a live top three. The official board is a JavaScript app last updated in mid-2025, with no 2026 model in it. Three separate aggregators each claim a different current top three (Artificial Analysis, vals.ai, and llm-stats, the last of which marks every entry self-reported), and they disagree because they use different problem sets and harnesses. The honest answer is that the benchmark's whole premise, dated problems, makes a frozen board unable to fairly rank newer models.",
    watchOutUrl: "https://livecodebench.github.io/leaderboard.html",
    leaders: [],
    honestEmpty: true,
    datedAnchor:
      "Official LiveCodeBench v5 board (last updated AUG 2025, independently evaluated): on the full problem set the top Pass@1 scores are Kimi-k1.6-IOI-high at 86.02, Gemini-2.5-Pro at 84.66, and o1-2024-12-17 (High) at 83.18. The newest model in the official data is from early 2025; no 2026 frontier model appears.",
    leaderboardUrl: "https://livecodebench.github.io/leaderboard.html",
    boardLastUpdated: "2025-08-01",
    needsRecheck: false,
    relatedConcepts: [
      { label: "Benchmarking LLMs", slug: "benchmarking-llms" },
      { label: "Reasoning models", slug: "reasoning-models" },
      { label: "Filtering AI hype", slug: "filtering-ai-hype" },
    ],
    sources: [
      "https://livecodebench.github.io/leaderboard.html",
      "https://github.com/LiveCodeBench/LiveCodeBench",
      "https://arxiv.org/abs/2403.07974",
    ],
  },

  {
    slug: "arc-agi-1",
    name: "ARC-AGI v1",
    domain: "Reasoning",
    scoreType: "Accuracy",
    trust: "near_ceiling",
    nearTie: true,
    caveat: "effectively solved by 2026",
    whatItMeasures:
      "ARC-AGI v1 is a set of colored-grid puzzles where you see a few examples of a transformation and must infer the rule, then apply it to a new grid. It tests whether a model can learn a brand-new pattern on the spot rather than recall a trained one. It was meant to be easy for humans and hard for AI, and for years it was.",
    exampleTask:
      "You are shown three or four small before-and-after grids of colored squares that share a hidden rule (say, the shape gets reflected and recolored), then a new input grid, and you must draw the correct output. People find these easy; until recently, AI could barely do them.",
    whyCare:
      "ARC-AGI was the famous test that machines could not crack: for years top models scored near zero while ordinary people solved the puzzles easily, making it a favorite argument that AI lacked real reasoning. The reason to care now is the reversal: by 2026 the best systems score 96 to 98 percent, matching the human reference, so this particular challenge has essentially been beaten, and its successor ARC-AGI-2 has taken its place.",
    scoring:
      "Accuracy on a held-out (semi-private) set, run and verified by the ARC Prize Foundation, which also tracks the compute cost per task to discourage winning by brute force. The original December 2024 breakthrough (OpenAI's o3 at 75.7 percent) is the famous milestone; the board has since climbed to the ceiling.",
    calibration:
      "Random guessing is near zero. The human references on the same board are about 77 percent for an average crowd worker and 98 percent for a panel. The 2024 breakthrough was o3 at 75.7 percent within the cost limit, and by mid-2026 the leaders sit at 96 to 98 percent, so v1 is effectively saturated.",
    watchOut:
      "ARC-AGI v1 is essentially solved, so the ordering at the very top is a near-tie among models clustered between 96 and 98 percent, right at the human-panel reference. Two cautions remain. The scores vary widely in cost (the top three here range from about 50 cents to over 7 dollars per task), so a higher score can simply mean more compute was spent, which is why cost is shown next to each number. And critics have always disputed the AGI framing even while accepting the numbers. The real action has moved to ARC-AGI-2.",
    watchOutUrl: "https://arcprize.org/leaderboard",
    leaders: [
      {
        rank: 1,
        model: "Gemini 3.1 Pro (Preview)",
        lab: "Google",
        score: "98% (ARC-AGI-1 Semi-Private eval, $0.52/task)",
        baselineGloss: "human panel reference is 98%",
        asOfDate: "2026-06-16",
        sourceUrl: "https://arcprize.org/media/data/leaderboard/v1.json",
        selfReported: false,
      },
      {
        rank: 2,
        model: "GPT-5.5 Pro (High)",
        lab: "OpenAI",
        score: "96.5% (ARC-AGI-1 Semi-Private eval, $4.53/task)",
        baselineGloss: "note the higher cost per task",
        asOfDate: "2026-06-16",
        sourceUrl: "https://arcprize.org/media/data/leaderboard/v1.json",
        selfReported: false,
      },
      {
        rank: 3,
        model: "Gemini 3 Deep Think (2/26)",
        lab: "Google",
        score: "96% (ARC-AGI-1 Semi-Private eval, $7.17/task)",
        baselineGloss: "ceiling cluster, not a clear gap",
        asOfDate: "2026-06-16",
        sourceUrl: "https://arcprize.org/media/data/leaderboard/v1.json",
        selfReported: false,
      },
    ],
    leaderboardUrl: "https://arcprize.org/leaderboard",
    boardLastUpdated: "2026-06-16",
    honestEmpty: false,
    needsRecheck: false,
    relatedConcepts: [
      { label: "Reasoning models", slug: "reasoning-models" },
      { label: "AGI", slug: "agi" },
      { label: "Benchmarking LLMs", slug: "benchmarking-llms" },
    ],
    sources: [
      "https://arcprize.org/leaderboard",
      "https://arcprize.org/blog/oai-o3-pub-breakthrough",
    ],
  },

  {
    slug: "arc-agi-2",
    name: "ARC-AGI v2",
    domain: "Reasoning",
    scoreType: "Accuracy",
    trust: "contested",
    nearTie: false,
    caveat: "top scores all self-reported",
    whatItMeasures:
      "ARC-AGI v2 is the harder successor to ARC-AGI, a fresh set of novel grid puzzles rebuilt specifically to defeat the brute-force and memorization tricks that let models conquer the first version. Humans still solve these easily, and at its 2025 launch the best reasoning models scored only about 3 percent.",
    exampleTask:
      "Like the original, each task shows a handful of before-and-after colored grids that share a hidden rule, then asks for the output on a new grid, but the rules are deliberately more compositional and novel so pattern-matching from training does not help. An average person solves roughly two thirds of them.",
    whyCare:
      "ARC-AGI-2 is the current front line of the argument over whether AI can really reason or just pattern-match, because it is built to be immune to memorization. It is also the sharpest example on this page of why provenance matters: the impressive public scores (one model is listed at 85 percent) are all self-reported lab claims that the benchmark's own foundation has not verified, and under the resource-constrained competition rules the best result is far lower.",
    scoring:
      "Percent of 120 novel tasks solved, maintained by the ARC Prize Foundation, which separately runs a strict, resource-limited competition (no internet, fixed hardware, a time limit) for its grand prize. The public-leaderboard figures here come from third-party aggregators of lab-reported claims, not from ARC Prize's own verified testing.",
    calibration:
      "Random chance is near zero; an average individual solves about 60 to 66 percent. At the May 2025 launch, leading reasoning models scored around 3 percent. The grand-prize bar is 85 percent on a hidden private set, which no team had reached as of mid-2026, and the best score under the constrained competition rules was only about 24 percent.",
    watchOut:
      "Every number in this panel is a self-reported lab claim, not an ARC Prize verified result: the foundation's own tracker shows zero independently verified scores for the public ARC-AGI-2 leaderboard, and aggregators disagree on the ranking. The gap between the headline claims (a model listed at 85 percent) and the resource-constrained competition record (about 24 percent in 2025) is the whole story: raw, unconstrained scores and efficient, reproducible problem-solving are very different things. The verified high-water mark is lower and older (Gemini 3 Deep Think at 84.6 percent on a high-compute semi-private run that ARC Prize confirmed in February 2026), and the 85 percent grand prize on a hidden private set remains unclaimed.",
    watchOutUrl: "https://arcprize.org/leaderboard",
    leaders: [
      {
        rank: 1,
        model: "GPT-5.5",
        lab: "OpenAI",
        score: "85.0%",
        baselineGloss: "self-reported; not ARC Prize verified",
        asOfDate: "2026-04-24",
        sourceUrl: "https://benchlm.ai/benchmarks/arcAgi2",
        selfReported: true,
      },
      {
        rank: 2,
        model: "GPT-5.4 Pro",
        lab: "OpenAI",
        score: "83.3%",
        baselineGloss: "self-reported lab claim",
        asOfDate: "2026-03-05",
        sourceUrl: "https://benchlm.ai/benchmarks/arcAgi2",
        selfReported: true,
      },
      {
        rank: 3,
        model: "Gemini 3.1 Pro",
        lab: "Google DeepMind",
        score: "77.1%",
        baselineGloss: "self-reported lab claim",
        asOfDate: "2026-06-09",
        sourceUrl: "https://benchlm.ai/benchmarks/arcAgi2",
        selfReported: true,
      },
    ],
    leaderboardUrl: "https://benchlm.ai/benchmarks/arcAgi2",
    boardLastUpdated: "2026-06-18",
    honestEmpty: false,
    needsRecheck: false,
    relatedConcepts: [
      { label: "Reasoning models", slug: "reasoning-models" },
      { label: "AGI", slug: "agi" },
      { label: "Filtering AI hype", slug: "filtering-ai-hype" },
    ],
    sources: [
      "https://arcprize.org/leaderboard",
      "https://arcprize.org/blog/arc-prize-2025-results-analysis",
      "https://benchlm.ai/benchmarks/arcAgi2",
    ],
  },

  {
    slug: "mmmu",
    name: "MMMU",
    domain: "Multimodal",
    scoreType: "Accuracy",
    trust: "near_ceiling",
    nearTie: true,
    caveat: "all scores self-reported",
    whatItMeasures:
      "MMMU tests whether a model can answer college-level exam questions that mix images with text: reading a chart, a circuit diagram, a medical scan, or a music score and reasoning about it. It spans six broad fields and dozens of subjects, with 30 different image types.",
    exampleTask:
      "A question might show a chemistry diagram, an economics chart, or a sheet of music and ask a college-exam-level question that only makes sense if the model actually understands the image, not just the words around it.",
    whyCare:
      "MMMU is the main yardstick for multimodal models, the ones that see as well as read, which is the direction consumer AI is heading as assistants start handling screenshots, documents, and photos. It matters because the leaders now sit just below the human-expert reference, so multimodal understanding at a college level is largely a solved demo, though with a big asterisk about how the scores are collected.",
    scoring:
      "Accuracy on the validation split (about 900 questions), where the official leaderboard accepts results labs submit themselves rather than running its own evaluations. That self-submission model is important context for the numbers below.",
    calibration:
      "Random guessing is about 25 percent on the multiple-choice format; the Human Expert (High) reference is 88.6 percent and is excluded from the ranking. The leaders now sit in the mid-80s, just under that human reference.",
    watchOut:
      "Every score on the MMMU board is self-reported: the leaderboard accepts entries labs submit themselves rather than independently re-running them, so the ordering rewards whoever reports, not necessarily whoever is best. The top scores sit within about a point of each other (a near-tie inside the roughly 1.5-point margin of error), so the ranking at the top is not meaningful. The more reliable test split has gone quiet, reportedly after its answers were released, so the validation split is now the main comparison surface. Different aggregators also crown different leaders.",
    watchOutUrl: "https://mmmu-benchmark.github.io/",
    leaders: [
      {
        rank: 1,
        model: "Qwen3.6 Plus",
        lab: "Alibaba (Qwen)",
        score: "86%",
        baselineGloss: "self-reported; human expert ref 88.6%",
        asOfDate: "2026-04-02",
        sourceUrl: "https://llm-stats.com/benchmarks/mmmu",
        selfReported: true,
      },
      {
        rank: 2,
        model: "GPT-5.1",
        lab: "OpenAI",
        score: "85.4%",
        baselineGloss: "Thinking and Instant variants tie here",
        asOfDate: "2025-11-13",
        sourceUrl: "https://www.codesota.com/benchmark/mmmu",
        selfReported: true,
      },
      {
        rank: 3,
        model: "GPT-5",
        lab: "OpenAI",
        score: "84.2%",
        baselineGloss: "self-reported; inside the margin",
        asOfDate: "2025-08-07",
        sourceUrl: "https://llm-stats.com/benchmarks/mmmu",
        selfReported: true,
      },
    ],
    leaderboardUrl: "https://llm-stats.com/benchmarks/mmmu",
    boardLastUpdated: "2026-06-23",
    honestEmpty: false,
    needsRecheck: false,
    relatedConcepts: [
      { label: "Multimodality", slug: "multimodality" },
      { label: "Benchmarking LLMs", slug: "benchmarking-llms" },
      { label: "Reasoning models", slug: "reasoning-models" },
    ],
    sources: [
      "https://mmmu-benchmark.github.io/",
      "https://arxiv.org/abs/2311.16502",
      "https://llm-stats.com/benchmarks/mmmu",
    ],
  },

  {
    slug: "lmarena-chatbot-arena",
    name: "LMArena (Chatbot Arena)",
    domain: "Human preference",
    scoreType: "Elo",
    trust: "contested",
    nearTie: true,
    caveat: "ranks 1-3 nearly tied",
    whatItMeasures:
      "LMArena ranks models by which one real people prefer in blind, side-by-side chats: you ask a question, see two anonymous answers, and vote for the better one, and millions of those votes become a single score. It is the closest thing to a popularity contest decided by users rather than a fixed exam.",
    exampleTask:
      "You type a prompt and get two replies with the model names hidden, pick the one you like better, and only afterward see which models you compared. Millions of these pairwise votes are pooled into an Elo rating, the same math used to rank chess players.",
    whyCare:
      "LMArena is the leaderboard that tries to measure what people actually prefer, not what a fixed test rewards, which is why labs cite it constantly when a new model launches. It matters as a reality check on exam scores, but it is easy to over-read: as of mid-2026 the top three are a statistical tie, they are all from one lab, and the number-one model has been pulled from public access.",
    scoring:
      "An Elo rating from blind pairwise human votes, shown with a confidence interval (for example, 1508 plus or minus 9). It is run by LMArena, the project formerly known as Chatbot Arena, now at arena.ai. Higher is better and there is no ceiling; 1000 is the baseline.",
    calibration:
      "Elo starts at 1000 for a baseline model; GPT-4 at launch was around 1350, and the prior frontier before 2025 sat around 1250 to 1300. Today's leaders are near 1500, but the top three are within about 6 points of each other, which is inside their error bars.",
    watchOut:
      "This is a genuine both-at-once case: a near-tie and a contested leader. The top three span only about 6 Elo points with overlapping confidence intervals, so there is no real number one, and all three are Anthropic models, so the top of the board is a single-lab cluster rather than a broad field. The current leader, Claude Fable 5, is flagged disputed because it was suspended from public access in June 2026 under a US export-control directive and can no longer gather new votes; it stays on the board as a frozen historical entry. Arena scores also move week to week, so any snapshot ages quickly.",
    watchOutUrl: "https://arena.ai/leaderboard/text",
    leaders: [
      {
        rank: 1,
        model: "claude-fable-5",
        lab: "Anthropic",
        score: "1508 +/- 9",
        baselineGloss: "top three span only 6 Elo",
        asOfDate: "2026-06-16",
        sourceUrl: "https://arena.ai/leaderboard/text",
        selfReported: false,
        disputed: true,
      },
      {
        rank: 2,
        model: "claude-opus-4-6-thinking",
        lab: "Anthropic",
        score: "1504 +/- 4",
        baselineGloss: "tied with #1 within error bars",
        asOfDate: "2026-06-16",
        sourceUrl: "https://arena.ai/leaderboard/text",
        selfReported: false,
      },
      {
        rank: 3,
        model: "claude-opus-4-7-thinking",
        lab: "Anthropic",
        score: "1502 +/- 5",
        baselineGloss: "all-Anthropic top three",
        asOfDate: "2026-06-16",
        sourceUrl: "https://arena.ai/leaderboard/text",
        selfReported: false,
      },
    ],
    leaderboardUrl: "https://arena.ai/leaderboard/text",
    boardLastUpdated: "2026-06-16",
    honestEmpty: false,
    needsRecheck: false,
    relatedConcepts: [
      { label: "Learning from human feedback", slug: "rlhf" },
      { label: "Benchmarking LLMs", slug: "benchmarking-llms" },
      { label: "Filtering AI hype", slug: "filtering-ai-hype" },
    ],
    sources: ["https://arena.ai/leaderboard/text", "https://lmarena.ai"],
  },

  {
    slug: "humaneval",
    name: "HumanEval",
    domain: "Coding",
    scoreType: "Pass rate",
    trust: "dated",
    nearTie: false,
    caveat: "saturated; board frozen 2024",
    whatItMeasures:
      "HumanEval checks whether a model can write a short, correct Python function from a plain-English description, graded by whether the code passes a set of unit tests. From 2021 it was the field's default coding test, until models got so good at it that it stopped telling anyone apart.",
    exampleTask:
      "The model gets a function signature and a docstring (for example, 'return the list of prime numbers below n') and must write the body so it passes the hidden unit tests. The 164 problems are mostly short, self-contained, and easy by today's standards.",
    whyCare:
      "HumanEval is worth knowing precisely because it is over: it was the benchmark that defined AI coding progress for years, and watching it die of success is the clearest example of benchmark saturation. A model scoring below 70 percent here is a red flag, but above 95 percent the number tells you almost nothing, because nearly every model clears it and the test was thoroughly memorized.",
    scoring:
      "Pass@1, the share of problems where the model's first attempt passes all unit tests. OpenAI created it but maintains no leaderboard; the closest independent tracker is EvalPlus, which checks the stricter HumanEval+ variant.",
    calibration:
      "The original 2021 baseline (OpenAI's Codex) was 28.8 percent. By 2025 nearly every frontier model clears 90 percent and many reach 95 to 97 percent, so a one or two point difference is statistical noise, not skill.",
    watchOut:
      "There is no trustworthy current leaderboard, which is why this panel shows a dated anchor. HumanEval is saturated and effectively retired: its 164 problems have been public since 2021 and appear in essentially every code-training corpus (the median problem shows up over 9,000 times on GitHub), so high scores partly reflect memorization. The test is also narrow, mostly easy single-function problems with few unit tests, so it misses real engineering. The 2026 numbers floating around aggregators are vendor self-reported; evaluators have moved to SWE-bench and LiveCodeBench.",
    watchOutUrl: "https://evalplus.github.io/leaderboard.html",
    leaders: [],
    honestEmpty: true,
    datedAnchor:
      "EvalPlus board (last updated DEC 2024, independently evaluated): o1 Preview and o1 Mini tied at the top with 96.3% HumanEval Pass@1 (89.0% on the stricter HumanEval+). No 2025 or 2026 model appears on the board; circulating newer figures are all vendor self-reported.",
    leaderboardUrl: "https://evalplus.github.io/leaderboard.html",
    boardLastUpdated: "2024-12-26",
    needsRecheck: false,
    relatedConcepts: [
      { label: "Benchmarking LLMs", slug: "benchmarking-llms" },
      { label: "Agents and tool use", slug: "agentic-capabilities" },
      { label: "Filtering AI hype", slug: "filtering-ai-hype" },
    ],
    sources: [
      "https://arxiv.org/abs/2107.03374",
      "https://evalplus.github.io/leaderboard.html",
      "https://github.com/openai/human-eval",
    ],
  },

  {
    slug: "aime",
    name: "AIME",
    domain: "Math",
    scoreType: "Accuracy",
    trust: "near_ceiling",
    nearTie: true,
    caveat: "old editions get memorized",
    whatItMeasures:
      "AIME is one of the hardest math contests given to American high schoolers, repurposed as an AI test: 15 problems per exam, each answer a whole number from 0 to 999, with no partial credit and no multiple choice to guess from. Top models now solve almost all of them.",
    exampleTask:
      "A problem reads like a tough contest question, for example 'find the number of ordered integer pairs that satisfy the following system', with the answer a single integer from 0 to 999. There are no answer choices to guess among, and the problems are meant for pencil and paper, not a calculator.",
    whyCare:
      "AIME is a clean, fast-refreshing gauge of AI's step-by-step mathematical reasoning, the same machinery behind progress in science and engineering, and top models now beat the typical human qualifier. The reason to read it carefully is contamination: old exams leak into training data, so a sky-high score on a 2024 paper can be memorization, while performance on a freshly released exam is the honest signal.",
    scoring:
      "Exact-match accuracy, the percent of problems solved (each model usually run several times and averaged). The trustworthy numbers come from MathArena, an independent academic group at ETH Zurich that runs every model itself on the newest exam, rather than from the contest organizers (the MAA), who only run the human competition.",
    calibration:
      "Top human competitors solve about 7 to 10 of 15 problems (roughly 46 to 67 percent); random guessing is near zero because answers are integers. The 2025 wave of reasoning models pushed scores past 90 percent, and on the 2026 exam the leaders cluster between 93 and 97 percent.",
    watchOut:
      "Two cautions. Contamination is the big one: models reliably score 10 to 20 points higher on older AIME exams that have circulated online for years than on a freshly released one, so any 'AIME 2024' number is an unreliable upper bound (this page uses the fresh 2026 edition). Saturation is the other: the leaders are separated by a fraction of a point, well inside the margin of error, and the third-place slot is a three-way tie, so the ranking at the top is not a real ordering. Watch for scores quietly run with a calculator or code tool, which inflates a test meant for pencil and paper.",
    watchOutUrl: "https://matharena.ai/",
    leaders: [
      {
        rank: 1,
        model: "Step-3.5-Flash",
        lab: "StepFun AI",
        score: "96.67% +/- 3.21%",
        baselineGloss: "MathArena, fresh 2026 exam",
        asOfDate: "2026-05-01",
        sourceUrl: "https://matharena.ai/?comp=aime--aime_2026",
        selfReported: false,
      },
      {
        rank: 2,
        model: "Kimi-K2.6",
        lab: "Moonshot AI",
        score: "96.4%",
        baselineGloss: "0.27 points behind #1",
        asOfDate: "2026-05-01",
        sourceUrl: "https://huggingface.co/datasets/MathArena/aime_2026",
        selfReported: false,
      },
      {
        rank: 3,
        model: "Kimi-K2.5",
        lab: "Moonshot AI",
        score: "95.83% +/- 3.58%",
        baselineGloss: "three-way tie for third",
        asOfDate: "2026-05-01",
        sourceUrl: "https://matharena.ai/models/moonshot_k25",
        selfReported: false,
      },
    ],
    leaderboardUrl: "https://matharena.ai/?comp=aime--aime_2026",
    boardLastUpdated: "2026-06-21",
    honestEmpty: false,
    needsRecheck: false,
    relatedConcepts: [
      { label: "Reasoning models", slug: "reasoning-models" },
      { label: "Learning from verifiable rewards", slug: "rlvr" },
      { label: "Benchmarking LLMs", slug: "benchmarking-llms" },
    ],
    sources: [
      "https://matharena.ai/",
      "https://arxiv.org/abs/2505.23281",
      "https://huggingface.co/datasets/MathArena/aime_2026",
    ],
  },

  {
    slug: "tau-bench",
    name: "TAU-bench",
    domain: "Agents",
    scoreType: "Pass rate",
    trust: "dated",
    nearTie: false,
    caveat: "no current verified board",
    whatItMeasures:
      "TAU-bench measures how reliably an AI agent can finish real customer-service tasks, like changing a flight, by using software tools, following company policy, and chatting with a simulated customer, all at once. Its key twist is grading on consistency: can the agent get it right every time, not just once.",
    exampleTask:
      "An agent is dropped into a simulated airline or retail help desk: it must talk to a simulated customer, look up and update records through tool calls, and follow the written policy, for example processing a refund only if the rules actually allow it. The task counts only if the database ends in exactly the right state.",
    whyCare:
      "TAU-bench is the test that asks whether you could actually trust an AI agent to handle your refund or flight change, the real-world use everyone is racing toward. Its lasting lesson is about reliability: it grades whether an agent succeeds on every one of several tries, and models that look fine at 60 percent on a single attempt often drop to the 20s when they have to be consistent.",
    scoring:
      "Pass^k, the chance an agent completes a task correctly on all k independent attempts (note the caret: this is stricter than the pass@k used for code, which counts any one success). The benchmark is from Sierra Research; the only independently verified scores come from Princeton's HAL leaderboard, and only for the airline tasks.",
    calibration:
      "Random success is near zero. Human customer-service agents in the original study scored roughly 70 to 80 percent on the airline tasks. The best independently verified scores are around 56 percent on airline, while self-reported retail numbers reach the high 80s but are not verified.",
    watchOut:
      "There is no trustworthy current leaderboard, so this panel shows a dated anchor. The only independently verified scores (from Princeton's HAL) cover just the airline tasks and stopped updating in mid-2025, so they are roughly a year stale. Every current number on third-party boards is self-reported by the model makers, and one community board had to delete results after a data leak was found in its example files. The task set has also changed (tau2 and tau3 corrected and expanded it), so old and new numbers are not directly comparable. Treat any 2026 TAU-bench figure with caution.",
    watchOutUrl: "https://hal.cs.princeton.edu/taubench_airline",
    leaders: [],
    honestEmpty: true,
    datedAnchor:
      "HAL (Princeton) airline split, independently verified, Pass^1: o4-mini High and Claude 3.7 Sonnet tied at 56.00 percent; o3 Medium and Claude Opus 4.1 at 54.00 percent. HAL paused new submissions and its most recent entries date to August 2025; no verified retail board exists.",
    leaderboardUrl: "https://taubench.com",
    needsRecheck: false,
    relatedConcepts: [
      { label: "Agents and tool use", slug: "agentic-capabilities" },
      { label: "Tool use", slug: "tool-use" },
      { label: "Benchmarking LLMs", slug: "benchmarking-llms" },
    ],
    sources: [
      "https://hal.cs.princeton.edu/taubench_airline",
      "https://arxiv.org/abs/2406.12045",
      "https://github.com/sierra-research/tau-bench",
    ],
  },
];
