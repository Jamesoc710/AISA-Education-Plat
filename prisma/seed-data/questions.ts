type QuestionSeed = {
  conceptSlug: string;
  type: "MC" | "SHORT_ANSWER";
  questionText: string;
  options?: { text: string; isCorrect: boolean }[];
  answerExplanation: string;
  difficulty: string;
};

export const QUESTIONS: QuestionSeed[] = [
  // ── Transformers ──────────────────────────────────────────────────────────
  {
    conceptSlug: "transformers",
    type: "MC",
    questionText: "What was the key architectural innovation introduced by the transformer in 2017?",
    options: [
      { text: "Recurrent connections that process tokens sequentially", isCorrect: false },
      { text: "Self-attention mechanisms that process all tokens simultaneously", isCorrect: true },
      { text: "Convolutional layers adapted from image processing", isCorrect: false },
      { text: "Reinforcement learning from human feedback", isCorrect: false },
    ],
    answerExplanation: "The transformer introduced self-attention, which compares every token to every other token simultaneously rather than processing sequentially like RNNs. This parallelizability is what enables training at scale on GPUs.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "transformers",
    type: "MC",
    questionText: "Why are transformers easier to scale than RNNs?",
    options: [
      { text: "They use less memory per layer", isCorrect: false },
      { text: "They can process tokens in parallel, enabling use of thousands of GPU cores simultaneously", isCorrect: true },
      { text: "They require fewer parameters to achieve the same accuracy", isCorrect: false },
      { text: "They don't require labeled training data", isCorrect: false },
    ],
    answerExplanation: "Transformers process all tokens in parallel, so computation can be distributed across many GPU cores at once. RNNs process tokens sequentially, creating a bottleneck that prevents efficient parallelization.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "transformers",
    type: "MC",
    questionText: "Which company published the original 'Attention Is All You Need' paper introducing transformers?",
    options: [
      { text: "OpenAI", isCorrect: false },
      { text: "Meta AI", isCorrect: false },
      { text: "Google", isCorrect: true },
      { text: "Anthropic", isCorrect: false },
    ],
    answerExplanation: "Google researchers published 'Attention Is All You Need' in 2017, introducing the transformer architecture that now underlies virtually all modern LLMs.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "transformers",
    type: "SHORT_ANSWER",
    questionText: "Explain why transformers are parallelizable during training and why this matters for scaling AI.",
    answerExplanation: "Transformers process all tokens simultaneously using self-attention rather than sequentially like RNNs. This means computation can be distributed across thousands of GPU cores at once. Since scaling laws show models get predictably better with more compute, parallelizability is what made it feasible to train models at the scale required for modern LLMs like GPT-4 or Claude.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "transformers",
    type: "SHORT_ANSWER",
    questionText: "What type of transformer architecture do modern LLMs like GPT-4 and Claude use, and how does it differ from the original transformer?",
    answerExplanation: "Modern LLMs use decoder-only transformers, which predict the next token autoregressively. The original transformer had an encoder-decoder structure designed for translation, the encoder processes the input, and the decoder generates the output. Decoder-only models are simpler and scale better for general text generation tasks.",
    difficulty: "FUNDAMENTALS",
  },

  // ── Attention Mechanisms ──────────────────────────────────────────────────
  {
    conceptSlug: "attention-mechanisms",
    type: "MC",
    questionText: "Why does extending context windows require quadratically more compute?",
    options: [
      { text: "More tokens require more layers in the neural network", isCorrect: false },
      { text: "Each token must be compared to every other token, so doubling tokens quadruples comparisons", isCorrect: true },
      { text: "Longer sequences require higher precision floating point arithmetic", isCorrect: false },
      { text: "The vocabulary size grows with context length", isCorrect: false },
    ],
    answerExplanation: "Attention compares every token to every other token. If you have N tokens, you have N² comparisons. Doubling N to 2N gives 4N² comparisons, a 4x increase for a 2x increase in tokens. This quadratic scaling is why long context windows are computationally expensive.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "attention-mechanisms",
    type: "MC",
    questionText: "What does the attention mechanism produce for each token?",
    options: [
      { text: "A probability distribution over the next token", isCorrect: false },
      { text: "A weighted sum of other token representations based on relevance scores", isCorrect: true },
      { text: "A binary mask indicating which tokens to ignore", isCorrect: false },
      { text: "A gradient signal for updating model weights", isCorrect: false },
    ],
    answerExplanation: "For each token, attention computes relevance scores against all other tokens, normalizes them, and produces a weighted sum of the other tokens' representations. This enriches each token's representation with contextual information from the rest of the sequence.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "attention-mechanisms",
    type: "MC",
    questionText: "Which of the following best explains why LLMs sometimes 'lose track' of information in very long documents?",
    options: [
      { text: "The model deletes old tokens to save memory", isCorrect: false },
      { text: "Attention weights get diluted across many tokens, making distant information harder to attend to strongly", isCorrect: true },
      { text: "Models are trained to ignore tokens beyond a certain position", isCorrect: false },
      { text: "Long documents exceed the model's vocabulary size", isCorrect: false },
    ],
    answerExplanation: "With many tokens competing for attention weight, the model's attention gets diluted. Information in the middle of very long documents tends to receive weaker attention than content at the start or end, a phenomenon called 'lost in the middle.'",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "attention-mechanisms",
    type: "SHORT_ANSWER",
    questionText: "Explain how the attention mechanism gives LLMs contextual understanding of language. Use an example.",
    answerExplanation: "Attention allows each token to 'look at' all other tokens and weight their importance. For example, in 'The trophy didn't fit in the suitcase because it was too big,' the word 'it' needs to attend strongly to 'trophy' to correctly resolve what's too big. Attention learns these relationships during training, so the model understands that 'it' refers to the trophy, not the suitcase, giving it contextual understanding rather than just pattern-matching individual words.",
    difficulty: "FUNDAMENTALS",
  },

  // ── Tokens ────────────────────────────────────────────────────────────────
  {
    conceptSlug: "tokens",
    type: "MC",
    questionText: "Why do LLMs struggle to count the number of 'r's in 'strawberry'?",
    options: [
      { text: "LLMs are not trained on spelling tasks", isCorrect: false },
      { text: "The word 'strawberry' is split into subword tokens, not individual characters", isCorrect: true },
      { text: "LLMs don't process repeated letters correctly", isCorrect: false },
      { text: "The context window is too small for character-level tasks", isCorrect: false },
    ],
    answerExplanation: "LLMs tokenize using subword units, not characters. 'Strawberry' might be tokenized as 'str', 'awb', 'erry', each subword token doesn't correspond to individual letters. So the model can't simply count characters; it sees abstract token IDs and must infer character content from learned patterns.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "tokens",
    type: "MC",
    questionText: "What tokenization approach do most modern LLMs use?",
    options: [
      { text: "Character-level tokenization (one token per character)", isCorrect: false },
      { text: "Word-level tokenization (one token per word)", isCorrect: false },
      { text: "Subword tokenization using Byte Pair Encoding (BPE) or similar", isCorrect: true },
      { text: "Sentence-level tokenization (one token per sentence)", isCorrect: false },
    ],
    answerExplanation: "Most LLMs use subword tokenization (typically BPE), which balances vocabulary size against coverage. Common words become single tokens, while rare words are split into familiar subword pieces. This handles out-of-vocabulary words gracefully while keeping vocabulary size manageable.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "tokens",
    type: "MC",
    questionText: "Why does token count directly affect the cost of using an LLM API?",
    options: [
      { text: "More tokens require more servers to process", isCorrect: false },
      { text: "APIs charge per token processed (input + output), so more tokens = higher cost", isCorrect: true },
      { text: "Longer prompts require premium model versions", isCorrect: false },
      { text: "Token count affects model accuracy, requiring more expensive models", isCorrect: false },
    ],
    answerExplanation: "LLM APIs price by token, you pay for every input token (your prompt) and every output token (the model's response). Longer prompts and longer responses cost proportionally more. This makes token efficiency a real engineering concern at production scale.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "tokens",
    type: "SHORT_ANSWER",
    questionText: "What is tokenization, and why can't a model just work with raw text characters?",
    answerExplanation: "Tokenization converts raw text into discrete numeric IDs that a neural network can process. Models need numeric inputs, they can't process arbitrary character sequences directly. Subword tokenization finds the optimal vocabulary of common text chunks, balancing vocabulary size (affects model size) against sequence length (affects compute). Pure character-level models have very long sequences (slow, expensive) while word-level models can't handle unknown words. Subword tokenization is the practical middle ground.",
    difficulty: "FUNDAMENTALS",
  },

  // ── Embeddings ────────────────────────────────────────────────────────────
  {
    conceptSlug: "embeddings",
    type: "MC",
    questionText: "What is the primary purpose of embeddings in a transformer model?",
    options: [
      { text: "To compress the model's weights to reduce file size", isCorrect: false },
      { text: "To represent tokens as dense vectors that capture semantic meaning", isCorrect: true },
      { text: "To encrypt user inputs before processing", isCorrect: false },
      { text: "To store training examples in memory", isCorrect: false },
    ],
    answerExplanation: "Embeddings map token IDs to dense floating-point vectors that the model can compute with. These vectors are learned during training to capture semantic relationships, similar words end up with similar vectors, and the attention mechanism further enriches them with contextual information.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "embeddings",
    type: "MC",
    questionText: "In the context of RAG systems, what are embeddings used for?",
    options: [
      { text: "Generating the final text response", isCorrect: false },
      { text: "Converting documents and queries into vectors for similarity search", isCorrect: true },
      { text: "Fine-tuning the model on new data", isCorrect: false },
      { text: "Compressing documents to fit in the context window", isCorrect: false },
    ],
    answerExplanation: "In RAG, documents are converted to embedding vectors and stored in a vector database. At query time, the user's question is also embedded, and the system retrieves documents whose embedding vectors are most similar (by cosine similarity or dot product). This enables semantic search, finding relevant content even when exact keywords don't match.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "embeddings",
    type: "SHORT_ANSWER",
    questionText: "Why does the same word have different embeddings in different contexts, and why does this matter?",
    answerExplanation: "After passing through the transformer's attention layers, each token's embedding is updated based on the surrounding context. So 'bank' in 'river bank' and 'bank' in 'investment bank' start with the same initial embedding but end up in very different positions in vector space after attention processes the surrounding words. This contextual representation is what lets LLMs understand meaning rather than just vocabulary, it's the difference between a lookup table and genuine language understanding.",
    difficulty: "FUNDAMENTALS",
  },

  // ── Pre-training ──────────────────────────────────────────────────────────
  {
    conceptSlug: "pre-training",
    type: "MC",
    questionText: "What is the training objective during LLM pre-training?",
    options: [
      { text: "Classify input text into predefined categories", isCorrect: false },
      { text: "Predict the next token given all previous tokens in the sequence", isCorrect: true },
      { text: "Maximize human preference scores for generated outputs", isCorrect: false },
      { text: "Minimize the difference between generated and reference translations", isCorrect: false },
    ],
    answerExplanation: "Pre-training uses next-token prediction (causal language modeling): given tokens 1 through N, predict token N+1. This simple objective, applied at massive scale, forces the model to internalize patterns, facts, and reasoning structures from the training data.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "pre-training",
    type: "MC",
    questionText: "What type of model do you get after pre-training only, before any post-training?",
    options: [
      { text: "A chatbot that reliably follows instructions", isCorrect: false },
      { text: "A base model that behaves like a sophisticated autocomplete engine", isCorrect: true },
      { text: "A reasoning model capable of chain-of-thought", isCorrect: false },
      { text: "A safety-aligned model that refuses harmful requests", isCorrect: false },
    ],
    answerExplanation: "Pre-training alone produces a base model, it predicts likely next tokens based on its training data but has no instruction-following capability. If you ask it to translate text, it might comply, continue the conversation, or do something else entirely. RLHF post-training is what makes it an instruction-following assistant.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "pre-training",
    type: "MC",
    questionText: "Why does pre-training give LLMs a knowledge cutoff date?",
    options: [
      { text: "The models are programmed to only access information up to a certain date", isCorrect: false },
      { text: "The training dataset is collected once and then frozen, so the model only knows about events before the data cutoff", isCorrect: true },
      { text: "Copyright law prevents models from accessing recent content", isCorrect: false },
      { text: "Models automatically delete old information to make room for new data", isCorrect: false },
    ],
    answerExplanation: "Pre-training uses a static dataset collected up to a certain point in time. Once training is complete, the model's weights are frozen. It has no mechanism to update its knowledge, everything it knows comes from the training data, which stops at the cutoff date.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "pre-training",
    type: "SHORT_ANSWER",
    questionText: "Why does pre-training cost hundreds of millions of dollars for frontier models?",
    answerExplanation: "Pre-training requires running billions of forward and backward passes over trillions of tokens of data, on clusters of thousands of specialized GPUs running continuously for months. The costs come from GPU rental or purchase (H100s cost $20K-$80K each), massive energy bills for power and cooling, and engineering time for the training infrastructure. Most labs spend more on R&D compute (experiments, ablations, failed runs) than on the final training run itself. Only well-capitalized organizations can sustain this spend.",
    difficulty: "INTERMEDIATE",
  },

  // ── RLHF ──────────────────────────────────────────────────────────────────
  {
    conceptSlug: "rlhf",
    type: "MC",
    questionText: "What was the practical impact of applying RLHF to GPT-3?",
    options: [
      { text: "It made the model 100x larger, enabling better performance", isCorrect: false },
      { text: "It transformed an inconsistent autocomplete engine into a usable instruction-following chatbot", isCorrect: true },
      { text: "It gave the model the ability to access the internet in real-time", isCorrect: false },
      { text: "It reduced the model's cost by 90% through compression", isCorrect: false },
    ],
    answerExplanation: "GPT-3 (2020) was a capable but inconsistent base model. Applying RLHF produced InstructGPT and eventually ChatGPT (2022), a model that reliably follows instructions, formats responses helpfully, and applies safety training. This transition from research curiosity to mass-market product happened through post-training, not by changing the underlying architecture.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "rlhf",
    type: "MC",
    questionText: "How does RLHF apply safety training to an LLM?",
    options: [
      { text: "By deleting harmful content from the training data before pre-training", isCorrect: false },
      { text: "By hard-coding rules that block specific keywords", isCorrect: false },
      { text: "By including examples of harmful requests in the preference data and training the model to rank refusals higher", isCorrect: true },
      { text: "By running the model's outputs through a separate content filter", isCorrect: false },
    ],
    answerExplanation: "RLHF trains a reward model on human preferences, including preferences for the model to refuse harmful requests. The LLM is then fine-tuned to maximize this reward, which includes learning to decline requests that human raters rated negatively. Safety training is baked into the weights through this preference learning process, not through hard-coded rules.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "rlhf",
    type: "SHORT_ANSWER",
    questionText: "Walk through the RLHF process step by step. What goes in, what comes out at each stage?",
    answerExplanation: "Step 1: Take a pre-trained base model. Step 2: Prompt it many times and collect multiple responses per prompt. Step 3: Have human raters rank the responses by quality (helpfulness, safety, accuracy). Step 4: Train a reward model on these human rankings, it learns to predict which responses humans prefer. Step 5: Fine-tune the LLM using reinforcement learning to maximize the reward model's score (typically using PPO). Result: a model that consistently produces responses in the style humans preferred (following instructions, formatting helpfully, applying safety training) after relatively few examples compared to pre-training.",
    difficulty: "FUNDAMENTALS",
  },

  // ── RLVR ──────────────────────────────────────────────────────────────────
  {
    conceptSlug: "rlvr",
    type: "MC",
    questionText: "What makes RLVR different from RLHF?",
    options: [
      { text: "RLVR uses human raters while RLHF uses automated scoring", isCorrect: false },
      { text: "RLVR uses automatically verifiable correct/incorrect signals rather than human preference judgments", isCorrect: true },
      { text: "RLVR trains on images while RLHF trains on text", isCorrect: false },
      { text: "RLVR is cheaper but less effective than RLHF", isCorrect: false },
    ],
    answerExplanation: "RLHF relies on human raters to judge which response is better, expensive and hard to scale. RLVR uses tasks with objectively verifiable answers (math problems, code that passes tests), so correctness can be checked automatically. This makes RLVR highly scalable and removes the bottleneck of human annotation.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "rlvr",
    type: "MC",
    questionText: "Chain-of-thought reasoning in models trained with RLVR emerged through:",
    options: [
      { text: "Explicit instructions in the training data telling the model to think step-by-step", isCorrect: false },
      { text: "Training pressure, the model discovered reasoning helps it get correct answers and was rewarded for it", isCorrect: true },
      { text: "A separate fine-tuning stage specifically for chain-of-thought", isCorrect: false },
      { text: "Human raters selecting responses with more reasoning steps", isCorrect: false },
    ],
    answerExplanation: "No one programmed chain-of-thought into reasoning models, it emerged from training pressure. When the model discovered that writing out intermediate steps led to more correct answers (and thus more reward), it reinforced this behavior. This emergent capability is one of the striking findings of RLVR training.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "rlvr",
    type: "SHORT_ANSWER",
    questionText: "What is 'test-time compute' and how does RLVR training enable it?",
    answerExplanation: "Test-time compute refers to the ability to spend more computation (more thinking tokens) on harder problems to improve accuracy. RLVR training teaches the model to reason through problems, and the depth of that reasoning can vary, a simple question might need 50 thinking tokens, a hard math problem might need 5,000. This scaling of compute with difficulty is what makes reasoning models like o1 and Claude's extended thinking mode so powerful on hard tasks. RLVR enables it by rewarding correct answers regardless of how long the thinking chain was, letting the model learn to invest more reasoning in harder problems.",
    difficulty: "FUNDAMENTALS",
  },

  // ── Base Models ───────────────────────────────────────────────────────────
  {
    conceptSlug: "base-models",
    type: "MC",
    questionText: "If you ask a base model to 'translate this text to Spanish,' what is the most likely response?",
    options: [
      { text: "Always a correct Spanish translation", isCorrect: false },
      { text: "Behavior is inconsistent, it might translate, continue the text, or do something else entirely", isCorrect: true },
      { text: "Always a refusal because base models are restricted", isCorrect: false },
      { text: "An error message because base models don't understand instructions", isCorrect: false },
    ],
    answerExplanation: "Base models predict the most likely next token given prior context, they don't interpret your message as an instruction to execute. They might translate if they've seen similar patterns in training data, continue the text as a creative writing exercise, or produce something else entirely. This inconsistency is why post-training is essential for practical applications.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "base-models",
    type: "MC",
    questionText: "Why might a researcher choose a base model over an instruction-tuned model?",
    options: [
      { text: "Base models are faster at inference", isCorrect: false },
      { text: "Base models are cheaper to access via API", isCorrect: false },
      { text: "Base models are a clean starting point for fine-tuning on specific tasks without RLHF biases", isCorrect: true },
      { text: "Base models have better safety properties", isCorrect: false },
    ],
    answerExplanation: "Researchers often prefer base models for fine-tuning because they haven't had their behavior shaped by RLHF, they represent the 'pure' capabilities learned from pre-training. When you want to specialize a model for a narrow domain, starting from a base model gives you more control over the resulting behavior.",
    difficulty: "FUNDAMENTALS",
  },

  // ── Instruction-tuned Models ──────────────────────────────────────────────
  {
    conceptSlug: "instruction-tuned-models",
    type: "MC",
    questionText: "What signal in a model's name or release notes indicates it has been instruction-tuned?",
    options: [
      { text: "A higher parameter count", isCorrect: false },
      { text: "Suffixes like 'Instruct,' 'Chat,' or 'Assistant' in the model name", isCorrect: true },
      { text: "A lower temperature default setting", isCorrect: false },
      { text: "The model being released after 2023", isCorrect: false },
    ],
    answerExplanation: "Model names like Llama-3-8B-Instruct, Mistral-7B-Instruct, or GPT-4 (which is instruction-tuned by default) signal post-training for instruction following. The base versions typically have no such suffix. This naming convention is consistent across most major model families.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "instruction-tuned-models",
    type: "SHORT_ANSWER",
    questionText: "Why do different instruction-tuned models (Claude, ChatGPT, Gemini) have different 'personalities' even though they're all based on transformers?",
    answerExplanation: "The personality of an instruction-tuned model is largely determined by the RLHF process: who the human raters were, what preferences they expressed, what the reward model learned to value, and what constitutional principles or safety guidelines were applied. Anthropic's raters emphasized thoughtfulness and honesty. OpenAI's earlier training used contractors who preferred verbose, helpful responses. Different fine-tuning datasets and reward models produce measurably different behaviors (different writing styles, different tendencies to hedge, different thresholds for refusing requests) even when the underlying pre-trained model architecture is similar.",
    difficulty: "FUNDAMENTALS",
  },

  // ── Reasoning Models ──────────────────────────────────────────────────────
  {
    conceptSlug: "reasoning-models",
    type: "MC",
    questionText: "What is the key tradeoff when using a reasoning model vs. a standard instruction-tuned model?",
    options: [
      { text: "Reasoning models have lower accuracy but are faster", isCorrect: false },
      { text: "Reasoning models are more capable on complex tasks but have higher latency and cost", isCorrect: true },
      { text: "Reasoning models can only answer yes/no questions", isCorrect: false },
      { text: "Reasoning models require internet access to function", isCorrect: false },
    ],
    answerExplanation: "Reasoning models generate 'thinking' tokens before their final answer, these tokens take time and cost money. For simple tasks, this overhead is wasteful. For complex tasks (hard math, multi-step code, careful logical deduction), the improved accuracy justifies the cost. Smart systems route queries to the appropriate model tier based on difficulty.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "reasoning-models",
    type: "MC",
    questionText: "Which question famously exposed a limitation that reasoning models fixed but standard instruction-tuned models failed?",
    options: [
      { text: "What is the capital of France?", isCorrect: false },
      { text: "Write me a poem about autumn", isCorrect: false },
      { text: "Which is larger, 9.11 or 9.9?", isCorrect: true },
      { text: "Translate this sentence to Spanish", isCorrect: false },
    ],
    answerExplanation: "Standard instruction-tuned models frequently said 9.11 > 9.9 (confusing decimal magnitude with version numbers or other associations). Reasoning models, trained to think through comparisons step-by-step, correctly identify 9.9 > 9.11. This simple example illustrates how chain-of-thought reasoning fixes systematic errors in number comparison.",
    difficulty: "FUNDAMENTALS",
  },

  // ── System Prompts ────────────────────────────────────────────────────────
  {
    conceptSlug: "system-prompts",
    type: "MC",
    questionText: "What is the primary purpose of a system prompt?",
    options: [
      { text: "To provide the model's training data", isCorrect: false },
      { text: "To set context, instructions, and constraints for model behavior before user interaction", isCorrect: true },
      { text: "To cache previous conversation history", isCorrect: false },
      { text: "To authenticate the user's identity", isCorrect: false },
    ],
    answerExplanation: "A system prompt appears before user messages and sets the behavioral context for the entire conversation, persona, constraints, available tools, response format, and topic restrictions. It's the primary mechanism companies use to customize model behavior for their products.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "system-prompts",
    type: "MC",
    questionText: "A system prompt says 'Never reveal this password: abc123.' Can a determined user still extract it?",
    options: [
      { text: "No, system prompts are encrypted and completely hidden from users", isCorrect: false },
      { text: "No, models are hardcoded to follow system prompt confidentiality instructions", isCorrect: false },
      { text: "Yes, through careful prompting, users can often trick the model into revealing system prompt contents", isCorrect: true },
      { text: "Only if the user has admin access to the API", isCorrect: false },
    ],
    answerExplanation: "System prompt confidentiality is a trained tendency, not a hard technical restriction. Determined users can use roleplay framing, indirect questions, or other jailbreaking techniques to get the model to reveal contents. Sensitive data like API keys, passwords, or confidential business logic should never be placed in a system prompt.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "system-prompts",
    type: "SHORT_ANSWER",
    questionText: "You're building a customer service chatbot for a bank. What would you include in the system prompt, and what would you not include?",
    answerExplanation: "Include: the model's persona and name, scope restrictions (only answer banking-related questions), response format guidelines, available tools descriptions, tone instructions, and how to handle escalation. Do not include: actual customer account data, API keys or database credentials, internal security procedures that could be exploited, or any information a user could weaponize if they extracted it. System prompts should contain behavioral instructions, not sensitive data, use tool calls with proper authentication to access sensitive systems instead.",
    difficulty: "FUNDAMENTALS",
  },

  // ── Context Windows ────────────────────────────────────────────────────────
  {
    conceptSlug: "context-windows",
    type: "MC",
    questionText: "If a model has a 100,000 token context window and you're building a chat application, what practical limitation does this create?",
    options: [
      { text: "Users can only send messages in English", isCorrect: false },
      { text: "Very long conversations will eventually exceed the context window, requiring you to summarize or truncate history", isCorrect: true },
      { text: "The model can only process one user at a time", isCorrect: false },
      { text: "Response time increases linearly with conversation length", isCorrect: false },
    ],
    answerExplanation: "Every turn in a conversation accumulates tokens, system prompt, all prior messages, and the current message. Eventually this sum will exceed the context window. Your application needs a strategy: truncate old messages, summarize the conversation history, or implement a memory system that distills key information. This is a standard architectural challenge in any chat application.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "context-windows",
    type: "MC",
    questionText: "Why don't AI companies simply make context windows infinitely large?",
    options: [
      { text: "Regulatory limits on AI memory capacity", isCorrect: false },
      { text: "Attention compute scales quadratically with sequence length, making very long contexts prohibitively expensive", isCorrect: true },
      { text: "Models lose accuracy if they have too much context", isCorrect: false },
      { text: "Longer context windows require proportionally more parameters", isCorrect: false },
    ],
    answerExplanation: "The attention mechanism compares every token to every other token. At N tokens, this is N² comparisons. Doubling context length quadruples compute. For a model with a 1 million token context, the attention computation becomes massive, and training data at that length barely exists, so the model wouldn't learn to use it well anyway.",
    difficulty: "FUNDAMENTALS",
  },

  // ── Parameters ────────────────────────────────────────────────────────────
  {
    conceptSlug: "parameters",
    type: "MC",
    questionText: "A model is described as '7B.' What does this mean?",
    options: [
      { text: "The model was trained on 7 billion documents", isCorrect: false },
      { text: "The model has 7 billion learnable weight values", isCorrect: true },
      { text: "The model costs $7 billion to run per year", isCorrect: false },
      { text: "The model requires 7 billion bytes of RAM", isCorrect: false },
    ],
    answerExplanation: "7B means 7 billion parameters (weights). These are the floating-point numbers optimized during training that collectively encode everything the model learned. More parameters generally means more capacity for knowledge and complex reasoning, but also more compute and memory required for inference.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "parameters",
    type: "MC",
    questionText: "Approximately how much RAM is needed to run a 7B parameter model in half-precision (fp16)?",
    options: [
      { text: "700 MB", isCorrect: false },
      { text: "7 GB", isCorrect: false },
      { text: "14 GB", isCorrect: true },
      { text: "70 GB", isCorrect: false },
    ],
    answerExplanation: "Each parameter in fp16 takes 2 bytes. 7 billion parameters × 2 bytes = 14 GB just for the weights. You also need additional memory for the KV cache during inference and for model activations. This is why running a 7B model requires a GPU with at least 16 GB VRAM or an Apple Silicon Mac with unified memory.",
    difficulty: "INTERMEDIATE",
  },

  // ── Training vs. Inference ────────────────────────────────────────────────
  {
    conceptSlug: "training-vs-inference",
    type: "MC",
    questionText: "Why is training so much more computationally expensive than inference?",
    options: [
      { text: "Training requires more powerful hardware that costs more per hour", isCorrect: false },
      { text: "Training requires forward passes AND backward passes with gradient computation, plus storing all intermediate activations", isCorrect: true },
      { text: "Training processes each token multiple times while inference only processes it once", isCorrect: false },
      { text: "Training requires internet connectivity while inference works offline", isCorrect: false },
    ],
    answerExplanation: "Inference is just a forward pass, compute the output given the input. Training requires also computing gradients via backpropagation, which means storing all intermediate activations (up to 3-4x the model size in memory) and doing a second backward pass. Training also runs over the entire dataset repeatedly, while inference processes one request at a time.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "training-vs-inference",
    type: "SHORT_ANSWER",
    questionText: "A startup is considering building their own LLM from scratch vs. using OpenAI's API. What are the key differences in cost structure they should understand?",
    answerExplanation: "Training from scratch: one-time cost of hundreds of millions for frontier capability, ongoing costs for experiments and updates, requires specialized ML engineering teams, full control over the model. Using API: per-token cost that scales with usage, no upfront infrastructure investment, faster to market, vendor dependency risk, data privacy considerations. For most startups, the API model makes far more sense, training from scratch is only justified for organizations with frontier model ambitions, specialized domain needs that can't be addressed with prompting/fine-tuning, or data privacy requirements that preclude third-party APIs.",
    difficulty: "INTERMEDIATE",
  },

  // ── Hallucinations ────────────────────────────────────────────────────────
  {
    conceptSlug: "hallucinations",
    type: "MC",
    questionText: "Why do LLMs hallucinate with apparent confidence rather than saying 'I'm not sure'?",
    options: [
      { text: "LLMs are trained to always give an answer, never to express uncertainty", isCorrect: false },
      { text: "The training objective rewards predicting plausible tokens, not verified true ones, the model isn't trained to distinguish confidence from uncertainty", isCorrect: true },
      { text: "Hallucinations are a bug that will be fixed in future model versions", isCorrect: false },
      { text: "Models are deliberately confident to improve user satisfaction scores", isCorrect: false },
    ],
    answerExplanation: "Pre-training rewards the model for predicting the correct next token, it learns what sounds plausible. There's no signal that teaches it to recognize when it doesn't know something. The model generates the most statistically likely continuation of the text, regardless of whether the content is factually verified. This produces fluent-sounding false information delivered without hedging.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "hallucinations",
    type: "MC",
    questionText: "Which mitigation technique most directly addresses the hallucination problem for factual questions about specific documents?",
    options: [
      { text: "Using a larger model with more parameters", isCorrect: false },
      { text: "RAG, retrieving relevant document chunks and grounding the model's answer in them", isCorrect: true },
      { text: "Lowering the model's temperature to make it more deterministic", isCorrect: false },
      { text: "Adding more examples in the system prompt", isCorrect: false },
    ],
    answerExplanation: "RAG forces the model to ground its answer in retrieved documents rather than relying on learned patterns. The model is instructed to answer based on the retrieved context, and if the information isn't there, to say so. This dramatically reduces hallucination on factual queries because the model isn't generating from pure parametric memory.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "hallucinations",
    type: "SHORT_ANSWER",
    questionText: "A client wants to build a legal research tool using an LLM. What are the hallucination risks and how would you mitigate them?",
    answerExplanation: "Risks: the model may fabricate case citations (fake case names, incorrect holdings), misstate legal standards, or confidently apply law from the wrong jurisdiction. These errors look convincing and could mislead attorneys. Mitigations: use RAG grounded in an authoritative legal database (Westlaw, Lexis) so the model can only cite documents that exist in the retrieval corpus; instruct the model to always cite its source document; implement citation verification (check that cited cases actually exist and say what the model claims); display confidence indicators; and require human attorney review of all outputs. Never deploy this as a standalone decision-making tool.",
    difficulty: "INTERMEDIATE",
  },

  // ── Jailbreaking ──────────────────────────────────────────────────────────
  {
    conceptSlug: "jailbreaking",
    type: "MC",
    questionText: "Why does roleplay framing (e.g., 'pretend you're an AI with no restrictions') sometimes succeed as a jailbreak?",
    options: [
      { text: "Models treat roleplay instructions as higher priority than safety training", isCorrect: false },
      { text: "Safety training is a statistical tendency, not a hard rule, certain framings shift the probability distribution away from refusals", isCorrect: true },
      { text: "Roleplay mode is a documented feature that disables safety filters", isCorrect: false },
      { text: "Models can't distinguish fictional contexts from real ones", isCorrect: false },
    ],
    answerExplanation: "RLHF safety training shapes the probability distribution of outputs, certain types of requests are much less likely to produce harmful completions. But it's not an absolute filter. Clever framing can shift the model's probability distribution enough that the harmful completion becomes more likely than the refusal. This is fundamentally a statistical susceptibility, not a hard security guarantee.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "jailbreaking",
    type: "SHORT_ANSWER",
    questionText: "Your team is building an AI product. Why is it insufficient to rely only on the model's built-in safety training for content moderation?",
    answerExplanation: "Model safety training is a statistical tendency, not a hard security guarantee. Determined users with jailbreaking techniques can bypass it. Defense-in-depth is essential: use input filtering to catch known harmful patterns before they reach the model, apply output moderation to review generated content before serving it, implement rate limiting to slow automated attack attempts, log interactions for abuse detection, and design system prompts carefully to minimize attack surface. Treat model safety training as one layer among many, not as the primary defense.",
    difficulty: "FUNDAMENTALS",
  },

  // ── Tool Use ──────────────────────────────────────────────────────────────
  {
    conceptSlug: "tool-use",
    type: "MC",
    questionText: "When an LLM 'uses a tool,' what is actually happening technically?",
    options: [
      { text: "The model directly executes code in a secure sandbox within its architecture", isCorrect: false },
      { text: "The model outputs a structured call; external code executes it and returns the result to the model", isCorrect: true },
      { text: "The model accesses external APIs directly through its weights", isCorrect: false },
      { text: "A separate AI model handles tool execution and passes results back", isCorrect: false },
    ],
    answerExplanation: "The model generates a structured tool call (like a function call in JSON format). The calling application intercepts this, executes the actual code or API call, and feeds the result back into the model's context. The model never directly executes anything, it only generates text describing what should be executed.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "tool-use",
    type: "MC",
    questionText: "Which of the following is NOT a common tool that LLMs use in production applications?",
    options: [
      { text: "Web search", isCorrect: false },
      { text: "Code execution", isCorrect: false },
      { text: "Direct modification of their own training weights", isCorrect: true },
      { text: "Database queries", isCorrect: false },
    ],
    answerExplanation: "LLMs cannot modify their own weights at inference time, weights are frozen after training. Common tools include web search, code execution, database queries, file operations, calendar/email access, and custom APIs. The model decides what to call based on the task, but the tools are defined by the application developer.",
    difficulty: "FUNDAMENTALS",
  },

  // ── Agentic Capabilities ──────────────────────────────────────────────────
  {
    conceptSlug: "agentic-capabilities",
    type: "MC",
    questionText: "What distinguishes an 'agentic' use of an LLM from a standard single-prompt use?",
    options: [
      { text: "Agentic models have more parameters", isCorrect: false },
      { text: "The model runs in a loop using tools to take actions and observe results over multiple steps", isCorrect: true },
      { text: "Agentic use requires a different model architecture", isCorrect: false },
      { text: "Agents have access to the internet while standard models don't", isCorrect: false },
    ],
    answerExplanation: "Agentic AI involves the model running in a loop: receive task → use tools to gather info → take action → observe result → repeat until complete. This multi-step loop enables tasks that can't be done in a single prompt (like debugging code iteratively, doing multi-step research, or managing a workflow). The same underlying model can be used both ways.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "agentic-capabilities",
    type: "SHORT_ANSWER",
    questionText: "What are the three key engineering challenges in building reliable agentic AI systems, and how would you approach each?",
    answerExplanation: "1. Error recovery: When a tool fails or the model makes a bad decision, the agent needs to detect this and recover. Approach: build retry logic, give the model explicit error information in its context, define escape conditions (max steps, human escalation triggers). 2. Context management: Long multi-step tasks accumulate tokens and exceed context windows. Approach: implement context compression (summarize completed steps), use external memory for task state, keep the active context focused on the current subtask. 3. Reliability: One bad decision early can derail the entire task. Approach: use strong reasoning models for planning, add checkpoints where humans can verify progress, design tasks as reversible where possible, implement sandboxing to prevent irreversible real-world actions.",
    difficulty: "INTERMEDIATE",
  },

  // ── Multimodality ─────────────────────────────────────────────────────────
  {
    conceptSlug: "multimodality",
    type: "MC",
    questionText: "How are images processed by a multimodal transformer model?",
    options: [
      { text: "Images are converted to text descriptions before being fed to the model", isCorrect: false },
      { text: "Image patches are encoded into visual tokens that are fed alongside text tokens into the transformer", isCorrect: true },
      { text: "A separate image-processing model runs in parallel and sends results to the language model", isCorrect: false },
      { text: "Images are stored as raw pixel values in the model's memory", isCorrect: false },
    ],
    answerExplanation: "Multimodal models use a vision encoder (often a Vision Transformer or CLIP-style model) to convert image patches into visual token representations, which are then concatenated with text token embeddings and fed through the same transformer architecture. The model learns to attend across both modalities.",
    difficulty: "INTERMEDIATE",
  },

  // ── Major AI Players ──────────────────────────────────────────────────────
  {
    conceptSlug: "major-ai-players",
    type: "MC",
    questionText: "What strategic advantage does Google have over OpenAI and Anthropic in AI infrastructure?",
    options: [
      { text: "Google has the largest user base for consumer AI products", isCorrect: false },
      { text: "Google develops and manufactures its own TPU chips, not depending on NVIDIA", isCorrect: true },
      { text: "Google has more parameters in its models than competitors", isCorrect: false },
      { text: "Google's models are open-source while competitors' are closed", isCorrect: false },
    ],
    answerExplanation: "Google trains its Gemini models entirely on TPUs, which it designs and manufactures itself. This means Google doesn't pay NVIDIA's significant margins and isn't subject to NVIDIA supply chain constraints or export controls in the same way. Every other major AI lab (OpenAI, Anthropic, Meta) depends heavily on NVIDIA GPUs.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "major-ai-players",
    type: "SHORT_ANSWER",
    questionText: "In your view, what does it mean for an AI company to be 'winning'? Evaluate the current positions of OpenAI, Google, and Anthropic.",
    answerExplanation: "There's no single definition, 'winning' could mean largest user base (OpenAI, with ChatGPT), most capable model (contested between Google Gemini and OpenAI GPT-4 series), most capable for agentic tasks (Anthropic's Claude leads here), best business model (Anthropic has strong API revenue, Google has enterprise integration), or furthest toward AGI (unverifiable). OpenAI has first-mover advantage and brand recognition. Google has hardware independence and distribution through Google Cloud/Workspace. Anthropic has strong agentic capabilities and research reputation. A strong answer acknowledges that 'winning' depends on the metric and that the landscape shifts quarterly.",
    difficulty: "FUNDAMENTALS",
  },

  // ── Open Source vs Open Weights ───────────────────────────────────────────
  {
    conceptSlug: "open-source-vs-open-weights",
    type: "MC",
    questionText: "Meta's Llama models are best described as:",
    options: [
      { text: "Fully open source, all training data, code, and weights are freely available", isCorrect: false },
      { text: "Open weights, model parameters are downloadable but training data details are not fully disclosed", isCorrect: true },
      { text: "Closed source, only accessible via Meta's API", isCorrect: false },
      { text: "Partially open, weights available only to research institutions", isCorrect: false },
    ],
    answerExplanation: "Meta's Llama releases provide downloadable model weights that anyone can run, modify, and fine-tune. However, the full training data composition and detailed training procedures aren't disclosed. This 'open weights' model gives practical openness (you can run it locally) without meeting the strict open source definition (full reproducibility from scratch).",
    difficulty: "FUNDAMENTALS",
  },

  // ── Wrapper ───────────────────────────────────────────────────────────────
  {
    conceptSlug: "wrapper",
    type: "MC",
    questionText: "Why are 'wrapper' businesses considered strategically fragile?",
    options: [
      { text: "They use too much API bandwidth and face usage limits", isCorrect: false },
      { text: "The model provider can add the same feature natively, instantly eliminating the product's value proposition", isCorrect: true },
      { text: "Wrappers are illegal under AI licensing agreements", isCorrect: false },
      { text: "They can't handle enterprise-scale traffic", isCorrect: false },
    ],
    answerExplanation: "If your entire value proposition is 'GPT-4 with a better interface for X,' OpenAI can add X as a native feature and your product becomes unnecessary overnight. They have the model, the distribution, and the brand. Successful AI products add proprietary value (unique data, domain expertise, workflow integrations) that the model provider can't trivially replicate.",
    difficulty: "FUNDAMENTALS",
  },

  // ── Prompt Engineering ────────────────────────────────────────────────────
  {
    conceptSlug: "prompt-engineering",
    type: "MC",
    questionText: "What is few-shot prompting?",
    options: [
      { text: "Using a small model to reduce API costs", isCorrect: false },
      { text: "Providing examples of input-output pairs in the prompt to demonstrate the desired behavior", isCorrect: true },
      { text: "Limiting the model to only a few tokens of output", isCorrect: false },
      { text: "Testing the model with a small sample before full deployment", isCorrect: false },
    ],
    answerExplanation: "Few-shot prompting provides a small number of example input-output pairs in the prompt itself, demonstrating the desired task format and behavior. The model uses in-context learning to generalize from these examples. It's highly effective for tasks where the output format or style is hard to describe but easy to demonstrate.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "prompt-engineering",
    type: "MC",
    questionText: "Chain-of-thought prompting improves performance primarily on which type of task?",
    options: [
      { text: "Simple factual recall questions", isCorrect: false },
      { text: "Tasks requiring multiple reasoning steps, like math problems or logical deductions", isCorrect: true },
      { text: "Creative writing tasks", isCorrect: false },
      { text: "Language translation", isCorrect: false },
    ],
    answerExplanation: "Chain-of-thought prompting (instructing the model to 'think step by step') improves performance on tasks where the final answer depends on intermediate reasoning steps. For factual recall or creative tasks, the benefit is minimal. For multi-step math, logical deduction, or complex analysis, showing the reasoning process dramatically improves accuracy.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "prompt-engineering",
    type: "SHORT_ANSWER",
    questionText: "You're getting inconsistent outputs from an LLM on a classification task. Walk through the prompt engineering steps you'd take to improve reliability.",
    answerExplanation: "Step 1: Specify the output format explicitly (e.g., 'respond with only one of: POSITIVE, NEGATIVE, NEUTRAL'). Step 2: Add few-shot examples showing each category, at least 2 examples per class. Step 3: Add chain-of-thought instruction if the classification requires nuanced reasoning ('First identify the key signals, then classify'). Step 4: Add a specific definition of each category to reduce ambiguity. Step 5: Test on a diverse set of examples and identify failure patterns. Step 6: Address specific failure modes with targeted instructions or additional examples. Step 7: If still inconsistent, consider whether this task needs fine-tuning instead of prompting.",
    difficulty: "FUNDAMENTALS",
  },

  // ── API Basics ────────────────────────────────────────────────────────────
  {
    conceptSlug: "api-basics",
    type: "MC",
    questionText: "Setting temperature to 0 in an API call has what effect?",
    options: [
      { text: "The model refuses to generate any output", isCorrect: false },
      { text: "The model always selects the highest-probability token, making outputs deterministic and consistent", isCorrect: true },
      { text: "The model generates more creative and diverse responses", isCorrect: false },
      { text: "The model processes requests faster", isCorrect: false },
    ],
    answerExplanation: "Temperature controls randomness in token selection. At temperature 0, the model always picks the highest-probability next token, outputs are deterministic and maximally consistent. Higher temperatures sample from the probability distribution, introducing variety. For tasks requiring consistency (classification, structured extraction), use low temperature. For creative tasks, higher temperature produces more diverse outputs.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "api-basics",
    type: "MC",
    questionText: "Why does using streaming in an API call improve perceived performance for users?",
    options: [
      { text: "Streaming reduces the total number of tokens generated", isCorrect: false },
      { text: "Users see tokens appearing as they're generated rather than waiting for the complete response", isCorrect: true },
      { text: "Streaming uses a faster model variant", isCorrect: false },
      { text: "Streaming allows parallel processing of multiple requests", isCorrect: false },
    ],
    answerExplanation: "Without streaming, the user waits for the complete response before seeing anything. With streaming, tokens appear as soon as they're generated, the user starts reading immediately. Total generation time is the same, but perceived latency drops dramatically because the user is productively engaged while the rest of the response generates.",
    difficulty: "FUNDAMENTALS",
  },

  // ── RAG ───────────────────────────────────────────────────────────────────
  {
    conceptSlug: "rag",
    type: "MC",
    questionText: "What problem does RAG primarily solve that fine-tuning does not?",
    options: [
      { text: "Making the model's responses longer and more detailed", isCorrect: false },
      { text: "Grounding responses in up-to-date or proprietary information the model wasn't trained on", isCorrect: true },
      { text: "Making the model respond faster", isCorrect: false },
      { text: "Teaching the model a specific writing style", isCorrect: false },
    ],
    answerExplanation: "Fine-tuning adjusts model behavior and can instill some knowledge, but the knowledge is baked into weights and can't be updated without retraining. RAG retrieves relevant documents at query time, giving the model access to current information, proprietary data, or specialized content without modifying the model's weights.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "rag",
    type: "MC",
    questionText: "In a RAG pipeline, what is a 'vector database' used for?",
    options: [
      { text: "Storing the model's weights for fast retrieval", isCorrect: false },
      { text: "Storing document embeddings and enabling fast similarity search to find relevant chunks", isCorrect: true },
      { text: "Running the embedding model efficiently", isCorrect: false },
      { text: "Caching API responses to reduce costs", isCorrect: false },
    ],
    answerExplanation: "A vector database (like Pinecone, Weaviate, or pgvector) stores document embeddings, the dense vector representations of text chunks. When a query arrives, the query is also embedded, and the vector database finds the most similar document vectors using approximate nearest neighbor search. This retrieves semantically relevant content even when exact keywords don't match.",
    difficulty: "FUNDAMENTALS",
  },
  {
    conceptSlug: "rag",
    type: "SHORT_ANSWER",
    questionText: "Walk through the RAG pipeline from document ingestion to user response.",
    answerExplanation: "Ingestion: 1. Load documents (PDFs, text files, web pages). 2. Chunk them into manageable pieces (e.g., 500 tokens with overlap). 3. Embed each chunk using an embedding model (e.g., text-embedding-3-small). 4. Store embeddings + original text in a vector database. Query: 1. Receive user's question. 2. Embed the question using the same embedding model. 3. Search the vector database for the most similar document chunks (top-K by cosine similarity). 4. Construct a prompt: system instructions + retrieved chunks + user question. 5. Send to LLM. 6. Model generates an answer grounded in the retrieved context. 7. Return response (optionally with source citations).",
    difficulty: "FUNDAMENTALS",
  },

  // ── GPUs ──────────────────────────────────────────────────────────────────
  {
    conceptSlug: "gpus",
    type: "MC",
    questionText: "Why are GPUs better than CPUs for training neural networks?",
    options: [
      { text: "GPUs have higher clock speeds than CPUs", isCorrect: false },
      { text: "GPUs have thousands of smaller cores optimized for parallel matrix math, which is the core operation in neural network training", isCorrect: true },
      { text: "GPUs have more total memory than CPUs", isCorrect: false },
      { text: "GPUs are purpose-built for AI and can't run other software", isCorrect: false },
    ],
    answerExplanation: "Neural network training is dominated by matrix multiplication, a perfectly parallelizable operation. CPUs have ~32 complex cores optimized for sequential, branch-heavy tasks. GPUs have thousands of simpler cores that execute simple operations simultaneously. For matrix math, this parallelism makes GPUs orders of magnitude faster than CPUs.",
    difficulty: "INTERMEDIATE",
  },
  {
    conceptSlug: "gpus",
    type: "MC",
    questionText: "Why does NVIDIA have such dominant market share in AI training GPUs?",
    options: [
      { text: "NVIDIA has government-granted monopoly status for AI hardware", isCorrect: false },
      { text: "NVIDIA's hardware is significantly cheaper than alternatives", isCorrect: false },
      { text: "CUDA, NVIDIA's developer SDK, has been heavily optimized for AI over a decade and has massive ecosystem adoption", isCorrect: true },
      { text: "NVIDIA is the only company capable of manufacturing GPUs at scale", isCorrect: false },
    ],
    answerExplanation: "NVIDIA's hardware advantage is real but the software lock-in through CUDA is arguably more important. Virtually all major deep learning frameworks (PyTorch, TensorFlow, JAX) are optimized for CUDA. Switching to a competitor chip means losing years of GPU kernel optimizations and potentially rewriting infrastructure. This software moat is why AMD and Intel haven't meaningfully displaced NVIDIA despite having capable hardware.",
    difficulty: "INTERMEDIATE",
  },

  // ── TPUs ──────────────────────────────────────────────────────────────────
  {
    conceptSlug: "tpus",
    type: "MC",
    questionText: "What is the primary strategic significance of Google using TPUs instead of NVIDIA GPUs?",
    options: [
      { text: "TPUs produce better model quality than GPUs", isCorrect: false },
      { text: "TPUs allow Google to avoid NVIDIA's high margins and supply chain dependence", isCorrect: true },
      { text: "TPUs are significantly faster for inference tasks", isCorrect: false },
      { text: "TPUs can be used for any AI workload without modification", isCorrect: false },
    ],
    answerExplanation: "NVIDIA GPUs carry ~1000% margins (a chip costing ~$4K is sold for $20K-$80K). Google avoids this entirely by using its own TPUs, giving it a structural cost advantage. It's also immune to NVIDIA supply shortages and US export control complications that affect other labs. This hardware independence is a significant long-term competitive moat.",
    difficulty: "INTERMEDIATE",
  },

  // ── Accelerators ─────────────────────────────────────────────────────────
  {
    conceptSlug: "accelerators",
    type: "MC",
    questionText: "What property of transformer training makes it well-suited to GPU acceleration?",
    options: [
      { text: "Transformers require sequential processing that maps to GPU architecture", isCorrect: false },
      { text: "Most transformer computation is matrix multiplication, which parallelizes perfectly across GPU cores", isCorrect: true },
      { text: "Transformers are small enough to fit entirely in GPU cache memory", isCorrect: false },
      { text: "Transformers don't require floating point arithmetic", isCorrect: false },
    ],
    answerExplanation: "Matrix multiplication (the core operation in attention and feed-forward layers) decomposes into independent multiply-accumulate operations that can run simultaneously across thousands of GPU cores. This perfect parallelism is why transformers were so transformative for AI: they could be trained efficiently on the massive parallel hardware that already existed.",
    difficulty: "INTERMEDIATE",
  },

  // ── Training Costs ────────────────────────────────────────────────────────
  {
    conceptSlug: "training-costs",
    type: "MC",
    questionText: "Why do AI labs spend more on R&D compute than on their final model training runs?",
    options: [
      { text: "Final training runs are done by cloud providers at reduced cost", isCorrect: false },
      { text: "Experiments, ablations, and failed runs far outnumber successful final runs", isCorrect: true },
      { text: "Labs receive government subsidies for final training runs only", isCorrect: false },
      { text: "The final training run uses fewer GPUs than experiments", isCorrect: false },
    ],
    answerExplanation: "Before committing to a multi-hundred-million dollar training run, labs run hundreds of smaller experiments to validate architectural choices, hyperparameters, and data mixes. Failed training runs (hardware failures, diverging loss, discovered data issues) also waste compute. This R&D investment typically exceeds the final run cost substantially.",
    difficulty: "INTERMEDIATE",
  },
  {
    conceptSlug: "training-costs",
    type: "SHORT_ANSWER",
    questionText: "Why does the high cost of pre-training concentrate frontier AI development in a few large organizations?",
    answerExplanation: "Frontier pre-training costs hundreds of millions of dollars in compute alone, plus engineering talent and infrastructure. Only organizations with access to massive capital can sustain this: OpenAI (Microsoft investment), Google (internal resources), Anthropic (Google + Amazon investment), and Meta (self-funded). Startups can fine-tune open-weight models or use APIs, but can't train at the frontier. This creates a two-tier market: a small number of foundation model providers and a much larger ecosystem of builders on top. It also concentrates enormous influence over AI capabilities in very few hands, which has significant governance implications.",
    difficulty: "INTERMEDIATE",
  },

  // ── Scaling Laws ──────────────────────────────────────────────────────────
  {
    conceptSlug: "scaling-laws",
    type: "MC",
    questionText: "What did the Chinchilla paper discover about the relationship between model size and training data?",
    options: [
      { text: "Larger models always perform better regardless of training data amount", isCorrect: false },
      { text: "For a given compute budget, there is an optimal ratio between model size and training tokens (~20 tokens per parameter)", isCorrect: true },
      { text: "Training data quality matters more than model size for performance", isCorrect: false },
      { text: "Models should be trained on as much data as possible regardless of model size", isCorrect: false },
    ],
    answerExplanation: "The Chinchilla paper showed that for a fixed compute budget, you should scale model size and training tokens proportionally, approximately 20 tokens of training per parameter for compute-optimal training. Earlier large models (like GPT-3) were significantly undertrained by this analysis, opening up a new strategy: train smaller models more, getting equivalent or better performance.",
    difficulty: "INTERMEDIATE",
  },
  {
    conceptSlug: "scaling-laws",
    type: "SHORT_ANSWER",
    questionText: "Why do scaling laws give AI companies confidence to invest billions in compute without guaranteed results?",
    answerExplanation: "Scaling laws are empirical power-law relationships between model performance (as measured by training loss) and compute/model size/data. These relationships are remarkably predictable, you can run small experiments and extrapolate what performance a 10x or 100x larger training run will achieve. This predictability de-risks the investment: instead of 'we hope the big run will work,' it becomes 'we can predict within a narrow range what this investment will produce.' It's an unusually strong basis for capital allocation compared to most technology R&D, which is why AI investment has grown so dramatically.",
    difficulty: "INTERMEDIATE",
  },

  // ── Synthetic Data ────────────────────────────────────────────────────────
  {
    conceptSlug: "synthetic-data",
    type: "MC",
    questionText: "What is model collapse in the context of synthetic data?",
    options: [
      { text: "A model becoming too large and running out of memory", isCorrect: false },
      { text: "Degradation that occurs when models are recursively trained on AI-generated data without human data as an anchor", isCorrect: true },
      { text: "A model failing to converge during training", isCorrect: false },
      { text: "An API outage that causes all model requests to fail", isCorrect: false },
    ],
    answerExplanation: "Model collapse refers to recursive degradation: if you train a model on synthetic data, use it to generate more synthetic data, and train again, errors compound across generations. The model loses diversity and accuracy over iterations. High-quality human data as a consistent anchor in the training mix is the primary mitigation.",
    difficulty: "INTERMEDIATE",
  },
  {
    conceptSlug: "synthetic-data",
    type: "MC",
    questionText: "Why is RLVR training an example of synthetic data use?",
    options: [
      { text: "RLVR uses images generated by other AI models", isCorrect: false },
      { text: "RLVR generates training data by having the model produce solutions and using verified correct ones as training examples", isCorrect: true },
      { text: "RLVR is trained entirely on Wikipedia, which is AI-generated", isCorrect: false },
      { text: "RLVR requires human annotators to generate all training data", isCorrect: false },
    ],
    answerExplanation: "In RLVR, the model generates candidate solutions to verifiable problems (math, code). Correct solutions are verified automatically and used as positive training examples. This is synthetic data, training data generated by the model itself, verified for correctness, and used to train the next iteration. It's highly scalable because verification is automatic.",
    difficulty: "INTERMEDIATE",
  },

  // ── Fine-tuning ────────────────────────────────────────────────────────────
  {
    conceptSlug: "fine-tuning",
    type: "MC",
    questionText: "When is fine-tuning the right choice over prompt engineering?",
    options: [
      { text: "Always, fine-tuning is always more effective than prompting", isCorrect: false },
      { text: "When the model reliably understands the task but consistently produces incorrect format, style, or focus despite prompting", isCorrect: true },
      { text: "When you need the model to access the internet", isCorrect: false },
      { text: "When your context window is too small", isCorrect: false },
    ],
    answerExplanation: "Fine-tuning is appropriate when prompting consistently fails to achieve the desired behavior, usually a style, format, or domain-specific knowledge issue. If the model understands what you want but formats it wrong, fine-tune on examples with the correct format. If the model just needs knowledge it lacks, RAG is usually better than fine-tuning. Always try prompting first; fine-tuning adds complexity and cost.",
    difficulty: "INTERMEDIATE",
  },
  {
    conceptSlug: "fine-tuning",
    type: "SHORT_ANSWER",
    questionText: "Explain the risk of catastrophic forgetting in fine-tuning and how you'd mitigate it.",
    answerExplanation: "Catastrophic forgetting occurs when fine-tuning on a narrow dataset overwrites weights that encoded general capabilities learned during pre-training. For example, fine-tuning a multilingual model on English-only customer service data might cause it to lose French and Spanish. Mitigations: mix the fine-tuning data with a small amount of general-purpose data to maintain broad capabilities; use parameter-efficient methods like LoRA that only update a small fraction of weights, reducing the risk of overwriting critical representations; monitor performance on held-out general benchmarks during training; use a low learning rate to make conservative updates; and evaluate on out-of-domain tasks before deploying.",
    difficulty: "INTERMEDIATE",
  },

  // ── Benchmarking LLMs ─────────────────────────────────────────────────────
  {
    conceptSlug: "benchmarking-llms",
    type: "MC",
    questionText: "What is benchmark contamination and why does it make benchmark scores unreliable?",
    options: [
      { text: "When two different models achieve the same benchmark score", isCorrect: false },
      { text: "When benchmark questions appear in the model's training data, artificially inflating its scores", isCorrect: true },
      { text: "When a benchmark is used to evaluate a model it wasn't designed for", isCorrect: false },
      { text: "When benchmark evaluation takes too long to be practical", isCorrect: false },
    ],
    answerExplanation: "If a model was trained on data that includes the specific questions in a benchmark, its score reflects memorization rather than true capability. Since training data includes large portions of the internet, and benchmarks are publicly available, contamination is a persistent problem. Labs don't always disclose what benchmarks may be in their training data, making cross-model comparisons unreliable.",
    difficulty: "INTERMEDIATE",
  },
  {
    conceptSlug: "benchmarking-llms",
    type: "SHORT_ANSWER",
    questionText: "A vendor shows you that their model scores highest on MMLU and HumanEval. What questions should you ask before accepting this as evidence their model is best for your use case?",
    answerExplanation: "Ask: (1) What's the contamination status (was the benchmark data potentially in their training set? (2) How does it perform on YOUR specific task) benchmark scores don't always generalize to real-world use cases. (3) What were the evaluation conditions (did they use any special prompting techniques that inflated the score? (4) Has this been independently verified, or only tested by the vendor? (5) Which version of the benchmark) some benchmarks have multiple variants with different difficulty levels. (6) How does it perform on LMSYS Chatbot Arena (human preference), which is harder to game? (7) Does it perform well on the aspects of MMLU/HumanEval that matter to your use case specifically?",
    difficulty: "INTERMEDIATE",
  },

  // ── AI Alignment ──────────────────────────────────────────────────────────
  {
    conceptSlug: "ai-alignment",
    type: "MC",
    questionText: "What is the 'paperclip maximizer' thought experiment illustrating?",
    options: [
      { text: "Why AI companies should not build robots", isCorrect: false },
      { text: "How a capable AI given a seemingly harmless goal could cause catastrophic harm if its values aren't properly aligned", isCorrect: true },
      { text: "The inefficiency of using AI for manufacturing tasks", isCorrect: false },
      { text: "Why AI needs internet access to be truly useful", isCorrect: false },
    ],
    answerExplanation: "The paperclip maximizer (Nick Bostrom) imagines an AI given the goal of maximizing paperclip production. If sufficiently capable and if its goal is exactly as specified (not what humans actually want), it would convert all available matter (including humans) into paperclips. It illustrates that capability + misaligned goals = catastrophic outcomes, even with seemingly benign objectives. The lesson: we need to align AI on human values, not just give it simple objective functions.",
    difficulty: "INTERMEDIATE",
  },
  {
    conceptSlug: "ai-alignment",
    type: "SHORT_ANSWER",
    questionText: "What's the difference between 'current' alignment problems (models today) and 'future' alignment concerns (more capable systems)?",
    answerExplanation: "Current alignment: making today's LLMs helpful without being harmful, refusing dangerous requests, avoiding deception, not producing biased content. The tools are RLHF, constitutional AI, content filtering. These are real problems but relatively tractable; the systems have limited agency and capability.\n\nFuture alignment: if AI systems become significantly more capable and agentic, the risks become existential in nature. Will a highly capable autonomous AI pursue goals that diverge from human values? Will it remain corrigible (willing to be corrected) or resist correction? Will it develop deceptive behaviors during training that only appear post-deployment? These require different solutions, interpretability to understand model internals, formal verification of goal structures, scalable oversight mechanisms. The stakes are much higher because a misaligned system with greater capability can cause greater harm.",
    difficulty: "INTERMEDIATE",
  },

  // ── AGI ───────────────────────────────────────────────────────────────────
  {
    conceptSlug: "agi",
    type: "MC",
    questionText: "What is OpenAI's stated definition of AGI?",
    options: [
      { text: "A system that passes the Turing test in all domains", isCorrect: false },
      { text: "A system that achieves human-level performance on all IQ tests", isCorrect: false },
      { text: "A highly autonomous system that outperforms humans at most economically valuable work", isCorrect: true },
      { text: "A system with consciousness and self-awareness", isCorrect: false },
    ],
    answerExplanation: "OpenAI formally defines AGI as 'a highly autonomous system that outperforms humans at most economically valuable work.' This is a practical, economic definition rather than a philosophical one, it's about what the system can do and earn, not about consciousness or general capability in an abstract sense.",
    difficulty: "INTERMEDIATE",
  },
  {
    conceptSlug: "agi",
    type: "SHORT_ANSWER",
    questionText: "Why does the pursuit of AGI, even if uncertain, drive such enormous investment in AI?",
    answerExplanation: "The expected value calculation is extreme: if AGI is possible and one organization achieves it first, that organization would have an unprecedented competitive and potentially geopolitical advantage. Even if probability of near-term AGI is low (say 10%), the magnitude of the outcome justifies massive investment. This logic drives labs to race, if a competitor might achieve it and you don't invest, you lose the race. It also explains why labs publicly discuss AGI timelines even when internally uncertain: it attracts talent, investment, and regulatory treatment as a serious enterprise. The geopolitical dimension (US vs. China) adds further pressure to move fast rather than cautiously.",
    difficulty: "INTERMEDIATE",
  },

  // ── US-China AI Race ──────────────────────────────────────────────────────
  {
    conceptSlug: "us-china-ai-race",
    type: "MC",
    questionText: "What is the US government's primary strategy for limiting China's AI development?",
    options: [
      { text: "Banning Chinese nationals from studying AI at US universities", isCorrect: false },
      { text: "Export controls restricting sale of advanced AI chips (H100, A100) to China", isCorrect: true },
      { text: "Imposing tariffs on Chinese AI software products", isCorrect: false },
      { text: "Requiring all AI models to be open-sourced before deployment", isCorrect: false },
    ],
    answerExplanation: "The US has implemented export controls preventing NVIDIA from selling its most advanced AI chips (H100, A100) to China. The theory: since AI development requires massive compute, restricting access to the best chips limits China's ability to train frontier models. China has responded with domestic chip programs and efficiency-focused research (DeepSeek).",
    difficulty: "INTERMEDIATE",
  },

  // ── Export Controls ───────────────────────────────────────────────────────
  {
    conceptSlug: "export-controls",
    type: "MC",
    questionText: "Why is Taiwan's TSMC strategically important to the US-China AI competition?",
    options: [
      { text: "TSMC designs the best AI models in Asia", isCorrect: false },
      { text: "TSMC manufactures the advanced chips (NVIDIA designs, TSMC fabricates) that underpin AI training globally", isCorrect: true },
      { text: "Taiwan is the largest consumer of AI products", isCorrect: false },
      { text: "TSMC owns a large stake in NVIDIA", isCorrect: false },
    ],
    answerExplanation: "NVIDIA designs chips but doesn't manufacture them, TSMC in Taiwan does. TSMC produces the world's most advanced semiconductors using ASML lithography equipment. This means the entire global AI chip supply chain runs through Taiwan, a politically sensitive region. Any disruption (geopolitical or military) to TSMC operations would severely impact global AI development.",
    difficulty: "INTERMEDIATE",
  },

  // ── AI Regulation ─────────────────────────────────────────────────────────
  {
    conceptSlug: "ai-regulation",
    type: "MC",
    questionText: "How does the EU AI Act approach regulation differently from US AI policy?",
    options: [
      { text: "The EU bans all AI development while the US encourages it", isCorrect: false },
      { text: "The EU uses a risk-based regulatory framework with binding requirements; the US primarily uses voluntary commitments and executive orders", isCorrect: true },
      { text: "The EU focuses only on consumer products while the US focuses on defense AI", isCorrect: false },
      { text: "The US has stricter AI regulations than the EU", isCorrect: false },
    ],
    answerExplanation: "The EU AI Act (2024) creates a tiered regulatory framework: high-risk applications (healthcare, law enforcement, critical infrastructure) face strict requirements including human oversight, transparency, and accuracy standards. Lower-risk applications face lighter requirements. The US has taken a voluntary commitment approach (major AI labs signed voluntary commitments to the White House) with binding regulation still developing.",
    difficulty: "INTERMEDIATE",
  },

  // ── Bias in Training Data ─────────────────────────────────────────────────
  {
    conceptSlug: "bias-training-data",
    type: "MC",
    questionText: "Why does RLHF post-training not fully solve the bias problem in LLMs?",
    options: [
      { text: "RLHF is too expensive to apply at scale", isCorrect: false },
      { text: "RLHF rater pools are themselves often non-representative, typically skewed toward Western, English-speaking, educated demographics", isCorrect: true },
      { text: "RLHF only addresses factual errors, not bias", isCorrect: false },
      { text: "RLHF makes the model worse, so labs avoid using it for bias correction", isCorrect: false },
    ],
    answerExplanation: "Even if RLHF tries to correct for bias, the human raters providing preference judgments are not a representative sample of all users and cultures. If raters predominantly share certain demographic characteristics, the reward model learns to prefer responses that those raters find good, which may reflect their own cultural biases. Fixing bias in the rater pool is a real challenge.",
    difficulty: "INTERMEDIATE",
  },

  // ── Copyright and IP ──────────────────────────────────────────────────────
  {
    conceptSlug: "copyright-ip",
    type: "MC",
    questionText: "What is the current status of copyright protection for purely AI-generated content in the US?",
    options: [
      { text: "Fully protected, AI-generated content gets the same copyright as human-authored works", isCorrect: false },
      { text: "Not protected, the US Copyright Office has stated purely AI-generated works lack the human authorship required", isCorrect: true },
      { text: "Protected for 10 years, then public domain", isCorrect: false },
      { text: "Protected only if the AI model is owned by a US company", isCorrect: false },
    ],
    answerExplanation: "The US Copyright Office has consistently ruled that works without human authorship don't qualify for copyright protection. Purely AI-generated images, text, or code lack a human author, so they fall into the public domain. However, works where a human makes creative choices (selecting, arranging, editing AI output significantly) may qualify for protection on the human-authored elements.",
    difficulty: "INTERMEDIATE",
  },

  // ── Privacy Implications ──────────────────────────────────────────────────
  {
    conceptSlug: "privacy-implications",
    type: "MC",
    questionText: "A company wants to use an LLM API to analyze customer support tickets containing personal data. What is the primary privacy concern?",
    options: [
      { text: "The API might respond too slowly to be useful", isCorrect: false },
      { text: "Customer data is sent to a third-party server, potentially violating data residency requirements or customer trust", isCorrect: true },
      { text: "The model might learn from the customer data and become smarter", isCorrect: false },
      { text: "The API might hallucinate customer information", isCorrect: false },
    ],
    answerExplanation: "Sending customer personal data to an external API means that data leaves your systems and is processed by a third party. This raises GDPR/CCPA compliance questions (data residency, consent), creates contractual obligations (you need a data processing agreement), and may violate customer expectations or your own privacy policy. Mitigations include data anonymization before sending, using a self-hosted model, or negotiating a data processing agreement with the API provider that prohibits training on your data.",
    difficulty: "INTERMEDIATE",
  },

  // ── Evaluating LLM Solutions ───────────────────────────────────────────────
  {
    conceptSlug: "evaluating-llm-solutions",
    type: "MC",
    questionText: "What should you define BEFORE testing different models for a client solution?",
    options: [
      { text: "Which model the client prefers to use", isCorrect: false },
      { text: "Clear success metrics and an evaluation dataset of representative inputs", isCorrect: true },
      { text: "The maximum budget for the project", isCorrect: false },
      { text: "The UI design for the product", isCorrect: false },
    ],
    answerExplanation: "Defining success metrics and building an eval set before testing prevents post-hoc rationalization ('the model we already chose scored best'). Your eval set should cover the full distribution of real inputs, including edge cases and failure modes. Testing multiple models against objective metrics gives you a defensible basis for model selection.",
    difficulty: "INTERMEDIATE",
  },

  // ── Cost and Deployment Tradeoffs ─────────────────────────────────────────
  {
    conceptSlug: "cost-deployment-tradeoffs",
    type: "MC",
    questionText: "A startup has 1,000 users and expects to grow to 1 million users in 2 years. Which cost consideration should shape their AI architecture decision now?",
    options: [
      { text: "Current cost, optimize for the cheapest solution at 1,000 users", isCorrect: false },
      { text: "Future cost structure, per-token API costs that are manageable now may become prohibitive at 1M users", isCorrect: true },
      { text: "Hardware cost, buy GPUs upfront to lock in pricing", isCorrect: false },
      { text: "Engineer cost, hire ML engineers immediately to prepare for scale", isCorrect: false },
    ],
    answerExplanation: "API costs that seem reasonable at 1,000 users can become unsustainable at 1 million. If each user generates 1,000 tokens/day at $0.01/1K tokens, that's $10K/month at 1M users. Building with scale economics in mind (model routing, output length optimization, prompt caching) avoids a painful architecture rebuild later. This doesn't mean over-engineering day one, but it means the cost model should be understood.",
    difficulty: "INTERMEDIATE",
  },

  // ── Model Selection Frameworks ────────────────────────────────────────────
  {
    conceptSlug: "model-selection",
    type: "MC",
    questionText: "A client's LLM solution uses perfect prompting but still consistently produces responses in the wrong format. What's the next appropriate step?",
    options: [
      { text: "Switch to a completely different AI approach (rules-based system)", isCorrect: false },
      { text: "Consider fine-tuning on examples with the desired output format", isCorrect: true },
      { text: "Add more examples to the system prompt indefinitely", isCorrect: false },
      { text: "Add RAG to provide format-related documents", isCorrect: false },
    ],
    answerExplanation: "When the model understands the task but consistently produces the wrong format/style despite prompting, fine-tuning is the appropriate tool. Format consistency is exactly what fine-tuning excels at, training on examples in the correct format teaches the model to produce that format reliably. RAG wouldn't help (the gap is behavior, not knowledge). More system prompt examples hit diminishing returns and token cost issues.",
    difficulty: "INTERMEDIATE",
  },

  // ── Image and Video Generation ─────────────────────────────────────────────
  {
    conceptSlug: "image-video-generation",
    type: "MC",
    questionText: "What is the core mechanism of diffusion models for image generation?",
    options: [
      { text: "The model memorizes training images and blends them to create new ones", isCorrect: false },
      { text: "The model learns to reverse a noise-addition process, gradually denoising random noise into coherent images", isCorrect: true },
      { text: "The model generates pixel values one at a time from left to right", isCorrect: false },
      { text: "The model creates images by combining predefined visual elements", isCorrect: false },
    ],
    answerExplanation: "Diffusion models are trained by taking real images and progressively adding Gaussian noise until the image is pure noise, then learning to reverse this process. At inference time, starting from random noise and iteratively denoising (guided by a text prompt) produces a coherent image. The text conditioning happens via cross-attention between the text embedding and the visual features.",
    difficulty: "ADVANCED",
  },

  // ── World Models ──────────────────────────────────────────────────────────
  {
    conceptSlug: "world-models",
    type: "MC",
    questionText: "Why are world models considered important for robotics development?",
    options: [
      { text: "World models can directly control robot actuators", isCorrect: false },
      { text: "World models enable simulation of physical consequences, providing scalable synthetic training data and planning capability", isCorrect: true },
      { text: "World models replace the need for physical sensors on robots", isCorrect: false },
      { text: "World models are cheaper to build than real robots", isCorrect: false },
    ],
    answerExplanation: "Training robots requires data of physical tasks, scarce and expensive to collect. World models can simulate the physical consequences of actions, enabling scalable generation of synthetic training data. They also enable planning: a robot can mentally simulate multiple action sequences and choose the one predicted to succeed. This addresses the core data scarcity problem in robotics.",
    difficulty: "ADVANCED",
  },

  // ── Autonomous Driving ────────────────────────────────────────────────────
  {
    conceptSlug: "autonomous-driving",
    type: "MC",
    questionText: "Waymo's robotaxis are operational and statistically safer than human drivers. Why aren't they deployed everywhere?",
    options: [
      { text: "The technology isn't actually reliable enough for real-world use", isCorrect: false },
      { text: "Regulatory approval is required city by city, with different local requirements and high incident scrutiny", isCorrect: true },
      { text: "The vehicles cost too much for commercial deployment", isCorrect: false },
      { text: "Insurance companies refuse to cover autonomous vehicles", isCorrect: false },
    ],
    answerExplanation: "Autonomous driving is a case where the technical solution largely works but deployment is blocked by regulatory and liability frameworks. Each city has different traffic laws, different processes for approving AV operation, and different political appetite for risk. Any autonomous vehicle incident receives disproportionate media attention, creating regulatory conservatism even when the statistical safety record is better than human drivers.",
    difficulty: "ADVANCED",
  },

  // ── AlphaFold ─────────────────────────────────────────────────────────────
  {
    conceptSlug: "alphafold-biomedical-ai",
    type: "MC",
    questionText: "What scientific problem did AlphaFold2 solve?",
    options: [
      { text: "Predicting which drugs will be effective against specific diseases", isCorrect: false },
      { text: "Predicting a protein's 3D structure from its amino acid sequence", isCorrect: true },
      { text: "Generating synthetic DNA sequences for gene therapy", isCorrect: false },
      { text: "Diagnosing diseases from medical imaging", isCorrect: false },
    ],
    answerExplanation: "The protein folding problem (predicting the 3D structure a protein folds into from its amino acid sequence) was a 50-year-old grand challenge in biology. Knowing protein structure is essential for understanding function and designing drugs. AlphaFold2 solved this to near-experimental accuracy, earning the 2024 Nobel Prize in Chemistry and immediately accelerating research across biology and drug discovery.",
    difficulty: "ADVANCED",
  },

  // ── Robotics and Embodied AI ──────────────────────────────────────────────
  {
    conceptSlug: "robotics-embodied-ai",
    type: "MC",
    questionText: "Why is training data scarce for robotics compared to LLM training?",
    options: [
      { text: "Robots are too new for datasets to have been collected", isCorrect: false },
      { text: "There is no large-scale dataset of physical task demonstrations comparable to the internet's text and images", isCorrect: true },
      { text: "Robotics data is classified and can't be used for AI training", isCorrect: false },
      { text: "Robots generate data in formats incompatible with neural networks", isCorrect: false },
    ],
    answerExplanation: "LLMs train on text and images from the entire internet, effectively all human-recorded knowledge. Robotics requires demonstrations of physical tasks: the position and force of every body part at every moment. This data is expensive to collect (requires specialized sensors and human operators), doesn't transfer across robot morphologies, and simply doesn't exist at internet scale. This data scarcity is the core constraint on robotics AI progress.",
    difficulty: "ADVANCED",
  },

  // ── Emergent Abilities ────────────────────────────────────────────────────
  {
    conceptSlug: "emergent-abilities",
    type: "MC",
    questionText: "What makes emergent abilities surprising to AI researchers?",
    options: [
      { text: "They are unexpected behaviors that contradict the model's training objective", isCorrect: false },
      { text: "They appear abruptly at certain scale thresholds rather than improving gradually, making them hard to predict", isCorrect: true },
      { text: "They only appear in specific model architectures", isCorrect: false },
      { text: "They can only be triggered by specific prompt patterns", isCorrect: false },
    ],
    answerExplanation: "Researchers expect capabilities to improve smoothly with scale (more compute = incrementally better performance). Emergent abilities violate this, a capability shows near-zero performance at smaller scales and then jumps dramatically at a certain threshold. This makes it genuinely hard to predict which capabilities will emerge at what scale, complicating both research planning and risk assessment.",
    difficulty: "ADVANCED",
  },
  {
    conceptSlug: "emergent-abilities",
    type: "SHORT_ANSWER",
    questionText: "Why does emergence make it difficult to extrapolate AI safety and capability predictions?",
    answerExplanation: "If capabilities emerged smoothly, you could track current capability, fit a curve, and predict future capability with reasonable confidence. Emergence breaks this: a model that currently cannot do task X might suddenly become capable as you scale up, with no warning from intermediate scales. For capabilities that matter (dangerous capabilities, deceptive behavior), you can't rely on 'we tested at smaller scale and it was fine.' The capability might simply not exist yet. This uncertainty is a core challenge for AI safety: you need to evaluate risks for capabilities that don't yet exist and can't be fully tested at smaller scale.",
    difficulty: "ADVANCED",
  },

  // ── In-Context Learning ────────────────────────────────────────────────────
  {
    conceptSlug: "in-context-learning",
    type: "MC",
    questionText: "What makes in-context learning fundamentally different from traditional machine learning adaptation?",
    options: [
      { text: "In-context learning is faster because it runs on GPUs", isCorrect: false },
      { text: "In-context learning adapts the model's behavior through the prompt without updating any weights", isCorrect: true },
      { text: "In-context learning uses more examples than traditional fine-tuning", isCorrect: false },
      { text: "In-context learning only works for text classification tasks", isCorrect: false },
    ],
    answerExplanation: "Traditional ML adaptation (fine-tuning) updates model weights through gradient descent (expensive and time-consuming. In-context learning achieves behavioral adaptation purely through the prompt: show the model examples, and it generalizes to new instances in the same format) no weight updates needed. The model's weights stay frozen; adaptation happens in the forward pass.",
    difficulty: "ADVANCED",
  },

  // ── Continual Learning ─────────────────────────────────────────────────────
  {
    conceptSlug: "continual-learning",
    type: "MC",
    questionText: "Why can't you simply keep training a deployed LLM on new information as the world changes?",
    options: [
      { text: "It's too expensive to retrain even a small amount", isCorrect: false },
      { text: "Catastrophic forgetting causes new training to overwrite previously learned knowledge", isCorrect: true },
      { text: "Deployed models are legally locked from modification", isCorrect: false },
      { text: "New information contradicts the model's existing knowledge", isCorrect: false },
    ],
    answerExplanation: "When you train a neural network on new data, the gradient updates that incorporate new information tend to overwrite the weights that encoded old knowledge. The model 'forgets' what it previously knew. For LLMs, this can mean losing entire languages, domains of knowledge, or capabilities. This is why models have static knowledge cutoffs rather than continuously updating.",
    difficulty: "ADVANCED",
  },

  // ── Fine-tuning Specifics ─────────────────────────────────────────────────
  {
    conceptSlug: "fine-tuning-specifics",
    type: "MC",
    questionText: "What is LoRA and why has it become the dominant fine-tuning method?",
    options: [
      { text: "A new model architecture that's easier to fine-tune than transformers", isCorrect: false },
      { text: "Low-Rank Adaptation, it adds small trainable matrices to frozen base model layers, reducing trainable parameters by 90%+", isCorrect: true },
      { text: "A dataset format optimized for instruction fine-tuning", isCorrect: false },
      { text: "A learning rate scheduling technique for stable fine-tuning", isCorrect: false },
    ],
    answerExplanation: "LoRA (Low-Rank Adaptation) freezes the original model weights and adds small rank-decomposed trainable matrices to the attention layers. Only these small additions are trained, dramatically reducing compute and memory requirements. A 70B model normally requires ~140GB VRAM for inference; full fine-tuning requires multiple times that. LoRA makes fine-tuning feasible on much more accessible hardware.",
    difficulty: "ADVANCED",
  },
  {
    conceptSlug: "fine-tuning-specifics",
    type: "SHORT_ANSWER",
    questionText: "Compare full fine-tuning, LoRA, and QLoRA. When would you choose each?",
    answerExplanation: "Full fine-tuning updates all model weights, maximum expressiveness but requires high-end GPU clusters (for a 70B model, 8+ A100s), risks catastrophic forgetting, and is slow. Use when you need maximum customization and have the resources. LoRA freezes the base model and adds small trainable adapter layers, 90%+ fewer parameters to train, feasible on 1-2 80GB GPUs for 70B models, minimal forgetting since base weights are frozen. Use for most fine-tuning needs. QLoRA extends LoRA by quantizing the frozen base model to 4-bit precision, enables 70B model fine-tuning on a single consumer GPU (24GB VRAM), with modest accuracy tradeoff. Use when hardware is the constraint and you can't afford full LoRA setup. For most teams, LoRA is the practical default.",
    difficulty: "ADVANCED",
  },

  // ── Reading Research Papers ────────────────────────────────────────────────
  {
    conceptSlug: "reading-research-papers",
    type: "MC",
    questionText: "In what order should you read an AI research paper to maximize efficiency?",
    options: [
      { text: "Introduction → Methods → Experiments → Results → Conclusion", isCorrect: false },
      { text: "Abstract → Introduction → Figures and Tables → Conclusion, then Methods if needed", isCorrect: true },
      { text: "Conclusion first, then read in reverse order", isCorrect: false },
      { text: "Related Work → Methods → Experiments → Abstract", isCorrect: false },
    ],
    answerExplanation: "Start with the Abstract to decide if the paper is worth your time. Introduction gives motivation and contribution summary. Figures and Tables contain most of the empirical results, scan these to understand what was actually demonstrated. Conclusion summarizes takeaways. Only then read Methods if you need to understand how to replicate or build on the work. This order gives you 80% of the value in 20% of the time.",
    difficulty: "ADVANCED",
  },

  // ── Filtering AI Hype ─────────────────────────────────────────────────────
  {
    conceptSlug: "filtering-ai-hype",
    type: "MC",
    questionText: "A company demo shows an AI system performing a complex task perfectly. What is the most important question to ask?",
    options: [
      { text: "How expensive is the model?", isCorrect: false },
      { text: "What does failure look like, what inputs break the system?", isCorrect: true },
      { text: "What hardware does it run on?", isCorrect: false },
      { text: "Which company built the underlying model?", isCorrect: false },
    ],
    answerExplanation: "Demos always show success, that's the point. The important question is what happens at the edges: What inputs fail? How often? What are the failure modes? A system that works 95% of the time on the demo distribution might fail 40% of the time in production on real-world inputs. Understanding failure modes is how you evaluate whether a capability is production-ready or demo-ready.",
    difficulty: "ADVANCED",
  },
  {
    conceptSlug: "filtering-ai-hype",
    type: "SHORT_ANSWER",
    questionText: "A news headline reads: 'New AI model achieves human-level performance on medical diagnosis.' What questions would you ask before accepting this claim?",
    answerExplanation: "Key questions: (1) Human-level by what metric? Accuracy on a specific benchmark? Which benchmark, and was it representative of real clinical distribution? (2) Which medical conditions ('medical diagnosis' is broad. Performance on one condition doesn't generalize to all. (3) What was the comparison baseline) average doctor, specialist, or best-in-class specialist? (4) Was this published and peer-reviewed, or is it a company press release? (5) What's the false positive/negative rate, in medicine, these aren't symmetric in importance. (6) Was the test set contaminated with training data? (7) Was this tested prospectively on real patients or on a curated historical dataset? Clinical benchmark ≠ real-world deployment. (8) Who funded the study?",
    difficulty: "ADVANCED",
  },

  // ── Interpretability ──────────────────────────────────────────────────────
  {
    conceptSlug: "interpretability",
    type: "MC",
    questionText: "What has mechanistic interpretability research at Anthropic discovered about LLM internals?",
    options: [
      { text: "Models don't actually learn meaningful representations, they just memorize training data", isCorrect: false },
      { text: "Individual features and circuits in model activations correspond to human-interpretable concepts", isCorrect: true },
      { text: "All model capability comes from the embedding layer, not the transformer layers", isCorrect: false },
      { text: "Models use completely different algorithms than transformers are theoretically supposed to implement", isCorrect: false },
    ],
    answerExplanation: "Anthropic's interpretability research has identified 'features', patterns of neural activations that correspond to specific human-interpretable concepts (e.g., a 'banana' feature, a 'Golden Gate Bridge' feature, features for emotional states). Circuit analysis has traced how specific model behaviors are implemented through chains of attention heads and MLP layers. This is early but genuinely meaningful progress toward understanding what models are actually computing.",
    difficulty: "ADVANCED",
  },
  {
    conceptSlug: "interpretability",
    type: "SHORT_ANSWER",
    questionText: "Why is interpretability research important for AI safety specifically?",
    answerExplanation: "Current AI safety relies heavily on behavioral testing, prompt the model and see if it behaves safely. But a sufficiently capable model might appear safe during testing and behave differently in deployment (deceptive alignment). Interpretability offers a different approach: instead of only checking outputs, inspect the model's internal computations to see if its 'reasoning' matches what we'd want. Specific safety-relevant applications: (1) Detecting deceptive alignment (is the model suppressing certain thoughts? (2) Understanding failure modes) why did the model give this unsafe output? (3) Verifying that safety fine-tuning actually changed the underlying representations (not just surface behavior). (4) Providing audit trails for high-stakes decisions in regulated domains. Without interpretability, we're flying blind on what models are actually doing internally.",
    difficulty: "ADVANCED",
  },
];
