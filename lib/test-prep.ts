/**
 * Test prep: what the tech team test covers and how to study for it.
 *
 * Content lives in code so an edit is a small commit. Nothing here is a test
 * question for the coming test: `outcomes` describe what a member should be
 * able to do, in general terms, and `LAST_YEARS_TEST` is the previous test,
 * shown so people know the style.
 *
 * Tone: readers range from CS majors to business, philosophy and psychology
 * majors with no AI background. Write so a newcomer is not put off and an
 * experienced reader is not talked down to: everyday words first, the proper
 * term in passing, and nothing phrased as a demand.
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
  /** Things to understand, written as plain noun phrases, not demands. */
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
    title: "Topics that might be covered",
    lead: "The test draws from these areas. None of them needs a technical background. If you can explain the idea in your own words, the way you would to a friend, you are in good shape.",
  },
  {
    priority: "position",
    title: "Questions that ask for your take",
    lead: "Some questions ask what you think. There is no right answer here. A clear opinion with a reason or two behind it is what we are looking for.",
  },
];

export const TEST_PREP_AREAS: TestPrepArea[] = [
  {
    slug: "training",
    title: "How AI models are trained",
    priority: "core",
    summary: "How a model goes from knowing nothing to being the assistant you chat with.",
    outcomes: [
      "The main steps a model goes through as it is trained, in order.",
      "What the model is practicing at each step, and what it learns from.",
      "How the model is different after each step, and why each one is needed.",
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
    title: "What happens when you ask an AI a question",
    priority: "core",
    summary: "The journey from the words you type to the answer you get back.",
    outcomes: [
      "The basic steps between typing a question and getting an answer.",
      "How a model breaks text into small pieces, called tokens, and turns them into numbers it can work with.",
      "How a model works out which words matter to each other, and why it can only take in so much text at once.",
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
    title: "AI that can take action",
    priority: "core",
    summary: "How AI goes from answering questions to getting things done.",
    outcomes: [
      "How a model can use outside tools, like a search engine or a calculator, instead of relying only on what it remembers.",
      "What people mean by an AI agent, in your own words.",
      "How an agent is different from a regular chatbot.",
    ],
    conceptSlugs: ["tool-use", "agentic-capabilities"],
  },
  {
    slug: "benchmarks",
    title: "How AI models are measured",
    priority: "core",
    summary: "The tests used to compare AI models, and how much to trust the scores.",
    outcomes: [
      "What a benchmark is: a standard test that lets people compare one model with another.",
      "Why those scores matter to the companies building AI and to anyone choosing a model.",
      "Why a high score does not always mean a model is better in real life.",
    ],
    conceptSlugs: ["benchmarking-llms", "evaluating-llm-solutions", "filtering-ai-hype"],
  },
  {
    slug: "landscape",
    title: "The different kinds of AI models",
    priority: "core",
    summary: "The types of models out there and what sets them apart.",
    outcomes: [
      "The difference between models you can only use through a company's app and models anyone can download and run themselves.",
      "Why companies offer both a top-of-the-line model and smaller, cheaper ones, and when the smaller one is the better choice.",
      "Who the major AI companies are and what each one is known for.",
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
    title: "The chips that power AI",
    priority: "core",
    summary: "The hardware behind AI, and the companies that make it.",
    outcomes: [
      "Why AI runs on special chips instead of the kind in a normal laptop.",
      "The difference between building a model, called training, and using one, called inference.",
      "Why NVIDIA matters so much to the AI industry, and how Google's approach is different.",
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
    summary: "What people mean by artificial general intelligence, and why the idea drives so much of the industry.",
    outcomes: [
      "What AGI means to you, and how that compares with other definitions you have heard.",
      "How the race toward AGI shapes where companies put their money and attention.",
    ],
    conceptSlugs: ["agi", "ai-alignment", "scaling-laws"],
  },
  {
    slug: "limitations",
    title: "Where AI still falls short",
    priority: "position",
    summary: "What today's AI cannot do well yet.",
    outcomes: [
      "The weaknesses that matter most to you, such as making things up or not remembering past conversations.",
      "Why those weaknesses exist, in simple terms.",
      "Which ones you expect to be fixed soon, and which might stick around.",
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
    title: "Is AI a bubble?",
    priority: "position",
    summary: "Whether the huge amounts of money going into AI make sense.",
    outcomes: [
      "Whether you think AI is overhyped as an investment, and why.",
      "Who would be hurt if the excitement cooled off, and who would be fine.",
      "What might change your mind.",
    ],
    conceptSlugs: ["ai-bubble", "training-costs", "ai-regulation", "wrapper"],
  },
  {
    slug: "frontier",
    title: "Which AI company is ahead",
    priority: "position",
    summary: "Who is leading right now, and whether that could change.",
    outcomes: [
      "Which company you think will be in the lead a year from now, and what makes you think so.",
      "One reason you might turn out to be wrong.",
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
    body: "Start with your answer, then add a sentence or two showing you understand why. Two clear sentences beat six vague ones.",
  },
  {
    title: "Write the way you would explain it to a friend",
    body: "Plain words are fine, and often better. You do not need jargon to get credit. A quick example usually does more than a textbook definition.",
  },
  {
    title: "For opinion questions, say what you think and why",
    body: "Give your opinion, one or two reasons for it, and one point someone might raise against it. There is no single right answer. We are looking at your reasoning. The weekly digest is an easy place to find recent examples.",
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
