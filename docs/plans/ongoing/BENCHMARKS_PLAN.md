# Benchmarks - Build Plan ("The Standings")

> Status: READY TO BUILD as of 2026-06-23. Design locked by a multi-agent design panel
> (saved at `docs/research/benchmarks-design-research.json`); content research already done
> (`docs/research/benchmarks-research.json` + `benchmarks-research-round2.json`). One gating
> Phase 0 first: a deep-research refresh of the leader data (see section 9).
>
> This doc is self-contained: a fresh chat can execute from it plus the committed inputs.
> Build on a branch off master. Commit after each logical step. No em dashes or en dashes
> anywhere in code, copy, or this doc (house rule).

## 1. What this is

`/benchmarks`, internal name "State of the Models": an editorial literacy surface for the AI
benchmarks people argue about. A single-column index of ~13 benchmarks, each opening to a
plain-language brief with a live-ish top-3 leader panel. The education hook is the per-benchmark
cross-link to the related catalog concept, same move as the digest and the trend tracker.

It is the third "current" editorial surface after the This Week digest and the Trends Pulse
Index, and it reuses their primitives almost entirely.

## 2. The locked design direction: "The Standings"

The full rationale, three reference picks, ASCII sketches, and per-persona grafts live in
`docs/research/benchmarks-design-research.json` (`synthesis` key). The essentials:

**Core insight.** Per our own verified research, almost every benchmark number is contested,
dated, self-reported, or saturated. So the organizing axis is NOT "who is winning." It is
"can you trust this number," made legible before the click. **STATUS (a trust tier), not the
score, is the hero of the list.**

**List surface (single column, NOT the trends two-up).** The break from two columns is a
data-integrity call: reading 91% next to 25% across a row invites a false league-table
comparison of non-comparable scores. One column forces vertical reading and lines the STATUS
column straight down the page.
- Header: SectionEyebrow `STATE OF THE MODELS`, H1 `Benchmarks`, one plain deck line.
- One row of ghost-text filter tabs on the TRUST axis with live counts (All / Live /
  Contested / Dated). Domain (Reasoning, Coding, Math, Multimodal, Human preference) is a
  quiet metadata atom inside each row, not a second filter row.
- Each row: a soft tinted ordinal badge (position only, never rank quality), the benchmark
  name as the hero (only it sweeps on hover), the one-line `whatItMeasures` under it, an 11px
  uppercase strip of two atoms max (`DOMAIN . scoreType`), and on the right a STATUS chip plus
  the single most important caveat in four words. **No raw score on the row** (a bare number
  needs a date, a baseline, and a caveat to mean anything; the row cannot carry all three).

**Detail surface (two-column split, prose left, leader rail right).**
- Use the `.trend-detail-split` / `.trend-detail-rule` classes (collapse to one column and hide
  the rule at <=720px). Do NOT use `.concept-shell` (it hides its aside entirely at 1279px and
  would never show the rail on a 1040px page).
- Set the page wrapper to `--maxw-content` (1040px) so list and detail share width; keep prose
  measure capped near 720px inside the left column.
- Left column order: `BackLink` to /benchmarks, then a domain kicker + the STATUS word large
  with a one-sentence plain gloss of what that status MEANS, then the H1 name, then ONE bold
  lead sentence (define via difficulty contrast, the "bus-stop test"), then four beats:
  1. WHAT IT MEASURES (+ a labeled, indented EXAMPLE TASK so difficulty is felt before any %)
  2. WHY YOU SHOULD CARE (placed second, so a bailing reader still gets the payoff)
  3. HOW SCORING WORKS (metric, scale, who runs the board, a calibration anchor like
     "chance 25%, experts ~81%, prior SOTA X" so no figure appears naked)
  4. WHAT TO WATCH (full structural parity: gold SectionEyebrow + a 3px horizontal gold
     ThinBar under it; contamination / saturation / the named controversy as a real paragraph
     plus an outbound "read the disclosure" link)
- Catalog cross-links embed inline at first mention via editorial-link, plus a closing
  "To go deeper" cluster into /concepts.

