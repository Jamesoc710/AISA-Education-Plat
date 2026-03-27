type ResourceSeed = {
  conceptSlug: string;
  title: string;
  url: string;
  sourceDomain: string;
  type: "VIDEO" | "ARTICLE" | "PAPER" | "TUTORIAL";
  estimatedMinutes?: number;
  description?: string;
  sortOrder: number;
};

export const RESOURCES: ResourceSeed[] = [
  // Transformers
  { conceptSlug: "transformers", title: "Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762", sourceDomain: "arxiv.org", type: "PAPER", estimatedMinutes: 40, description: "The original transformer paper", sortOrder: 1 },
  { conceptSlug: "transformers", title: "Illustrated Transformer", url: "https://jalammar.github.io/illustrated-transformer/", sourceDomain: "jalammar.github.io", type: "ARTICLE", estimatedMinutes: 25, description: "Visual walkthrough of the transformer architecture", sortOrder: 2 },
  { conceptSlug: "transformers", title: "But what is a GPT? Visual intro to transformers", url: "https://www.youtube.com/watch?v=wjZofJX0v4M", sourceDomain: "youtube.com", type: "VIDEO", estimatedMinutes: 27, description: "3Blue1Brown's visual explanation", sortOrder: 3 },

  // Attention Mechanisms
  { conceptSlug: "attention-mechanisms", title: "Attention? Attention!", url: "https://lilianweng.github.io/posts/2018-06-24-attention/", sourceDomain: "lilianweng.github.io", type: "ARTICLE", estimatedMinutes: 30, description: "Lilian Weng's comprehensive overview of attention", sortOrder: 1 },
  { conceptSlug: "attention-mechanisms", title: "Visualizing Attention, a Transformer's Heart", url: "https://www.youtube.com/watch?v=eMlx5fFNoYc", sourceDomain: "youtube.com", type: "VIDEO", estimatedMinutes: 26, description: "3Blue1Brown on attention mechanisms", sortOrder: 2 },

  // Tokens
  { conceptSlug: "tokens", title: "OpenAI Tokenizer", url: "https://platform.openai.com/tokenizer", sourceDomain: "openai.com", type: "TUTORIAL", estimatedMinutes: 10, description: "Interactive tool to see how text gets tokenized", sortOrder: 1 },
  { conceptSlug: "tokens", title: "Let's build the GPT Tokenizer", url: "https://www.youtube.com/watch?v=zduSFxRajkE", sourceDomain: "youtube.com", type: "VIDEO", estimatedMinutes: 120, description: "Andrej Karpathy builds a tokenizer from scratch", sortOrder: 2 },

  // Embeddings
  { conceptSlug: "embeddings", title: "Word2Vec and Embeddings Explained", url: "https://www.youtube.com/watch?v=viZrOnJclY0", sourceDomain: "youtube.com", type: "VIDEO", estimatedMinutes: 20, description: "Visual introduction to word embeddings", sortOrder: 1 },
  { conceptSlug: "embeddings", title: "The Illustrated Word2vec", url: "https://jalammar.github.io/illustrated-word2vec/", sourceDomain: "jalammar.github.io", type: "ARTICLE", estimatedMinutes: 25, description: "A visual guide to embeddings and word vectors", sortOrder: 2 },

  // Pre-training
  { conceptSlug: "pre-training", title: "Let's reproduce GPT-2", url: "https://www.youtube.com/watch?v=l8pRSuU81PU", sourceDomain: "youtube.com", type: "VIDEO", estimatedMinutes: 240, description: "Andrej Karpathy builds and trains GPT-2 from scratch", sortOrder: 1 },
  { conceptSlug: "pre-training", title: "Scaling Laws for Neural Language Models", url: "https://arxiv.org/abs/2001.08361", sourceDomain: "arxiv.org", type: "PAPER", estimatedMinutes: 40, description: "OpenAI's foundational paper on how models scale", sortOrder: 2 },

  // RLHF
  { conceptSlug: "rlhf", title: "InstructGPT: Training language models to follow instructions", url: "https://arxiv.org/abs/2203.02155", sourceDomain: "arxiv.org", type: "PAPER", estimatedMinutes: 40, description: "The paper behind ChatGPT's instruction following", sortOrder: 1 },
  { conceptSlug: "rlhf", title: "RLHF: Reinforcement Learning from Human Feedback", url: "https://huggingface.co/blog/rlhf", sourceDomain: "huggingface.co", type: "ARTICLE", estimatedMinutes: 20, description: "Hugging Face's clear explanation of the RLHF process", sortOrder: 2 },

  // RLVR
  { conceptSlug: "rlvr", title: "DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via RL", url: "https://arxiv.org/abs/2501.12948", sourceDomain: "arxiv.org", type: "PAPER", estimatedMinutes: 50, description: "The open paper behind R1's reasoning training approach", sortOrder: 1 },
  { conceptSlug: "rlvr", title: "OpenAI o1 System Card", url: "https://openai.com/index/openai-o1-system-card/", sourceDomain: "openai.com", type: "ARTICLE", estimatedMinutes: 25, description: "OpenAI's release notes on o1's capabilities and training", sortOrder: 2 },

  // Hallucinations
  { conceptSlug: "hallucinations", title: "Why Does ChatGPT Lie? (Hallucination Explained)", url: "https://www.youtube.com/watch?v=6b1TGpIEyYo", sourceDomain: "youtube.com", type: "VIDEO", estimatedMinutes: 15, description: "Clear non-technical explanation of why hallucinations happen", sortOrder: 1 },
  { conceptSlug: "hallucinations", title: "Anthropic's Guide to Reducing Hallucination", url: "https://docs.anthropic.com/en/docs/test-and-evaluate/strengthen-guardrails/reduce-hallucinations", sourceDomain: "anthropic.com", type: "TUTORIAL", estimatedMinutes: 15, description: "Practical techniques for reducing hallucinations in production", sortOrder: 2 },

  // Tool Use
  { conceptSlug: "tool-use", title: "Tool Use with Claude", url: "https://docs.anthropic.com/en/docs/build-with-claude/tool-use", sourceDomain: "anthropic.com", type: "TUTORIAL", estimatedMinutes: 30, description: "Official guide to implementing tool use with the Claude API", sortOrder: 1 },
  { conceptSlug: "tool-use", title: "Function Calling in OpenAI API", url: "https://platform.openai.com/docs/guides/function-calling", sourceDomain: "openai.com", type: "TUTORIAL", estimatedMinutes: 20, description: "How function calling works in the OpenAI API", sortOrder: 2 },

  // Agentic Capabilities
  { conceptSlug: "agentic-capabilities", title: "Building Effective Agents — Anthropic", url: "https://www.anthropic.com/research/building-effective-agents", sourceDomain: "anthropic.com", type: "ARTICLE", estimatedMinutes: 25, description: "Anthropic's practical guide to agent architecture", sortOrder: 1 },
  { conceptSlug: "agentic-capabilities", title: "ReAct: Synergizing Reasoning and Acting in Language Models", url: "https://arxiv.org/abs/2210.03629", sourceDomain: "arxiv.org", type: "PAPER", estimatedMinutes: 35, description: "The foundational paper on reasoning + acting in LLM agents", sortOrder: 2 },

  // RAG
  { conceptSlug: "rag", title: "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks", url: "https://arxiv.org/abs/2005.11401", sourceDomain: "arxiv.org", type: "PAPER", estimatedMinutes: 40, description: "The original RAG paper from Facebook AI", sortOrder: 1 },
  { conceptSlug: "rag", title: "RAG vs Fine-tuning — How to choose", url: "https://www.pinecone.io/learn/retrieval-augmented-generation/", sourceDomain: "pinecone.io", type: "ARTICLE", estimatedMinutes: 20, description: "Practical guide to when to use RAG vs other approaches", sortOrder: 2 },

  // Prompt Engineering
  { conceptSlug: "prompt-engineering", title: "Anthropic Prompt Engineering Guide", url: "https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview", sourceDomain: "anthropic.com", type: "TUTORIAL", estimatedMinutes: 30, description: "Official best practices for prompting Claude", sortOrder: 1 },
  { conceptSlug: "prompt-engineering", title: "Chain-of-Thought Prompting Elicits Reasoning in LLMs", url: "https://arxiv.org/abs/2201.11903", sourceDomain: "arxiv.org", type: "PAPER", estimatedMinutes: 25, description: "The paper that established chain-of-thought prompting", sortOrder: 2 },

  // API Basics
  { conceptSlug: "api-basics", title: "Anthropic API Quickstart", url: "https://docs.anthropic.com/en/docs/quickstart", sourceDomain: "anthropic.com", type: "TUTORIAL", estimatedMinutes: 20, description: "Get started calling Claude from code in minutes", sortOrder: 1 },
  { conceptSlug: "api-basics", title: "OpenAI API Reference — Chat Completions", url: "https://platform.openai.com/docs/api-reference/chat", sourceDomain: "openai.com", type: "TUTORIAL", estimatedMinutes: 15, description: "The standard chat completions API used across most LLM providers", sortOrder: 2 },

  // Scaling Laws
  { conceptSlug: "scaling-laws", title: "Training Compute-Optimal Large Language Models (Chinchilla)", url: "https://arxiv.org/abs/2203.15556", sourceDomain: "arxiv.org", type: "PAPER", estimatedMinutes: 40, description: "The paper that changed how labs think about model size vs. data", sortOrder: 1 },

  // Fine-tuning
  { conceptSlug: "fine-tuning", title: "Fine-tuning Guide — OpenAI", url: "https://platform.openai.com/docs/guides/fine-tuning", sourceDomain: "openai.com", type: "TUTORIAL", estimatedMinutes: 25, description: "How to fine-tune OpenAI models on custom data", sortOrder: 1 },
  { conceptSlug: "fine-tuning", title: "LoRA: Low-Rank Adaptation of Large Language Models", url: "https://arxiv.org/abs/2106.09685", sourceDomain: "arxiv.org", type: "PAPER", estimatedMinutes: 35, description: "The paper introducing LoRA, the dominant efficient fine-tuning method", sortOrder: 2 },

  // Benchmarking
  { conceptSlug: "benchmarking-llms", title: "LMSYS Chatbot Arena", url: "https://chat.lmsys.org/", sourceDomain: "chat.lmsys.org", type: "TUTORIAL", estimatedMinutes: 15, description: "Live human-preference model comparison leaderboard", sortOrder: 1 },
  { conceptSlug: "benchmarking-llms", title: "Evaluating LLMs is Harder Than You Think", url: "https://www.anthropic.com/research/evaluating-ai-systems", sourceDomain: "anthropic.com", type: "ARTICLE", estimatedMinutes: 20, description: "The challenges of measuring AI capability accurately", sortOrder: 2 },

  // AI Alignment
  { conceptSlug: "ai-alignment", title: "Core Views on AI Safety — Anthropic", url: "https://www.anthropic.com/research/core-views-on-ai-safety", sourceDomain: "anthropic.com", type: "ARTICLE", estimatedMinutes: 20, description: "Anthropic's perspective on the AI safety challenge", sortOrder: 1 },
  { conceptSlug: "ai-alignment", title: "Superintelligence: Paths, Dangers, Strategies (Chapter 8)", url: "https://en.wikipedia.org/wiki/Superintelligence:_Paths,_Dangers,_Strategies", sourceDomain: "wikipedia.org", type: "ARTICLE", estimatedMinutes: 30, description: "Nick Bostrom's influential framing of alignment risks", sortOrder: 2 },

  // GPUs
  { conceptSlug: "gpus", title: "The GPU That's Powering AI — NVIDIA H100 Explained", url: "https://www.youtube.com/watch?v=4A48jEbRjuE", sourceDomain: "youtube.com", type: "VIDEO", estimatedMinutes: 18, description: "Technical overview of the H100 and why it matters", sortOrder: 1 },

  // Interpretability
  { conceptSlug: "interpretability", title: "Towards Monosemanticity — Anthropic", url: "https://www.anthropic.com/research/towards-monosemanticity-decomposing-language-models-with-dictionary-learning", sourceDomain: "anthropic.com", type: "PAPER", estimatedMinutes: 60, description: "Anthropic's breakthrough interpretability research on model features", sortOrder: 1 },
  { conceptSlug: "interpretability", title: "A Mathematical Framework for Transformer Circuits", url: "https://transformer-circuits.pub/2021/framework/index.html", sourceDomain: "transformer-circuits.pub", type: "PAPER", estimatedMinutes: 90, description: "Foundational framework for mechanistic interpretability", sortOrder: 2 },
];
