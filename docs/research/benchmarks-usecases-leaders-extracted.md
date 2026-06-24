# Use-case roster: verified leader extractions (2026-06-24)

Supplement to `benchmarks-usecases-research.json`. The deep-research workflow
returned solid definitional content but only one verified live top-3 (EQ-Bench).
Two more were recovered from primary same-origin data files (the same technique
used for the existing 13, e.g. MMLU-Pro's results.csv). Scores are verbatim. No
em or en dashes.

## EQ-Bench Creative Writing v3 (writing) - VERIFIED, independent
Source: https://eqbench.com/creative_writing.html (LLM-judged by eqbench / Sam Paech).
Read 2026-06-23. Ranks by Elo Score; also reports a 0-100 Rubric Score.
1. claude-fable-5 (Anthropic) - Elo 2191.8 (Rubric 84.05)
2. claude-opus-4-7 (Anthropic) - Elo 2179.3 (Rubric 82.85)
3. gpt-5.5 (OpenAI) - Elo 2019.0 (Rubric 85.05)
Not self-reported, not disputed. NEAR-TIE at #1/#2 (12.5 Elo apart); #3 is ~160 below.
Watch-out: metrics disagree, gpt-5.5 has the HIGHEST Rubric (85.05) yet ranks #3 on Elo.

## BFCL V4 (tool use) - VERIFIED, independent (Berkeley Gorilla)
Source: https://gorilla.cs.berkeley.edu/data_overall.csv (backs the JS leaderboard.html).
Board last updated 2026-04-12; metric = Overall Acc (AST-based, reproducible commit f7cf735).
1. Claude-Opus-4-5-20251101 (FC) (Anthropic) - 77.47% Overall Acc
2. Claude-Sonnet-4-5-20250929 (FC) (Anthropic) - 73.24% Overall Acc
3. Gemini-3-Pro-Preview (Prompt) (Google) - 72.51% Overall Acc
Independently evaluated by the Gorilla team, not self-reported. NEAR-TIE at #2/#3 (0.73 pt).
Freshness caveat: April 2026 board, so it predates Opus 4.7/4.8, Gemini 3.1, GPT-5.5.

## OSWorld-Verified (computer use) - VERIFIED, execution-scored
Source: https://os-world.github.io/static/data/osworld_verified_results.xlsx (361-task split).
Read 2026-06-24. Metric = success rate (execution-checked).
1. Pointer Agent w/ Opus 4.7 (Pointer) - 83.6% (301.94/361), 2026-05-21
2. Holo3-35B-A3B (H Company) - 82.6% (296.41/359), 2026-04-20
3. Pointer Agent w/ Sonnet 4.6 (Pointer) - 81.5% (293.22/360), 2026-05-21
Execution-verified, not self-reported. NEAR-TIE at top (83.6 / 82.6 / 81.5 within ~2 pts).
KEY CAVEAT: entries are AGENT SCAFFOLDS, not bare models (#1 and #3 are the same Pointer
scaffold on different base models); a student calls a model, not this whole system.
Leaders now EXCEED the human baseline (72.36%); at the 2024 paper launch the best AI hit 12.24%.

## No verified current top-3 (ship honest-empty or clearly-labeled self-reported)
- LongBench v2 (long context): board is JS-rendered; the only readable figures are a stale
  ~2025-03 snapshot (Gemini-2.5-Pro ~63.3% CoT) that failed verification. Honest-empty.
  Anchor: human experts 53.7%, best direct model 50.1%, o1-preview 57.7%; chance 25%.
- Global-MMLU (multilingual): NO public leaderboard exists in the primary sources (dataset
  card + ACL paper). Honest-empty. Framing: 42 languages, 28% culturally sensitive, rankings
  shift between the full set and the culturally-sensitive subset.
- OmniDocBench (document AI): the only top-3 (MinerU2.5-Pro 95.75 / GLM-OCR 95.22 /
  PaddleOCR-VL-1.5 94.93) is self-reported in the README AND the #1 model shares a maintainer
  (OpenDataLab) with the benchmark. Ship as clearly-labeled self-reported + conflict caveat
  (the arc-agi-2 / mmmu pattern), trust=contested.

## SimpleQA (factuality) - VERIFIED 2026-06-24, manual source + adversarial check
Source: https://www.kaggle.com/benchmarks/openai/simpleqa (Kaggle SimpleQA Leaderboard, OpenAI).
Board last updated 2026-06-01; read 2026-06-24. Metric = Correct (percent of all 4,326 questions
answered correctly), raw accuracy, NOT the F-score SimpleQA also reports. Higher is better. trust=live.
1. Gemini 3.1 Pro Preview (Google) - 74.8% plus or minus 1.4%
2. Gemini 3 Pro Preview (Google) - 70.5% plus or minus 1.4%
3. Gemini 2.5 Flash (Google) - 66.9%  [DISPUTED: rank 3 could not be independently confirmed; seed with disputed=true]
Provenance MIXED (Kaggle reproduces where possible and captures auditable outputs, but some scores can
be publisher-reported), so do not present 74.8% as fully independent. Verb "tops" (74.8 vs 70.5 exceeds
the plus or minus 1.4 intervals, not a statistical tie). NOT a near-tie. Confidence medium (JS-rendered
Kaggle page; rank 3 unconfirmed).
WATCH-OUT (use as the pick caveat): the bars are the Correct column, not the F-score; and the name
"SimpleQA" is overloaded, this Kaggle OpenAI board (74.8 / 70.5) is distinct from the DeepMind SimpleQA
Verified board (different figures around 77 / 72 / 70) and from llm-stats.com (a different 0-to-1
metric). Always name this specific board.
Baseline anchor: 2024-2025 frontier models scored high-40s to about 50 percent (o3 50.5, Claude and
Grok 4 about 48 to 49); the Gemini 3.x generation jumped to the 70s, a recent step-change.

## MMMU-Pro (multimodal / images, charts, documents) - VERIFIED 2026-06-24, manual source + adversarial check
Source: https://artificialanalysis.ai/evaluations/mmmu-pro (Artificial Analysis, INDEPENDENT runs).
Read 2026-06-24. Metric = MMMU-Pro Benchmark Score, percent correct, 0 to 100, higher is better.
trust=near_ceiling.
1. Gemini 3.5 Flash (high) (Google) - 84%
2. Gemini 3.5 Flash (medium) (Google) - 84%
3. Gemini 3.1 Pro Preview (Google) - 82%
NEAR-TIE at the top, but a WITHIN-MODEL tie: ranks 1 and 2 are the SAME Gemini 3.5 Flash model at two
reasoning settings (high and medium), both 84%; the next DISTINCT model is Gemini 3.1 Pro Preview at
82% (within 2 points). Verb "leads, but the top is a statistical tie". Independent, but Artificial
Analysis numbers can differ from the official MMMU-Pro harness and other boards (which rank different
models on top), so treat the exact numbers as one lab's measurement. Confidence high.
WATCH-OUT (use as the pick caveat): the top two slots are the same model at two settings, not two
different models; cite Artificial Analysis specifically.
NOTE: leader labels were corrected against the LIVE AA page; the 24 Jun screenshot showed stale labels
("Gemini 3.5 Flash", "Gemini 3 Pro Preview"); the live page reads "Gemini 3.5 Flash (high)", "Gemini
3.5 Flash (medium)", "Gemini 3.1 Pro Preview".
Baseline anchor: 3,460 questions across 30 disciplines, image plus text; a hardened MMMU that removes
guessing so scores fall sharply; frontier low-to-mid 80s, Claude 4.5 Haiku 59% trails leaders by
20-plus points, so the metric still separates models.

## Design2Code (frontend) - still honest-empty 2026-06-24
No current leaderboard found (manual search turned up nothing). Ship honest-empty: empty=true plus the
paper's dated anchor plus a gapReason (no public current board for screenshot-to-code exists).

## Note: both new leaders are all-Google at the top
SimpleQA top-3 and MMMU-Pro top-3 are entirely Google / Gemini in June 2026. That concentration is
worth one honest caveat line on each pick: a single lab leading a board is a real signal, but it also
means the pick rests on one vendor's standing on one board.
