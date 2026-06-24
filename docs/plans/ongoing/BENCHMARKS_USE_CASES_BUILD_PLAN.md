# Benchmarks v2 Build Plan: "By Task, with Receipts"

> Status: READY TO BUILD as of 2026-06-24. Design locked by a multi-agent design panel
> (1 survey, 3 research lenses, 4 independent designer proposals, 4 adversarial cross-critiques,
> 1 synthesis, 2 adversarial verifiers, 1 self-repair pass). Full panel output saved at
> `docs/research/benchmarks-usecases-design-research.json` (`synthesis` key). This builds directly
> on PR1 ("The Standings", `docs/plans/ongoing/BENCHMARKS_PLAN.md`), which lives on branch
> `feat/benchmarks-standings` and is NOT merged. All v2 work continues on that same branch.
>
> This doc is self-contained: a fresh chat can execute from it plus the committed inputs. Build
> incrementally, commit after each logical step. No em dashes or en dashes anywhere in code, copy,
> or this doc (house rule); commas, colons, and hyphens only. Run the app on port 3100 and confirm
> the page title says "AISA Atlas" before trusting what you see.

## 1. What this is

PR1 answered "what is this benchmark, and can you trust its number." v2 adds the question students
actually arrive with: "I have a task, which model do I pick, and which benchmark should I even be
looking at." It is a use-case explorer plus an honest model picker, layered on the existing
trust-first surface.

The design language is "By Task, with Receipts": a single-column hairline use-case index that
becomes a second door at `/benchmarks` (alongside the unchanged Standings list), and a per-use-case
"decision walk" page where the spine is the how-to-choose guidance and every honest pick is a welded
ScoreStamp citing exactly one benchmark, one date, and one caveat. It borrows benchlm.ai's
information design (the use-case entry point, the dated bottom-line, the decision-ready picks, the
per-goal guidance) and deliberately rejects benchlm's card grid, its composite score, and its
unified league table.

## 2. The core insight and why the explorer is a list, not a grid

The organizing fact of this dataset is scarcity of trustworthy live data. Of the 22 seeded
benchmarks, 4 ship honest-empty (`livecodebench`, `longbench-v2`, `global-mmlu`, `design2code`) and 2
more are self-reported-flagged (`omnidocbench`, `arc-agi-2`); `simpleqa` and `mmmu-pro` were seeded
honest-empty in PR1 but now carry verified leaders (section 4), so PR2a flips them to populated. The
new roster's leaders are mostly dated (BFCL's April board), scaffolds (OSWorld), or self-reported
(OmniDocBench). So MOST use cases will surface few or no trustworthy live leaders.

A card grid advertises that each cell should be full, so a 1-board-0-live use case reads as a broken
or unfinished tile next to a 3-live one. A hairline row is naturally allowed to be short, so
thinness reads as deliberate teaching, not a hole. All four designers' critics independently killed
the benchlm card grid for this exact reason, and the PR1 panel already rejected a two-up grid for the
benchmark index one altitude down (a row of equal cells reads as a league table). A column of eleven
hairline rows reads as a contents page of doors, never eleven ranked contestants. Making the data
honesty a feature, not a hole, is the whole design.

Verified during this panel: there is no editorial card-grid class in the codebase (`.browse-grid` is
`display:flex/column` only, `app/globals.css` lines 336-339), which confirms the explorer must be
hairline rows to stay inside the established editorial voice.

## 3. The three surfaces

### 3.1 The explorer (a second door at /benchmarks, default landing)

`/benchmarks` stays one route. A thin new `BenchmarksHubClient` owns a single ghost-text toggle pair
that reuses the exported `CategoryTab` visual: `[By task] | The Standings`. By task is the default
landing because the locked audience (mixed, often non-technical students) arrives with a task, not a
benchmark name; The Standings is the unchanged PR1 trust list one click away. The PR1 list internals
stay byte-for-byte untouched; only its component gains one additive export (`CategoryTab`) plus a new
`PICK_VERB` map, and the page fetches both data sets. This honors "do not redesign the trust spine"
while answering the brief's openness to reworking the surface: the trust list becomes one of two
doors, never replaced or relocated. (We reject decision-flow's move of repointing `/benchmarks` to a
bare question page and demoting The Standings to `/benchmarks/all`: every critic flagged that as the
largest churn and a relitigation of the PR1 placement.)

The explorer is a single-column hairline index of the 11 use cases at `--maxw-content` (1040px),
built by cloning the PR1 `BenchmarkRow` grammar into a `UseCaseRow` so it inherits the `<=600px`
collapse and the capped `benchCellIn` stagger for free.

```
/benchmarks   (mode toggle: [By task] | The Standings)
+--------------------------------------------------------------------+
| PICK A MODEL                            Browse all 22 benchmarks -> |
| What are you trying to do?                                          |
| Start from your task. Each one names the 2 to 3 tests that measure  |
| it, says how far to trust each, and gives one honest pick or says   |
| plainly when no one can.                                            |
|                                                                    |
| [By task]   The Standings                                          |
|--------------------------------------------------------------------|
| (o) Coding and building apps                       See the boards ->|
|     Will it write code that actually runs?                          |
|     SWE-bench [LIVE]  LiveCodeBench [DATED]  HumanEval [NEAR CEILING]|
|--------------------------------------------------------------------|
| (o) Writing and communication                      See the boards ->|
|     Can it write something worth reading?                           |
|     EQ-Bench [LIVE]   LMArena [LIVE]                                 |
|--------------------------------------------------------------------|
| (o) Factual accuracy: not making things up         See the boards ->|
|     Will it answer a fact wrong with confidence?                    |
|     SimpleQA [DATED]   Humanity's Last Exam [CONTESTED]             |
|--------------------------------------------------------------------|
|  ~ Tasks no benchmark measures cleanly yet ~  (authored honestEmpty)|
| (o) Long documents and big context                 See the boards ->|
|     Can it read a whole report at once?                             |
|     LongBench v2 [DATED]                                            |
+--------------------------------------------------------------------+
  position glyph (never a rank)   name=hero   chips=each board's OWN status
  col-3 = neutral affordance, NO count verdict; group split = authored flag
  no model name, no score, no 'most live' phrase anywhere on this surface
```

