export const TIERS = [
  {
    name: "Fundamentals",
    slug: "fundamentals",
    description: "The building blocks. If you can't explain these, you're not ready for projects, site tours, or client conversations.",
    sortOrder: 1,
    color: "#E8B54A",
  },
  {
    name: "Intermediate",
    slug: "intermediate",
    description: "The 'how it works in the real world' layer. What separates a participant from a valuable team member.",
    sortOrder: 2,
    color: "#6B9BD2",
  },
  {
    name: "Advanced",
    slug: "advanced",
    description: "The cutting edge and the deep dives. What separates someone who's informed from someone who's a thought leader.",
    sortOrder: 3,
    color: "#8B8B9E",
  },
];

export const SECTIONS = [
  // FUNDAMENTALS
  { tierSlug: "fundamentals", name: "Core Architecture", slug: "core-architecture", description: "The foundational mechanics of modern AI models", sortOrder: 1 },
  { tierSlug: "fundamentals", name: "Training Process", slug: "training-process", description: "How LLMs are built, from raw data to capable, safe assistants", sortOrder: 2 },
  { tierSlug: "fundamentals", name: "Model Types", slug: "model-types", description: "The three families of LLMs and what distinguishes them", sortOrder: 3 },
  { tierSlug: "fundamentals", name: "Key Concepts", slug: "key-concepts", description: "The vocabulary every AI practitioner needs to operate confidently", sortOrder: 4 },
  { tierSlug: "fundamentals", name: "Capabilities", slug: "capabilities", description: "What modern LLMs can actually do beyond generating text", sortOrder: 5 },
  { tierSlug: "fundamentals", name: "Industry Basics", slug: "industry-basics", description: "The competitive landscape, business models, and vocabulary of the AI industry", sortOrder: 6 },
  { tierSlug: "fundamentals", name: "Practical Skills", slug: "practical-skills", description: "Hands-on techniques for working with AI systems", sortOrder: 7 },
  // INTERMEDIATE
  { tierSlug: "intermediate", name: "Hardware & Compute", slug: "hardware-compute", description: "The physical infrastructure that makes AI possible", sortOrder: 1 },
  { tierSlug: "intermediate", name: "Scaling & Data", slug: "scaling-data", description: "How models improve with more compute and data", sortOrder: 2 },
  { tierSlug: "intermediate", name: "Evaluation & Alignment", slug: "evaluation-alignment", description: "Measuring AI capabilities and ensuring they serve human values", sortOrder: 3 },
  { tierSlug: "intermediate", name: "Geopolitics & Regulation", slug: "geopolitics-regulation", description: "The global political and regulatory forces shaping AI development", sortOrder: 4 },
  { tierSlug: "intermediate", name: "Ethics & Responsibility", slug: "ethics-responsibility", description: "The societal implications of AI that every practitioner must grapple with", sortOrder: 5 },
  { tierSlug: "intermediate", name: "Practical Decision-Making", slug: "practical-decision-making", description: "Frameworks for making real AI product and architecture decisions", sortOrder: 6 },
  // ADVANCED
  { tierSlug: "advanced", name: "Modern Non-LLM AI", slug: "modern-non-llm-ai", description: "The AI landscape beyond language models", sortOrder: 1 },
  { tierSlug: "advanced", name: "Advanced Training Mechanics", slug: "advanced-training-mechanics", description: "Deeper mechanics of how models learn and what emerges from scale", sortOrder: 2 },
  { tierSlug: "advanced", name: "Research & Meta-Skills", slug: "research-meta-skills", description: "Skills for staying current and thinking critically about AI", sortOrder: 3 },
];

