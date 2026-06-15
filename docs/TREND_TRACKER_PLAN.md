# Trend Tracker - Implementation Plan (EXPANSION.md section 7.2)

> Status: READY TO BUILD as of 2026-06-14. Research complete, code-grounded plan below.
> This doc is self-contained: a fresh session can execute from it plus the committed inputs.
> Build on branch `feat/trend-tracker` off master. Commit after each logical step.

## What this is

A `/trends` "pulse of tech" surface: a packed-circle bubble field (size = momentum, color =
category, ring = heating/cooling) that clicks through to a plain-language brief per trend. Plus an
admin "Sync now" panel and a daily cron that refreshes the trends from live web search. The
education hook is the per-trend "Related in the catalog" links back to concept pages.

## Inputs (all committed to master)

- **`docs/research/trend-map-research.json`** - the 22 verified trends to seed. Each record has:
  `name, slug, category (AI|Tech|Capital), whatItIs, whatsHappeningNow, momentum (0-100),
  momentumLabel (emerging|accelerating|mainstreaming|cooling), direction (heating|cooling),
  topStories[{headline, sourceUrl, date, whyItMatters}], relatedConcepts[string], sources[],
  confidence, notes, synthNote`. Top level also has `categoryBalance` (AI 11 / Tech 7 / Capital 4),
  `stillThin[]` (8 soft facts to recheck), and `caveats`.
- **`docs/research/benchmarks-codebase-survey.json`** - reusable-code survey (digest pipeline,
  schema, surfaces, admin, infra).
- **`docs/EXPANSION.md` section 7.2** - the feature spec (bubble field, detail page, pipeline, data models).
- Project memory: `[[deep-research-model-mix]]`, `[[feedback_editorial_surface]]`,
  `[[feedback_browse_card_aesthetic]]`, `[[feedback_dialog_portal_theme]]`,
  `[[feedback_prisma_restart_dev]]`, `[[feedback_no_em_dashes]]`, `[[project_dev_server_port]]`.

## Decisions locked

1. **Bubble field: add `d3-hierarchy`** (the `pack()` layout only, ~20KB). No viz library exists in
   the repo today; hand-rolling circle-packing is the medium-high risk path. `pack()` solves it in
   one call. Render the result as plain SVG `<circle>` with inline-style tokens.
2. **Shared primitives: extract** `verifyUrl`, `cleanDigestText`/`stripDashes`,
   `balancedJsonCandidates` out of `lib/digest-sync.ts` into shared modules (`lib/url.ts`,
   `lib/text.ts`, `lib/llm-json.ts`) - but do this at the START of Phase 4 (when `trend-sync` first
   needs them), update `digest-sync.ts` to import from the new location, and verify the digest still
   builds and behaves. Do NOT touch the live digest before then.
3. **Ship static-first.** Phase 1+2 (seeded static list + detail + publish gate) is PR #1, a
   complete shippable feature. Bubble field is PR #2. Cron is PR #3. Matches how the digest and the
   section 7.3 benchmarks plan sequence ("static + dated first, then cron").

## Grounded code map (from recon, 2026-06-14)

### Clone source for the cron - `lib/digest-sync.ts`
- Model `claude-opus-4-8`; web search tool `web_search_20250305` (NOT `20260209`, which blew past
  the 300s ceiling); `MAX_TOKENS = 24000`; `WEB_SEARCH_MAX_USES = 10`; `MAX_API_CALLS = 4` bounding
  a `do/while` pause_turn loop on `.stream().finalMessage()`.
- Reusable primitives (currently private to this file): `balancedJsonCandidates()` (generator
  yielding every balanced `{...}`, take the last valid one), `stripDashes()`, `cleanDigestText()`
  (strips leaked `<cite>` markup then stripDashes), `verifyUrl()` (real GET, follow redirects, 8s
  timeout, browser UA, `res.ok` = verified, derive sourceDomain from the RESOLVED url).
- **Cache is INLINE, not a separate table.** `DigestEdition.contentHash` (SHA-256 of normalized
  content) on a row keyed `weekOf @unique`; skip logic = re-fetch by key, compare hash, upsert only
  if different. *(Correction to old memory: there is no `TrendSyncCache`/`BenchmarkLeaderCache`
  table; follow the inline-hash pattern, per-Trend-row.)*
- Cron route `app/api/cron/sync-digest/route.ts`: `export const maxDuration = 300`, Bearer
  `CRON_SECRET` check -> 401 on miss, returns `{ok, weekOf, outcome, itemCount, dropped,
  searchesUsed, apiCalls, errors, durationMs}`. `vercel.json` entry `0 13 * * 1`.
