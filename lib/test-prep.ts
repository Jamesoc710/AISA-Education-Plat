/**
 * Test prep: what the tech team test covers and how to study for it.
 *
 * Content lives in code so an edit is a small commit. Nothing here is a test
 * question for the coming test: `outcomes` describe what a member should be
 * able to do, in general terms, and `LAST_YEARS_TEST` is the previous test,
 * shown so people know the style.
 *
 * `conceptSlugs` may name concepts that are not in the database yet; the page
 * and the practice scopes skip any slug that does not resolve.
 */

export type TestPrepPriority = "core" | "position";

export type TestPrepArea = {
  slug: string;
  title: string;
  priority: TestPrepPriority;
  /** One sentence on what this area is about. */
  summary: string;
  /** "You should be able to..." statements. */
  outcomes: string[];
  conceptSlugs: string[];
};

export const TEST_PREP_FORMAT = {
  facts: [
    { label: "Format", value: "Short written answers" },
    { label: "Time", value: "Up to an hour" },
    { label: "Length", value: "About 2 to 4 sentences each" },
  ],
  note: "Nobody is expected to use the whole hour. The time is there so you can think before you write.",
};

export const TEST_PREP_GROUPS: { priority: TestPrepPriority; title: string; lead: string }[] = [
  {
    priority: "core",
    title: "Know these cold",
    lead: "The mechanics. These have right answers, and you should be able to explain each one without notes.",
  },
  {
    priority: "position",
    title: "Be ready to argue a position",
    lead: "There is no single right answer here. What counts is a clear claim, real evidence, and knowing the best argument against you.",
  },
];

export const TEST_PREP_AREAS: TestPrepArea[] = [
  {
    slug: "training",
    title: "How an LLM is trained",
    priority: "core",
    summary: "The stages a model goes through between raw data and the assistant you talk to.",
    outcomes: [
      "Walk through the training stages in order and say what changes at each one.",
      "For each stage, explain what the model is learning to do, what data it learns from, and what kind of model comes out.",
      "Explain how the stages differ from each other, not just what each one is.",
    ],
    conceptSlugs: [
      "pre-training",
      "rlhf",
      "rlvr",
      "base-models",
      "instruction-tuned-models",
      "reasoning-models",
    ],
  },
  {
    slug: "prompt-to-output",
    title: "From prompt to output",
    priority: "core",
    summary: "What happens inside the model between the moment you hit enter and the words that come back.",
    outcomes: [
      "Follow a prompt through the model step by step, in plain language.",
      "Define tokens and embeddings and explain how one becomes the other.",
      "Explain what attention does and why longer context is hard to build.",
    ],
    conceptSlugs: [
      "prompt-to-output",
      "tokens",
      "embeddings",
      "attention-mechanisms",
      "transformers",
      "context-windows",
      "system-prompts",
    ],
  },
  {
    slug: "agents",
    title: "Agents and tool use",
    priority: "core",
    summary: "How a model goes from answering questions to getting things done.",
    outcomes: [
      "Explain tool use: what the model does, and what the surrounding code does.",
      "Describe an agent in your own words and say what makes it different from a chat assistant.",
      "Name where agents tend to go wrong.",
    ],
    conceptSlugs: ["tool-use", "agentic-capabilities"],
  },
  {
    slug: "benchmarks",
    title: "Benchmarks",
    priority: "core",
    summary: "How the industry measures models, and how much those measurements can be trusted.",
    outcomes: [
      "Explain what a benchmark is and why labs, customers and investors care about them.",
      "Give concrete reasons a benchmark score can mislead.",
      "Say how you would judge a model for a real task instead of by a leaderboard.",
    ],
    conceptSlugs: ["benchmarking-llms", "evaluating-llm-solutions", "filtering-ai-hype"],
  },
  {
    slug: "landscape",
    title: "The model landscape",
    priority: "core",
    summary: "The kinds of models on offer and what separates them.",
    outcomes: [
      "Compare closed models with open ones: who can run them, change them and inspect them, and what each choice costs.",
      "Explain why a lab's flagship model and its mid-tier model differ, and when the smaller one is the better pick.",
      "Describe the major labs and what sets each one apart.",
    ],
    conceptSlugs: [
      "closed-vs-open-models",
      "open-source-vs-open-weights",
      "major-ai-players",
      "parameters",
      "model-selection",
      "cost-deployment-tradeoffs",
    ],
  },
  {
    slug: "hardware",
    title: "Hardware and compute",
    priority: "core",
    summary: "The chips and data centers underneath everything, and who controls them.",
    outcomes: [
      "Explain why AI needs accelerators instead of ordinary processors.",
      "Separate training from inference: what each one is and what each one demands.",
      "Describe NVIDIA's position in the market and why Google's hardware situation is different.",
    ],
    conceptSlugs: [
      "accelerators",
      "gpus",
      "tpus",
      "training-vs-inference",
      "training-vs-inference-compute",
      "training-costs",
    ],
  },
  {
    slug: "agi",
    title: "AGI",
    priority: "position",
    summary: "What people mean by it, and how chasing it shapes the industry.",
    outcomes: [
      "Give your own definition of AGI and defend it against a competing one.",
      "Explain how the pursuit of AGI affects where money goes and what labs prioritize.",
    ],
    conceptSlugs: ["agi", "ai-alignment", "scaling-laws"],
  },
  {
    slug: "limitations",
    title: "Limits of LLMs",
    priority: "position",
    summary: "Where today's models fall short, and which of those limits look temporary.",
    outcomes: [
      "Name the limitations you think matter most and explain where each one comes from.",
      "Say which ones you expect to be solved soon and which ones look deeper.",
    ],
    conceptSlugs: [
      "llm-limitations",
      "hallucinations",
      "continual-learning",
      "jailbreaking",
      "interpretability",
    ],
  },
  {
    slug: "bubble",
    title: "The AI bubble debate",
    priority: "position",
    summary: "Whether the money pouring into AI is justified, and who is exposed if it is not.",
    outcomes: [
      "Take a side on whether there is a bubble and back it with specifics.",
      "Explain who would be hurt if spending slowed, and who would be fine.",
      "Describe what you would watch to know whether you were wrong.",
    ],
    conceptSlugs: ["ai-bubble", "training-costs", "ai-regulation", "wrapper"],
  },
  {
    slug: "frontier",
    title: "Who leads the frontier",
    priority: "position",
    summary: "Which lab is ahead, why, and whether that will last.",
    outcomes: [
      "Pick the lab you expect to lead over the next year and explain what you are basing that on.",
      "Name the strongest reason you might be wrong.",
    ],
    conceptSlugs: ["major-ai-players", "benchmarking-llms", "us-china-ai-race", "export-controls"],
  },
];