Anatomy of a `UseCaseRow` (grid `36px / minmax(0,1fr) / 172px`):
- col 1: the tile-indigo badge as a position glyph, never an ordinal that reads as rank quality.
- col 2: the use-case name as the `.editorial-link .bench-name` hero at `--text-xl`, in plain student
  task language ("Factual accuracy: not making things up"); a one-line `audienceLine` ellipsised
  underneath; then the EVIDENCE STRIP that replaces PR1's `DOMAIN . scoreType` line: the 2 to 3
  backing benchmark short names, each followed by its own `size="sm"` `StatusChip`. Each chip is that
  single board's own per-benchmark STATUS (the PR1 hero), never a verdict synthesized across the
  backing set. No model name and no score ever appears on this surface, which enforces
  honest-picks-only at the architecture level.
- col 3: a NEUTRAL non-comparative affordance only. It reads "See the boards ->" for every row. The
  trust signal lives entirely in the per-board evidence-strip chips.

Grouping: rows split into two groups by the single AUTHORED `UseCase.honestEmpty` boolean, never a
computed live-board count. Honest-empty use cases sit last under a `HairRule` plus an 11px label
"Tasks no benchmark measures cleanly yet". No trust-filter tab row (the PR1 trust axis is meaningless
on a use-case axis); no faceted search (11 authored items is a knowable set).

### 3.2 The use-case page (/benchmarks/use/[slug]): a decision walk

A two-column editorial split that mirrors `benchmark-detail-client.tsx` beat for beat (so it inherits
the voice for free): the PR1 `.trend-detail-split` / `.trend-detail-rule` classes, the
`.trend-detail-enter` fade, `data-surface="editorial"`, `--maxw-content`. The left column is the
prose spine (how-to-choose IS the spine, not a sidebar); the right rail is the honest-picks panel
(the analog of `LeaderPanel`). The route clones `benchmarks/[slug]/page.tsx` exactly.

Left-column order:
1. `BackLink` "Back to tasks" -> `/benchmarks` (PR1 `BackLink` retargeted).
2. Kicker eyebrow "USE CASE" + `DraftChip` when the row is draft and the viewer is admin.
3. h1 = use-case name + one bold 19px task lead.
4. BOTTOM LINE (benchlm's signature, made honest and single-board-bound): a left-border callout (3px,
   not a tinted box) whose sentence is trust-gated and ALWAYS dated to exactly one named board
   (`UseCase.bottomLineBenchmarkSlug`), never a max-across-picks reduction. Honest-empty swaps to "No
   board here measures this cleanly, so we are not naming a leader."
5. BEAT 1 "The tests that matter": one prose sentence naming the ordered backing benchmarks BEFORE any
   leader appears (goal-to-evidence routing), then a YARDSTICK LIST of light hairline rows (a
   `size="sm"` `StatusChip` + the benchmark name as an `.editorial-link` to `/benchmarks/[slug]` + a
   one-line how-far-to-trust gloss), with an inline "also central to Science" cross-tag note where
   shared. Not full `BenchmarkRow`s (that would couple the surfaces).
6. BEAT 2 "How to choose" (THE SPINE, full weight): a per-goal branch list, each branch a sub-goal
   pointing to exactly one benchmark or an honest "no clean answer yet". A metric disagreement becomes
   two branches (EQ-Bench Elo vs Rubric).
7. BEAT 3 "What to watch" (the one structural recolor): the `WatchOut` primitive (gold eyebrow + 3px
   gold bar) carrying the use-case-level caveat.
8. `GoDeeper`: concept cross-links validated against the live `prisma.concept` catalog, exactly like
   the PR1 detail path.

Right rail: a board-bound dated stamp (the bottom-line board's name + its own "As of MON YYYY", never
"top model is X"), then the hairline-separated `PickStamp` column (never a podium, never a vs-N
delta), then a footer listing the backing `StatusChip`s. An honest-empty rail leads with what IS
known (the dated anchor and any baseline figures, so the student has something to work with), then
names the gap and why it exists (the authored `gapReason`), then the judge-it-yourself criteria. See 5.6.

```
/benchmarks/use/long-documents   (HONEST-EMPTY, full weight, decision aid)
+----------------------------------------+---+----------------------+
| <- Back to tasks                       |   | LONGBENCH V2 [DATED] |
| USE CASE                               |   | As of MAR 2026       |
| Long documents and big context         |   |----------------------|
| You want a model that stays coherent   | 1 | No reliable current  |
| across a whole report, not a prompt.   | p | board. Most-cited    |
|                                        | x | figure is a dated    |
| BOTTOM LINE  (bound to LongBench v2)   | | | anchor:              |
| | No board here measures this cleanly, | r | human experts 53.7%  |
| | so we are not naming a leader. Here   | u | | best direct 50.1%  |
| | is the yardstick and the anchor.      | l | | chance 25%          |
| ------------------------------------   | e |                      |
| THE TESTS THAT MATTER                   |   | Backing board:       |
|  LongBench v2 [DATED] ->  no readable   |   | LongBench v2 [DATED] |
|  independent board; JS-only, last clean |   | No live board for    |
|  ~Mar 2026.                             |   | this task.           |
| ------------------------------------   |   | Browse all 22 ->     |
| HOW TO CHOOSE                           |   +----------------------+
| No board here measures this cleanly, so |
| we are not naming a winner. Judge it    |
| yourself on these two things:           |
|  1. Does it keep facts straight across  |
|     a long document, or contradict      |
|     itself partway through?             |
|  2. Does accuracy fall off a cliff past |
|     your real document length?          |
| ------------------------------------   |
| | WHAT TO WATCH  (gold bar)            |
| A long context window is not the same   |
| as using it well; a high score can mean |
| the harness, not the model, did the     |
| reading.                                |
+----------------------------------------+
Same geometry as a populated page; absence is deliberate AUTHORED content
(honestEmpty=true), never a silent resolve-failure.
```

### 3.3 The honest pick (a `PickStamp`)

A pick is a claim welded to one receipt. It is a thin wrapper around the PR1 `ScoreStamp` atom
(exported from `benchmark-detail-client.tsx`) with a claim label above and a required caveat below, in
a hairline-separated row (no box, no medal, no vs-N delta). STATUS is the hero of the pick exactly as
it is of every PR1 row.