- Admin route `app/api/admin/digest/route.ts`: `requireAdmin()` (Supabase user -> Prisma
  `User.role === "ADMIN"` -> 403), POST = generate now (as DRAFT), PATCH = publish/unpublish.
  `maxDuration = 300`. Review-before-publish: generates draft, admin reviews, then PATCH publishes.
- Admin UI `components/admin-digest-card.tsx`: POST -> outcome pill -> "Review draft" link ->
  Publish. Mirror this and `components/admin-calendar-sync.tsx` (Sync now -> POST -> result pill ->
  `router.refresh()`).

### Schema template - `prisma/schema.prisma`
Model graph: Track -> Tier -> Section -> Concept; recent feature models Project (lines ~258-284),
ProjectInterest, Feedback, ScheduleEvent, ScheduleCellCache, DigestEdition. **Project is the
template**: `slug @unique` (business/upsert key), `status` default "draft", string-enum `stage`,
nullable `trackId`, `Json?` fields, `createdAt`/`updatedAt @updatedAt`, `@@index([status])`,
`@@map("projects")`. Prisma-7: no datasource url in schema, `createMany` has no `skipDuplicates`
(use upsert loops), restart dev after `db push` + generate.

### Seed pattern - `scripts/seed-projects.ts`
Idempotent: `upsert({ where: { slug }, create: { status: "draft", ...common }, update: common })`
so new rows are draft and existing rows never lose their published/curated state. Modes: `--check`
(static validation only), `--verify` (static + read-only DB cross-check), `--delete a,b,c` (soft
delete by slug). Run: `npx tsx --env-file=.env scripts/seed-projects.ts [mode]`. Child rows
(assignments) are deleteMany + recreate per parent. Mirror exactly for `seed-trends.ts`.

### Surfaces + tokens
- Container `maxWidth: 1040` (`--maxw-content`), `padding: "32px 32px 80px"`, centered.
- Tokens: `--color-bg #FAF9F5`, `--color-surface #FFFFFF`, `--color-surface-2`, `--color-text`,
  `--color-text-2`, `--color-border`, `--color-accent #5E6AD2`, `--color-accent-soft`, radius
  `--radius-1..3`, text `--text-sm..2xl`. Styling is inline `style={{}}`, classes only for
  responsive hooks. `(main)` shell sets `data-theme="light"` (`components/main-shell.tsx`).
- Primitives: `IconTile` (colors incl. blue, steel, sage, mint, indigo, honey...), `Button`
  (primary/secondary/ghost), `Icon` (Phosphor, `name`+`size`), `StatusTag` (tone pills).
- **List view** = Build Board card pattern (`components/build-client.tsx`): flex column of cards,
  IconTile + content, title row with chips, 2-line preview, hover bg -> surface-2, stretched link.
  Reuse `StageChip`-style for momentumLabel, `StatusTag` for category.
- **Detail page** = `components/build-detail-client.tsx` (820px, breadcrumb, IconTile header,
  bordered sections, markdown renderers, external-link chips). Top Stories = dated rows with source
  chips; Related concepts = links to `/concepts/[slug]`.
- **Admin** = `components/admin-calendar-sync.tsx` + `admin-digest-card.tsx` patterns.
- Portal gotcha: any modal must `createPortal(..., document.body)` AND re-wrap in
  `<div data-theme="light">` (see `components/feedback-dialog.tsx`).

### Nav + routing
Sidebar `components/sidebar.tsx` (PREPARE group has the global, non-track-scoped links: Assessments,
Calendar, Homework). Add `Trends` there. Global pages live at `app/(main)/<name>/page.tsx` like
`/calendar`, `/digest`. Trends are global (category, not Track-scoped), so they sit outside track
scope like Calendar.

### Bubble field feasibility
No d3/visx/recharts/force code anywhere; calendar is a CSS grid. Path: add `d3-hierarchy`, build
`pack()` input (one node per trend, `value` = momentum), render `leaves()` as SVG `<circle>` with a
`ResizeObserver` for responsiveness. The list view is the mandatory a11y/mobile fallback and the
MVP; the bubble field is a progressive enhancement behind the toggle.

## Proposed schema (add to prisma/schema.prisma)