**Leader panel (right rail).** Honest and dated by design (your call). A dated stamp on its own
HairRule (`LEADERS AS OF JUN 10 2026`) so a screenshot carries its date. Each row: a soft
tile-indigo ordinal + a **ScoreStamp** atom (three lines that never separate: model + lab; the
score taken VERBATIM from the data free-text string, preserving intervals like "1510 plus or
minus 11" and split-name caveats, beside a small baseline gloss; the normalized "Mon YYYY"
as-of label + source). Trust flags render INLINE, never on hover (`SELF-REPORTED` chip in
tile-steel, `DISPUTED` chip in tile-gold). Near-ties (a separate required boolean, NOT the same
as the CONTESTED trust word) print a quiet "near tie" note spanning the rows.
- **Honest-empty state is first-class.** Where there is no trustworthy current top-3
  (LiveCodeBench has no parseable board; several benchmarks only have historical anchors), the
  panel does NOT fabricate rows. It shows "No reliable current leaderboard. The most cited
  figure is a dated anchor:" followed by the single dated anchor.
- **Board-behind line.** When `boardLastUpdated` is null or older than the leaders' asOfDate,
  show a muted "board last updated MAR 2026, may be behind" line. In static v1 this is a
  date-vs-date comparison computed at render against the build date, NOT the Pulse Index
  cron-stale logic (there is no live `syncedAt` in static v1).