What a pick MAY claim: ONLY top of THIS one named board, on THIS date, by THIS metric, subject to THIS
caveat. The leading verb is a deterministic function of the cited benchmark's trust tier, authored
once in a `PICK_VERB` lookup that mirrors `TRUST_META`:
- `live` -> "tops"
- `near_ceiling` -> "leads, but the top is a statistical tie"
- `contested` or self-reported -> "claims the top of" plus the conflict caveat
- `dated` -> "led as of MON YYYY" (past tense)
- a near-tie at the top demotes any single name to a co-leaders framing ("share the top of") AND emits
  a separate welded `ScoreStamp` for each cited co-leader, so "share" is sourced for every name. If the
  top is a tie, every tied model is shown, no matter how many tie (no cap): `leaderRanks` lists all
  tied ranks and one welded stamp is rendered per rank under a single shared near-tie caveat.

The score, lab, date, and flag chips RESOLVE at render from the cited benchmark's `leaders` Json by
`(slug, rank)`, so the receipt can never drift from the board.

What a pick may NEVER claim: best model in general; any composite, average, or cross-benchmark
standing; any "tops N of 11" tally; any per-use-case live-board count or "most boards live" verdict;
any rank order inside a near-tie; any price/speed/latency/context superlative (there is no model
catalog); a scaffold score as a bare-model score; or a second model that does not carry its own welded
receipt. The caveat is a required field the seeder rejects when empty, and it is part of the welded
block, so the flattering half (the model name) is physically un-screenshot-able without the qualifying
half.

```
DECISION-READY PICKS   (writing use case, live board, near-tie)
+------------------------------------------------------------------+
| [LIVE]  Best for head-to-head writing preference                 |
| -- co-leaders: ONE welded ScoreStamp per cited rank --           |
| claude-fable-5   Anthropic     share the top of EQ-Bench ->       |
| Elo 2191.8   Rubric 84.05 of 100; LLM-judged                     |
| JUN 2026 . eqbench.com                                            |
| claude-opus-4-7  Anthropic     share the top of EQ-Bench ->       |
| Elo 2179.3   Rubric 83.x; LLM-judged                             |
| JUN 2026 . eqbench.com                                            |
| (gold) Near-tie: these two are within 12.5 Elo. Read the top as  |
|        a cluster, not a clean number one.                        |
+------------------------------------------------------------------+
DATED board (agents use case)
+------------------------------------------------------------------+
| [DATED]  Best for tool and function calling                      |
| Claude-Opus-4-5 (FC)  Anthropic   led as of APR 2026 on BFCL ->   |
| 77.47% Overall Acc   Berkeley-evaluated, reproducible            |
| APR 2026 . gorilla.cs.berkeley.edu                               |
| (gold) Board last readable April 2026; predates Opus 4.7/4.8,   |
|        Gemini 3.1, GPT-5.5. Read as past tense, not today's best.|
+------------------------------------------------------------------+
SCAFFOLD board (computer use): the word carries it, line E is MANDATORY
+------------------------------------------------------------------+
| [LIVE]  Best for computer use / desktop automation               |
| Pointer Agent (Opus 4.7)  Anthropic   tops OSWorld -> [SCAFFOLD]  |
| 83.6%   human baseline 72.36%                                    |
| JUN 2026 . osworld.github.io                                     |
| (gold) Led by a scaffold, Pointer Agent running Opus 4.7; you    |
|        cannot get this score from the bare model. (REQUIRED line)|
+------------------------------------------------------------------+
```

Receipt lines: A (claim, trust-gated `StatusChip` + "Best for {sub-goal}"); B (resolved model + lab
prefixed by the `PICK_VERB`, with inline SELF-REPORTED / DISPUTED / SCAFFOLD `FlagChip`s; repeats once
per cited rank for a co-leaders pick); C-D (the resolved `ScoreStamp`: verbatim score string +
baseline gloss, then `monYear(asOfDate)` + `domainOf(sourceUrl)` link); E (the required caveat,
gold-hued when it is a hard warning, plus the mandatory what-was-tested clause for scaffolds).

## 4. The new-roster data reality (design the picks around this)