```prisma
model Trend {
  id              String   @id @default(cuid())
  slug            String   @unique               // kebab-case; upsert key + URL
  name            String
  category        String                          // "AI" | "Tech" | "Capital"
  whatItIs        String                          // plain-language explainer
  whatsHappening  String                          // "what's happening now (mid-2026)"
  momentum        Int      @default(50)           // 0-100, drives bubble size
  momentumLabel   String   @default("accelerating") // emerging|accelerating|mainstreaming|cooling
  direction       String   @default("heating")    // heating|cooling -> solid|dashed ring
  relatedConcepts Json?                            // [{ label, slug? }] - slug links to /concepts/[slug]
  sources         Json?                            // string[] backing URLs
  confidence      String   @default("high")
  status          String   @default("draft")      // draft|published (publish gate)
  contentHash     String?                          // SHA-256 for cron skip (inline, like DigestEdition)
  curatedAt       DateTime?                         // set on any admin edit -> cron skips this row
  syncedAt        DateTime @default(now())          // staleness banner if >36h
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  updates         TrendUpdate[]
  @@index([status])
  @@index([category])
  @@map("trends")
}

model TrendUpdate {
  id           String   @id @default(cuid())
  trendId      String
  headline     String
  whyItMatters String
  sourceUrl    String?
  sourceDomain String?
  date         DateTime
  createdAt    DateTime @default(now())
  trend        Trend    @relation(fields: [trendId], references: [id], onDelete: Cascade)
  @@index([trendId])
  @@index([date])
  @@map("trend_updates")
}
```

Category -> color (bubble fill + card rail): **AI -> blue, Tech -> steel (slate), Capital -> sage
(green)** via `--tile-{color}-bg/fg` (spec says AI blue / Tech slate / Capital green).

## Phased plan

### Phase 0 - branch
`git checkout -b feat/trend-tracker` off master.

