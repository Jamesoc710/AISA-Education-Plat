# TCO Expansion Plan

> **From AISA Atlas → TCO (Tech Collective Org).** Staying AI-centric, broadening to wider
> tech, and adding a Capital Markets / VC branch. This is the master plan: the vision, the
> architecture decision everything hangs on, every feature fleshed out, and a phased roadmap
> with concrete deliverables at each stage.
>
> **Status:** Executing. Phase 1 ("Now") **shipped**; "This Week in Tech" digest **shipped, merged
> to master, and live in production** (complete for now — follow-up ideas parked in §8 LATER).
> Next up: Build Board + Opportunities. Last updated 2026-06-09.
> **Owner:** @etownjames7 · **Doc home:** `docs/EXPANSION.md`

---

## How to use this doc

- **Section 1–4** = the why and the rules. Read once.
- **Section 5** = the one load-bearing engineering decision (the `Track` model). Build first.
- **Section 6** = the three reusable patterns every feature leans on.
- **Section 7** = each feature, fully specified (surface, data model, sourcing, MVP, deliverable).
- **Section 8** = the phased roadmap with **per-stage deliverables + acceptance criteria**.
- **Section 10** = the exact deep-research prompts to run in a separate chat.
- Check items off in Section 8 as they ship; update the Changelog (Section 13).

---

## 1. The pivot

AISA Atlas was built as an AI-literacy study tool for one cohort prepping for a tech-team
test. TCO keeps the AI spine but becomes a **broad, come-as-you-are resource for a varied
membership** — AI, Capital Markets/VC, and wider tech — for members of any background and
interest level.

**What changes:** the audience (one cohort → the whole club), the scope (AI-only → multi-track),
and the framing (test-prep / "recruits" → self-directed exploration). **What doesn't:** the
stack, the design system, and the core learning machinery — all of it generalizes.

---

## 2. Where we are today (June 2026)

- **(Update 2026-06-09)** The TCO pivot is live in production: Track model + track-scoped
  Browse/Quiz/Flashcards/Progress, the 42-term Capital Markets vocabulary track **with its 84
  authored quiz questions (quiz content complete)**, MEMBER rename, and the full "This Week in
  Tech" digest (weekly Opus + web-search pipeline, review-before-publish, archive, home teaser,
  self-check quiz). First unattended digest cron: Mon 13:00 UTC.
- **Live & real.** Deployed on Vercel; ~21 real members used it actively in late April, then it
  went dormant. Revival is part of the goal.
- **Feature-complete core:** Browse (16 sections / 57 AI concepts), concept detail, practice quiz
  (MC + LLM-graded short answer), flashcards, formal assessments, homework, progress dashboard,
  SharePoint-synced calendar, feedback, and a full admin console. Clean codebase (no stub debt).