export const CONCEPTS = [
  // ── FUNDAMENTALS / Core Architecture ─────────────────────────────────────
  {
    sectionSlug: "core-architecture",
    name: "Transformers",
    slug: "transformers",
    subtitle: "The dominant architecture behind modern AI, parallelizable, scalable, attention-powered",
    difficulty: "FUNDAMENTALS",
    sortOrder: 1,
    whatItIs: `Transformers are the neural network architecture that powers virtually every modern large language model. Introduced by Google in 2017 in the paper "Attention Is All You Need," transformers replaced older sequential architectures like RNNs by processing all input tokens simultaneously rather than one at a time.

The key innovation is the **self-attention mechanism**, which allows the model to weigh how relevant each token is to every other token in the input. This gives transformers rich contextual understanding, the word "not" before "good" fundamentally changes the meaning, and the attention mechanism learns to capture this.

Because transformers process input in parallel, they scale extremely well across thousands of GPUs. This parallelizability is what made it possible to train models on internet-scale data and reach the capabilities we see today.`,
    whyItMatters: `Every major AI model you'll encounter (GPT-4, Claude, Gemini, Llama) is a transformer. When clients ask why AI improved so dramatically after 2017, the answer is transformers. When you're evaluating a new model architecture or reading a research paper, understanding transformers is your baseline. You can't have an intelligent conversation about modern AI without it.`,
    goDeeper: `The original transformer has an encoder-decoder structure designed for translation tasks. Modern LLMs use decoder-only transformers, which predict the next token autoregressively. The attention formula is: Attention(Q,K,V) = softmax(QKᵀ/√dₖ)V, queries, keys, and values are learned linear projections of the input embeddings. Multi-head attention runs this process in parallel across multiple "heads," each learning different types of relationships.`,
  },
  {
    sectionSlug: "core-architecture",
    name: "Attention Mechanisms",
    slug: "attention-mechanisms",
    subtitle: "How models decide what to focus on, the core of what makes transformers powerful",
    difficulty: "FUNDAMENTALS",
    sortOrder: 2,
    whatItIs: `The attention mechanism is an algorithm that determines how much weight to give each token in the input when processing any other token. During training, the model learns which relationships between tokens matter, for example, a pronoun attending strongly to the noun it refers to, or "not" attending to the word that follows it.

Every token is compared to every other token, producing an attention score. These scores are normalized and used to create a weighted sum of token representations. The result is that each token's representation is "enriched" with context from the rest of the sequence.

This all-to-all comparison is what makes attention powerful, and also what makes it computationally expensive. Longer inputs require quadratically more computation, which is a core reason why context windows are hard to extend.`,
    whyItMatters: `Attention is the reason LLMs understand context rather than just pattern-matching. It explains why context window size is such a hard engineering problem (quadratic compute cost), why models sometimes "lose track" of things in very long documents, and why the concept of "relevant context" matters when you're prompting a model. If you understand attention, you understand the biggest architectural constraint in modern AI.`,
    goDeeper: `Self-attention vs cross-attention: self-attention compares a sequence to itself; cross-attention (used in encoder-decoder models) compares one sequence to another. Sparse attention variants (like sliding window attention in Mistral) reduce the quadratic cost by only attending to nearby tokens. Flash Attention is a hardware-optimized implementation that makes long-context models practical by reducing memory bandwidth rather than compute.`,
  },
  {
    sectionSlug: "core-architecture",
    name: "Tokens",
    slug: "tokens",
    subtitle: "The atomic units of language that AI models actually process",
    difficulty: "FUNDAMENTALS",
    sortOrder: 3,
    whatItIs: `Tokens are the vocabulary of a transformer model, the discrete units that the model reads and generates. Before training, a tokenizer is built that maps text to token IDs (integers) the model can process.

Most LLMs use **subword tokenization** (typically BPE, or Byte Pair Encoding), which finds the most frequent character sequences in the training data and uses those as tokens. Common words like "dog" become single tokens; rarer words like "artificial" might split into "art" and "ificial." This balances vocabulary size against coverage.

Tokens are not always whole words, and they don't map 1-to-1 with characters. "ChatGPT is great" might be 5 tokens. This has real implications: token counts determine cost, speed, and context window usage.`,
    whyItMatters: `Token counting directly affects your API costs, latency, and what fits in a context window. When a client asks why their long document can't fit in one prompt, or why the API bill is higher than expected, tokens are the answer. The famous example of LLMs failing to count the r's in "strawberry" also comes down to tokenization, the model sees subword units, not individual characters.`,
    goDeeper: `The tokenizer is fixed before training and can't be changed without retraining the model. GPT-4 uses cl100k_base, a ~100,000-token vocabulary. Multilingual models often have larger vocabularies to handle non-Latin scripts efficiently. Vocabulary size is a hyperparameter tradeoff: larger vocab = fewer tokens per sequence but larger embedding tables and slower softmax computation.`,
  },
  {
    sectionSlug: "core-architecture",
    name: "Embeddings",
    slug: "embeddings",
    subtitle: "How models represent meaning internally, dense vectors that capture semantic relationships",
    difficulty: "FUNDAMENTALS",
    sortOrder: 4,
    whatItIs: `Embeddings are how transformers represent tokens internally as numbers. Each token ID is mapped to a dense vector of floating-point numbers (the embedding dimension, typically 768 to 12,288 values for modern models). These vectors are learned during training.

Initially, embeddings just encode identity, token 42 maps to a fixed vector. But after being processed through the transformer's layers and attention mechanism, these vectors become "enriched" with contextual meaning. The embedding for "bank" in "river bank" becomes different from "bank" in "investment bank" because attention has incorporated surrounding context.

Embeddings are also the foundation of semantic search and RAG systems, where text is converted to vectors and stored in vector databases for similarity lookup.`,
    whyItMatters: `Embeddings are why LLMs understand meaning rather than just syntax. They're also the technical foundation for one of the most practically useful AI techniques, RAG (Retrieval-Augmented Generation), where you embed your documents and retrieve relevant chunks based on vector similarity. If your team is building any AI product that needs to work with custom data, embeddings are almost certainly involved.`,
    goDeeper: `The embedding layer is a lookup table of shape [vocab_size × embedding_dim]. Positional embeddings are added to token embeddings to give the model sequence order information (since attention itself is order-agnostic). Modern models use rotary positional embeddings (RoPE) instead of learned or sinusoidal positions. Dedicated embedding models (like text-embedding-3-large) are transformers trained specifically to produce useful dense representations rather than to generate text.`,
  },

  // ── FUNDAMENTALS / Training Process ───────────────────────────────────────
  {
    sectionSlug: "training-process",
    name: "Pre-training",
    slug: "pre-training",
    subtitle: "The massive first stage that teaches a model to predict language",
    difficulty: "FUNDAMENTALS",
    sortOrder: 1,
    whatItIs: `Pre-training is the foundational and most expensive stage of LLM development. The model is trained on internet-scale data (essentially as much text as can be collected and cleaned) with a simple objective: predict the next token given all previous tokens.

This stage uses entire data centers running for months and costs tens to hundreds of millions of dollars for frontier models. The result is a **base model**, a powerful autocomplete engine that has internalized patterns, facts, reasoning structures, and language from its training data, but has no instruction-following capability.

Data quality and quantity both matter. High-quality sources (textbooks, Wikipedia, peer-reviewed papers, curated code) are weighted heavily. But scale is critical, models need exposure to the full diversity of human language and knowledge.`,
    whyItMatters: `Pre-training is why AI models know so much, it's where all the world knowledge comes from. It's also why they have a knowledge cutoff date, why they can write code in any language, and why they sometimes reproduce training data verbatim. The enormous cost of pre-training is why there are only a handful of organizations capable of building frontier models, which shapes the entire competitive landscape you'll be analyzing in industry conversations.`,
    goDeeper: `The training objective is called "next-token prediction" or "causal language modeling." The model sees tokens 1..n and predicts token n+1, computing cross-entropy loss against the true next token. This is done for every position in every sequence simultaneously. The compute requirement is roughly: 6 × N × D FLOPs per training step, where N is parameter count and D is tokens in the batch, which explains why scaling both parameters and data proportionally is the Chinchilla-optimal approach.`,
  },
  {
    sectionSlug: "training-process",
    name: "RLHF / Post-training",
    slug: "rlhf",
    subtitle: "Turning a raw autocomplete engine into a useful, safe assistant",
    difficulty: "FUNDAMENTALS",
    sortOrder: 2,
    whatItIs: `Reinforcement Learning from Human Feedback (RLHF) is the post-training stage that transforms a pre-trained base model into a useful chatbot. A base model knows how to predict text but can't reliably follow instructions or maintain a helpful persona.

The process: the base model generates multiple responses to the same prompt, human raters rank the responses by quality, a **reward model** is trained on these preferences, and then the LLM is fine-tuned using RL to maximize the reward model's score. After relatively few examples compared to pre-training, the model learns to consistently follow instructions and format responses helpfully.

This is the same mechanism used for safety alignment, teaching the model to refuse harmful requests despite having been trained on data that includes how to make those things.`,
    whyItMatters: `RLHF is the difference between GPT-3 (2020, research curiosity) and ChatGPT (2022, product used by hundreds of millions). It's what makes models practically useful. It also explains why different models have different "personalities" and why safety behaviors can be inconsistent, the reward model and fine-tuning process involve significant design choices and tradeoffs.`,
    goDeeper: `The RL algorithm used is typically PPO (Proximal Policy Optimization). A key challenge is reward hacking, the LLM learns to game the reward model rather than actually improve. Constitutional AI (Anthropic's approach) adds a self-critique step where the model evaluates its own outputs against principles, reducing dependence on human raters. DPO (Direct Preference Optimization) is a newer alternative that skips the explicit reward model, directly optimizing the LLM on preference pairs.`,
  },
  {
    sectionSlug: "training-process",
    name: "Reasoning Training / RLVR",
    slug: "rlvr",
    subtitle: "How modern models learn to think step-by-step using verifiable rewards",
    difficulty: "FUNDAMENTALS",
    sortOrder: 3,
    whatItIs: `Reinforcement Learning from Verifiable Rewards (RLVR) is the training technique behind modern reasoning models like OpenAI's o1/o3 and Claude's extended thinking mode. Unlike RLHF, which relies on human preference judgments, RLVR uses datasets where answers can be automatically verified as correct or incorrect, math problems, coding challenges, logic puzzles.

The model generates solutions, gets rewarded for correct answers, and iteratively learns strategies that work. Crucially, no one programmed chain-of-thought reasoning or backtracking, these **emerged** from training pressure alone. The model discovered that thinking through problems step-by-step leads to more correct answers.

The result is "test-time compute": the model can spend more reasoning tokens on harder problems, scaling its capability with task difficulty.`,
    whyItMatters: `Reasoning models changed what AI can actually accomplish. Problems that stumped instruction-tuned models (complex math, multi-step coding, careful logical deduction) became tractable. When you see "thinking" tokens in Claude or o3, RLVR is why they exist. It's also why the question "which is bigger, 9.11 or 9.9?" now gets answered correctly.`,
    goDeeper: `DeepSeek-R1 showed that RLVR training could be applied to open-weight models with dramatic capability gains, published in early 2025. The key algorithmic innovation is GRPO (Group Relative Policy Optimization), which avoids needing a separate critic model by comparing multiple rollouts within a group. The "thinking" tokens are not fixed-format chain-of-thought, the model develops its own internal reasoning language during training.`,
  },

  // ── FUNDAMENTALS / Model Types ─────────────────────────────────────────────
  {
    sectionSlug: "model-types",
    name: "Base Models",
    slug: "base-models",
    subtitle: "Pure autocomplete, powerful but raw and hard to direct",
    difficulty: "FUNDAMENTALS",
    sortOrder: 1,
    whatItIs: `A base model is the direct output of pre-training, a model trained only to predict the next token with no instruction fine-tuning or safety training applied. Base models have internalized an enormous amount of knowledge and capability from their training data, but they express it inconsistently.

If you prompt a base model to translate text to Spanish, it might do the translation, or it might continue the text as if it were a forum thread, or generate a different translation task. It has the capability but can't reliably surface it on demand.

Base models are valuable for researchers who want to fine-tune models for specific tasks from a clean starting point, or who want to study what capabilities emerge purely from scale and data.`,
    whyItMatters: `Understanding base models clarifies why post-training matters so much, and why "the model knows X" doesn't mean "the model will tell you X." It also gives context for evaluating open-weight model releases, when Meta releases a Llama base model vs. an instruct model, they serve very different purposes. A base model needs additional fine-tuning before being deployable in a product.`,
    goDeeper: null,
  },
  {
    sectionSlug: "model-types",
    name: "Instruction-tuned Models",
    slug: "instruction-tuned-models",
    subtitle: "The chatbots you know, RLHF-trained to follow instructions reliably",
    difficulty: "FUNDAMENTALS",
    sortOrder: 2,
    whatItIs: `Instruction-tuned models are base models that have been fine-tuned through RLHF (or related techniques) to reliably follow user instructions and behave like assistants. These are the models behind ChatGPT, Claude, and Gemini as most people experience them.

Post-training teaches the model to: interpret prompts as instructions rather than text to continue, format responses appropriately, apply safety training, and maintain a consistent assistant persona. The training data is relatively small compared to pre-training (often millions of examples rather than trillions of tokens) but it dramatically changes the model's behavior.

The "instruct" or "chat" suffix in model names (e.g., Llama-3-8B-Instruct) signals this post-training.`,
    whyItMatters: `When choosing a model for a client project, you're almost always choosing between instruction-tuned models. Understanding what post-training does (and what it doesn't do) helps you set realistic expectations, understand failure modes, and make better prompting decisions.`,
    goDeeper: null,
  },
  {
    sectionSlug: "model-types",
    name: "Reasoning Models",
    slug: "reasoning-models",
    subtitle: "The current frontier, models that think before they answer",
    difficulty: "FUNDAMENTALS",
    sortOrder: 3,
    whatItIs: `Reasoning models are instruction-tuned models further trained with RLVR to develop extended chain-of-thought reasoning capabilities. They generate "thinking" tokens before their final answer, working through the problem step by step, trying approaches, catching errors, and backtracking when something doesn't work.

Examples include OpenAI's o1, o3; Anthropic's Claude with extended thinking; and Google's Gemini Flash Thinking. These models dramatically outperform standard instruction-tuned models on math, coding, and complex multi-step reasoning tasks.

The tradeoff: reasoning tokens cost more (latency and API cost scale with thinking depth), and they're overkill for simple tasks. The best systems route simple queries to fast instruction-tuned models and hard queries to reasoning models.`,
    whyItMatters: `Reasoning models represent the current frontier of what AI can do. For projects involving code generation, data analysis, or complex decision-making, knowing when to use a reasoning model vs. a standard model is a real engineering decision with cost and latency implications.`,
    goDeeper: null,
  },

  // ── FUNDAMENTALS / Key Concepts ───────────────────────────────────────────
  {
    sectionSlug: "key-concepts",
    name: "System Prompts",
    slug: "system-prompts",
    subtitle: "The instructions that shape how a model behaves before a user says anything",
    difficulty: "FUNDAMENTALS",
    sortOrder: 1,
    whatItIs: `A system prompt is a special input provided to an LLM that sets context, instructions, and constraints for how it should behave throughout a conversation. It appears before the user's messages and typically has higher priority, models are trained to follow system prompt instructions even when user messages conflict.

System prompts can instruct the model to: respond only in a certain language, adopt a specific persona, limit discussion to certain topics, use a particular format, or be aware of available tools. They're the primary mechanism by which companies customize model behavior for their products.

System prompts are not foolproof, they can be undermined through jailbreaking, and they don't override safety training baked in during RLHF.`,
    whyItMatters: `Every AI product you'll work on will have a system prompt. Writing effective system prompts is a core skill, it's the difference between a model that stays on-task and one that goes off the rails. It's also relevant to security: protecting secret instructions in system prompts (like API keys or business logic) is a real concern, since users can often extract them through careful prompting.`,
    goDeeper: null,
  },
  {
    sectionSlug: "key-concepts",
    name: "Context Windows",
    slug: "context-windows",
    subtitle: "The maximum text a model can see at once, and why it's so hard to extend",
    difficulty: "FUNDAMENTALS",
    sortOrder: 2,
    whatItIs: `The context window is the maximum number of tokens an LLM can process in a single forward pass, everything the model can "see" when generating a response. This includes the system prompt, conversation history, any retrieved documents, and the current user message.

Extending context windows is technically hard for two reasons: the attention mechanism's compute scales quadratically with sequence length (doubling tokens → 4x compute), and training data rarely contains sequences millions of tokens long, so models don't learn to use very long contexts well.

In practice, longer context windows enable document analysis, long conversations, and agentic tasks, which is why they matter commercially.`,
    whyItMatters: `Context window size is one of the most important practical constraints when building AI products. It determines whether you need RAG (if your data doesn't fit), how long conversations can be before history needs to be summarized, and how much code an agent can hold in its working memory. "What fits in the context window?" is a question you'll answer constantly.`,
    goDeeper: `Positional encodings determine how well a model uses positions far from the start. RoPE (Rotary Position Embedding) generalizes better to longer sequences than learned absolute positions. Techniques like ALiBi (Attention with Linear Biases) allow models to extrapolate beyond their training context length. "Lost in the middle" is a documented phenomenon where models perform worse on information placed in the middle of long contexts vs. the beginning or end.`,
  },
  {
    sectionSlug: "key-concepts",
    name: "Parameters",
    slug: "parameters",
    subtitle: "The learned weights that define a model, and why size matters",
    difficulty: "FUNDAMENTALS",
    sortOrder: 3,
    whatItIs: `Parameters (also called weights) are the numerical values inside a neural network that are learned during training. For a transformer, these include the attention weight matrices, feed-forward layer weights, and the embedding table. The total count of these values is what people mean by "model size."

A model with 7 billion parameters has 7 billion floating-point numbers that collectively encode everything it learned. Larger parameter counts generally mean more capacity to store knowledge and learn complex patterns, but also more compute required for both training and inference.

Model sizes range from tiny (1B parameters, runs on a phone) to massive (estimated ~1.8 trillion for GPT-4's mixture-of-experts architecture).`,
    whyItMatters: `Parameter count is shorthand for model capability and cost. A 7B parameter model you can run on a laptop has very different cost and capability characteristics than a 70B model requiring a server. When making deployment decisions (self-hosted vs. API, which model tier to use) understanding what parameter count implies about hardware requirements and capability is essential.`,
    goDeeper: null,
  },
  {
    sectionSlug: "key-concepts",
    name: "Training vs. Inference",
    slug: "training-vs-inference",
    subtitle: "Building a model vs. running one, fundamentally different compute profiles",
    difficulty: "FUNDAMENTALS",
    sortOrder: 4,
    whatItIs: `Training is the process of updating a model's parameters by running data through it and computing gradients, the mathematical recipe for how each parameter should change to reduce prediction error. It requires storing all intermediate activations for backpropagation, making it extremely memory-intensive.

Inference is using a trained model to generate outputs, a forward pass only, no gradients stored. It's much cheaper: the same GPU used for training can serve many more inference requests. You can also batch multiple inference requests together, further improving efficiency.

For frontier models, training costs hundreds of millions of dollars and happens rarely. Inference happens billions of times per day at a tiny fraction of the per-query cost.`,
    whyItMatters: `This distinction directly informs cost conversations with clients and stakeholders. "Why is OpenAI so expensive?" relates to inference costs at scale. "Why can't I just train my own model?" relates to training costs. "Why is fine-tuning cheaper than pre-training?" The compute profile is completely different. Understanding this split also explains why specialized inference hardware is a distinct market.`,
    goDeeper: null,
  },
  {
    sectionSlug: "key-concepts",
    name: "Hallucinations",
    slug: "hallucinations",
    subtitle: "When LLMs confidently state things that aren't true, and why it's a fundamental problem",
    difficulty: "FUNDAMENTALS",
    sortOrder: 5,
    whatItIs: `Hallucination refers to an LLM generating factually incorrect information with apparent confidence. The model doesn't flag its uncertainty, it produces false citations, wrong dates, invented names, and incorrect facts with the same fluency as correct ones.

The root cause is in the training objectives: during pre-training, models are rewarded for predicting the correct next token but not specifically penalized for confident wrong guesses. The model learns to generate plausible-sounding text, and "plausible" doesn't mean "verified."

Hallucination rates vary by domain (better on common knowledge, worse on niche facts), model size, and whether the model has access to tools like web search.`,
    whyItMatters: `Hallucinations are the #1 practical failure mode you'll encounter in AI products. Any client application needing factual accuracy (legal research, medical information, financial data) must be designed around this. Standard mitigations include RAG (grounding the model in retrieved documents), tool use (letting the model verify via search), and prompt engineering that instructs the model to acknowledge uncertainty.`,
    goDeeper: null,
  },
  {
    sectionSlug: "key-concepts",
    name: "Jailbreaking",
    slug: "jailbreaking",
    subtitle: "Bypassing a model's safety training through adversarial prompting",
    difficulty: "FUNDAMENTALS",
    sortOrder: 6,
    whatItIs: `Jailbreaking is the practice of constructing prompts that circumvent an LLM's safety fine-tuning or system prompt instructions, getting the model to produce outputs it was trained to refuse. Common techniques include roleplay framing, hypothetical framing, prompt injection, and multi-step manipulation.

Safety training from RLHF is not robust, it's a statistical tendency, not a hard rule. With enough creativity, a determined user can often find framings that bypass the training. Secret system prompt content (like API keys or confidential instructions) is also frequently extractable through careful prompting.`,
    whyItMatters: `If you're building AI products, jailbreaking is a threat model you must design for. Relying solely on the model's safety training to prevent abuse is insufficient. This motivates input/output filtering, content moderation layers, rate limiting, and careful system prompt design. Understanding jailbreaking also helps you evaluate AI safety claims critically, "we've aligned the model" and "the model is safe against adversarial users" are very different claims.`,
    goDeeper: null,
  },

  // ── FUNDAMENTALS / Capabilities ────────────────────────────────────────────
  {
    sectionSlug: "capabilities",
    name: "Tool Use",
    slug: "tool-use",
    subtitle: "How LLMs interact with external systems to extend their capabilities",
    difficulty: "FUNDAMENTALS",
    sortOrder: 1,
    whatItIs: `Tool use (also called function calling) is the ability of an LLM to invoke external code or APIs during a conversation. The model is given descriptions of available tools in its system prompt. When it determines a tool should be used, it outputs a structured call, execution is handed off to the calling code, and the result is returned to the model as context before it continues generating.

Common tools include: web search, code execution, database queries, file operations, calendar access, and custom APIs. The model doesn't run code itself, it decides what to call and interprets results.

This architecture is how Claude Code, ChatGPT's code interpreter, and virtually every AI product with external integrations work.`,
    whyItMatters: `Tool use is what transforms LLMs from impressive text generators into systems that can actually do things in the world. Almost every AI product worth building involves tool use. Understanding how it works (the model generates structured calls, code executes them, results feed back) helps you architect AI systems correctly, understand failure modes (what if the tool fails?), and explain agent behavior to clients.`,
    goDeeper: null,
  },
  {
    sectionSlug: "capabilities",
    name: "Agentic Capabilities",
    slug: "agentic-capabilities",
    subtitle: "LLMs running in loops with tools to complete multi-step tasks autonomously",
    difficulty: "FUNDAMENTALS",
    sortOrder: 2,
    whatItIs: `Agentic AI refers to LLMs operating in an autonomous loop: receive a task, use tools to gather information, take actions, observe results, and continue until the task is complete or the model determines it's stuck. This enables tasks that can't be accomplished in a single prompt.

A coding agent, for example, might: search the codebase to understand structure, write a function, run tests, read the error output, fix the bug, and repeat until tests pass. Each step involves at least one LLM call and one or more tool invocations.

Key challenges in agentic systems: error recovery (what happens when a tool fails), context management (long tasks exceed context windows), and reliability (one bad decision early can derail the whole task).`,
    whyItMatters: `Agents are the primary reason AI labs are investing so heavily in capabilities right now. They extend what a single model call can accomplish by orders of magnitude. You'll be building with agentic frameworks (LangChain, LlamaIndex, Claude's agent SDK). Understanding the loop model, tool calling, and failure modes is the foundation for building anything non-trivial with AI.`,
    goDeeper: null,
  },
  {
    sectionSlug: "capabilities",
    name: "Multimodality",
    slug: "multimodality",
    subtitle: "AI that can see, hear, and reason across text, images, audio, and more",
    difficulty: "FUNDAMENTALS",
    sortOrder: 3,
    whatItIs: `Multimodal models process more than just text, they handle images, audio, video, and other data types within the same model architecture. Different modalities are tokenized using modality-specific encoders (e.g., image patches become visual tokens) and fed into the transformer alongside text tokens.

This allows a model to: analyze images and describe them, answer questions about photos, generate images from text descriptions, transcribe and reason about audio, and understand documents with mixed text and visuals.

GPT-4o, Claude 3.5+, and Gemini are all multimodal. Image generation models like DALL-E use related but distinct architectures (diffusion models).`,
    whyItMatters: `Most real-world data isn't pure text. Documents have tables and charts, products have images, meetings produce audio. Multimodal models unlock AI applications across these domains. For client work, understanding what a model can and can't perceive across modalities prevents you from proposing solutions that don't actually work.`,
    goDeeper: null,
  },

  // ── FUNDAMENTALS / Industry Basics ────────────────────────────────────────
  {
    sectionSlug: "industry-basics",
    name: "Major AI Players",
    slug: "major-ai-players",
    subtitle: "Who's building frontier AI and what differentiates each lab",
    difficulty: "FUNDAMENTALS",
    sortOrder: 1,
    whatItIs: `Three organizations dominate frontier AI development as of early 2026:

**OpenAI** has first-mover advantage with ChatGPT, the largest user base, massive Microsoft investment, and a history of setting industry benchmarks. Their GPT-4 and o-series models remain highly competitive.

**Google DeepMind** produces Gemini, currently competitive at the frontier, and crucially trains models on their own TPU infrastructure rather than NVIDIA GPUs, the only major player not dependent on NVIDIA's supply chain.

**Anthropic** has a strong enterprise/API presence, models widely used as backends in other companies' AI products, and leads in agentic model capabilities. Founded by former OpenAI leaders with a focus on safety research.

Meta (Llama open weights), Mistral, xAI (Grok), and Chinese labs (DeepSeek, Baidu) are significant secondary players.`,
    whyItMatters: `You'll be asked about the AI landscape constantly, by clients, recruiters, and industry contacts. Being able to accurately describe who's winning, why, and what the competitive dynamics look like is a baseline for credibility. It also shapes which models and APIs are appropriate for a given project.`,
    goDeeper: null,
  },
  {
    sectionSlug: "industry-basics",
    name: "Open Source vs. Open Weights",
    slug: "open-source-vs-open-weights",
    subtitle: "The important distinction between truly open AI and 'open enough'",
    difficulty: "FUNDAMENTALS",
    sortOrder: 2,
    whatItIs: `**Open source** software traditionally means the full source code, training data, training procedures, and weights are all freely available, modifiable, and redistributable. Applied strictly, almost no AI model meets this definition, sharing training data involves enormous legal complexity around copyright and data licensing.

**Open weights** means the trained model parameters are publicly downloadable, but the training data and full training procedures may not be disclosed. Meta's Llama series, Mistral, and Qwen are open weights. You can download, run, modify, and fine-tune them, but you can't recreate the exact training run.

The distinction matters for legal, business, and reproducibility reasons. An "open weights" model is still commercially valuable (you can self-host it without API costs) but it's not fully open in the traditional sense.`,
    whyItMatters: `Clients will ask whether they should use open models or API-based closed models. The answer depends on cost at scale, data privacy requirements, customization needs, and infrastructure capability. Knowing the difference between open weights and truly open source also helps you engage critically with AI companies' marketing claims about "openness."`,
    goDeeper: null,
  },
  {
    sectionSlug: "industry-basics",
    name: "What a Wrapper Is",
    slug: "wrapper",
    subtitle: "The thin AI product problem, and why it matters for business strategy",
    difficulty: "FUNDAMENTALS",
    sortOrder: 3,
    whatItIs: `A "wrapper" is a product or service built primarily by calling another company's AI API, with minimal proprietary technology added. The core value proposition (the intelligence) is entirely rented from the underlying model provider.

Wrappers are extremely common because building on top of GPT-4 or Claude is fast and cheap. But they're strategically fragile: the model provider could ship the same feature natively, undercutting the product. They're also hard to differentiate, if your entire product is "GPT-4 with a nice UI," a competitor can replicate it in a weekend.

Successful AI products built on top of model APIs add genuine proprietary value: unique data flywheels, deep domain expertise, integrations into existing workflows, or specialized fine-tuning that creates a real moat.`,
    whyItMatters: `This concept comes up constantly in conversations about AI business strategy. When evaluating a startup or product idea, being able to identify whether it's a wrapper (and whether that's a problem) is a key analytical skill. It also informs how AISA members should think about the AI products they build: what's the real moat beyond "we used Claude"?`,
    goDeeper: null,
  },

  // ── FUNDAMENTALS / Practical Skills ───────────────────────────────────────
  {
    sectionSlug: "practical-skills",
    name: "Prompt Engineering",
    slug: "prompt-engineering",
    subtitle: "The craft of writing inputs that reliably get the outputs you want",
    difficulty: "FUNDAMENTALS",
    sortOrder: 1,
    whatItIs: `Prompt engineering is the practice of designing model inputs to elicit reliable, high-quality outputs. It encompasses system prompt design, few-shot examples, chain-of-thought instructions, output format specification, and iterative refinement based on observed failures.

Key techniques: **zero-shot prompting** (just ask), **few-shot prompting** (provide examples of input-output pairs), **chain-of-thought** (instruct the model to reason step-by-step before answering), **role prompting** (assign a persona or expertise), and **output structuring** (specify JSON, markdown, or other formats).

Prompt engineering is less of a science and more of a craft, different models respond differently to the same prompts, and prompts that work for GPT-4 may not work for Claude.`,
    whyItMatters: `This is the most immediately applicable skill for any work with AI models. Whether you're building a product, running an experiment, or helping a client, your ability to write effective prompts determines whether the AI actually does what you want. It's one of the fastest skills to improve with deliberate practice, ship something and iterate on the prompts.`,
    goDeeper: null,
  },
  {
    sectionSlug: "practical-skills",
    name: "API Basics",
    slug: "api-basics",
    subtitle: "How to actually call an LLM from code, the mechanics every builder needs",
    difficulty: "FUNDAMENTALS",
    sortOrder: 2,
    whatItIs: `LLM APIs expose model capabilities over HTTP. The standard pattern: send a POST request with your messages array (system + user turns), model selection, and parameters (temperature, max_tokens), receive a response containing the generated text and token usage.

Key parameters: **temperature** (0 = deterministic, 1+ = creative/random), **max_tokens** (caps response length), **top_p** (nucleus sampling). Streaming is available on all major APIs to return tokens as they're generated, improving perceived latency.

Cost is billed per token (input + output, often at different rates). At scale, token efficiency becomes a real engineering concern.`,
    whyItMatters: `You can't build anything with AI without understanding how to call the API. Knowing the cost model prevents budget surprises. Understanding temperature helps you tune model behavior. Streaming matters for user-facing applications where latency is visible. This is table stakes for any technical work with LLMs.`,
    goDeeper: null,
  },
  {
    sectionSlug: "practical-skills",
    name: "RAG (Retrieval-Augmented Generation)",
    slug: "rag",
    subtitle: "Grounding AI responses in your data, the go-to pattern for custom knowledge bases",
    difficulty: "FUNDAMENTALS",
    sortOrder: 3,
    whatItIs: `RAG is a pattern that combines information retrieval with LLM generation to give models access to data beyond their training. The basic flow: convert your documents into embeddings and store them in a vector database, embed the user's question at query time, retrieve the most similar document chunks by vector similarity, inject those chunks into the LLM's context, and let the model generate an answer grounded in the retrieved content.

RAG solves two key problems: the knowledge cutoff (your model doesn't know about events after training), and the inability to inject proprietary data (the model doesn't know about your company's documents or database).

More sophisticated RAG adds query rewriting, reranking, hybrid search (vector + keyword), and recursive retrieval.`,
    whyItMatters: `RAG is the most widely deployed AI architecture pattern for enterprise applications. Any AI product that needs to reason over custom documents, internal data, or recent information will likely use RAG. Understanding it end-to-end (from embedding models to vector stores to chunking strategies) is essential for building real AI products, not just demos.`,
    goDeeper: null,
  },

  // ── INTERMEDIATE / Hardware & Compute ─────────────────────────────────────
  {
    sectionSlug: "hardware-compute",
    name: "GPUs",
    slug: "gpus",
    subtitle: "The parallel processing chips that made modern AI possible",
    difficulty: "INTERMEDIATE",
    sortOrder: 1,
    whatItIs: `GPUs (Graphics Processing Units) are processors designed to perform thousands of simple mathematical operations in parallel. Originally built for rendering graphics, they were repurposed for AI training when researchers discovered their massive parallelism was ideal for transformer computation.

NVIDIA dominates the data center GPU market with their A100 and H100 chips, which cost $20,000–$80,000 each. NVIDIA's sustained dominance is partly due to CUDA, their programming framework, which has been optimized for AI workloads for over a decade and has massive developer adoption.

A modern AI training cluster uses tens of thousands of these GPUs interconnected with specialized high-bandwidth networking (NVLink, InfiniBand).`,
    whyItMatters: `GPU availability is literally the bottleneck for AI development. The reason there are only a few organizations capable of training frontier models is that you need access to thousands of H100s, costing billions of dollars. This hardware constraint shapes every aspect of the industry, investment patterns, regulatory policy (chip export controls), and competitive strategy.`,
    goDeeper: null,
  },
  {
    sectionSlug: "hardware-compute",
    name: "TPUs",
    slug: "tpus",
    subtitle: "Google's custom AI chips, and why they give Google a unique strategic advantage",
    difficulty: "INTERMEDIATE",
    sortOrder: 2,
    whatItIs: `TPUs (Tensor Processing Units) are custom ASICs designed by Google specifically for the matrix mathematics required by neural networks. Unlike GPUs, which are general-purpose parallel processors adapted for AI, TPUs are purpose-built for lower-precision tensor operations.

Google's Gemini series is trained and served entirely on TPUs, making Google the only major AI lab not dependent on NVIDIA's supply chain. Google is now licensing TPU access through Google Cloud, with Anthropic entering a significant partnership for TPU compute.`,
    whyItMatters: `Google's TPU independence is a significant strategic moat. While OpenAI and Anthropic pay NVIDIA's premium, Google controls its own compute cost structure. Understanding TPUs explains why Anthropic's Google partnership is so significant, why hardware independence matters strategically, and why chip geopolitics affects AI lab strategy.`,
    goDeeper: null,
  },
  {
    sectionSlug: "hardware-compute",
    name: "Why Accelerators Matter",
    slug: "accelerators",
    subtitle: "Why specialized hardware is essential (not optional) for AI at scale",
    difficulty: "INTERMEDIATE",
    sortOrder: 3,
    whatItIs: `Accelerators (GPUs, TPUs, and emerging custom chips) enable AI at scale through massive parallelism. Transformers can be structured so that most computation happens in large matrix multiplications, which decompose perfectly into thousands of independent operations that accelerators can run simultaneously.

A CPU might have 32 cores executing complex instructions. An H100 has 16,896 CUDA cores running simple operations simultaneously. For the specific math AI training requires, this is thousands of times faster than a CPU.

The key insight: scaling laws show models get reliably better with more compute, and the only way to reach required compute levels with current technology is massive parallelism on accelerators.`,
    whyItMatters: `Accelerators aren't just faster computers, they're a fundamentally different computational paradigm that made modern AI possible. This context helps you understand why "just train it on a normal computer" isn't feasible, why chip stocks have become so valuable, and why countries are treating semiconductor access as a national security issue.`,
    goDeeper: null,
  },
  {
    sectionSlug: "hardware-compute",
    name: "Training Costs",
    slug: "training-costs",
    subtitle: "Why building frontier models costs hundreds of millions, and what that means",
    difficulty: "INTERMEDIATE",
    sortOrder: 4,
    whatItIs: `Pre-training a frontier model costs hundreds of millions of dollars and involves running data centers consuming megawatts of power for months. The costs come from: hardware (thousands of H100 GPUs at high rental or purchase cost), energy (power and cooling), engineering time for training infrastructure, and the R&D compute spent on experiments before the final run.

For major labs, the majority of spending goes to R&D compute (experiments, ablations, failed runs), not the final model run. A training failure partway through wastes enormous resources.

This is why only well-capitalized organizations (backed by Microsoft, Google, or significant venture capital) can train at the frontier.`,
    whyItMatters: `Training cost context is essential for industry analysis. It explains why AI labs need massive investment, why the hyperscaler advantage is so significant, why open-weight models are a big deal (they let smaller organizations access frontier-class capability), and why many "AI startups" are actually wrapper businesses rather than model developers.`,
    goDeeper: null,
  },
  {
    sectionSlug: "hardware-compute",
    name: "Training vs. Inference Compute",
    slug: "training-vs-inference-compute",
    subtitle: "The very different hardware demands of building vs. running a model",
    difficulty: "INTERMEDIATE",
    sortOrder: 5,
    whatItIs: `Training requires storing not just the model weights but all intermediate activations needed for backpropagation, roughly 3-4x the memory of weights alone. Training also requires precise floating-point arithmetic, whereas inference can use quantized (lower precision) weights.

Inference is dramatically lighter: only a forward pass, no gradient storage. A quantized 70B model can run on 2-4 consumer GPUs. Inference can also be batched, serving 50 simultaneous requests takes similar compute to serving 1 on the same hardware, which is why API providers can offer low per-token costs at scale.

This creates two distinct market segments: training clusters (massive, specialized, centralized) and inference infrastructure (more distributed, easier to deploy).`,
    whyItMatters: `These differences inform every deployment decision. "Can we self-host this model?" depends on inference requirements, not training requirements. "Why is the API cheaper than renting the compute to run it myself?" relates to batching efficiency at scale. "Why is fine-tuning cheaper than pre-training?" The compute profile is completely different.`,
    goDeeper: null,
  },

  // ── INTERMEDIATE / Scaling & Data ─────────────────────────────────────────
  {
    sectionSlug: "scaling-data",
    name: "Scaling Laws",
    slug: "scaling-laws",
    subtitle: "The mathematical relationships that predict how AI models improve with scale",
    difficulty: "INTERMEDIATE",
    sortOrder: 1,
    whatItIs: `Scaling laws are empirical mathematical relationships that describe how model performance improves predictably with increases in model size, training data, and compute. The key finding from DeepMind's Chinchilla paper: given a fixed compute budget, there's an optimal allocation between model size and data quantity.

The Chinchilla optimal ratio suggests training a model on approximately 20 tokens per parameter (e.g., a 7B model should train on ~140B tokens for compute-optimal training). Earlier models like GPT-3 were significantly undertrained by this metric.

Scaling laws are why AI labs can make confident predictions about what a training run will achieve before spending the compute.`,
    whyItMatters: `Scaling laws are the intellectual foundation for the massive investment in AI compute. "We know spending more will make the model better, and we can predict by how much" is an unusually strong basis for capital allocation. They also explain why model development strategy changed significantly after the Chinchilla paper, labs shifted from training bigger models to training more data-efficient ones.`,
    goDeeper: null,
  },
  {
    sectionSlug: "scaling-data",
    name: "Synthetic Data",
    slug: "synthetic-data",
    subtitle: "Using AI to generate training data for AI, and why it's becoming essential",
    difficulty: "INTERMEDIATE",
    sortOrder: 2,
    whatItIs: `Synthetic data is training data generated by an AI model rather than collected from humans. As the volume of high-quality human-generated text on the internet approaches saturation, labs are turning to LLMs to generate additional training examples.

Applications include: generating diverse paraphrases of existing content, creating question-answer pairs from documents, generating code with known-correct solutions for RLVR training, and creating domain-specific training examples that don't exist in public data.

The key concern is model collapse, if you train on AI-generated data, then use that model to generate more data, recursive degradation can occur if not carefully managed.`,
    whyItMatters: `Synthetic data is what makes RLVR training scalable, you can generate essentially unlimited math and coding problems with verifiable answers. It's also a key tool for teams that need domain-specific fine-tuning data that doesn't exist publicly. Understanding the tradeoffs (cost, quality, collapse risk) is important for any team doing model training or fine-tuning.`,
    goDeeper: null,
  },
  {
    sectionSlug: "scaling-data",
    name: "Fine-tuning",
    slug: "fine-tuning",
    subtitle: "Adapting a pre-trained model to a specific task or style with targeted training",
    difficulty: "INTERMEDIATE",
    sortOrder: 3,
    whatItIs: `Fine-tuning is the process of continuing training on a pre-trained model with a smaller, task-specific dataset. Rather than training from scratch, you start from a model that already understands language and update its weights to specialize for your use case.

Common applications: adjusting model style and persona, adding domain-specific knowledge, improving performance on a narrow task, and safety fine-tuning. Parameter-efficient fine-tuning methods like LoRA update only a small fraction of weights, making fine-tuning feasible on consumer hardware.

The risk: catastrophic forgetting, fine-tuning on new data can overwrite previously learned capabilities if not done carefully.`,
    whyItMatters: `Fine-tuning is the practical alternative to prompting when prompt engineering hits its limits. If a client needs a model that consistently responds in a specific format, maintains a brand voice, or performs reliably on a narrow task, fine-tuning may be the right tool. Understanding when to fine-tune vs. prompt engineer vs. use RAG is a key architectural decision in AI product development.`,
    goDeeper: null,
  },

  // ── INTERMEDIATE / Evaluation & Alignment ─────────────────────────────────
  {
    sectionSlug: "evaluation-alignment",
    name: "Benchmarking LLMs",
    slug: "benchmarking-llms",
    subtitle: "How we measure AI capability, and why benchmarks are tricky",
    difficulty: "INTERMEDIATE",
    sortOrder: 1,
    whatItIs: `Benchmarks are standardized test suites used to evaluate and compare LLM capabilities. Common benchmarks include MMLU (multiple-choice knowledge across 57 subjects), HumanEval (code generation), MATH (mathematical reasoning), and LMSYS Chatbot Arena (human preference-based Elo ratings).

Different benchmarks measure different things, and a model can score highly on one while underperforming on another. There's also significant concern about **benchmark contamination**, models trained on data that includes benchmark questions score artificially high.

The field is increasingly moving toward human evaluation as a more reliable signal, since human raters are harder to game than fixed question sets.`,
    whyItMatters: `Benchmark scores are the primary currency of AI capability claims, and they're frequently misleading. Being able to ask "which benchmarks, evaluated how, with what contamination controls?" is critical for evaluating model vendor claims. It also helps you understand why "Model X beat Model Y on benchmark Z" doesn't always mean Model X is better for your use case.`,
    goDeeper: null,
  },
  {
    sectionSlug: "evaluation-alignment",
    name: "AI Alignment",
    slug: "ai-alignment",
    subtitle: "Ensuring AI systems do what we actually want, now and as capabilities grow",
    difficulty: "INTERMEDIATE",
    sortOrder: 2,
    whatItIs: `Alignment refers to the challenge of ensuring AI systems behave in accordance with human values and intentions. For current models, this primarily means preventing harmful outputs while maintaining usefulness, a tension that RLHF tries to navigate.

For future, more capable models, alignment concerns expand: Will a highly capable AI system pursue goals that seem aligned but have unintended consequences? Will it remain corrigible (willing to be corrected) as it becomes more capable? The classic thought experiment: an AI tasked to maximize paperclip production, if sufficiently capable and misaligned, would pursue this goal even at the cost of human wellbeing.

Anthropic's entire founding rationale centers on alignment research, the belief that solving alignment is existentially important as AI capabilities advance.`,
    whyItMatters: `Alignment shapes every major AI lab's strategy, safety policies, and product decisions. Understanding the distinction between current alignment work (RLHF, content policies) and longer-term alignment concerns (goal misspecification, deceptive alignment) helps you engage credibly with AI safety discussions and understand why companies like Anthropic make the decisions they do.`,
    goDeeper: null,
  },
  {
    sectionSlug: "evaluation-alignment",
    name: "AGI (Definitions and) Strategy",
    slug: "agi",
    subtitle: "What AGI actually means, why it matters, and how it shapes the AI industry",
    difficulty: "INTERMEDIATE",
    sortOrder: 3,
    whatItIs: `Artificial General Intelligence (AGI) has no consensus definition, but is commonly described as AI capable of performing any cognitive task that a human can. OpenAI's formal definition is "a highly autonomous system that outperforms humans at most economically valuable work."

No current system meets any reasonable AGI definition. Current LLMs are highly capable in specific domains but fail on tasks requiring robust physical reasoning, reliable common sense, or self-directed long-term planning.

Despite this, the belief that AGI is achievable in the near future drives massive investment, the first organization to achieve AGI at a controllable level would have an extraordinary competitive and geopolitical advantage.`,
    whyItMatters: `AGI as a goal shapes everything in the AI industry (investment patterns, talent competition, regulatory debates, and geopolitical strategy. Being able to discuss AGI with appropriate nuance) acknowledging genuine uncertainty about timelines and definitions while understanding why labs take it seriously, is essential for credible industry analysis.`,
    goDeeper: null,
  },

  // ── INTERMEDIATE / Geopolitics & Regulation ────────────────────────────────
  {
    sectionSlug: "geopolitics-regulation",
    name: "US-China AI Race",
    slug: "us-china-ai-race",
    subtitle: "The geopolitical competition that's accelerating AI investment and shaping policy",
    difficulty: "INTERMEDIATE",
    sortOrder: 1,
    whatItIs: `The US and China are engaged in a strategic competition over AI dominance, driven by the belief that AI leadership will translate to economic and military advantage. Both nations have made AI a national strategic priority.

US strategy has focused on export controls (restricting the sale of advanced NVIDIA chips to China) to limit China's ability to train frontier models. China has responded by investing in domestic chip development (Huawei's Ascend series) and model efficiency research (DeepSeek's notable efficiency achievements).

This competition creates a "race to the top" dynamic where both nations prioritize speed over caution, with significant implications for AI regulation globally.`,
    whyItMatters: `The US-China AI race is the underlying context for most AI policy discussions. Export controls, TSMC's role in Taiwan, chip supply chains, and US investment in domestic semiconductor manufacturing (CHIPS Act) all connect to this competition. Understanding this context helps you interpret AI policy news, regulatory proposals, and investment decisions.`,
    goDeeper: null,
  },
  {
    sectionSlug: "geopolitics-regulation",
    name: "Export Controls and Hardware Policy",
    slug: "export-controls",
    subtitle: "How chip export restrictions shape global AI development",
    difficulty: "INTERMEDIATE",
    sortOrder: 2,
    whatItIs: `The US government restricts export of advanced AI chips (NVIDIA H100, A100) and semiconductor manufacturing equipment to China and other nations. These controls aim to prevent adversaries from accessing the compute required to train frontier AI models.

The chokepoints: NVIDIA designs chips, TSMC (Taiwan) manufactures them using ASML (Netherlands) lithography equipment. US export controls cover multiple layers of this supply chain.

China's DeepSeek demonstrated in early 2025 that highly capable models could be trained with fewer chips through algorithmic efficiency improvements, raising questions about the long-term effectiveness of compute-focused controls.`,
    whyItMatters: `Chip export controls are a primary tool of AI geopolitical strategy and a significant business risk for semiconductor companies. Understanding the supply chain and where controls apply helps you analyze policy proposals, understand NVIDIA's strategic position, and contextualize Chinese AI lab achievements within their hardware constraints.`,
    goDeeper: null,
  },
  {
    sectionSlug: "geopolitics-regulation",
    name: "AI Regulation and Investment",
    slug: "ai-regulation",
    subtitle: "How government policy shapes where and how fast AI develops",
    difficulty: "INTERMEDIATE",
    sortOrder: 3,
    whatItIs: `AI regulation varies dramatically by jurisdiction. The EU AI Act (2024) establishes risk-based regulation, with the highest requirements for "high-risk" systems in domains like healthcare and law enforcement. The US has taken a lighter-touch approach, relying primarily on voluntary commitments and executive orders.

The regulatory environment creates incentives and disincentives: heavy regulation can slow domestic development and push AI companies to less-regulated jurisdictions. The US-China race dynamic creates political pressure against regulation that might handicap US companies.`,
    whyItMatters: `Regulation determines where AI companies can operate, what they can build, and how fast they can move. For AI products in regulated industries (finance, healthcare, law), understanding the regulatory landscape becomes necessary for product design. For AISA members working on AI policy or consulting with enterprises, this is immediately applicable knowledge.`,
    goDeeper: null,
  },

  // ── INTERMEDIATE / Ethics & Responsibility ─────────────────────────────────
  {
    sectionSlug: "ethics-responsibility",
    name: "Bias in Training Data",
    slug: "bias-training-data",
    subtitle: "How historical inequities get baked into AI models, and what we can do about it",
    difficulty: "INTERMEDIATE",
    sortOrder: 1,
    whatItIs: `LLMs learn from internet-scale data that reflects historical human biases, racial, gender, cultural, and socioeconomic. Models trained on this data inherit these biases: generating more positive associations for certain demographic groups, underrepresenting minority perspectives, and performing worse on tasks involving underrepresented languages or cultures.

Post-training (RLHF) can partially correct for biases, but rater pools for preference data are themselves non-representative, often skewed toward English-speaking, Western, educated populations.

Mitigations include diverse training data curation, bias auditing benchmarks, adversarial testing, and intentional RLHF focus on bias reduction, none of which fully solve the problem.`,
    whyItMatters: `Any AI product that interacts with real users will encounter bias issues. Ignoring them creates legal, reputational, and ethical risks. Understanding where bias comes from (training data, RLHF rater demographics, prompt design) helps you build systems that minimize harm and set appropriate expectations with clients about limitations.`,
    goDeeper: null,
  },
  {
    sectionSlug: "ethics-responsibility",
    name: "Copyright and IP Concerns",
    slug: "copyright-ip",
    subtitle: "The unresolved legal questions about training data and AI-generated content",
    difficulty: "INTERMEDIATE",
    sortOrder: 2,
    whatItIs: `LLMs are trained on vast amounts of copyrighted content without explicit licensing from creators, books, articles, code, art. The legal question of whether this constitutes fair use or copyright infringement is actively litigated (e.g., The New York Times v. OpenAI, Getty Images v. Stability AI).

On the output side: the US Copyright Office has stated that purely AI-generated works lack the human authorship required for copyright protection, though works with significant human creative input may qualify.

Models can also reproduce training data verbatim (memorization), generated code might reproduce GPL-licensed code, and the legal status of AI-assisted creative work is unsettled.`,
    whyItMatters: `For AI products in commercial contexts, copyright concerns affect what training data can be used, what outputs can be commercially exploited, and what disclosures clients need. Enterprises increasingly want indemnification from AI vendors for IP issues. Understanding the legal landscape helps you advise clients on risk and make informed decisions.`,
    goDeeper: null,
  },
  {
    sectionSlug: "ethics-responsibility",
    name: "Privacy Implications",
    slug: "privacy-implications",
    subtitle: "Data privacy risks in AI systems, from training to deployment",
    difficulty: "INTERMEDIATE",
    sortOrder: 3,
    whatItIs: `AI models present several privacy risk categories: **Training data memorization** (models can reproduce personal information present in training data when prompted correctly. **Inference privacy**) user queries sent to AI APIs are processed by third-party servers, raising data residency and confidentiality concerns. **Model inversion**, in some cases, training data can be partially reconstructed from model weights.

For enterprise deployments, GDPR and CCPA impose requirements on how AI systems handle personal data. Many enterprise AI contracts now include data processing agreements, model training opt-outs, and audit rights.`,
    whyItMatters: `Privacy concerns are a major reason enterprises hesitate to adopt AI products. "Can we use our customer data with this API?" is a question you'll constantly field. Understanding the actual risks (memorization, inference exposure, regulatory requirements) helps you design systems that address legitimate concerns without over-restricting AI use.`,
    goDeeper: null,
  },

  // ── INTERMEDIATE / Practical Decision-Making ───────────────────────────────
  {
    sectionSlug: "practical-decision-making",
    name: "Evaluating LLM Solutions",
    slug: "evaluating-llm-solutions",
    subtitle: "How to assess whether an AI solution actually solves the client's problem",
    difficulty: "INTERMEDIATE",
    sortOrder: 1,
    whatItIs: `Evaluating an LLM-based solution requires thinking across several dimensions: **Task fit** (does the task actually benefit from an LLM, or is a simpler rule-based system more appropriate? **Reliability requirements**) can you tolerate occasional wrong answers? **Cost model** (what's the per-query cost at your expected volume? **Latency requirements**) can users wait 30 seconds for a reasoning model?

A structured evaluation process: define success metrics before testing, build an eval set of representative inputs, test multiple models on the eval set, and measure against your metrics rather than vibes.

Common failure modes: choosing a model based on benchmark rankings rather than your specific task, neglecting edge cases, and not testing at realistic input distributions.`,
    whyItMatters: `The difference between a demo that impresses and a product that works is rigorous evaluation. Being able to structure an eval process and make model selection decisions based on evidence rather than marketing is what distinguishes senior AI practitioners. Clients will rely on you to tell them whether a proposed AI solution will actually work for their use case.`,
    goDeeper: null,
  },
  {
    sectionSlug: "practical-decision-making",
    name: "Cost and Deployment Tradeoffs",
    slug: "cost-deployment-tradeoffs",
    subtitle: "API vs. self-hosted, which model tier, and how to control AI costs",
    difficulty: "INTERMEDIATE",
    sortOrder: 2,
    whatItIs: `Key deployment decision axes:

**API vs. self-hosted:** APIs have zero infrastructure overhead but variable cost that scales with usage, potential data privacy issues, and vendor dependence. Self-hosted open-weight models have fixed infrastructure cost, full data privacy, and customization flexibility, but require ML engineering expertise.

**Model tier selection:** Larger models are more capable but more expensive and slower. Routing easy queries to cheaper small models and hard queries to capable large models (model routing) is a common optimization.

**Cost controls:** Prompt caching (reusing common system prompt tokens), batch processing, output length caps, and smart routing are the primary levers.`,
    whyItMatters: `AI costs can spiral quickly at production scale. A model costing $0.01 per query at 100 queries/day costs $30K/month at 100K queries/day. Learning to think about AI economics before committing to an architecture prevents expensive rebuilds. These tradeoffs come up in every serious AI product conversation.`,
    goDeeper: null,
  },
  {
    sectionSlug: "practical-decision-making",
    name: "Model Selection Frameworks",
    slug: "model-selection",
    subtitle: "When to fine-tune vs. prompt, self-host vs. API, and which model family to use",
    difficulty: "INTERMEDIATE",
    sortOrder: 3,
    whatItIs: `A practical framework for model selection:

**Prompting first:** For most tasks, start with prompt engineering against a strong API model. It's fastest to iterate and often sufficient.

**RAG if knowledge is the gap:** If the model lacks specific knowledge (company data, recent events, proprietary information), add RAG before considering fine-tuning.

**Fine-tune if behavior is the gap:** If the model reliably understands the task but consistently produces the wrong format or style, fine-tuning is appropriate.

**Self-host if privacy or cost at scale is the constraint:** Open-weight models for data-sensitive applications or very high-volume deployments.

**Model family selection:** Claude excels at instruction following and agentic tasks; GPT-4 is strong across the board with a large ecosystem; Gemini has the longest context and Google integration.`,
    whyItMatters: `This decision tree is something you'll apply on every project. Getting it right (not over-engineering or under-engineering) is what makes AI projects succeed. Being able to walk a client through this framework demonstrates genuine expertise beyond "we'll just use ChatGPT."`,
    goDeeper: null,
  },

  // ── ADVANCED / Modern Non-LLM AI ──────────────────────────────────────────
  {
    sectionSlug: "modern-non-llm-ai",
    name: "Image and Video Generation",
    slug: "image-video-generation",
    subtitle: "How diffusion models and generative AI create visual content",
    difficulty: "ADVANCED",
    sortOrder: 1,
    whatItIs: `Modern image generation primarily uses **diffusion models**, systems trained to gradually denoise random noise into coherent images conditioned on a text prompt. During training, images are progressively corrupted with noise; the model learns to reverse this process. At inference, the model starts from random noise and iteratively denoises it guided by the text prompt.

Models like DALL-E 3 and Stable Diffusion combine a text encoder (often CLIP or LLM-based) with a UNet or transformer diffusion model. Video generation extends this to temporal consistency, requiring coherent motion across frames, a significantly harder problem.

The integration trend is toward multimodal LLMs that natively generate and understand images rather than requiring separate model pipelines.`,
    whyItMatters: `Image and video generation are among the most commercially visible AI capabilities and a source of significant disruption in creative industries. Understanding the technical approach (diffusion vs. GAN vs. transformer) helps you evaluate capabilities, limitations, and appropriate use cases. It's also relevant context for conversations about AI and creative labor.`,
    goDeeper: null,
  },
  {
    sectionSlug: "modern-non-llm-ai",
    name: "World Models",
    slug: "world-models",
    subtitle: "AI systems that learn how the physical world works, the foundation for robotics and simulation",
    difficulty: "ADVANCED",
    sortOrder: 2,
    whatItIs: `A world model is a system that learns to predict the consequences of actions in an environment, essentially a simulatable representation of how the world works. Humans have rich world models: drop a phone, it falls; push a glass to the edge of a table, it will fall.

AI world models like Google's Genie 2 and Meta's V-JEPA learn these dynamics from video data, building internal representations that can predict future states given an action. This enables: planning by simulating possible futures, generating training data for robotics by running simulated rollouts, and video generation that respects physical plausibility.

World models are considered a key missing piece for achieving robust robotic manipulation and autonomous driving.`,
    whyItMatters: `World models represent a distinct paradigm from language modeling, moving from predicting tokens to predicting states of the world. They're why the robotics and autonomous driving industries are watching AI developments closely, and why synthetic data generation for physical tasks is becoming feasible.`,
    goDeeper: null,
  },
  {
    sectionSlug: "modern-non-llm-ai",
    name: "Autonomous Driving",
    slug: "autonomous-driving",
    subtitle: "The hard problem of getting AI to navigate the physical world reliably",
    difficulty: "ADVANCED",
    sortOrder: 3,
    whatItIs: `Autonomous vehicles use stacks that typically include: perception (cameras, LiDAR, radar → detected objects), prediction (where will other agents move?), planning (what should the car do?), and control (how to execute the plan). Modern approaches increasingly use end-to-end learned systems rather than hand-engineered modules.

Waymo's robotaxis in San Francisco and Phoenix demonstrate that technical solutions exist for well-defined geographic areas. The remaining technical challenges include rare edge cases, adverse weather, and robust 3D perception.

The primary blockers are regulatory (different rules city by city, high incident scrutiny) and liability (who is responsible when an autonomous vehicle causes harm?), not purely technical.`,
    whyItMatters: `Autonomous driving illustrates the gap between "technically works in controlled conditions" and "deployable at scale": a lesson that applies broadly to AI products. The regulatory and liability frameworks developed here will likely inform AI regulation in other high-stakes domains.`,
    goDeeper: null,
  },
  {
    sectionSlug: "modern-non-llm-ai",
    name: "AlphaFold and Biomedical AI",
    slug: "alphafold-biomedical-ai",
    subtitle: "How AI is transforming biology and drug discovery",
    difficulty: "ADVANCED",
    sortOrder: 4,
    whatItIs: `AlphaFold2, developed by Google DeepMind, solved the protein structure prediction problem (predicting a protein's 3D shape from its amino acid sequence) earning its creators the 2024 Nobel Prize in Chemistry. The system uses transformer attention applied to multiple sequence alignments and evolutionary co-variation patterns.

The impact was immediate: the entire known protein universe was predicted and published openly, accelerating research across biology and drug discovery. AlphaFold3 extended this to predicting interactions between proteins, DNA, RNA, and small molecules.

Beyond protein folding, biomedical AI includes: drug-target interaction prediction, medical image analysis (pathology, radiology), clinical trial patient matching, and genomic sequence analysis.`,
    whyItMatters: `AlphaFold is the clearest example of AI solving a previously intractable scientific problem, and represents the potential for domain-specific AI to transform fields beyond software. It also illustrates a key pattern: transformer architectures generalize across domains when the problem can be framed appropriately.`,
    goDeeper: null,
  },
  {
    sectionSlug: "modern-non-llm-ai",
    name: "Robotics and Embodied AI",
    slug: "robotics-embodied-ai",
    subtitle: "The unique challenges of teaching AI to act in the physical world",
    difficulty: "ADVANCED",
    sortOrder: 5,
    whatItIs: `Robotics is uniquely hard for AI because: data is scarce (no internet of robot demonstrations), the real world is continuous and high-dimensional (vs. discrete tokens), simulation-to-reality transfer is imperfect, and physical actions have irreversible consequences.

LLM integration has improved generalization dramatically. Models like RT-2 and Google's PaLM-E use pre-trained vision-language models as the "brain" of the robot, enabling generalization to novel objects and instructions without task-specific training.

Humanoid robots (Figure, 1X, Unitree) are receiving significant investment because human-form robots can operate in human-designed environments and use human-collected demonstration data more directly.`,
    whyItMatters: `Robotics represents one of the highest-impact potential applications of AI, physically capable, general-purpose robots would transform labor markets, manufacturing, and elder care. The technical challenges and the integration with LLMs are directly relevant to understanding the current AI landscape and where investment is flowing.`,
    goDeeper: null,
  },

  // ── ADVANCED / Advanced Training Mechanics ─────────────────────────────────
  {
    sectionSlug: "advanced-training-mechanics",
    name: "Emergent Abilities",
    slug: "emergent-abilities",
    subtitle: "Capabilities that appear suddenly at scale, and why they surprise researchers",
    difficulty: "ADVANCED",
    sortOrder: 1,
    whatItIs: `Emergent abilities are capabilities that appear abruptly in models above certain scale thresholds rather than improving gradually. In-context learning, chain-of-thought reasoning, and arithmetic ability have all shown roughly step-function improvements at critical parameter counts or training compute levels.

The mechanism is debated: some researchers argue emergence is a measurement artifact (metrics that show sudden jumps actually reflect smooth underlying improvements), while others argue genuinely qualitative transitions occur.

Emergence is one reason AI progress is hard to predict, capabilities that seem absent can appear rapidly as training scale increases, without anyone having explicitly trained for them.`,
    whyItMatters: `Emergence is why AI capabilities have repeatedly surprised even experts. It's central to arguments about AI risk (capabilities might emerge unexpectedly at scale), arguments for continued scaling investment, and honest discussions about what current models can and cannot do.`,
    goDeeper: null,
  },
  {
    sectionSlug: "advanced-training-mechanics",
    name: "In-Context Learning",
    slug: "in-context-learning",
    subtitle: "How models learn from examples in their prompt without weight updates",
    difficulty: "ADVANCED",
    sortOrder: 2,
    whatItIs: `In-context learning (ICL) is the ability of an LLM to adapt its behavior based on examples provided in the prompt, without any gradient updates to its weights. Provide 5 examples of a new classification task, and the model generalizes to new instances, even for tasks it's never seen during training.

This is fundamentally different from traditional machine learning, where adaptation requires re-training. ICL appears to be an emergent capability of sufficiently large models, smaller models don't show robust in-context learning.

The mechanism is still actively studied. Leading theories suggest models perform a form of implicit gradient descent in the forward pass, or learn general pattern-matching algorithms during training that apply at inference time.`,
    whyItMatters: `ICL is why few-shot prompting works and why you can teach a model new tasks through careful prompt construction. Understanding ICL helps you use few-shot prompting more effectively and understand why structured prompt design sometimes produces dramatically better results than natural language instructions alone.`,
    goDeeper: null,
  },
  {
    sectionSlug: "advanced-training-mechanics",
    name: "Continual Learning",
    slug: "continual-learning",
    subtitle: "The unsolved problem of teaching models without forgetting what they know",
    difficulty: "ADVANCED",
    sortOrder: 3,
    whatItIs: `Continual learning is the challenge of training a model on new data without it forgetting previously learned knowledge. Neural networks exhibit **catastrophic forgetting**: when trained on a new task or dataset, weight updates to accommodate new information overwrite weights that encoded previous knowledge.

For LLMs, this means you cannot simply keep training a deployed model on new information as the world changes. You must either retrain from scratch (expensive), fine-tune carefully with regularization techniques that limit forgetting, or use retrieval (RAG) to provide current information at inference time.

Active research approaches include: elastic weight consolidation, memory replay (include old data in new training), and modular architectures that add new capacity rather than overwriting old.`,
    whyItMatters: `Continual learning explains why LLMs have knowledge cutoff dates, why "the model doesn't know about X that happened last month" is a fundamental limitation rather than an oversight, and why keeping models current is an engineering challenge. It also motivates RAG as the primary practical solution for current-information needs.`,
    goDeeper: null,
  },
  {
    sectionSlug: "advanced-training-mechanics",
    name: "Fine-tuning Specifics",
    slug: "fine-tuning-specifics",
    subtitle: "The technical details of how fine-tuning actually works",
    difficulty: "ADVANCED",
    sortOrder: 4,
    whatItIs: `Fine-tuning updates all or a subset of a pre-trained model's weights on a new dataset. Full fine-tuning updates everything, computationally expensive and risks forgetting. **LoRA (Low-Rank Adaptation)** is the dominant efficient fine-tuning technique: it freezes the base model weights and adds small trainable rank-decomposed matrices to attention layers, reducing trainable parameters by 90%+ while preserving most performance.

QLoRA extends this by quantizing the frozen base model to 4-bit precision, enabling fine-tuning of 65B models on a single consumer GPU.

Training data quality and format matter as much as architecture choice, garbage in, garbage out applies doubly to fine-tuning.`,
    whyItMatters: `LoRA and QLoRA make fine-tuning accessible beyond organizations with massive compute budgets. Understanding the tradeoffs between full fine-tuning, LoRA, and QLoRA, and the practical requirements (data size, GPU memory, training time), helps you plan feasibly and evaluate fine-tuning services offered by model providers.`,
    goDeeper: null,
  },

  // ── ADVANCED / Research & Meta-Skills ─────────────────────────────────────
  {
    sectionSlug: "research-meta-skills",
    name: "Reading Research Papers",
    slug: "reading-research-papers",
    subtitle: "How to extract value from AI papers without getting lost in the math",
    difficulty: "ADVANCED",
    sortOrder: 1,
    whatItIs: `AI research papers follow a consistent structure: Abstract, Introduction, Related Work, Methods, Experiments, Results, Conclusion. For most practical purposes, you can read Abstract → Introduction → Figures and Tables → Conclusion and get 80% of the value.

Key strategies: read the abstract to decide if it's worth your time, look at figures first (most results are in graphs), identify the central claim and check if the experiments actually support it, look for ablation studies (which show which components contribute to the result), and check the related work to understand what prior work the paper builds on.

Preprint repositories (arXiv) mean papers are available before peer review, always note whether a paper has been peer-reviewed and treat unreplicated results with appropriate skepticism.`,
    whyItMatters: `The cutting edge of AI moves faster than any course or textbook can track. Papers are how new techniques propagate. Being able to skim a new paper and extract whether it's relevant and credible (even without deep mathematical background) is how you stay current. It also helps you critically evaluate media coverage of AI research, which is often sensationalized.`,
    goDeeper: null,
  },
  {
    sectionSlug: "research-meta-skills",
    name: "Filtering AI Hype",
    slug: "filtering-ai-hype",
    subtitle: "Critical frameworks for separating genuine capability from marketing and media distortion",
    difficulty: "ADVANCED",
    sortOrder: 2,
    whatItIs: `AI hype follows predictable patterns: cherry-picked demos that don't reflect typical performance, benchmark scores without methodology context, "could" and "might" hedged claims reported as fact, and impressive-sounding capabilities without real-world validation.

Key filters: **What's the eval methodology?** (Controlled vs. cherry-picked?), **Does this replicate?** (Can others reproduce the claimed results?), **What does failure look like?** (Every demo shows success, what breaks it?), **Who's the source?** (Company PR vs. independent researchers vs. peer-reviewed), **What's the baseline?** (How much better than the previous approach?).`,
    whyItMatters: `As AI practitioners, you'll be asked to evaluate new AI tools and research constantly. The ability to parse a news headline about a "revolutionary AI breakthrough" and assess whether it actually changes anything is a differentiating skill. It also protects you from building on top of overhyped, unreliable capabilities.`,
    goDeeper: null,
  },
  {
    sectionSlug: "research-meta-skills",
    name: "Interpretability",
    slug: "interpretability",
    subtitle: "The research frontier of understanding what's happening inside AI models",
    difficulty: "ADVANCED",
    sortOrder: 3,
    whatItIs: `Interpretability (also called mechanistic interpretability or explainability) is the research field focused on understanding what computations neural networks actually perform internally. Current LLMs are largely black boxes, we know inputs and outputs but have limited insight into the internal representations and algorithms that produce outputs.

Anthropic's interpretability research has identified "features" in model activations that correspond to human-interpretable concepts, individual neurons or circuits that activate for specific concepts. Circuit analysis traces how specific behaviors are implemented through attention heads and MLP layers.

Interpretability matters for: debugging model failures, providing audit trails for high-stakes decisions, detecting deceptive alignment in future powerful models, and understanding emergent capabilities.`,
    whyItMatters: `Interpretability is one of the core research bets at Anthropic and increasingly at other labs. As AI systems are deployed in consequential domains (healthcare, law, finance), "the model said so" is insufficient justification, auditors and regulators will require explanations. Understanding the current state and limitations of interpretability research helps you engage with the AI safety community credibly.`,
    goDeeper: null,
  },
];