export function getTestPrepArea(slug: string | null | undefined): TestPrepArea | undefined {
  return TEST_PREP_AREAS.find((a) => a.slug === slug);
}

/** Flashcard decks for an area live at /flashcards/prep-<area slug>. */
export const TEST_PREP_DECK_PREFIX = "prep-";

export const ANSWER_ADVICE: { title: string; body: string }[] = [
  {
    title: "Answer the question first",
    body: "Lead with the direct answer, then use the next sentence or two to show you understand why. Two clear sentences beat six vague ones.",
  },
  {
    title: "Explain it like you would to a teammate",
    body: "Plain words are fine. If you use a term, show you know what it means. A short example often does more than a definition.",
  },
  {
    title: "For opinion questions: claim, evidence, counterpoint",
    body: "State your position, give one or two specific reasons, and name the best argument against you. Any well-argued position can earn full marks. The weekly digest is the easiest place to find current evidence.",
  },
];

/**
 * Last year's test, as it was given. Each inner array is one group of
 * questions that appeared together.
 */
export const LAST_YEARS_TEST: string[][] = [
  [
    "Very simply, walk through the three stages of LLM training (pretraining, RLHF, RLVR). For each stage, describe (a) what the model is being trained to do, (b) what data is used, and (c) what kind of model you get after training.",
  ],
  [
    "Define tokens and embeddings. How do they relate to each other inside a transformer?",
    "What does the attention mechanism do in Transformers?",
    "Why is scaling the context window so difficult?",
  ],
  ["Explain tool use in LLMs, and its connection to Agentic AI."],
  [
    "Why do accelerators like GPUs and TPUs matter for AI?",
    "What's the difference between training and inference of AI models?",
    "How has NVIDIA's market position shaped the industry, and what makes Google's hardware situation different from the other major labs?",
  ],
  [
    "In the next 12 months, what AI Lab do you believe will be the industry leader in terms of frontier model performance, and why do you believe this?",
  ],
  ["What do you see as the major limitations of Large Language Models?"],
  ["What does AGI mean, and how has the pursuit of AGI impacted investment and strategy?"],
  [
    "Explain your opinion on if there is or is not an AI bubble, who that bubble affects, and what the implications of this are.",
  ],
];
