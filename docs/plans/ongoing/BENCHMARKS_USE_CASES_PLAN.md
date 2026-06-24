# Benchmarks v2: Use-Case Explorer + Honest Model Picker

> Status: PLANNED as of 2026-06-24. Builds directly on PR1 ("The Standings",
> docs/plans/ongoing/BENCHMARKS_PLAN.md), which lives on branch
> `feat/benchmarks-standings` (NOT merged). All v2 work continues on that same
> branch. The FRONT END is being redone in a separate chat with this framing in
> mind; this doc plus the research output is the spec and data foundation for it.
> No em dashes or en dashes anywhere (house rule).

## 1. What changes and why

PR1 answered "what is this benchmark, and can you trust its number." v2 adds the
question students actually have: "I have a task, which model do I pick, and which
benchmark should I even be looking at?"

The use-case framing is our literacy goal aimed at a decision: for a given task,
name the 2 to 3 benchmarks that matter, say how far to trust each, and point to
who currently leads (dated and caveated). benchlm.ai and Artificial Analysis
inspired the shape (the "Explore by use case" grid, the per-use-case page, the
decision-ready picks). We keep our trust-first spine and deliberately reject
their composite scores and unified league table.

## 2. Locked decisions (James, 2026-06-24)

- **Honest picks ONLY.** Every "best for X" names the single benchmark, date, and
  caveat behind it ("Best for factual recall: X, top of SimpleQA, May 2026,
  self-reported"). NO invented composite or overall score. NO model catalog
  (price / speed / latency / context). NO unified cross-benchmark mega-table.
  Those are the non-comparable averaging the design panel rejected and the
  self-reported aggregates this page exists to flag.
- **Grow the roster first** so every use case has real, trustworthy backing
  before any UI ships.
- **Hold all front-end work** until the research is done; the front-end redo is a
  separate chat. Same branch (`feat/benchmarks-standings`); PR1 stays unmerged.
- New leader data is sourced by deep research (independent boards preferred,
  self-reported flagged), NOT scraped from benchlm or Artificial Analysis.

## 3. Use-case taxonomy (student-framed)

Eleven use cases. Most reuse the 13 benchmarks PR1 already authored; the right
column is the roster expansion.

| Use case | Benchmarks we already have | New to author |
|---|---|---|
| Coding & building apps | SWE-bench Verified, LiveCodeBench, HumanEval | Design2Code |
| Math & step-by-step reasoning | AIME, FrontierMath | - |
| Science & expert knowledge | GPQA Diamond, MMLU-Pro, Humanity's Last Exam | - |
| Novel-problem / fluid reasoning | ARC-AGI v1, ARC-AGI v2 | - |
| Images, charts & documents | MMMU | MMMU-Pro, OmniDocBench |
| Agents, tools & automation | TAU-bench | BFCL, OSWorld |
| Factual accuracy (not hallucinating) | Humanity's Last Exam | SimpleQA |
| Long documents & big context | - | LongBench v2 |
| What people actually prefer | LMArena | - |
| Writing & communication (NEW, student) | LMArena | EQ-Bench (Creative Writing) |
| Languages & translation (NEW, student) | - | Global-MMLU |

Optional candidate (not committed): **Studying & tutoring** as an honest-empty
use case, since no benchmark cleanly measures teaching quality. That gap is
itself the lesson and fits the skepticism mission; include only if James wants it.

A benchmark can tag into more than one use case (e.g. Humanity's Last Exam sits
in both Science and Factuality; LMArena in both Preference and Writing).

## 4. Roster expansion (9 new benchmarks)

Same treatment as the existing 13: a four-beat brief (whatItMeasures with a
bus-stop lead, exampleTask, whyCare, scoring, calibration, watchOut + a
disclosure link), verified current top-3 (lab + verbatim score + as-of date +
source + selfReported/disputed), trust tier + nearTie, relatedConcepts validated
against the live catalog, dash-free, seeded as drafts. honest-empty + a single
dated anchor wherever no trustworthy current board exists.

- **SimpleQA** (factuality) - OpenAI short-fact QA; the canonical "does it make
  things up" board. Expect a real current board.
- **LongBench v2** (long context) - Tsinghua; long-document understanding.
- **BFCL** (Berkeley Function Calling Leaderboard) (tool use) - canonical
  function-calling board with a live leaderboard.
- **OSWorld** (computer use) - real desktop/GUI agent tasks; likely low scores,
  good honesty story.
- **OmniDocBench** (document AI) - document parsing / OCR / layout.
- **MMMU-Pro** (multimodal) - the harder, de-saturated MMMU.
- **Design2Code** (frontend / app dev) - build a webpage from a screenshot.
- **EQ-Bench (Creative Writing)** (writing) - independent writing-quality eval.
- **Global-MMLU** (multilingual) - knowledge across languages (MGSM as fallback).

Watch for self-reported-only or unreadable boards (several of these will likely
ship honest-empty, exactly like LiveCodeBench / HumanEval / TAU-bench did).

## 5. Data model (for the front-end chat)

- `Benchmark` gains **`useCases String[]`** (multi-tag; like `domain` but plural),
  applied to all 22 benchmarks via the seed.
- A **use-case content layer** (seed-data file, optionally a small `UseCase`
  Prisma model later):
  `{ slug, name, blurb, audienceLine, orderedBenchmarkSlugs[], howToChoose,
     picks[] }`.
- **Honest decision picks** are authored per use case, each
  `{ label ("Best for X"), benchmarkSlug, value (the leader string), asOfDate,
     caveat, selfReported }` and rendered with the SAME receipts as the
  ScoreStamp atom. No composite, ever.

## 6. Surfaces (front-end chat builds these)

- `/benchmarks`: add an "Explore by use case" card grid (each card = the use case
  + the benchmarks it draws on). Keep the PR1 trust-first list as the "all
  benchmarks" foundation.
- `/benchmarks/use/[slug]`: the task framing, which benchmarks matter and how far
  to trust them, the honest decision picks, links into the per-benchmark briefs,
  the "how to choose" guidance, and concept cross-links.
- Reuse the PR1 editorial primitives: `TRUST_META` / `StatusChip`, the
  ScoreStamp atom, `SectionEyebrow` / `HairRule`, the editorial-link sweep.
- Key PR1 files to extend: `lib/benchmarks.ts`, `components/benchmarks-client.tsx`,
  `components/benchmark-detail-client.tsx`, `prisma/schema.prisma` (Benchmark),
  `prisma/seed-data/benchmarks.ts`, `scripts/seed-benchmarks.ts`.

## 7. Research approach

Deep research, Phase-0 style (deep-research model mix per memory: sonnet for
search/fetch, opus to verify). For each of the 9 new benchmarks return, with a
source link for every number: what it measures (plain, no jargon-by-jargon), why
it matters, scoring (metric, scale, maintainer, official board URL + last-updated
date), watch-outs (contamination, saturation, named controversy), the current
(June 2026) top-3 with lab + verbatim score + as-of date + selfReported +
disputed, whether the top is a statistical tie, a one-line baseline anchor
(chance / human / prior SOTA), and where no trustworthy current board exists, say
so and give the single most-cited dated anchor instead of a guess.
Adversarially verify every top-3. No em or en dashes.
Save to `docs/research/benchmarks-usecases-research.json`.

## 8. Phases

- **A. Research** the 9 new benchmarks (the gating work; this chat).
- **B. Author** the new benchmark seed records (drafts) + the use-case content +
  `useCases` tags on all 22 benchmarks (this chat, after A).
- **C. Front-end redo** (separate chat): the use-case explorer + use-case pages +
  honest decision picks, plus whatever rework of the PR1 surfaces James wants,
  built on top of A + B.