**Motion + accent.** Existing editorial vocabulary only, all CSS, all gated by
`usePrefersReducedMotion`. List rows use the `trendCellIn` entrance with the capped ~18ms
stagger; the name is the only hover-animated element (editorial-link sweep). Accent is
`--color-accent` (#4255FF, via `data-surface="editorial"`). Exactly one structural recolor on
the whole surface: the WHAT TO WATCH eyebrow + its ThinBar swap accent for `--color-gold`.
Trust state is carried by the WORD first, color second, never color alone.

## 3. Reference picks (from the panel)

- **Our World in Data** indicator pages: plain-sentence definition at top, Source+Year fused to
  every number, a named "Data Quality / Definitions" section with real weight, inline related
  cross-links. Maps one-to-one onto our four-beat detail, the ScoreStamp, the gold WATCH
  section, and the inline catalog handoff.
- **Humanity's Last Exam leaderboard** "Rank (Upper Bound)": reports how many models are
  significantly better instead of faking a clean #1 when scores tie. We translate the idea into
  one plain sentence ("statistically tied with ranks 2 and 3").
- **Typewolf Favorite Sites** (negative-reference balanced): the numbered-badge + hero-name +
  11px metadata-strip row at hairline separators (the Pulse Index already adapted it). We borrow
  the rhythm and restraint but use ONE column, not two, because our scores are not comparable.

## 4. Inputs (committed to the repo)

- `docs/research/benchmarks-research.json` - Pass 1 methodology + 11 cited findings + benchmark
  bodies (what it measures / why / scoring / criticisms / why-care).
- `docs/research/benchmarks-research-round2.json` - the authoritative data. `leaderTables[]`
  (per benchmark: `leaderboardUrl`, `boardLastUpdated` nullable, `observedDate`, `official`,
  `needsRecheck`, `leaders[]` with `rank`, `model`, `lab`, `score` FREE-TEXT verbatim,
  `asOfDate`, `selfReported`, `disputed`, plus `notes`), `records` (the four-beat bodies for
  the four that were missing in pass 1), `checks` (2 fact checks), and `stillMissing` (9 small
  rechecks).
- `docs/research/benchmarks-codebase-survey.json` - reusable-code survey.
- `docs/research/benchmarks-design-research.json` - this design panel's full output.
- `docs/plans/ongoing/EXPANSION.md` section 7.3 - the original feature spec.
- Project memory: editorial surface pattern, dialog-portal-theme, prisma-restart-dev,
  turbopack-hmr-restart, dev-server-port (run on 3100, title must say "AISA Atlas").

## 5. Data model (Prisma)

Mirror the `Trend` model. Store leaders as inline `Json` (not a separate `BenchmarkLeaderCache`
table that the §7.3 spec floated): the trend cron proved that an inline `contentHash` + the
draft-gate works well, so reuse that shape rather than a second table.

```prisma
model Benchmark {
  id               String   @id @default(cuid())
  slug             String   @unique          // kebab-case; upsert key + /benchmarks/[slug]
  name             String                     // "GPQA Diamond"
  domain           String                     // Reasoning | Coding | Math | Multimodal | Human preference | ...
  scoreType        String                     // Accuracy | Elo | Pass rate | ... (never compare an Elo to a %)
  trust            String                     // REQUIRED trust tier: live | near_ceiling | contested | dated
  nearTie          Boolean  @default(false)   // author-set; orthogonal to trust (drives the "ranks tied" note)
  caveat           String                     // the four-word list-row caveat ("dropped by OpenAI 2026")

  whatItMeasures   String
  exampleTask      String?
  whyCare          String
  scoring          String
  calibration      String?                    // "chance 25%, experts ~81%, prior SOTA X"
  watchOut         String
  watchOutUrl      String?

  leaders          Json                       // [{ rank, model, lab, score(verbatim), baselineGloss, asOfDate, sourceUrl, selfReported, disputed }]
  leaderboardUrl   String?
  boardLastUpdated DateTime?
  honestEmpty      Boolean  @default(false)   // true => "no reliable current leaderboard" + single dated anchor
  needsRecheck     Boolean  @default(false)

  relatedConcepts  Json?                       // [{ label, slug }] -> /concepts/[slug]
  sources          Json?                       // string[]

  status           String   @default("draft")  // publish gate: draft | published (mirrors Trend.status)
  contentHash      String?                       // SHA-256 for the PR2 cron skip (inline, like Trend)
  curatedAt        DateTime?                      // set on admin edit -> PR2 cron skips this row
  syncedAt         DateTime @default(now())       // PR2 staleness banner
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@index([status])
  @@index([trust])
  @@map("benchmarks")
}
```

Apply with `prisma db push` (provider mismatch blocks `migrate dev`, same as every prior model).
After push: `prisma generate`, then KILL and restart `next dev` (HMR cannot reload
`node_modules/.prisma/client`; symptom is a 500 "Cannot read properties of undefined").

Two `status` concepts on purpose: `trust` is the displayed trust tier; `status` is the
publish gate (draft until an admin publishes), exactly like `Trend.status`.

## 6. File map (mirror the trend tracker)

Create, by analogy to the cited existing file:
- `app/(main)/benchmarks/page.tsx`         <- `app/(main)/trends/page.tsx` (force-dynamic;
  published-only for members, `?preview=draft` for admins; pass list view + counts).
- `app/(main)/benchmarks/[slug]/page.tsx`  <- `app/(main)/trends/[slug]/page.tsx` (drafts
  never reachable by URL; redirect to /benchmarks unless published or admin).
- `components/benchmarks-client.tsx`        <- `components/trends-client.tsx` (the single-column
  list; copy SectionEyebrow, the editorial-link style block, CategoryTab re-pointed to the
  TRUST axis, the tile ordinal badge, ArrowRight, usePrefersReducedMotion + trendCellIn).
- `components/benchmark-detail-client.tsx`  <- `components/trend-detail-client.tsx` (the split,
  the four beats, the ThinBar used HORIZONTALLY under WHAT TO WATCH, the BackLink) plus a new
  `ScoreStamp` subcomponent and the leader panel.
- `lib/benchmarks.ts`                        <- `lib/trends.ts` + `lib/digest-view.ts` (data
  access + server-side view serialization; resolve concept names at render time so a rename
  never goes stale).
- `prisma/seed-data/benchmarks.ts`           <- `prisma/seed-data/trends.ts` (the 13 authored
  records).
- `scripts/seed-benchmarks.ts`               <- `scripts/seed-trends.ts` (idempotent upsert by
  slug; `--check` static / `--verify` read-only / `--delete` modes; never deletes user data).
- `scripts/build-benchmarks-seed.ts`         <- `scripts/build-trends-seed.ts` (OPTIONAL
  generator that assembles `benchmarks.ts` from the research JSON; fail-loud on missing fields).
- `app/api/admin/benchmarks/route.ts`        <- `app/api/admin/trends/route.ts` (ADMIN-guarded
  PATCH publish / unpublish / publishAll; 403 for non-admins; POST sync stubbed 501 until PR2).
- `components/admin-benchmarks-card.tsx`     <- `components/admin-trends-card.tsx` ("Publish all"
  on the admin Overview, later "Sync now").
- `components/sidebar.tsx`                    add a `SidebarNavItem` in the Primary group right
  after the Trends link (sidebar.tsx ~line 118): `href="/benchmarks"`, `label="Benchmarks"`,
  a new icon (see below), `active={isActive("/benchmarks")}`.
- `components/ui/icon.tsx`                    add the benchmarks icon to the `IconName` union +
  the Phosphor map. Candidates: `Ranking`, `ChartBar`, `Gauge`, `Medal`, `Trophy`. VERIFY it
  exists first by listing `node_modules/@phosphor-icons/react/dist/csr/` (the package is
  ESM-only; `require` returns empty keys). Watch the missing-name gotchas from the icon memory.

## 7. Verified design tokens (do not guess; these were checked against globals.css)

- Wrap pages in `data-surface="editorial"` inside the `(main)` `data-theme="light"` shell.
- `--maxw-content: 1040px` (globals.css:88) for both list and detail width.
- Ground `--color-bg #FAF9F5`; text `--color-text` / `--color-text-2 #6B6B73` / `--color-text-3`
  for size-and-opacity hierarchy; every hairline is `--color-border #E8E5DC`.
- STATUS chip tokens (use `-bg` and `-fg` as a PAIR; all verified present):
  - LIVE = `--tile-sage-bg #E2EED5` / `--tile-sage-fg #4F7028`
  - NEAR CEILING = `--tile-steel-bg #D8DEEC` / `--tile-steel-fg #38486D`
    (note: `--tile-slate` does NOT exist; runner-up proposals that named it were wrong)
  - CONTESTED = `--tile-gold-bg #FBE2A6` / `--tile-gold-fg #855208`
  - DATED = `--tile-stone-bg #DDDDE3` / `--tile-stone-fg #43434E`
  - ordinal / rank badge = `--tile-indigo-bg #DDDAFB` / `--tile-indigo-fg #4F40A0`
- Caveat hue for WHAT TO WATCH eyebrow + the 3px ThinBar: `--color-gold` (#B8860C in light),
  `--color-gold-soft #FBEFCE` only if a soft background tint is needed.
- ThinBar (in `components/trend-detail-client.tsx`) is a 3px HORIZONTAL bar (height 3,
  left-anchored width). Reuse horizontally; do NOT invent a vertical rail.

## 8. Phases

**Phase 0 (GATING): deep-research leader refresh.** James's call: ship all 13, but the leader
data is the stale part, so run one more deep-research query first (section 9). Only LMArena has
a verified current top-3, round 2 never produced an arena.ai snapshot, LiveCodeBench has no
readable board, FrontierMath is `needsRecheck` (Epoch mid-review), and several boards are months
stale. Output feeds `prisma/seed-data/benchmarks.ts`. Run in a separate deep-research chat.

**PR1: static surface (the whole build, zero infra).**
1. `Benchmark` model + `db push` + generate + restart dev.
2. `prisma/seed-data/benchmarks.ts` (13 records) authored from the research + Phase 0 refresh,
   each with: the four-beat body, an example task, a calibration anchor, the four-word caveat,
   the trust tier + nearTie boolean, verbatim leader strings (or `honestEmpty: true` + a single
   dated anchor), `relatedConcepts` validated against real concept slugs, 0 dashes. Seed via
   `scripts/seed-benchmarks.ts` as drafts.
3. `lib/benchmarks.ts`, the list route + `benchmarks-client.tsx`, the detail route +
   `benchmark-detail-client.tsx` + `ScoreStamp` + leader panel (with honest-empty + ties +
   board-behind line).
4. Sidebar link + icon; admin publish gate route + `admin-benchmarks-card.tsx`; POST sync
   stubbed 501.
5. Publish-gate verify, then publish all 13 in the shared DB (invisible until the code deploys),
   same dance as the trend tracker.

**PR2: weekly leader cron (purely additive).** Clone the trend-sync pipeline:
`app/api/cron/sync-benchmarks` (Bearer `CRON_SECRET`, `maxDuration 300`), admin "Sync now",
inline `contentHash` skip, the draft-gate (a changed benchmark drops to `status=draft` for
review; unchanged stay published), the >Nh staleness banner. Reuse the shared helpers in
`lib/text.ts` / `lib/url.ts` / `lib/llm-json.ts`. Leaders move on the order of weeks, so a
weekly cadence; `vercel.json` schedule stays UNWIRED until James picks it (same stance as the
digest + trends crons). Note from Phase 0: GPQA Diamond, FrontierMath, and ARC-AGI-2 have no
canonical machine-readable board, so for those the "refresh" is hand-curation, not an auto-swap.

## 9. Phase 0 deep-research prompt (run in a separate deep-research chat)

> Goal: refresh and complete the LEADER data for the 13 benchmarks so the static seed ships
> with the most current, trustworthy, DATED top-3 we can get, and an honest-empty verdict where
> we cannot. This is content, not engineering. Use the model mix from the deep-research memory
> (sonnet for search/fetch, opus to verify, fable only for final synthesis).

```
For each of these AI benchmarks, find the CURRENT (June 2026) top-3 leaderboard if a
trustworthy one exists: MMLU-Pro, GPQA Diamond, SWE-bench Verified, HumanEval, LiveCodeBench,
ARC-AGI-2, MMMU, LMArena / Chatbot Arena Elo, Humanity's Last Exam, FrontierMath, AIME,
TAU-bench (plus any clear v1 addition). For each benchmark return, as structured data with a
source link for every number:
(1) the official or best-available leaderboard URL and the date it was last updated;
(2) the top-3 models with lab, the score COPIED VERBATIM as the board states it (keep intervals
    like "1510 +/- 11" and split-name caveats), each entry's as-of date, and whether each score
    is self-reported or independently evaluated, and whether it is disputed;
(3) whether the top ranks are a statistical tie (a near-tie), stated plainly;
(4) a one-line baseline anchor a non-expert needs to read the top score (random chance, expert
    human level, prior state of the art);
(5) if NO trustworthy current board exists (e.g. LiveCodeBench, or boards that are JS-only and
    unreadable), say so explicitly and give the single most-cited DATED anchor figure instead,
    never a guess.
Specifically resolve the round-2 gaps: produce the missing arena.ai / LMArena snapshot, make a
real attempt at LiveCodeBench (parse performances_generation.json from its GitHub Pages repo or
use browser automation), and re-check FrontierMath now that Epoch AI may have finished its
review. Adversarially verify every top-3 before returning it. No em dashes or en dashes.
```

Save its output to `docs/research/benchmarks-leaders-refresh.json`.

## 10. Decisions locked (James, 2026-06-23)

- **v1 = all 13 benchmarks** (not a staged 6-8). Accept the heavier editorial authoring; run the
  Phase 0 research refresh first to fill the leader gaps.
- **Keep the leader panel, embrace honest + dated.** Most panels will show dated anchors or the
  honest-empty state; that truthfulness is the point of the page.
- **v1 is static + dated**, zero infra. The weekly leader cron is PR2, purely additive.

## 11. Still open (confirm during build, do not block PR1 structure)

- STATUS taxonomy wording: default `LIVE / NEAR CEILING / CONTESTED / DATED`. Some benchmarks are
  two states at once (FrontierMath is contested AND near-saturation; HumanEval is near-ceiling
  AND somewhat dated). Show the single dominant state on the list, let WHAT TO WATCH hold the
  nuance. James picks the dominant state per benchmark.
- Search box: deferred for v1 (13 items are scannable; the TRUST filter tabs are enough). Add a
  free-text search only if the set grows.
- LiveCodeBench: include as an honest-empty entry (it teaches "no trustworthy board exists")
  unless Phase 0 produces a readable board.

## 12. Acceptance + tests (PR1)

- `/benchmarks` lists all 13 as a single-column hairline index, STATUS chip + four-word caveat
  per row, no raw score on rows, trust-axis filter tabs with correct counts, 0 dashes, light
  theme, 0 console errors, no mobile overflow.
- Each `/benchmarks/[slug]` renders the four beats in order, the example task, the calibration
  anchor, the gold WHAT TO WATCH section, the leader panel (ScoreStamp dated, inline trust
  chips, ties handled, honest-empty where applicable, board-behind line correct), and resolving
  catalog cross-links.
- Draft benchmarks are invisible to members and 404/redirect by URL; admin `?preview=draft`
  shows them; the publish-gate route is 403 for non-admins.
- Playwright-verify the member surface end to end (same checklist the trend tracker used).
  Admin button-clicks need an admin session.