- **Recently fixed (2026-06-08):** the short-answer **LLM grader** was silently failing on every
  call (Claude wrapped its JSON in ```` ```json ```` fences → `JSON.parse` threw → generic
  fallback). Fixed in `lib/grading.ts` (robust JSON extraction) + hardened
  `components/quiz-short-answer.tsx`. This repaired grading in **both** practice quizzes and
  formal assessments. Verified live.
- **Known framing debt to shed during the pivot:** default role `RECRUIT`, "Mentor console" /
  "Recruits" labels, tier subtitles that gatekeep ("you're not ready for… client conversations"),
  and `whyItMatters` copy anchored to "clients/recruiters."

---

## 3. Guiding principles

1. **AI stays the flagship — by construction.** New tracks never dilute it: AI is `isPrimary`,
   `sortOrder=0`, the default route, and sidebar-first.
2. **Come-as-you-are.** No gatekeeping, no test-prep framing on any new surface. Tracks are
   *interests, not access tiers.* Anyone can join/switch any track.
3. **Reuse, don't reinvent.** Every feature is one of three things: a Track, a clone of the
   calendar's live-data pipeline, or a reuse of the card/editorial surfaces. (See §6.)
4. **Never fetch live per request.** All "current" data is **DB-cached + cron-refreshed + LLM-
   assisted**, exactly like the calendar sync. Admins get a "Sync now" button.
5. **Content is the real bottleneck, not code.** Line up a content owner per track *before*
   shipping its surface, or it launches thin and loses credibility.
6. **Ship the safe, static cut first.** Every live/LLM feature has a static-first MVP so v1
   carries zero cron/cost risk; the dynamic layer is purely additive.

---

## 4. Naming & terminology cleanup (cross-cutting, do alongside Phase 1)

| Old | New |
|---|---|
| Role `RECRUIT` (default) | `MEMBER` |
| "Mentor console" / "Recruits" (admin) | "Console" / "Members" |
| Gatekeeping tier subtitles | Neutral, curiosity-led copy |
| `whyItMatters` "when clients ask…" | Broadened to personal/career relevance |

> Role is a free-string column today, so renaming the default is low-risk — but audit every
> read of the literal `"RECRUIT"` (e.g. admin stat cards, both `auth/callback` routes) before
> flipping it.

---

## 5. Foundation: the `Track` model (build this first)

Today: `Tier → Section → Concept`, single-domain (AI). To support AI · Capital Markets · Tech in
parallel, add **one model — `Track` — as the new root above `Tier`.** Three independent design
passes converged on this exact shape.

### Why Track-above-Tier (not a `track` string column, not separate trees)

- **The migration is ~2 data lines.** Only `Tier` needs the FK; `Section`/`Concept`/`Question`/
  `Bookmark` inherit Track *transitively*. Seed one `ai` Track, backfill `trackId` on the 3
  existing tiers — done.
- **Browse changes by one line:** loader gains `where: { section: { tier: { trackId } } }`.
- A string column would leak track-filtering into every query and force a painful re-migration
  the moment Capital gets real content. Do the real model once.

### Schema (additive, non-destructive)

```prisma
model Track {
  id          String  @id @default(cuid())
  slug        String  @unique          // "ai", "capital-markets", "field-guides"
  name        String
  shortName   String
  description  String
  accentColor String                   // drives the per-track accent swatch
  isPrimary   Boolean @default(false)  // AI = true
  sortOrder   Int                      // AI = 0
  tiers       Tier[]
  @@map("tracks")
}

// Tier gains:
trackId String @default("<ai track id>")   // NULLABLE-add then backfill, then make required
track   Track  @relation(fields: [trackId], references: [id])
@@index([trackId])

// User gains:
activeTrackId String?                       // + mirror to a cookie for SSR-safe scoping

model TrackMembership {                      // members can hold multiple tracks
  userId   String
  trackId  String
  joinedAt DateTime @default(now())
  @@id([userId, trackId])
  @@map("track_memberships")
}
```

### Migration safety rails (live DB, 21 real members)

1. **Add `Tier.trackId` as nullable**, backfill all existing tiers to the seeded `ai` track, then
   (optionally) make it required. One migration. Never reseed concepts in place — that would
   orphan `Bookmark` rows by `conceptId`.
2. **Slug discipline (critical):** `Tier.slug` / `Section.slug` / `Concept.slug` are globally
   `@unique` today, and bookmarks, `/concepts/[slug]` routes, **and the calendar's
   `catalogFingerprint` LLM cache** all depend on the 57 AI slugs staying byte-stable. So:
   - **Keep AI slugs unprefixed and untouched.**
   - **Namespace all new-track slugs:** `cap-safe`, `cap-carry`, `tech-git`, …
   - Migrate `Tier.slug` to `@@unique([trackId, slug])`; **leave `Concept.slug` globally unique
     for v1** so routes and the calendar cache never churn.
3. **Active track in a cookie + `User.activeTrackId`** (no URL segment in v1, so existing routes
   keep working). A `/t/[trackSlug]/…` URL form can layer on later for shareable deep links.
4. **After `prisma db push`, kill and restart `next dev`** or every surface 500s with "Cannot
   read properties of undefined" (HMR can't reload the generated client). See
   `feedback_prisma_restart_dev`.

### Track-scoping must thread through ALL read paths

Browse **and** Quiz **and** Flashcards **and** Progress must read `activeTrackId` — otherwise a
Capital member's practice quiz mixes "carry" and "transformers" and the pivot is only cosmetic.

---

## 6. Shared infrastructure you'll reuse everywhere

### 6.1 The live-data pipeline (clone of `lib/schedule-sync.ts`)
Every "current" surface — Trend Tracker, This Week digest, Benchmark leader lines, Market Pulse —
clones the **same five pieces**:
1. Anthropic client + Claude (`claude-haiku-4-5-20251001`, **web_search tool** enabled for fresh data).
2. **SHA-256 content-hash cache-skip** (`ScheduleCellCache` → `TrendSyncCache` / `BenchmarkLeaderCache` / …): the model only re-runs when the underlying source digest changes.
3. Prisma `Json` upsert of the normalized result.
4. A hard **`LLM_CAP` budget guard** (calendar uses 100) so a stuck cron can't burn budget.
5. **Deterministic fallback** on LLM/parse failure (graceful degradation, never a crash).
Plus the cron route (`Bearer CRON_SECRET`) and an admin **"Sync now"** button.

> **Cron staggering** (`vercel.json` currently has one entry — calendar `0 6 * * *`). Add each new
> cron on its own slot so they don't contend for function/LLM budget:
> digest `0 13 * * 1` (Mon), benchmarks `0 6 * * 0` (Sun), trends `0 7 * * *` (daily).

> **URL-verification rule:** for any LLM-surfaced story/link, only persist updates whose URL the
> cron successfully fetches (200), and require `sourceDomain` to be extracted from the *real*
> returned URL — never model-generated. Guards against hallucinated headlines.

> **web_search tool-version learning (digest, 2026-06-09):** use `web_search_20250305`, not
> `web_search_20260209` — the newer version's dynamic-filtering rounds pushed a live Sonnet 4.6
> run to ~410s (past any Vercel function ceiling); plain search finishes in ~65s. Set
> `export const maxDuration = 300` on every web-search route, and extract model JSON with a
> balanced-brace scanner (prose after the JSON broke first-`{`-to-last-`}` slicing). Searches
> bill at $10/1k + tokens; `usage.server_tool_use.web_search_requests` reports the count.

### 6.2 The card surface (clone of `browse-client.tsx`)
Brilliant-style bordered rows + colored `IconTile` left rail, 18px titles, content-preview lines,
~1040px. Use for **catalog / act** surfaces: Browse, Build Board, Trend list-view, Tools Directory.

### 6.3 The editorial surface (clone of `home-client.tsx`)
`data-surface="editorial"`, Hanken Grotesk + Quizlet blue `#4255FF`, hairline rules, no cards.
Use for **read / reflect** surfaces: Home, Progress, Benchmarks, Deal Teardowns, the onboarding
track-picker, the track-switcher popover.

> Dialogs/popovers must `createPortal` to `document.body` **and** re-wrap in `data-theme="light"`
> (the established trap-avoidance pattern).

---

## 7. The features

Effort: **S** = <½ day · **M** = ~1–2 days · **L** = ~3–5 days. All "auth" = logged-in member,
no role gating, unless noted.

### 7.1 Capital Markets & VC — second Track *(Phase 1 flagship of the rebrand)*

A real second learning track that **instantly inherits** flashcards, quiz, bookmarks, progress,
and the calendar's pre-session review. Lights up the dormant `CAPITAL_TEAM` calendar events.

- **Surface:** Track switcher pill at top of Browse (`?track=capital-markets`); same card surface,
  green-spectrum tiles (echoing the calendar's `CAPITAL_TEAM` green). Concept pages unchanged.
- **v1 content — one "Vocabulary" tier, 4 sections, ~32 terms** (`cap-*` slugs):

  | Section | Terms |
  |---|---|
  | **Venture Financing** | SAFE · priced round · Series A/B/C · term sheet · cap table · dilution · pre/post-money valuation · option pool · liquidation preference · pro rata · convertible note · vesting/cliff |
  | **Fund Mechanics** | LP · GP · carry · management fee · 2-and-20 · capital call · vintage year · DPI · TVPI · MOIC · IRR · J-curve |
  | **Markets & Metrics** | TAM/SAM/SOM · ARR/MRR · net revenue retention · burn rate · runway · CAC/LTV · EV/Revenue & EV/EBITDA multiples · DCF · public comps |
  | **Diligence & Deal Terms** | due diligence · data room · board seat · anti-dilution (full-ratchet vs weighted-average) · drag-along/tag-along · ROFR · down round · secondary · exit (M&A vs IPO) |

- **Data model:** none new beyond Track — these are `Concept` rows. Extend `SECTION_VISUALS` in
  `lib/section-icons.ts` with the 4 capital sections + icons/colors.
- **Sourcing:** one-time authored seed (see deep-research §10), reviewed by a Capital lead. Evergreen — no refresh cost.
- **Effort:** M (after Track lands). **MVP deliverable:** a member switches to Capital Markets and
  studies 32 VC terms via Browse + flashcards + quiz; AI members see zero change.
- **Fast-follows:** **Deal Teardowns** (editorial surface; annotated real financings, jargon links
  back to `cap-*` concepts) and **Market Pulse** (weekly venture/markets digest via the §6.1 pipeline).

### 7.2 Trend Tracker — "pulse of tech" *(Phase 2/3; ship the digest cut first)*

Bubble field of what's moving in AI / tech / markets right now → click for a plain-language brief.

- **Bubble field (`/trends`, card surface):** 14–22 packed circles.
  - **Size = momentum** (0–100, blends recency + story volume + week-over-week delta).
  - **Color = category** (AI blue · Tech slate · Capital green).
  - **Ring = direction** (solid heating / dashed cooling — colorblind-safe).
  - Category filter chips + a **mandatory List-view toggle** (card rows) for mobile/a11y.
- **Detail (`/trends/[slug]`):** *What it is · What's happening now · Top stories* (dated headline
  + source + why-it-matters) *· New developments · Related in the catalog* (← the education hook:
  links a hot headline straight to the concept behind it).
- **Pipeline:** §6.1. Daily cron → one web-search call **per category** (3 total) for discovery →
  hash-cached normalize per trend. A slow news day ≈ 3 calls, ~cents/day. Admin curate/override
  (any human edit locks that field from the cron). **Staleness banner** if cron is >36h stale.
- **Data:** `Trend` + `TrendUpdate` + `TrendSyncCache`.
- **Effort:** L. **Sequencing:** ship **§7.6 "This Week in Tech" digest first** to prove the
  web-search cron + cost guard + URL-verification cheaply; then layer the bubble field on top.

### 7.3 Benchmarks — "State of the Models" *(Phase 3)*

Editorial literacy surface for the benchmarks people argue about.

- **Surface (`/benchmarks`, editorial):** hairline list, one row per benchmark; detail page per
  benchmark with *what it measures · why it matters · how scoring works · watch out for*
  (contamination/saturation), a **live top-3 leader panel**, and a cross-link to the related concept.
- **v1 set (~8–14):** MMLU-Pro, GPQA Diamond, SWE-bench Verified, HumanEval/LiveCodeBench, ARC-AGI,
  MMMU, LMArena Elo, Humanity's Last Exam (+ FrontierMath, AIME, TAU-bench if research is ready).
- **Data:** `Benchmark` (static curated body) + `BenchmarkLeaderCache` (cron-refreshed leader line).
- **Sourcing:** static body authored once from a deep-research pass (§10); leader line refreshed by
  a **weekly** cron (leaderboards move on the order of weeks).
- **Effort:** M. **MVP deliverable:** static + *dated* leader numbers (zero infra) → weekly cron is
  a purely additive follow-up.

### 7.4 Broadening: "Field Guides" *(Phase 3)*

Keep AI a full track, Capital Markets a peer track, and ship everything else as **Sections under
one `field-guides` track** (avoids thin, unstaffed top-level tracks):

- **AI Builder / Tooling** *(highest synergy — start here):* picking a model · prompting in
  practice · using the API · Cursor/Claude Code · building a simple RAG/agent · cost & rate limits.
- **Practical Dev Literacy:** what an API really is · Git/GitHub · the terminal · frontend/backend/DB
  · how a web app deploys · reading an error message · env vars.
- **Cybersecurity Basics:** threat models · passwords/2FA/passkeys · phishing · encryption in plain
  English · prompt injection (bridges to AI) · privacy.
- **Careers in Tech:** resume · technical & behavioral interviews · portfolio · breaking into
  AI vs VC vs SWE · negotiation.
- **Effort:** M per guide; gate each behind real authored content. Builder first.

### 7.5 Build Board — Projects showcase + Opportunities *(Phase 2; top revival pick)*

The single best cure for the empty-room feeling, and it builds out the already-scaffolded-but-empty
`ProjectAssignment` model.

- **Showcase tab (`/build`, card surface):** member projects — IconTile colored by track, title,
  blurb preview, contributor initials, "looking for: designer" tags, repo/demo links. Detail page
  with team + "request to join."
- **Opportunities tab (`?tab=opportunities`):** internships / club-project openings / analyst roles
  — deadline urgency dot (reuse Home's `DueList` red-inside-7-days), apply link, track tag, bookmarkable.
- **Data:** `Project` (wire to the existing `ProjectAssignment` stub) + `Opportunity`.
- **Sourcing:** human social content. **Hand-seed 3–5 real member projects + 2–3 live posts before
  launch** (an empty showcase is worse than none). Draft→approve gate via `PROJECT_LEAD`/`ADMIN`.
- **Effort:** L; **MVP = Showcase only, admin-seeded** (defer self-submit + Opportunities).

### 7.6 Supporting features

- **This Week in Tech — digest** *(Phase 2; proves the live pipeline):* a weekly cron'd 5–7 item
  AI/tech/markets brief, **admin-reviewed before publish**. Data: `DigestEdition` (clone of
  `ScheduleCellCache`). Effort: M.
- **AI/Tech Tools Directory** *(Phase 3):* a curated "what tool for what task" matrix
  (writing/coding/research/design/data/markets) with pricing. Data: `AiTool` (static seed). Effort: S–M.
- **Member-suggested Resource queue** *(Phase 3, cheapest win):* `Resource.suggestedById` **already
  exists** — add a `status` column (`pending|published|rejected`) + inline submit + admin review. Effort: S.

### 7.7 Deliberately skipped (avoid bloat)

Calendar RSVP (calendar is read-only from SharePoint) · badges/leaderboards (clashes with the
come-as-you-are shift) · Discord integration (a webhook from the digest beats a feature) ·
alumni page (no alumni base yet) · standalone Data/Product tracks (fold the best bits into Field Guides).

---

## 8. Roadmap & per-stage deliverables

> Each phase lists **what ships**, **the deliverable a member/admin can actually see/do**, and
> **acceptance criteria.** Check items off as they land.

### NOW — make the rebrand structurally true
**Goal:** AI members notice nothing; Capital members get a real home on day one.

- [x] **Track model + migration** (`Track`, `Tier.trackId`, `User.activeTrackId`, `TrackMembership`; backfill AI) — **M** — shipped 2026-06-09
- [x] **Track-scope all read paths** (Browse `?track=` + switcher pill, Quiz, Flashcards, Progress via cookie) — **M** — shipped 2026-06-09; verified AI=10 / Capital=0 / AI=10
- [x] **Capital Markets Vocabulary track** — **M** — shipped 2026-06-09; **42** `cm-*` Concept rows (1 "Vocabulary" tier / 4 sections) seeded from deep research, live behind the switcher.
- [x] **Capital quiz questions** — **M** — shipped 2026-06-09 (`feat/capital-quiz-questions`, merged); **84 MC questions** (2 per `cm-*` term, difficulty mirroring each concept, §10 nuance coverage), seeded to prod + Playwright-verified: capital-only quiz, both grading paths, AI quiz unchanged. **Capital quiz content is DONE** — Capital members have full Browse / flashcards / quiz parity with AI. Only optional extras remain: short-answer questions (LLM-graded, AI-track style) if demand shows, and the §9 Capital-lead spot-check of formula-bearing vocab.
- [x] **Sidebar track switcher + terminology cleanup** — **S** — shipped 2026-06-09. A global Tracks switcher in the sidebar (3 tracks, accent dots; AI tier links gate to the AI track); `RECRUIT→MEMBER` across the role value, both signup callbacks, role validation, admin UI ("Console" / "Members" / "Total members"), and a DB migration of 21 users.

**Stage deliverable:** *A member opens Browse, flips a track switcher to "Capital Markets," and
studies 32 VC terms through the same flashcards + practice quiz + bookmarks + progress they already
have. The AI experience is byte-for-byte unchanged. The admin console says "Members," not "Recruits."*

**Acceptance:** AI bookmarks/progress intact for all 21 members · Capital quiz contains only Capital
questions · switching tracks re-scopes Browse/Quiz/Flashcards/Progress · no console errors.

### NEXT — kill the empty-room feeling (revival)
**Goal:** a dormant club has a reason to log in weekly + proof other humans are here.

- [x] **Build Board — Showcase** (admin-seeded; `Project` wired to `ProjectAssignment`; `/build` + detail) — **L** — **shipped 2026-06-09**: 3 real member projects live (LA Fires Assistant, AgentRank, AI Acceleration Visualization), QA placeholders deleted, member view verified, merged to master. Stage chips + walkthrough links added same day from user feedback.
- [x] **This Week in Tech digest** (first live-pipeline feature; `DigestEdition`; admin-reviewed publish) — **M** — shipped 2026-06-09 and iterated same day to v5 (per-item whyItMatters + verified go-deeper resources + category tags + catalog cross-links; big-picture closer + what-to-watch; archive routes; week-over-week memory; home teaser; self-check quiz). **Merged to master + deployed; COMPLETE for now** — remaining ideas live in the LATER "Digest follow-ups" entry. Watch: first unattended prod cron Mon 13:00 UTC.
- [ ] **Opportunities tab** (`Opportunity`; deadline urgency; same card surface) — **M** — planning pass
  done 2026-06-09, **execution paused pending James x Maggie conversation.** Settled design: `/build`
  gets tabs **Projects | Opportunities** (`?tab=opportunities`); no detail page (card holds org, type
  chip, track dot, deadline + red-inside-7-days urgency, Apply link); auto-archive = member query
  excludes past-deadline rows (no cron), moderators see Expired chips; types `internship | club-project
  | job | research | competition` (pure module like project-stages); optional `projectId` cross-link so
  club-project postings point at their showcase project; bookmarking deferred. **Editorial rule:** if it
  expires it is an opportunity, if it is about something members built it is a project. Sourcing: hand-seed
  first (same draft -> approve gate + seed-script pattern as the showcase); an LLM web-search discovery
  cron (digest pipeline clone, drafts-only, never auto-publish, deadlines human-confirmed) is a purely
  additive fast-follow if curation feels like a chore.

**Stage deliverable:** *A member lands on Home, sees a fresh weekly "This Week in Tech" brief, browses
a Build Board of 3–5 real member projects with "request to join," and finds 2–3 live internship/club
openings. The app visibly feels alive and populated.*

**Acceptance:** digest cron runs + admin can "Generate now" and review before publish · all digest
links resolve (200) · Build Board never shows an empty state at launch · expired opportunities auto-archive.
*(Digest acceptance criteria met 2026-06-09 — Generate now / review / publish verified end-to-end and
URL verification enforced in the pipeline; the cron's first unattended production run lands Monday.)*

### LATER — depth + AI-landscape literacy
**Goal:** deepen each track and add the editorial landscape surfaces, now that retention features are proven.

- [ ] **Trend Tracker** bubble field (on top of the proven digest pipeline; `Trend`/`TrendUpdate`/`TrendSyncCache`) — **L**
- [ ] **Benchmarks** surface (static+dated first, then weekly leader-line cron) — **M**
- [ ] **Capital Deal Teardowns** + **Market Pulse** weekly cron — **M**
- [ ] **Field Guides** (Builder → Dev → Security → Careers, gated on authored content) — **M each**
- [ ] **Resource queue** (`Resource.status`) + **per-track URL routes** `/t/[slug]/…` — **S**
- [ ] **Digest follow-ups** (deferred 2026-06-09, in priority order): email-on-publish (Resend free
  tier, opt-in flag on User, `sentAt` idempotency, editorial HTML template) · link-preview (og:)
  metadata on /digest routes · "Previously" update-links from the week-over-week memory to archived
  weeks · Tuesday backup cron (no-ops when an edition exists) + draft-ready admin email · member
  story submissions queue (pending→review, mirrors Resource queue) · track-aware item ordering via
  the active-track cookie · per-edition "was this useful?" reactions · prompt nudge for ≥1 video
  resource — **S–M each**

**Stage deliverable:** *A member explores a live bubble field of trends (and clicks through to the
concept behind a headline), reads "what GPQA actually measures and who leads," studies an annotated
Series A teardown, and follows a Builder field guide to ship a first RAG app.*

**Acceptance:** trend/benchmark crons cost-guarded + staleness-flagged · benchmark numbers dated +
cited · teardown jargon links resolve to `cap-*` concepts · Field Guides gated behind real content.

---

## 9. Content authoring plan (the real bottleneck)

| Content | Volume | Owner needed | Sourcing |
|---|---|---|---|
| Capital vocab | ~32 terms | **Capital lead** (review) | Deep-research draft (§10) → human edit |
| Build Board seed | 3–5 projects + 2–3 opps | Admin | Hand-seeded from real members |
| Benchmarks body | ~8–14 | Admin | Deep-research draft (§10) → human edit |
| Deal Teardowns | 3–5 | Capital lead | Authored (optionally Haiku-assisted from a term sheet) |
| Field Guides | per guide | Curriculum lead / Builder owner | Authored (Builder is in-house competence) |
| Tools Directory | ~30 tools | Admin | Deep-research draft (§10) → human edit |

**Action before Phase 1 ships:** name the Capital Markets content owner.

---

## 10. Deep research — what to run in a separate chat

Run these in a **separate Claude chat** (deep-research mode). The engineering needs *zero* research;
these are purely content. Run **Prompt 1 first** (it gates Phase 1).

### Prompt 1 — Capital Markets & VC vocabulary *(run first; feeds Phase 1)*

```
Build a Capital Markets & Venture Capital vocabulary pack for a university tech club's learning
app, aimed at members from mixed (often non-finance) backgrounds. Cover these ~32 terms, grouped:
[Venture Financing] SAFE, priced round, Series A/B/C, term sheet, cap table, dilution, pre/post-money
valuation, option pool, liquidation preference, pro rata, convertible note, vesting/cliff;
[Fund Mechanics] LP, GP, carry, management fee, 2-and-20, capital call, vintage year, DPI, TVPI,
MOIC, IRR, J-curve; [Markets & Metrics] TAM/SAM/SOM, ARR/MRR, net revenue retention, burn rate,
runway, CAC/LTV, EV/Revenue & EV/EBITDA multiples, DCF, public comps; [Diligence & Terms] due
diligence, data room, board seat, anti-dilution (full-ratchet vs weighted-average), drag-along/
tag-along, ROFR, down round, secondary, exit (M&A vs IPO).

For EACH term return, as structured data (one record per term):
(1) whatItIs — 2-3 plain sentences, no jargon-defined-by-jargon;
(2) whyItMatters — why a student / operator / investor cares;
(3) flashcardShort — a <12-word gloss;
(4) flashcardDefinition — one tight sentence;
(5) source — a citation URL.
Call out the specific nuances members trip on: post-money SAFE dilution, full-ratchet vs
weighted-average anti-dilution, DPI vs TVPI vs MOIC vs IRR, the 2-and-20 carry waterfall, cap-table
math. Source from a16z / Y Combinator / NVCA glossaries and standard term-sheet references.
```

### Prompt 2 — AI benchmarks + trend map *(run before the Later phase)*

```
Produce a current (mid-2026) content pack for an AI-literacy education site aimed at university
students from mixed, non-expert backgrounds. Two parts, returned as structured data (a table/list
per part) with a source link for every factual claim.

PART A — AI BENCHMARKS. For each major AI/LLM benchmark in use today (at minimum: MMLU, MMLU-Pro,
GPQA Diamond, SWE-bench Verified, HumanEval/LiveCodeBench, ARC-AGI-2, MMMU, Chatbot Arena/LMArena
Elo, Humanity's Last Exam, FrontierMath, AIME, TAU-bench, plus any others that matter) give:
(1) what it measures in one plain sentence, (2) why it matters in the AI landscape, (3) approximate
current state-of-the-art score and which model/lab leads as of mid-2026, (4) known criticisms or
saturation, (5) a 1-2 sentence "why a normal person should care."

PART B — AI & TECH TREND MAP. Identify the 18-25 most important current trends across AI and
adjacent tech (e.g. agentic AI, reasoning/inference-time compute, multimodal & world models,
on-device/edge AI, open-weight vs closed, AI for coding, AI in science/biomed, robotics/embodied AI,
compute & energy, interpretability/safety, AI regulation, the AI funding/VC landscape, synthetic
data). For each: a 2-3 sentence plain-English explainer, a "what's happening right now (mid-2026)"
update, a momentum rating (emerging / accelerating / mainstreaming / cooling), and 2-3 authoritative
source links.
```

### Prompt 3 — AI/Tech Tools Directory *(optional; feeds §7.6)*

```
Assemble a "what tool for what task" directory of ~30 AI/tech tools for a university club, across
categories: writing, coding, research, design, data, markets. For each tool: name, category,
bestFor (one line), a 1-2 sentence blurb, pricing tier (free/freemium/paid), and an official URL.
Favor tools a student would actually use in 2026. Return as structured data, one record per tool.
```

> Not a deep-research task — **doc lookup:** before wiring any live cron, check the in-repo
> `claude-api` reference for the **web_search tool's** exact request/response/citation shape and
> per-call pricing, to size the cost ceiling and the URL-verification step.

---

## 11. Risks & guardrails

- **Live-DB migration** → nullable-add + backfill only; never reseed concepts in place; restart dev after push.
- **Slug collisions** → AI slugs stay unprefixed; all new tracks `cap-*`/`tech-*`.
- **Cosmetic pivot** → track scope must thread through Quiz/Flashcards/Progress, not just Browse.
- **LLM hallucinated links** → URL-verify (200) + extract real `sourceDomain`; admin review before publish for the digest.
- **Cost creep** → content-hash cache + `LLM_CAP` guard + weekly (not daily) cadence where possible.
- **Empty surfaces** → hand-seed Build Board + gate Field Guides behind authored content.
- **Stale-as-fresh** → `lastSyncedAt` + amber staleness banner on every live surface.
- **Framing regression** → bake "mixed-background, no prior knowledge, no test-prep" into every LLM system prompt.

---

## 12. Open decisions (need a call before/at Phase 1)

1. Does Capital Markets want difficulty tiers (Fundamentals/Intermediate/Advanced) or one flat
   "Vocabulary" tier? *(Recommend: flat for v1.)*
2. Track switcher scope: Browse-only, or swap the whole sidebar context per track? *(Recommend: Browse switcher + cookie for v1.)*
3. Who is the **Capital Markets content owner**?
4. Active track in cookie/`User` only, or also in the URL (`/t/[slug]/…`)? *(Recommend: cookie now, URL later.)*
5. New `CAPITAL_LEAD` authoring role, or reuse `ADMIN`/`CURRICULUM_LEAD`? *(Recommend: reuse for v1.)*

---

## 13. Changelog

- **2026-06-08** — Plan authored. Practice-quiz + assessment **LLM grader fixed** (`lib/grading.ts`
  robust JSON extraction + client hardening), verified live. Status report + live Playwright audit complete.
- **2026-06-09** — **Phase 1 foundation shipped** (branch `feat/tco-expansion-phase-1`): `Track` model +
  migration + AI backfill; 3 tracks seeded (AI / Capital Markets / Field Guides); track-scoped Browse
  (with a per-track-colored switcher pill + coming-soon empty state) + Quiz + Flashcards + Progress;
  softened gatekeeping tier copy. Verified live (AI unchanged; Capital empty-but-clean; `tsc` clean).
- **2026-06-09** — **Capital Markets vocabulary seeded** (42 `cm-*` terms from deep research →
  `prisma/seed-data/capital-markets-vocab.ts` via `scripts/seed-capital-markets.ts`; research report
  preserved at `docs/research/capital-markets-vocab-research.json`). Browse / concept detail / flashcards
  (42 cards) all live for the Capital track. 10/42 terms adversarially verified; rest drafted from cited
  primary sources (YC / a16z / NVCA / Carta) — spot-check the formula-bearing ones before a hard launch.
  Remaining "Now": CAPITAL sidebar group, `RECRUIT→MEMBER`. Follow-up: author quiz questions for Capital terms.
- **2026-06-09** — **"Now" stage closed out.** Sidebar **Tracks switcher** (global, cookie-based; LEARN
  tier links gate to AI) wired through layout/main-shell/sidebar; switching re-scopes the whole app
  (verified: Home "Continue learning" follows the active track). **`RECRUIT→MEMBER` rename** complete —
  role default, both signup callbacks, `VALID_ROLES`, admin count + copy ("Console", "Members" tab,
  "Total members"), and `scripts/migrate-recruit-to-member.ts` migrated 21 existing users. `tsc` clean,
  zero console errors. **Phase 1 (Now) done.** Next phase: Build Board + "This Week in Tech" digest.
- **2026-06-09** — **"This Week in Tech" digest shipped** (first §6.1 live-data feature, proving the
  web-search cron + cost guard + URL verification). `DigestEdition` model (weekOf-unique, draft→publish);
  `lib/digest-sync.ts` (Sonnet 4.6 + `web_search_20250305` max_uses 6, ≤4-call pause_turn cap, balanced-
  JSON parse, URL-verify + real `sourceDomain`, SHA-256 hash skip, published editions immutable to the
  pipeline — checked *before* any LLM spend); cron `/api/cron/sync-digest` Mon 13:00 UTC + admin
  generate/publish routes (`maxDuration 300`); admin Overview card (Generate now / Review draft /
  Publish); `/digest` editorial page (last-updated line, amber >8d staleness banner, admin
  `?preview=draft`) + sidebar "This Week". Live-verified end-to-end: generation 65s / 5 searches /
  6 items / 1 aggregator dup dropped → reviewed → published; cron 401 unauth'd and `skipped_published`
  in 184ms at $0 post-publish. Worst-case run ≈ $0.25; weekly ≈ $1/mo. Remaining "Next": Build Board,
  Opportunities tab.
- **2026-06-09** — **Digest v2 content shape.** Each item now carries `whyItMatters` (its own labeled
  section on /digest) and 1–2 `resources` (go-deeper article/video links, URL-verified like the source;
  a dead resource drops alone, never its item; type tag corrected from the resolved hostname). Em/en
  dashes banned from all digest output + UI copy (prompt style rule + deterministic sanitizer: digit
  ranges → hyphens, prose dashes → commas). `max_uses` 6→10 (≤$0.10/run searches), `max_tokens` 6000.
  Fixed a hydration mismatch on the admin card's relative timestamp (suppressHydrationWarning span).
  Live-verified: 84s / 8 searches / 6 items, all primary-source, 2 dead resource links dropped, 0 dashes
  in stored content; republished same day. Worst-case run ≈ $0.45 on Sonnet (≈ $0.65 on Opus 4.8 if
  ever switched; searches are model-independent).
- **2026-06-09** — **Digest v3: Opus + "The big picture" closer.** Model switched to `claude-opus-4-8`
  with adaptive thinking (`max_tokens` 12000); new `bigPicture`/`watchFor` columns + a closing section
  on /digest (synthesis-not-recap narrative + a concrete "What to watch" line; prompt forbids new facts
  and recapping). First Opus run (170s / 9 searches) exposed a coherence bug: URL verification dropped
  2 items (Yahoo Finance blocks bots) while the closer still referenced them. Fixed two ways: a dead
  source URL now promotes the item's first verified resource link to be the source (story survives),
  and if any item still drops entirely the closer is omitted for that run. A second Opus run then
  truncated at a 12K `max_tokens` (adaptive-thinking depth varies run to run) → switched the call to
  `messages.stream(...).finalMessage()` with a 24K budget (the TS SDK's non-streaming guard throws
  above ~21K anyway). **Shipped + republished same day:** verified run 216s / 6 searches / 6 items /
  0 drops / closer grounded in visible items / 0 dashes. Opus run cost ≈ $0.30-0.70 incl. thinking;
  ~$2-3/mo weekly. Watch prod runtimes: ~220s against the 300s route ceiling; if it creeps, trim
  `WEB_SEARCH_MAX_USES` first.
- **2026-06-09** — **Digest v4** (cite fix + archive + memory + tags + cross-links). (1) Fixed leaked
  web_search `<cite>` markup persisting as literal text inside JSON-string output — `cleanDigestText`
  strips it (tolerating tags sliced by length caps) + prompt rule + in-place clean of the live edition.
  (2) **Archive**: `/digest/[week]` serves any published edition; "Past editions" hairline list on
  /digest; drafts unreachable by URL. (3) **Week-over-week memory**: previous edition's titles go into
  the prompt ("only repeat with a material new development"); first fires next Monday. (4) **Category
  tags**: validated `ai|tech|markets` per item, track-accent byline dots. (5) **Catalog cross-links**:
  concept catalog injected into the prompt (schedule-sync pattern), `relatedConceptSlugs` (0-2)
  validated server-side, names resolved at render via `lib/digest-view.ts`, "Related in the catalog"
  links per item — the news→concept education hook and the Trend Tracker dry run. (6) **Recovery
  turn**: a live run burned all searches and ended with narration, no JSON — the pipeline now forces
  one text-only continuation (`tool_choice: none`) reusing the research. (7) Observability:
  `searchesUsed`/`durationMs` columns, last-run stats + a 48h awaiting-review amber hint on the admin
  card. Verified live: 215s / 9 searches / 6 items, all categorized, cross-track slugs (`cm-*` on the
  IPO + Broadcom items), resource-promotion fired (dead openai.com source → VentureBeat link promoted),
  0 dashes / 0 cite tags; republished.
- **2026-06-09** — **Merged + deployed; digest v5 (home teaser + self-check quiz).**
  `feat/tco-expansion-phase-1` merged to master (4e77c98) and deployed. /home gains a "This Week in
  Tech" teaser (linked headline + top item titles, published editions only). The pipeline also
  generates a 3-4 question multiple-choice self-check quiz in the same Opus call (strict validation:
  exactly 4 options, exactly 1 correct, sanitized; an invalid quiz never fails the run; omitted with
  the closer when an item drops in verification), stored in `DigestEdition.quiz` and rendered as an
  inline answer-and-reveal player on /digest (client-side only, nothing recorded). Verified live:
  162s / 8 searches / 6 items / 4 valid questions; republished. All remaining digest ideas
  (email-on-publish first among them) parked in the LATER checklist.
- **2026-06-09** — **Build Board Showcase built** (`feat/build-board`, not merged: review-gated on real
  content). Additive schema live in prod via db push: `Project` + `ProjectInterest`, FK + unique wired onto
  the empty `ProjectAssignment` stub. `/build` on the card surface (track-colored hammer tiles, blurb
  preview, contributor initials from assignments + an `extraContributors` Json fallback for non-members,
  looking-for tags, repo/demo chips) + `/build/[slug]` detail (Markdown body, team list, breadcrumb).
  Join mechanic, per decision (club has no Discord): in-app interest record, one per member per project,
  optional 500-char note, dialog portaled + light-theme wrapped; leads/admins see name + mailto + note in
  an on-page Moderation panel. Draft-to-approved gate via PATCH `/api/admin/projects/[id]`
  (ADMIN/PROJECT_LEAD); members and anonymous only ever query `status: "approved"`. Sidebar "Build Board"
  link. Seeding: `scripts/seed-projects.ts` (idempotent by slug, creates land as draft, updates never touch
  status, --check/--verify/--delete modes, dash-ban validation) + 3 `qa-sample-*` drafts for layout QA.
  Playwright-verified as the QA admin: full role matrix (anonymous / MEMBER / ADMIN), approve -> anonymous
  sees exactly one project -> unpublish -> empty state again, draft URLs 307 for non-moderators, interest
  flow end to end, zero console errors; `tsc` clean. Next: collect real projects, swap the seed file,
  approve, verify member view, merge. Opportunities tab still pending.
  **Same-day follow-up (user feedback):** the board also celebrates *finished* work. Added `Project.stage`
  (idea | building | polishing | completed | paused; `lib/project-stages.ts`) rendered as tile-colored
  chips on cards + detail, `walkthroughUrl` as a third link chip (Loom etc.), and extraContributors
  upgraded to `{ name, role? }` objects so unlinked contributors can carry a real role. First real project
  seeded as a draft: **LA Fires Assistant** (AI, polishing, James OConnor lead, repo + demo + walkthrough).
  Verified live; still gated on the remaining real projects.
- **2026-06-09** — **Build Board LAUNCHED.** User supplied 3 real projects and gave the publish OK:
  **LA Fires Assistant** (AI, polishing, repo + demo + Loom), **AgentRank** (AI, building, repo;
  behavioral agent-readiness leaderboard vs Lighthouse 13.3 static audit), **AI Acceleration
  Visualization** (AI, idea; capability/infrastructure/adoption gap, working title, stage set to idea
  per the lead's own "no code yet" note). All three leads account-linked to jsoc@uoregon.edu (users.name
  set to "James O'Connor" at the user's request). Approved via the in-app moderation flow, QA placeholder
  drafts deleted from prod (script --delete; interest records cascaded) and removed from the seed file,
  anonymous member view verified (exactly 3 projects, no Draft chips, all detail pages 200). Merged to
  master. Em/en dashes in supplied copy converted at authoring time (colons/hyphens). Remaining from the
  NEXT stage: Opportunities tab.
- **2026-06-09** — **Capital Markets quiz questions shipped** (`feat/capital-quiz-questions`). 84 authored
  MC questions, 2 per `cm-*` term, derived strictly from the seeded vocab pack + the cited research file
  (no new facts); difficulty mirrors each concept's; distractors lean on real cross-term confusions
  (SAFE vs note, DPI vs TVPI, drag vs tag, fee vs carry); targets the §10 nuance list (post-money SAFE
  math, full-ratchet vs weighted-average, DPI/TVPI/MOIC/IRR, the 2-and-20 waterfall, cap-table math);
  zero em/en dashes. Data: `prisma/seed-data/capital-markets-questions.ts`; seeded to prod via idempotent
  `scripts/seed-capital-questions.ts` (--check static / --verify read-only modes, upsert keyed by
  conceptSlug+questionText, never deletes, 84 created / 0 updated). Playwright-verified live as the QA
  admin: Capital mixed quiz served 10/10 capital-only questions, MC grading correct on both paths
  (check + explanation on a right answer; cross + correct revealed on a wrong one), results screen grouped
  all 4 capital sections with review-these links to `cm-*` concepts, AI mixed quiz unchanged
  (Parameters / GPUs / Attention), zero console errors. The Phase 1 "Now" stage is now fully
  content-complete: Capital members get Browse + flashcards + quiz parity with AI.