### Phase 1 - Data layer (schema + seed, draft-gated)
Deliverables:
- D1.1 `Trend` + `TrendUpdate` in schema.prisma (above). `prisma db push` + `prisma generate`,
  then **kill and restart `next dev`** (HMR can't reload `.prisma/client`; symptom is 500 "Cannot
  read properties of undefined"). Run on port 3100, verify title says "AISA Atlas".
- D1.2 `prisma/seed-data/trends.ts` generated from `trend-map-research.json`: **apply each record's
  `synthNote` fix**, spot-check the 8 `stillThin` items, strip all em/en dashes, seed `status:
  "draft"`. Build the `relatedConcepts` mapping here: free-text label -> concept slug where
  confident (e.g. "agents and tool use" -> `agentic-capabilities`, "reasoning"/"chain-of-thought"
  -> `reasoning-models`, "multimodality" -> `multimodality`, "transformer architecture" ->
  `transformers`, "evaluation and benchmarking" -> `benchmarking-llms`, "AI alignment" ->
  `ai-alignment`, "interpretability" -> `interpretability`, "synthetic data" -> `synthetic-data`,
  "training vs inference" -> `training-vs-inference`, "world models" -> `world-models`,
  "robotics/embodied AI" -> `robotics-embodied-ai`, "open-weight" -> `open-source-vs-open-weights`,
  "AI regulation" -> `ai-regulation`). Leave non-matches as `{label}` with no slug (renders as plain
  text). Capital-category trends and infra terms ("AI capex", "concentration risk", "on-device AI")
  will mostly have no concept link - that is expected; the catalog is AI-literacy, not finance.
- D1.3 `scripts/seed-trends.ts` idempotent (upsert by slug, child `TrendUpdate` rows deleteMany +
  recreate, never clobber `curatedAt`/published rows), with `--check`/`--verify`/`--delete` modes,
  run via `npx tsx --env-file=.env`.
Tests:
- T1.1 `--check` passes: 22 trends, valid category/momentumLabel/direction enums, momentum 0-100,
  every topStory has a sourceUrl, zero em/en dashes anywhere.
- T1.2 seed then `--verify` shows 22 draft Trend rows + the TrendUpdate rows; re-run seed is
  idempotent (counts stable, no dupes).
- T1.3 concept-map coverage report printed (how many trends got >=1 linked concept; orphans listed).

### Phase 2 - Static surfaces (PR #1: list + detail + publish gate)
Deliverables:
- D2.1 `app/(main)/trends/page.tsx` (force-dynamic) -> `components/trends-client.tsx`: **list view**
  (category-railed cards, momentumLabel chip, whatsHappening preview), category filter chips, and
  the list<->bubble toggle scaffold (bubble disabled until Phase 3). Build Board card pattern.
- D2.2 `app/(main)/trends/[slug]/page.tsx` -> `components/trend-detail-client.tsx`: breadcrumb,
  header (IconTile + name + category/momentum chips), sections What it is / What's happening now /
  Top stories (dated rows + source chips) / Related in the catalog (concept links). Build detail
  template, 820px.
- D2.3 `components/sidebar.tsx`: add `Trends` link in PREPARE group (icon `trend-up`).
- D2.4 `app/api/admin/trends/route.ts` PATCH publish/unpublish (`requireAdmin`) +
  `components/admin-trends-card.tsx` listing drafts with Publish/Unpublish. POST-generate stubbed
  until Phase 4.
- D2.5 Spot-check the 22, then publish them so the surface is non-empty.
Tests (Playwright, dev on 3100):
- T2.1 `/trends` renders the published cards; category filter narrows; card click -> detail.
- T2.2 `/trends/[slug]` shows all sections, >=1 dated top story with a working external link, and
  related-concept links that resolve to `/concepts/[slug]`.
- T2.3 sidebar Trends active state; mobile width renders the list with no overflow.
- T2.4 admin publish/unpublish flips visibility (draft hidden from anonymous/members on `/trends`).
- T2.5 zero em/en dashes in rendered content; `data-theme="light"` correct (no dark bleed).
- **Checkpoint: merge PR #1, deploy, live-verify on aisa-atlas.vercel.app. Complete shippable feature.**

### Phase 3 - Bubble field (PR #2: enhancement)
Deliverables:
- D3.1 add `d3-hierarchy` to package.json.
- D3.2 `components/trend-bubble-field.tsx`: SVG `pack()` (radius prop momentum, fill = category
  color, ring solid heating / dashed cooling, label, click -> detail), `ResizeObserver` responsive,
  ~1200px surface like the calendar.
- D3.3 wire the toggle (bubble default desktop, list default mobile/a11y, choice persisted in
  localStorage). Colorblind-safe rings (solid/dashed, not color-only) + hover tooltip (name + momentum).
Tests:
- T3.1 desktop: 22 circles, radius tracks momentum, click -> detail.
- T3.2 toggle works; mobile width auto-uses list.
- T3.3 a11y: circles keyboard-focusable + accessible labels; list is the screen-reader path.
- T3.4 deterministic packing (no `Math.random`/`Date.now` in layout; stable across renders).
- **Checkpoint: merge PR #2, deploy, verify.**

### Phase 4 - Live cron pipeline (PR #3, L-effort)
Deliverables:
- D4.0 **extract** `verifyUrl` -> `lib/url.ts`, `cleanDigestText`/`stripDashes` -> `lib/text.ts`,
  `balancedJsonCandidates` -> `lib/llm-json.ts`; update `digest-sync.ts` imports; verify digest
  unaffected (build + a manual digest sync still works).
- D4.1 `lib/trend-sync.ts` cloning digest-sync: ONE `web_search` call per category (3 total),
  `claude-opus-4-8`, `web_search_20250305`, MAX_API_CALLS bound, balanced-brace JSON, cleanDigestText,
  verifyUrl on every story URL (drop dead links).
- D4.2 per-Trend upsert with inline `contentHash` skip; respect `curatedAt` lock (skip
  human-edited rows); update `syncedAt`; cron-created/changed trends land as `draft`
  (review-before-publish). Momentum is LLM-assigned per sync (model returns 0-100 from
  recency/volume signals; no formula).
- D4.3 `app/api/cron/sync-trends/route.ts` (Bearer `CRON_SECRET`, `maxDuration 300`) + `vercel.json`
  `0 7 * * *` (daily, staggered from digest Mon 13:00). Set `CRON_SECRET` in Vercel env (already set).
- D4.4 `app/api/admin/trends/route.ts` POST (manual Sync now) + wire `admin-trends-card` Sync now
  (POST -> pill -> refresh) + staleness banner on `/trends` if `syncedAt` > 36h.
Tests:
- T4.1 cron 401 without Bearer, 200 with; payload `{ok, outcome, counts, searchesUsed, durationMs}`.
- T4.2 hash-skip: run sync twice, second reports cached/no-writes for unchanged trends.
- T4.3 `curatedAt` lock: edit a trend, run sync, confirm it is untouched.
- T4.4 every synced URL verified-or-dropped; zero em/en dashes in output.
- T4.5 cost guard: `searchesUsed <= 3` per run; a real run completes under maxDuration.
- T4.6 staleness banner shows when `syncedAt` > 36h.
- **Checkpoint: merge PR #3, deploy. First unattended cron = next 07:00 UTC; verify Fluid
  Compute/maxDuration on that run.**

## Guardrails / gotchas
- Restart `next dev` after every `prisma db push` + generate (port 3100; title "AISA Atlas").
- Zero em/en dashes in any seeded or generated content (prompt rule + stripDashes sanitizer).
- Seed and cron-create as `draft`; nothing student-facing until an admin publishes.
- Apply per-record `synthNote` fixes and spot-check `stillThin` before publishing the 22.
- Trends are global, not Track-scoped (do not thread trackId).
- Cache is inline `contentHash` per Trend row; there is no separate sync-cache table.
- Modals (if any) need `createPortal` + `data-theme="light"` re-wrap.

## Model corrections captured here
- Old memory said the cron cache would be a `TrendSyncCache`/`BenchmarkLeaderCache` table; the
  shipped pattern is inline `contentHash` on the content row. Use inline per-Trend hash.