export const CONCEPT_RELATIONS: [string, string][] = [
  ["transformers", "attention-mechanisms"],
  ["transformers", "tokens"],
  ["transformers", "embeddings"],
  ["attention-mechanisms", "context-windows"],
  ["tokens", "api-basics"],
  ["embeddings", "rag"],
  ["pre-training", "base-models"],
  ["pre-training", "scaling-laws"],
  ["pre-training", "training-costs"],
  ["rlhf", "base-models"],
  ["rlhf", "ai-alignment"],
  ["rlhf", "instruction-tuned-models"],
  ["rlvr", "reasoning-models"],
  ["rlvr", "synthetic-data"],
  ["base-models", "fine-tuning"],
  ["instruction-tuned-models", "system-prompts"],
  ["reasoning-models", "benchmarking-llms"],
  ["system-prompts", "jailbreaking"],
  ["system-prompts", "prompt-engineering"],
  ["context-windows", "rag"],
  ["context-windows", "continual-learning"],
  ["hallucinations", "rag"],
  ["hallucinations", "benchmarking-llms"],
  ["tool-use", "agentic-capabilities"],
  ["agentic-capabilities", "reasoning-models"],
  ["gpus", "tpus"],
  ["gpus", "training-costs"],
  ["gpus", "accelerators"],
  ["scaling-laws", "training-costs"],
  ["fine-tuning", "fine-tuning-specifics"],
  ["fine-tuning", "synthetic-data"],
  ["ai-alignment", "agi"],
  ["ai-alignment", "interpretability"],
  ["benchmarking-llms", "filtering-ai-hype"],
  ["rag", "embeddings"],
  ["prompt-engineering", "api-basics"],
  ["model-selection", "cost-deployment-tradeoffs"],
  ["model-selection", "fine-tuning"],
  ["emergent-abilities", "scaling-laws"],
  ["in-context-learning", "prompt-engineering"],
];
