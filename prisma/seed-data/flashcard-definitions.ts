/**
 * Flashcard-style definitions for all 57 concepts.
 *
 * Style: 1-2 sentences, plain definition, written to sit on a flashcard.
 * Audience: recruits at all technical levels. Avoid heavy jargon where a
 * plainer phrasing works.
 *
 * Constraints:
 *   - No em dashes (—). Use commas, parentheses, or "like" instead.
 *   - Keep it tight. Every sentence should pay rent.
 *
 * Keyed by concept slug for lookup during seeding.
 */

export const FLASHCARD_DEFINITIONS: Record<string, string> = {
  // ── FUNDAMENTALS / Core Architecture ──────────────────────────────────
  transformers:
    "The neural network architecture behind every modern AI model. It uses attention to let every word in a sentence influence every other word, all processed in parallel instead of one word at a time.",

  "attention-mechanisms":
    "The algorithm that lets a model decide which parts of the input matter most for understanding each word. It compares every token to every other token, which is why it's powerful and why long inputs get expensive.",

  tokens:
    "The small chunks of text that a model actually reads and generates, usually a whole word or a piece of a word. Token count determines API cost, latency, and how much text fits in the context window.",

  embeddings:
    "Dense lists of numbers that represent the meaning of words or text inside a model. Similar meanings sit close together in this number space, which is what enables semantic search and RAG.",

  // ── FUNDAMENTALS / Training Process ───────────────────────────────────
  "pre-training":
    "The first and most expensive stage of building a model, where it reads trillions of words from the internet and learns to predict the next word. The result is a raw base model that knows a lot but can't yet follow instructions.",

  rlhf: "The post-training stage that turns a raw base model into a usable assistant. Humans rank model responses, a reward model learns those preferences, and the model is fine-tuned to produce answers humans prefer.",

  rlvr: "A training technique that teaches models to reason step by step by rewarding them for correct answers on problems with verifiable solutions, like math or code. It's how modern reasoning models like o3 and Claude's extended thinking mode were built.",

  // ── FUNDAMENTALS / Model Types ────────────────────────────────────────
  "base-models":
    "A model fresh out of pre-training, with no instruction-tuning or safety training applied. It knows a lot but behaves like advanced autocomplete, often continuing a prompt instead of following it.",

  "instruction-tuned-models":
    "A base model that has been fine-tuned (usually through RLHF) to reliably follow user instructions and behave like an assistant. These are the models behind ChatGPT, Claude, and Gemini as most people experience them.",

  "reasoning-models":
    "Instruction-tuned models further trained to think before answering by working through a problem step by step. They cost more and run slower, but dramatically outperform standard models on math, coding, and complex logic.",

  // ── FUNDAMENTALS / Key Concepts ───────────────────────────────────────
  "system-prompts":
    "Special instructions given to a model before any user message that set its persona, rules, and constraints for the whole conversation. Nearly every AI product uses one to shape how the model behaves.",

  "context-windows":
    "The maximum amount of text a model can see at once, measured in tokens. It includes the system prompt, conversation history, retrieved documents, and the current message, and extending it is hard because attention scales quadratically with length.",

  parameters:
    "The numerical weights inside a neural network that get learned during training and encode what the model knows. Model size usually refers to parameter count, which correlates roughly with capability, cost, and hardware requirements.",

  "training-vs-inference":
    "Training is the expensive, rare process of updating a model's weights by computing gradients over data. Inference is the much cheaper process of actually using the trained model to generate outputs.",

  hallucinations:
    "When a model confidently states something that isn't true, like a fake citation, a wrong date, or an invented fact. It happens because models are trained to produce plausible-sounding text, not to verify truth.",

  jailbreaking:
    "Crafting prompts that get a model to bypass its safety training or ignore its system prompt, producing outputs it was trained to refuse. Safety training is a statistical tendency rather than a hard rule, so creative framing can often get around it.",

  // ── FUNDAMENTALS / Capabilities ───────────────────────────────────────
  "tool-use":
    "The ability of a model to call external code or APIs during a conversation, like web search, code execution, or database queries. The model decides when and what to call, and your code actually runs the tool and feeds the result back.",

  "agentic-capabilities":
    "When a model runs in a loop, using tools to gather information, take actions, check results, and keep going until a task is complete. This is how coding assistants, research agents, and most non-trivial AI products work.",

  multimodality:
    "A model's ability to process more than just text, including images, audio, and video within the same architecture. GPT-4o, Claude, and Gemini are all multimodal, which lets them analyze photos, documents, charts, and audio directly.",

  // ── FUNDAMENTALS / Industry Basics ────────────────────────────────────
  "major-ai-players":
    "The three labs at the frontier in 2026 are OpenAI (ChatGPT, Microsoft-backed), Google DeepMind (Gemini, trained on their own TPUs), and Anthropic (Claude, safety-focused). Meta, Mistral, xAI, and Chinese labs like DeepSeek are significant secondary players.",

  "open-source-vs-open-weights":
    "Open source traditionally means the code, training data, and procedures are all public, which almost no AI model qualifies for. Open weights (like Llama or Mistral) means just the trained model file is downloadable, which is still valuable but not fully open.",

  wrapper:
    "A product built mostly by calling someone else's AI API, with little proprietary technology of its own. Wrappers are easy to build but strategically fragile, since the model provider could ship the same feature natively at any time.",

  // ── FUNDAMENTALS / Practical Skills ───────────────────────────────────
  "prompt-engineering":
    "The craft of writing model inputs that reliably produce the outputs you want. It covers techniques like role assignment, few-shot examples, chain-of-thought instructions, and specifying the output format.",

  "api-basics":
    "The mechanics of calling a model from code, by sending HTTP requests with messages, model choice, and parameters like temperature and max_tokens. You're billed per token, and understanding this is required for building anything on top of a model.",

  rag: "Retrieval-Augmented Generation, a pattern where you pull relevant documents from a vector database and inject them into the model's context so it can answer grounded in your data. It's the default architecture for enterprise AI working with custom knowledge.",

  // ── INTERMEDIATE / Hardware & Compute ─────────────────────────────────
  gpus: "Chips originally built for graphics that turned out to be ideal for AI because they run thousands of simple operations in parallel. NVIDIA dominates the data center GPU market with H100s and A100s costing tens of thousands of dollars each.",

  tpus: "Google's custom AI chips, purpose-built for the matrix math that neural networks rely on. They're the reason Google trains Gemini without depending on NVIDIA, and Anthropic now partners with Google for TPU access as well.",

  accelerators:
    "The umbrella term for specialized AI hardware like GPUs, TPUs, and custom chips. They make modern AI possible by running thousands of simple math operations in parallel instead of a few complex ones sequentially.",

  "training-costs":
    "Pre-training a frontier model costs hundreds of millions of dollars between hardware, electricity, engineering, and the research compute burned on experiments and failed runs. That's why only a handful of well-capitalized organizations can train at the frontier.",

  "training-vs-inference-compute":
    "Training needs massive memory to store gradients and intermediate states during learning, while inference only needs a forward pass and can be batched across many users. That's why inference infrastructure is cheaper, more distributed, and scales differently from training clusters.",

  // ── INTERMEDIATE / Scaling & Data ─────────────────────────────────────
  "scaling-laws":
    "Empirical math rules that predict how model performance improves as you scale up parameters, data, and compute. The Chinchilla finding says compute-optimal training uses roughly 20 tokens of data per parameter, which reshaped how labs plan their training runs.",

  "synthetic-data":
    "Training data generated by an AI model rather than collected from humans. It's essential for scaling past the limits of high-quality human writing and for creating verifiable problems for RLVR, but risks model collapse if fed back too aggressively.",

  "fine-tuning":
    "Continuing training on a pre-trained model with a smaller, task-specific dataset to specialize it for a particular style, domain, or task. It's the go-to option when prompt engineering hits its limits but you don't need a model from scratch.",

  // ── INTERMEDIATE / Evaluation & Alignment ─────────────────────────────
  "benchmarking-llms":
    "Standardized test suites like MMLU, HumanEval, MATH, and Chatbot Arena used to compare model capabilities. Scores are easy to game through benchmark contamination, so the field is moving toward human preference evaluation as a more reliable signal.",

  "ai-alignment":
    "The challenge of making sure AI systems actually do what humans want, now and as they become more capable. Current work centers on RLHF and content policies, while longer-term concerns include goal misspecification and maintaining human control over more powerful systems.",

  agi: "Artificial General Intelligence, commonly defined as AI that can perform any cognitive task a human can. No current system meets any reasonable AGI definition, but the belief that it's achievable soon drives massive investment and shapes industry strategy.",

  // ── INTERMEDIATE / Geopolitics & Regulation ───────────────────────────
  "us-china-ai-race":
    "A strategic competition between the US and China over AI dominance, driven by the belief that AI leadership translates to economic and military power. It shapes chip export controls, national investment patterns, and most global AI policy debates.",

  "export-controls":
    "US restrictions on selling advanced AI chips and manufacturing equipment to China, meant to slow China's ability to train frontier models. The supply chain chokepoints are NVIDIA (chip design), TSMC in Taiwan (manufacturing), and ASML in the Netherlands (lithography equipment).",

  "ai-regulation":
    "Government policy that determines where AI companies can operate, what they can build, and how fast they can move. The EU AI Act takes a risk-based approach with strict rules for high-risk domains, while the US has relied mostly on voluntary commitments and executive orders.",

  // ── INTERMEDIATE / Ethics & Responsibility ────────────────────────────
  "bias-training-data":
    "Biases in training data across race, gender, culture, and language get learned by the model and show up in its outputs. Post-training can partially correct for them, but the rater pools used for preference data are themselves non-representative, so it never fully goes away.",

  "copyright-ip":
    "Unresolved legal questions about whether training on copyrighted content is fair use, and whether purely AI-generated outputs can be copyrighted at all. Active lawsuits like NYT v. OpenAI will help shape what's actually allowed.",

  "privacy-implications":
    "The main AI privacy risks are training-data memorization (models reproducing personal info), inference exposure (queries processed by third-party servers), and partial reconstruction of training data from model weights. Laws like GDPR and CCPA add legal requirements on top.",

  // ── INTERMEDIATE / Practical Decision-Making ──────────────────────────
  "evaluating-llm-solutions":
    "The process of rigorously checking whether an AI solution actually solves the problem, beyond a convincing demo. It means defining success metrics upfront, building an eval set of representative inputs, and testing multiple models against those metrics rather than vibes.",

  "cost-deployment-tradeoffs":
    "The decisions that shape AI product economics: API vs. self-hosted, which model tier to use, and how to keep costs under control. Key levers include prompt caching, routing easy queries to cheaper models, batching, and output length caps.",

  "model-selection":
    "A practical decision framework for AI projects: start with prompt engineering on a strong API model, add RAG if the gap is missing knowledge, fine-tune if the gap is behavior, and self-host only if privacy or scale demands it.",

  // ── ADVANCED / Modern Non-LLM AI ──────────────────────────────────────
  "image-video-generation":
    "AI that creates images or video from text prompts, typically using diffusion models that learn to gradually denoise random noise into a coherent image. DALL-E, Stable Diffusion, and Sora are well-known examples.",

  "world-models":
    "AI systems that learn to predict how an environment responds to actions, building an internal simulation of how the world works. They're considered a key missing piece for robust robotics, autonomous driving, and physically plausible video generation.",

  "autonomous-driving":
    "Self-driving vehicle systems that combine perception (cameras, LiDAR, radar), prediction, planning, and control. The technology works in constrained areas like Waymo's robotaxi zones, but regulation and liability, not pure engineering, are the main blockers to scaling further.",

  "alphafold-biomedical-ai":
    "AlphaFold is a DeepMind model that solved the protein structure prediction problem, earning a 2024 Nobel Prize in Chemistry. It's the clearest example of AI cracking a previously intractable scientific problem and it kicked off a broader wave of biomedical AI applications.",

  "robotics-embodied-ai":
    "AI applied to physical robots, which is uniquely hard because real-world data is scarce, actions are irreversible, and simulation-to-reality transfer is imperfect. Using pre-trained vision-language models as the robot's brain has dramatically improved generalization to new objects and tasks.",

  // ── ADVANCED / Advanced Training Mechanics ────────────────────────────
  "emergent-abilities":
    "Capabilities that appear suddenly at certain model scales instead of improving gradually, like in-context learning and chain-of-thought reasoning. They're a reason AI progress is hard to predict and a central point in debates about AI risk and scaling.",

  "in-context-learning":
    "The ability of a large model to learn a new task from a few examples in the prompt, without any weight updates. It's why few-shot prompting works, and it appears to be an emergent capability that only shows up at sufficient scale.",

  "continual-learning":
    "The unsolved problem of training a model on new information without it forgetting what it already knew, a failure mode called catastrophic forgetting. Without a solution, models have fixed knowledge cutoffs, which is part of why RAG is the practical workaround for keeping them current.",

  "fine-tuning-specifics":
    "The technical mechanics of fine-tuning, including full fine-tuning and efficient methods like LoRA and QLoRA. LoRA adds small trainable matrices instead of updating every weight, which makes fine-tuning feasible on consumer hardware.",

  // ── ADVANCED / Research & Meta-Skills ─────────────────────────────────
  "reading-research-papers":
    "A skill for extracting value from AI papers without reading every line or mastering the math. The efficient path is abstract, figures, conclusion first, and only digging into methods if the claim is worth validating.",

  "filtering-ai-hype":
    "The skill of separating real capability gains from marketing, cherry-picked demos, and media distortion. The key filters are evaluation methodology, replicability, visible failure modes, source credibility, and whether there's a meaningful baseline to compare against.",

  interpretability:
    "The research area focused on understanding what computations a model is actually doing internally, rather than treating it as a black box. It matters for debugging, audit trails in high-stakes domains, and detecting deceptive alignment in future more capable systems.",
};