| New benchmark | Use case | Pick treatment |
|---|---|---|
| EQ-Bench Creative Writing v3 | writing | the ONLY verified live top-3; co-leaders pick `leaderRanks [1,2]` (fable-5 Elo 2191.8, opus-4-7 Elo 2179.3, within 12.5 Elo) plus a separate gpt-5.5 Rubric-split pick |
| BFCL V4 | agents/tools | recovered from same-origin CSV, board dated 2026-04-12; verb "led as of APR 2026", DATED chip |
| OSWorld-Verified | computer use | recovered from XLSX; leaders are AGENT SCAFFOLDS (Pointer Agent w/ Opus 4.7 83.6%); SCAFFOLD chip + REQUIRED whatWasTested |
| OmniDocBench | document AI | only top-3 is self-reported AND #1 shares a maintainer with the benchmark; verb "claims the top of", Self-reported chip + conflict caveat, trust=contested |
| LongBench v2 | long context | honest-empty; dated anchor (human experts 53.7%, best direct 50.1%, chance 25%) |
| Global-MMLU | languages | honest-empty; no public board exists |
| SimpleQA | factuality | VERIFIED (James source + adversarial check, 2026-06-24). Kaggle SimpleQA board (OpenAI), trust=live, mixed provenance. Top 3: Gemini 3.1 Pro Preview 74.8% +/- 1.4%, Gemini 3 Pro Preview 70.5% +/- 1.4%, Gemini 2.5 Flash 66.9% (rank 3 DISPUTED, unconfirmed). Verb "tops". Flip PR1 honestEmpty to false |
| MMMU-Pro | images/docs | VERIFIED (2026-06-24). Artificial Analysis board (independent), trust=near_ceiling. Top 3: Gemini 3.5 Flash (high) 84%, Gemini 3.5 Flash (medium) 84%, Gemini 3.1 Pro Preview 82%. Within-model tie at the top (#1/#2 are the same model at two settings); verb "leads, but the top is a statistical tie". Flip PR1 honestEmpty to false |
| Design2Code | frontend | honest-empty (no current board found, 2026-06-24); ship empty=true + paper anchor + gapReason |

Sources: `docs/research/benchmarks-usecases-research.json` and
`docs/research/benchmarks-usecases-leaders-extracted.md` (the latter now carries the verified SimpleQA
and MMMU-Pro records added 2026-06-24). PR2a authoring: SimpleQA and MMMU-Pro flip from PR1 honest-empty
to populated `Benchmark.leaders` (verbatim scores, the per-leader `disputed` flag on SimpleQA rank 3,
the named board URL); their use-case picks cite those leaders. The remaining honest-empty benchmarks
(LongBench v2, Global-MMLU, Design2Code) ship `empty=true` plus a `datedAnchor` and a `gapReason`. Both
new boards are all-Google at the top, which is itself worth one honest caveat line on each pick.

## 5. Data model

Two Prisma changes plus a content layer. Apply with `prisma db push` (provider mismatch blocks
`migrate dev`, same as every prior model). After push: `prisma generate`, then KILL and restart
`next dev` on 3100 (HMR cannot reload `node_modules/.prisma/client`; symptom is a 500 "Cannot read
properties of undefined").

### 5.1 `Benchmark.useCases` (the tag)

Add one nullable column to `model Benchmark` (around line 551 in `prisma/schema.prisma`, beside
`relatedConcepts` / `sources`):

```prisma
useCases  Json?   // string[] of use-case slugs this benchmark backs
```

`Json`, not `String[]` and not a join table, to match the existing inline-Json convention (`leaders`,
`relatedConcepts`, `sources` are all inline `Json`) and keep the delta to one nullable column; it is
parsed by the existing `asStringArray` helper. A benchmark may tag into several use cases
(`humanitys-last-exam` -> `[science-and-expert-knowledge, factual-accuracy]`; `lmarena-chatbot-arena`
-> `[what-people-prefer, writing-and-communication]`).

### 5.2 `model UseCase` (the content layer)

A second model that mirrors `Benchmark`'s draft-gate plus inline-Json shape, so it inherits the
publish path, the `@@index([status])` visibility rule, the `DraftChip`, and the seed dash-validation
for free.

```prisma
model UseCase {
  id            String   @id @default(cuid())
  slug          String   @unique          // /benchmarks/use/[slug]
  name          String                     // "Factual accuracy: not making things up"
  audienceLine  String                     // one-line student gloss (explorer + page lead)
  taskLead      String                     // the bold bus-stop framing sentence
  bottomLine    String                     // the dated bottom-line callout copy (authored, trust-gated)
  bottomLineBenchmarkSlug String?           // the ONE board the bottom line + rail date bind to (null when honestEmpty)
  evidenceLine  String                     // "read mainly through SimpleQA, with HLE as a cross-check"
  yardsticks    Json                       // [{ benchmarkSlug, trustGloss }] ordered (the tests that matter)
  picks         Json                       // [PickSeed] authored honest picks
  howToChoose   Json                       // [{ goal, benchmarkSlug?, guidance, noCleanAnswer?, reason? }]
  judgeCriteria Json?                       // string[]; the honest-empty "judge it yourself on these two things"
  watchOut      String
  watchOutUrl   String?
  relatedConcepts Json?                     // [{ label, slug? }] reuse the validated shape
  honestEmpty   Boolean  @default(false)    // AUTHORED: no backing board has a usable live leader; drives explorer grouping
  datedAnchor   String?                     // the single anchor shown when honestEmpty (present this FIRST)
  gapReason     String?                     // why no trustworthy board exists (shown after the anchor); required when honestEmpty
  order         Int      @default(0)        // editorial sort within a group
  status        String   @default("draft")  // publish gate, mirrors Benchmark
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  @@index([status])
  @@map("use_cases")
}
```

`PickSeed` (one element of `picks[]`):

```
{ label, benchmarkSlug,
  leaderRank?,        // cite one leader row for a single-leader pick
  leaderRanks?,       // number[]; cite multiple rows for a co-leaders near-tie pick (each gets its own welded ScoreStamp)
  scaffold?,          // bool
  selfReported?,      // bool; drives the verb
  empty?,             // bool; AUTHORED honest-empty (emits no model name)
  datedAnchor?,       // when empty
  caveat,             // REQUIRED
  whatWasTested? }    // REQUIRED when scaffold=true
```

The pick AUTHORS the slug, rank(s), label, and caveat; the score/lab/date/flags RESOLVE from the cited
benchmark's `leaders` at render, so a pick can never drift and a scaffold or self-reported score is
never forced onto `Benchmark.leaders` (which would pollute the PR1 trust spine).

### 5.3 The read path: `lib/use-cases.ts`

Mirrors `lib/benchmarks.ts` and reuses `getBenchmarkViewer`, `asLeaders`, `asStringArray`,
`asRawRelatedConcepts`, and the `prisma.concept` validation pattern at `lib/benchmarks.ts:210-222`.

- `UseCasePickView` has `stamps: {...}[]`, an ARRAY of one welded stamp per cited rank (length 1 for a
  single-leader pick, N for a co-leaders pick), plus the computed `verb`, `empty`, `datedAnchor`,
  `caveat`, `whatWasTested`, `benchmarkSlug`.
- `UseCaseCardData.group` is `'answerable' | 'sparse'` derived ONLY from the authored `honestEmpty`
  boolean, never a computed live-board tally. `backing` is each board's OWN trust (for the
  evidence-strip chips), never aggregated.
- `getUseCases(viewer)`: published unless admin; `backing` resolved by joining the yardsticks'
  `benchmarkSlug`s against PUBLISHED benchmarks (a draft board never leaks a chip to a member);
  grouped by the authored `honestEmpty` flag, honest-empty last, then by `order` then name. No "most
  boards live" string is ever computed.
- `getUseCaseDetail(slug, viewer)`: `findUnique`, null when not published and not admin (route
  redirects). Each pick resolves its receipt from `prisma.benchmark.leaders` by `(slug, rank)` for
  every cited rank. The rail date binds to `bottomLineBenchmarkSlug`'s own `asOfDate`, never a
  max-across-picks reduction. Leader score strings stay verbatim; only the date is normalized via
  `monYear`.

### 5.4 The five trust-integrity rules (locked by the adversarial verifier)

These came out of the panel's trust-integrity adversary and are non-negotiable, because each one is a
place the design could have quietly reintroduced a forbidden cross-benchmark synthesis:

1. The explorer col-3 carries NO count-derived language. No "most boards live" or "no live board"
   verdict (that is a soft rollup of trust tiers across the backing set). Col-3 is a neutral "See the
   boards ->" affordance; the per-board `StatusChip`s carry all trust signal; the group split is the
   authored `honestEmpty` flag, never a tally.
2. A co-leaders pick emits N separate welded `ScoreStamp`s, one per cited rank, each with its own
   model + score + date + source, under one shared near-tie caveat line. Never one stamp with an
   unsourced second name, and never a 2-row mini-table.
3. SCAFFOLD reuses the gold tile, so the distinction is carried by the WORD "SCAFFOLD" plus a
   MANDATORY, seeder-enforced `whatWasTested` line, never by hue. `seed-use-cases.ts` rejects any
   `scaffold=true` pick whose `whatWasTested` is empty, exactly as it rejects an empty caveat.
4. Authored-empty (`empty=true` in the seed) and resolve-failure-empty are distinct paths. Only an
   authored `empty=true` pick renders the judge-it-yourself / `HonestEmpty` body. A non-empty pick
   whose `(slug, rank)` fails to resolve (board unpublished or `leaders[rank]` gone) DROPS entirely,
   logs an admin-visible warning, and fails `seed-use-cases --verify`. Absence is never silently
   presented as authored honesty.
5. The populated Bottom Line binds to exactly ONE named board (`bottomLineBenchmarkSlug`) and that
   board's own date. No page-level "As of MON YYYY" computed by reducing over multiple boards.

### 5.5 Seeds and admin path

- `prisma/seed-data/use-cases.ts`: exports `UseCaseSeed` type, `USE_CASE_SEEDS` (11 records), and a
  `USE_CASE_SLUGS` allowed-set constant. Honest-empty cases author a `gapReason`. The
  `studying-and-tutoring` case is dropped (James, 2026-06-24). Authored from the
  use-case research, dash-free, seeded as drafts. The 11 slugs: `coding-and-building-apps`,
  `math-and-reasoning`, `science-and-expert-knowledge`, `novel-problem-reasoning`,
  `images-charts-and-documents`, `agents-tools-and-automation`, `factual-accuracy`,
  `long-documents-and-context`, `what-people-prefer`, `writing-and-communication`,
  `languages-and-translation`.
- `prisma/seed-data/benchmarks.ts`: add `useCases?: string[]` to the `BenchmarkSeed` type (currently
  lines 62-88, which already carries the v2 domains and `datedAnchor`) and tag all 22 records.
- `scripts/seed-use-cases.ts`: mirrors `scripts/seed-benchmarks.ts` (upsert by slug as draft;
  `--check` / `--verify` / `--delete` modes; the `BANNED_DASHES` sweep over text fields). Its verify
  cross-checks: (a) every `yardstick` / `pick` / `howToChoose` / `bottomLineBenchmarkSlug`
  `benchmarkSlug` exists in `BENCHMARK_SEEDS`; (b) every pick `leaderRank` / `leaderRanks` entry exists
  on that benchmark's `leaders` (or `empty=true`); (c) every `scaffold=true` pick has a non-empty
  `whatWasTested`; (d) every pick has a non-empty `caveat`; (e) every `honestEmpty=true` use case has a
  non-empty `gapReason`.
- `scripts/seed-benchmarks.ts`: add a `USE_CASE_SLUGS` allowed-set check for the new `Benchmark.useCases`
  tag, beside the existing `DOMAINS` / `SCORE_TYPES` / `TRUSTS` validators.
- `app/api/admin/use-cases/route.ts`: an exact copy of `app/api/admin/benchmarks/route.ts` (same local
  non-redirecting `requireAdmin` -> 403; PATCH `publish` / `unpublish` / `publishAll` over
  `UseCase.status`; no GET; POST 501 stub).

### 5.6 Honest-empty body order (James, 2026-06-24)

An honest-empty use case is full-weight authored content, ordered to give the student something to work
with before naming the hole:

1. What IS known, first: the dated anchor and any baseline figures (LongBench v2: human experts 53.7%,
   best direct model 50.1%, chance 25%). This is the part a student can act on, so it leads.
2. The gap and WHY it exists: an authored `gapReason` on the `UseCase`, stated plainly (for example
   "the only board is JavaScript-only and cannot be read from the page", "every reported score is
   self-reported with no independent eval", or "no public leaderboard exists for this yet").
3. The judge-it-yourself criteria: the two authored things a student can test for themselves.

This replaces the bare "No reliable current leaderboard" lead: the absence stays legible, but the
present signal leads and the reason for the gap is explicit, never a dead end. `gapReason` is the new
authored field added to the `UseCase` model in 5.2, and `seed-use-cases --verify` requires it on every
`honestEmpty=true` use case.

## 6. File map (mirror the named existing file)

| Path | Based on | What |
|---|---|---|
| `prisma/schema.prisma` | `model Benchmark` (525-563) | add `useCases Json?` to Benchmark; add `model UseCase`; `db push` + generate + restart dev |
| `lib/use-cases.ts` | `lib/benchmarks.ts` | NEW read path; `getUseCases` / `getUseCaseDetail`; `PICK_VERB`; resolve receipts from `leaders` by `(slug, rank)`; drop-on-resolve-fail; grouping from the authored flag |
| `lib/benchmarks.ts` | `getBenchmarks` / `BenchmarkCardData` (52-63, 157-192) | add `useCases` to the select + card type (via `asStringArray`) for the evidence strip and the "also central to X" note |
| `components/benchmarks-client.tsx` | `CategoryTab` (454-508), `TRUST_META` (27-52) | export `CategoryTab` (no signature change); export a `PICK_VERB` map beside `TRUST_META`; no change to PR1 list internals |
| `components/benchmark-detail-client.tsx` | the module-local primitives (230-627, 709-725) | EXPORT `ScoreStamp`, `FlagChip`, `monYear`, `domainOf`, `Beat`, `Prose`, `MicroLabel`, `ExampleTask`, `WatchOut`, `GoDeeper`, `BackLink`, `HonestEmpty`; add a SCAFFOLD label path via the generic `FlagChip(label, tile='gold')`; pure refactor, no visual change |
| `components/benchmarks-hub-client.tsx` | `BenchmarksClient` header + exported `CategoryTab` | NEW thin client: the `[By task] | The Standings` toggle rendering `UseCaseExplorerClient` or `BenchmarksClient`; default By task |
| `components/use-case-explorer-client.tsx` | `BenchmarksClient` + `BenchmarkRow` (75-337) | NEW hairline explorer: interrogative header, `UseCaseRow`, evidence-strip of each board's own `StatusChip`, neutral col-3 affordance, authored honest-empty group; copies the `bench-row` `<style>` by value |
| `components/use-case-detail-client.tsx` | `benchmark-detail-client.tsx` | NEW decision walk: split, left spine (BackLink, kicker, h1, task lead, board-bound Bottom Line, yardstick list, how-to-choose, WatchOut, GoDeeper), right rail (board-bound dated stamp, `PickStamp` column via exported `ScoreStamp` one-per-rank, `HonestEmpty` + judge-it-yourself), `UseCaseModeration` |
| `app/(main)/benchmarks/page.tsx` | the existing route (1-16) | fetch both `getBenchmarks` and `getUseCases`; render `BenchmarksHubClient`; keep `force-dynamic` + title |
| `app/(main)/benchmarks/use/[slug]/page.tsx` | `benchmarks/[slug]/page.tsx` (1-24) | NEW route: `force-dynamic`, await `params` (Promise), `getBenchmarkViewer` + `getUseCaseDetail`, `redirect('/benchmarks')` on miss, render `UseCaseDetailClient` |
| `prisma/seed-data/use-cases.ts` | `prisma/seed-data/benchmarks.ts` (type + records + header) | NEW: `UseCaseSeed` type + `USE_CASE_SEEDS` (11 records) + `USE_CASE_SLUGS` allowed-set |
| `prisma/seed-data/benchmarks.ts` | `BenchmarkSeed` type (62-88) + the 22 records | add `useCases?: string[]` to the type and tag all 22 records |
| `scripts/seed-use-cases.ts` | `scripts/seed-benchmarks.ts` | NEW seeder + the four verify cross-checks in 5.5 |
| `scripts/seed-benchmarks.ts` | `validateStatic` + the allowed-sets (28-128) | add the `USE_CASE_SLUGS` check for `Benchmark.useCases` |
| `app/api/admin/use-cases/route.ts` | `app/api/admin/benchmarks/route.ts` (1-77) | NEW publish gate over `UseCase.status` |

NOTE: no sidebar or icon change is needed. `components/sidebar.tsx` already carries the `/benchmarks`
item with the `ranking` icon, and `isActive` is a prefix match (`pathname === href ||
pathname.startsWith(href + "/")`), so `/benchmarks/use/*` and the hub toggle keep the nav item active
for free.

## 7. Verified design tokens and classes (checked against globals.css with line numbers)

Wrap every benchmark surface in `data-surface="editorial"` inside the `(main)` `data-theme="light"`
shell. Use only the verified set; zero new color or shadow tokens; zero new chrome.

- Width and ground: `--maxw-content` 1040px (88); `--color-bg` #FAF9F5 (99); `--color-surface`
  #FFFFFF (100, admin card only).
- Text hierarchy: `--color-text` / `--color-text-2` / `--color-text-3` (text-2 and text-3 both
  #6B6B73, 112-113), size-and-opacity, not new colors.
- Hairlines: `--color-border` #E8E5DC (103); `--color-border-subtle` #EFEDE6 (104).
- Accent: `--color-accent` #4255FF under `[data-surface=editorial]` (191), hover #3545E0 (192); used
  only for `.editorial-link` underlines and the active `CategoryTab` sweep.
- STATUS chip tile pairs (use `-bg` and `-fg` together): LIVE sage #E2EED5 / #4F7028 (134-135); NEAR
  CEILING and the Self-reported `FlagChip` steel #D8DEEC / #38486D (160-161); CONTESTED, the Disputed
  `FlagChip`, and the SCAFFOLD `FlagChip` gold #FBE2A6 / #855208 (140-141); DATED stone #DDDDE3 /
  #43434E (158-159); the position glyph tile-indigo #DDDAFB / #4F40A0 (154-155). `--tile-slate` does
  NOT exist.
- Caveat hue: `--color-gold` #B8860C (123) for the `WatchOut` bar, the `DraftChip`, the required pick
  caveat line, and the required scaffold what-was-tested line; `--color-gold-soft` #FBEFCE (124) only
  for a soft tint. `--shadow-card` exists (174-175) but the editorial surface does not use it.
- Type and spacing: `--text-xl` 24px (69) for the hero name; `--text-xs/sm/md` 12/13/16; `--radius-2`
  8px (51) and `--space-4/5` 16/24 (79-80) for the admin Moderation card only.
- Layout classes: `.trend-detail-split` + `.trend-detail-rule` collapse to 1fr and hide the rule at
  `<=720px` (460-470) -> USE for the page. `.concept-shell` hides its `> aside` at `<=1279px`
  (279-285) -> AVOID for a rail. The `.bench-row` `<=600px` regrid and `benchCellIn` live in
  `benchmarks-client.tsx`'s inline `<style>` (187-214) and are copied by value into the explorer.

NOTE on SCAFFOLD reusing the gold tile: this is intentional and safe because the mandatory,
seeder-enforced word "SCAFFOLD" carries the meaning, not the hue, so it never collapses chromatically
into a dismissible "contested" read. Trust state is always carried by the word first, color second.

## 8. Phases (reviewable PRs on `feat/benchmarks-standings`)

### PR2a: data foundation + content layer (no student-facing UI)

Scope: schema (`Benchmark.useCases Json?` + `model UseCase` incl. `bottomLineBenchmarkSlug`); `db push`
+ generate + restart dev. Tag all 22 `BenchmarkSeed` records and extend the type. Author
`prisma/seed-data/use-cases.ts` (11 use cases; each authors `honestEmpty` + `bottomLineBenchmarkSlug`;
picks cite `(slug, rank)` or `leaderRanks` with required caveats; `empty=true` + `datedAnchor` for the
empty-leaning cases plus an authored `gapReason`; scaffold picks carry required `whatWasTested`). Add `scripts/seed-use-cases.ts`
plus the `USE_CASE_SLUGS` check in `seed-benchmarks.ts`. Add `lib/use-cases.ts` + `PICK_VERB`. Add
`app/api/admin/use-cases/route.ts`. Export `ScoreStamp` / `FlagChip` / `monYear` / `domainOf` + the
prose primitives from `benchmark-detail-client.tsx` (pure export, add the SCAFFOLD `FlagChip` path).
Seeded as drafts.

Acceptance: `prisma validate` + `db push` + generate clean; `seed-benchmarks --verify` still passes
(all 22 tagged, no banned dashes, every `useCases` tag in `USE_CASE_SLUGS`); `seed-use-cases --verify`
passes the five cross-checks (every benchmarkSlug resolves, every `leaderRank`/`leaderRanks` exists or
`empty=true`, every pick has a non-empty caveat, every scaffold pick has a non-empty `whatWasTested`,
every honest-empty use case has a non-empty `gapReason`, zero banned dashes); `getUseCases` / `getUseCaseDetail` return typed data with each cited rank resolved
into `UseCasePickView.stamps[]` and grouping derived from `honestEmpty`; all use cases `status=draft`;
`/benchmarks` and `/benchmarks/[slug]` render unchanged.

Playwright: visit `:3100/benchmarks` and a `/benchmarks/[slug]` (e.g. `eq-bench-creative-writing`);
assert HTTP 200, `document.title` contains "AISA Atlas", the PR1 list still renders 22 rows, and the
brief is visually unchanged (a screenshot baseline for the export refactor). Assert the rendered HTML
of both contains no em or en dash.

### PR2b: the explorer + hub toggle

Scope: export `CategoryTab`. Add `benchmarks-hub-client.tsx` (the `[By task] | The Standings` toggle,
default By task) and `use-case-explorer-client.tsx` (hairline `UseCaseRow` index, evidence-strip of
each board's own `StatusChip`, neutral col-3 "See the boards ->" affordance, honest-empty group under
a `HairRule` + label gated on the authored flag). Rewire `benchmarks/page.tsx` to fetch both and
render the hub. PR1 list internals untouched.

Acceptance: `/benchmarks` defaults to By task with 11 rows; each row shows the name, the
`audienceLine`, and at least one backing `StatusChip` (each chip the board's own status); col-3 reads
"See the boards ->" with NO count phrase ("most boards live" / "no live board" must not appear); no
model name and no score appears anywhere on the explorer; honest-empty rows sit under the "Tasks no
benchmark measures cleanly yet" label and their grouping is the authored flag; toggling to The
Standings renders the byte-for-byte unchanged PR1 list; reduced-motion disables the entrance; `<=600px`
collapses with no horizontal scroll.

Playwright: navigate `:3100/benchmarks`; assert title contains "AISA Atlas"; count 11 use-case rows;
assert the explorer DOM contains zero known leader model strings (e.g. "claude-fable-5", "Pointer
Agent", "MinerU2.5-Pro") and zero "%" score tokens AND zero "most boards live" / "no live board" text;
assert col-3 reads "See the boards"; assert the honest-empty label is present with at least 2 sparse
rows after it; click a row and assert the URL becomes `/benchmarks/use/<slug>`; click the toggle and
assert the PR1 trust-filter tabs ("Live", "Dated") appear.

### PR2c: the use-case page + honest picks

Scope: add `use-case-detail-client.tsx` (board-bound dated Bottom Line, yardstick list, `PickStamp`
column via the exported `ScoreStamp` emitting one welded stamp per cited rank, `PICK_VERB` + SCAFFOLD
chip + required what-was-tested line, how-to-choose branches, `WatchOut`, `GoDeeper`, `HonestEmpty` +
judge-it-yourself for authored `empty=true`, board-bound rail date, `UseCaseModeration`) and the
`/benchmarks/use/[slug]` route (`force-dynamic`, redirect-on-miss).

Acceptance: a live use case (`writing-and-communication`) renders a Bottom Line bound to one named
board with that board's own date, a co-leaders pick where BOTH `claude-fable-5` and `claude-opus-4-7`
carry their own welded `ScoreStamp` (model + verbatim score + `monYear` + source) under one near-tie
caveat, and a second metric-split pick; the near-tie note replaces a clean number one and no vs-N delta
appears; a dated use case (`agents-tools-and-automation`) shows "led as of APR 2026" + the DATED chip +
past tense; the OmniDocBench pick shows the Self-reported chip + maintainer-conflict caveat; the
OSWorld pick shows the SCAFFOLD chip + a required what-was-tested line; an honest-empty use case
(`long-documents-and-context`) renders the `HonestEmpty` body + dated anchor + the judge-it-yourself
criteria and emits NO model name; the rail date equals the bottom-line board's date, not a
max-across-picks value; an unknown slug redirects to `/benchmarks`; a draft use case redirects for a
member but renders with a `DraftChip` for an admin who can publish via the new route.

Playwright: visit `:3100/benchmarks/use/writing-and-communication`; assert the head-to-head pick
contains TWO model strings each with its own MON YYYY token and source link, and a single near-tie
caveat line; assert no element text is "overall" or a bare composite score and no vs-#N delta exists.
Visit `/benchmarks/use/long-documents-and-context`; assert zero leader model strings, the dated anchor
text ("53.7%") present, and the judge-it-yourself criteria rendered. Visit
`/benchmarks/use/agents-tools-and-automation`; assert the "SCAFFOLD" chip text + the required
what-was-tested sentence + the "led as of" past-tense verb. Visit `/benchmarks/use/does-not-exist`;
assert redirect to `/benchmarks`. Assert no em or en dash in any rendered page.

### PR2d (optional): copy and QA pass

Scope: a dash-free, trust-gated-verb copy pass over all 11 use cases and their picks, plus a final
honest-empty body-order check (present the known figures first, then the `gapReason`, then the
judge-it-yourself criteria). No code change. The `studying-and-tutoring` case is dropped per James,
2026-06-24 (no benchmark is a clear enough measure of teaching quality to anchor it).

Acceptance: every pick verb matches its cited board's trust tier; every honest-empty body leads with
its known figures before naming the gap; zero banned dashes.

## 9. What the plan resolves (the six brief items) and the decisions locked

The brief asked the panel to resolve six things. Each is settled in this plan:

1. The explorer surface and where it lives: a single-column hairline index (not a card grid), as the
   default of a two-mode toggle at the unchanged `/benchmarks` route. The PR1 trust list becomes the
   second door, byte-for-byte unchanged. See sections 2 and 3.1.
2. The use-case page: a decision walk mirroring the PR1 split; the tests that matter, a trust gloss per
   board, how-to-choose as the spine, honest picks with receipts, and a first-class honest-empty body
   with judge-it-yourself criteria. See section 3.2.
3. The data model: `Benchmark.useCases Json?` plus a new `UseCase` model and a `PickSeed` shape, seeded
   and published exactly like `Benchmark`. See section 5.
4. Honest decision-pick design: the `PickStamp`, the trust-gated `PICK_VERB`, what it may and may not
   claim, and the resolve-from-`leaders` receipt that cannot drift. See sections 3.3 and 5.4.
5. Motion, tokens, accessibility: PR1 vocabulary only, zero new chrome, status carried by the word
   first. See section 7.
6. Phasing: PR2a (data) -> PR2b (explorer) -> PR2c (page) -> PR2d (optional), each with acceptance plus
   Playwright. See section 8.

Decisions locked (James, 2026-06-24). All seven open questions are now settled:

1. Default landing mode: keep "By task" as the default; The Standings is the one-click second tab.
2. Use-case set: ship the 11. The `studying-and-tutoring` case is dropped (no benchmark is a clear
   enough measure of teaching quality to anchor it). PR2d loses the extra case and is now an optional
   copy pass only.
3. Honest-empty presentation: present what IS known first (the dated anchor and any baseline figures,
   so the student has something to work with), THEN state the gap and WHY it exists (an authored
   `gapReason`), THEN the judge-it-yourself criteria. Ship all 11; do not stage the launch. See 5.6.
4. Pick freshness vs the future leader cron (James deferred; decided default below, revisit when the
   cron is wired): v1 is static-authored, so nothing drifts in v1. The pick verb is computed from the
   board's trust tier (`PICK_VERB`) so it updates on its own; the authored caveat prose can lag.
   Default: when the PR1-style leader cron later drafts a changed benchmark, the admin re-reads that
   benchmark's dependent use-case picks in the same draft review. A future enhancement can list, on
   each cron run, the use-case picks whose cited board changed, for targeted re-read. Not v1-blocking.
5. Cross-tagging display (panel's call, James approved): keep only the inline "also central to X"
   navigational note; no cross-use-case rollup or count (a backdoor composite, killed on sight).
6. Per-use-case ordered benchmark list and trust gloss wording (panel's call, James approved): author
   the taxonomy mapping as proposed; James reviews the ordering and the gloss wording on-site after the
   build and requests changes from there.
7. Ties: if the top is a tie, make it known no matter how many models tie. A co-leaders pick welds
   every tied rank as its own welded `ScoreStamp` (no cap); `leaderRanks` lists all tied ranks and the
   single near-tie caveat spans the group.

## 10. Build gotchas (carry over from PR1, do not relearn)

- After `prisma db push` + `prisma generate`, KILL and restart `next dev` on 3100. HMR cannot reload
  `node_modules/.prisma/client`; the symptom is a 500 "Cannot read properties of undefined".
- This is a MODIFIED Next.js. Read the relevant guide in `node_modules/next/dist/docs/` before writing
  any route code, and mirror the working `app/(main)/benchmarks/[slug]/page.tsx` exactly (`params` is a
  Promise; `await params`).
- After full-file rewrites or a `git stash` pop, Turbopack HMR can desync and routes spuriously 404.
  `rm -rf .next` and restart dev before bisecting a 404 as a code bug.
- Zero em dashes and zero en dashes anywhere. The seeders enforce this with a `BANNED_DASHES` sweep;
  keep all authored copy on commas, colons, and hyphens.
- Run on port 3100; confirm the page title says "AISA Atlas" (port 3000 is a different project).

## 11. Inputs (committed to the repo)

- `docs/research/benchmarks-usecases-design-research.json` - this design panel's full output
  (`research` 3 lenses, `panel` 4 personas with proposal + critique, `synthesis`, `verification`).
- `docs/research/benchmarks-usecases-research.json` + `benchmarks-usecases-leaders-extracted.md` - the
  verified new-benchmark content and leader extractions.
- `docs/plans/ongoing/BENCHMARKS_USE_CASES_PLAN.md` - the v2 spec and the locked decisions.
- `docs/plans/ongoing/BENCHMARKS_PLAN.md` - the PR1 build (data model, tokens, file map).
- `docs/research/benchmarks-design-research.json` - the PR1 design panel (the synthesis shape this
  panel mirrors).
- PR1 code to reuse and extend: `lib/benchmarks.ts`, `components/benchmarks-client.tsx`,
  `components/benchmark-detail-client.tsx`, `app/(main)/benchmarks/{page.tsx,[slug]/page.tsx}`,
  `prisma/seed-data/benchmarks.ts`, `prisma/schema.prisma` (Benchmark model), `scripts/seed-benchmarks.ts`,
  `app/api/admin/benchmarks/route.ts`, `components/ui/icon.tsx`, `components/sidebar.tsx`.
- Project memory: editorial surface pattern, dialog-portal-theme, prisma-restart-dev,
  turbopack-hmr-restart, dev-server-port (run on 3100, title must say "AISA Atlas").

## 12. Manual leader-data intake (optional, for James)

Manual collection is NOT required: the plan ships every thin use case gracefully as honest-empty with a
dated anchor and a stated `gapReason`. It is an UPGRADE path. Where James can read a trustworthy current
board that the research could not (JavaScript-only boards, companion CSV or XLSX files, or a board that
needs a fresh manual read), a use case can move from honest-empty to a real receipted pick.

Most valuable to collect (no verified current top-3 today): SimpleQA, MMMU-Pro, Design2Code.
Refresh-worthy (dated, or recovered from a companion file): BFCL (April 2026 board), OSWorld (scaffold
leaders), OmniDocBench (self-reported). Already live, no action needed: EQ-Bench Creative Writing.

Present each board to me in this plain format, one block per benchmark. Paste it as text or a table, or
send a screenshot of the board together with its URL. I convert it into the `Benchmark.leaders` seed
shape and author the pick.

```
Benchmark:            <name and slug>
Board URL:            <the exact page or data file you read>
Board last updated:   <date shown on the board, or "none shown">
Read on:              <the date you read it>
Eval type:            <independently evaluated | self-reported by the lab>
Conflict of interest: <none, or e.g. "the #1 model shares a maintainer with the benchmark">
Near-tie at the top:  <no, or "yes, ranks 1 and 2" etc.>
Baseline anchor:      <random chance / human level / prior SOTA, whichever a newcomer needs>
Leaders (top 3):
  1. <model exact name as the board states it> | <lab> | <score VERBATIM, keep the unit and any interval, e.g. "1510 +/- 11" or "77.47% Overall Acc"> | <as-of date> | self-reported: <y/n> | disputed: <y/n> | source: <URL for this number>
  2. ...
  3. ...
Scaffold note:        <only if the leader is an agent system, not a bare model, e.g. "Pointer Agent running Opus 4.7; you cannot get this from the bare model">
```

Two rules that matter most: copy each score string VERBATIM (do not round or normalize; keep the unit
and any interval), and give a source URL for every number. If a board has no trustworthy current data,
say so and give the single most-cited dated anchor plus a one-line reason for the gap; that ships as
honest-empty, which is a valid and intended outcome, not a failure.
