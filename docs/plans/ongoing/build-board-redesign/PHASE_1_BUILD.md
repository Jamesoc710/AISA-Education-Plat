# Build Board Phase 1, Build Order (Branch LOW)

Companion to BUILD_BOARD_REDESIGN_PLAN.md. Read that first for the full rationale; this sequences
the work and bakes in the resolved branch.

## Branch decision (resolved 2026-06-24): LOW

The club has about 3 showable artifacts now, targeting about 8 within a week, growing. Per the
plan's cold-start section that is Branch LOW:
- POSTING is the hero and the only acceptance-critical surface. It is both the zero-today gap and
  the cold-start seeding mechanism (a lead dogfoods the modal with real past work via paste-URL).
- The index is relabeled a growing index, not a celebration wall, and must read intentional at 3
  to 5 rows.
- CUT the "Recently shipped" featured rail (featuring 3 of 5 rows reads as showing the board twice).
- Success metric: members posted N new projects in month one, not "the showcase reads alive on day one."
- Graduate to the HIGH presentation (featured rail, showcase-first framing) as the count approaches
  about 12. No rebuild; it is a presentation flip.

## Build order (posting first, it unblocks seeding and is the hero)

### 1. Posting flow
- Three-step modal cloning the body-portal plus data-theme="light" dialog (template: the
  request-to-join dialog in build-detail-client.tsx, about line 585 on).
- Step 1 (required, the ONE gate): title, blurb (cap 280 to match the static validator), stage as
  an UNSELECTED radio that blocks advancement (this is how the schema default of "building" is
  genuinely inverted). Steps 2 and 3 are freely navigable.
- Step 2 (optional): track, Markdown description, repo/demo/walkthrough URLs (validate ^https?://).
  Import is paste-URL only in phase 1, no scrape.
- Step 3: optional help-wanted role labels (reuse lookingFor), proofread, submit.
- New POST /api/build/projects writes status "draft" and sets createdById = authUser.id SERVER-SIDE
  (never from client input). Any authenticated user may post; moderator approval gates visibility
  (reuse the existing draft-then-approve rule).
- Active "Post the first project" empty state wired to the modal, replacing the passive copy.

### 2. Stage vocabulary migration (4 values: Idea / Building / Shipped / Paused)
NOT a seeder re-run. It is four coordinated changes:
- A one-shot script: prisma.project.updateMany completed to shipped, and polishing to building. Run
  once against the live DB, separate from the seeder.
- Edit lib/project-stages.ts: PROJECT_STAGES drops polishing, renames completed to shipped;
  STAGE_META labels and tiles updated.
- Edit prisma/seed-data/projects.ts so every stage string is in the new 4-value set, or the next
  seed --check fails static validation (about line 57).
- Gate the posting modal stage options to the 4 values in the SAME deploy.
- Provenance check first: confirm the seed file is the sole source of stage truth for live rows
  (holds today; record the check).

### 3. Join loop (replace the mailto dead-end), the second-largest build
- POST /api/build/projects/[id]/accept: ONE transaction creating a ProjectAssignment (handle the
  @@unique so a duplicate does not 500), flipping ProjectInterest.status to "accepted", stamping
  respondedById and respondedAt. Sibling /decline flips to "declined".
- ProjectInterest.status: redefine as pending | accepted | declined (drop the dead new | seen;
  never written today, so zero migration cost). Add respondedById String? and respondedAt DateTime?.
- toCard read-path reconciliation (build.ts about 118-140): render author from createdById AND team
  from assignments without double-rendering a solo creator. Net-new, and it is correctness not polish.
- Team ownership split: self-serve projects get a Lead ProjectAssignment written AT APPROVAL; seeded
  project teams stay seed-file-owned (the seeder deleteMany-wipes assignments each run, so a Lead row
  on a seeded project would be eaten).
- Accept/decline control set inside the existing ModerationPanel (replacing the bare mailto, about
  543-555). A club-wide "Stale requests" view (pending past N days, any moderator) so an inactive
  lead does not recreate the dead-end.
- Requester-side "Your requests" surface (pending/accepted/declined) so resolution is observable
  without notifications (notifications are phase 2).

### 4. Index rebuild (editorial, LOW-tuned)
- Editorial hairline index on data-surface="editorial" reusing the benchmarks .bench-row 3-column
  grid (36px / minmax(0,1fr) / 172px), staggered entrance with usePrefersReducedMotion, HairRule,
  SectionEyebrow.
- Row: ordinal badge / title-as-hero (--text-xl, editorial-link hover) plus blurb plus uppercase
  TRACK · STAGE meta / column 3 is a QUIET 11px lifecycle line (SHIPPED · 2026, or BUILDING), with
  the help-wanted line as the column-three ACCENT when lookingFor is non-empty. Do NOT make status a
  big hero word.
- Kill from the row: IconTile, trailing chevron, ContributorStack (returns null when empty), per-row
  external chips, any thumbnail. Move team initials and links to the detail page.
- Facets via FilterTabs with count badges, client-side over getProjects: stage (Paused deselected by
  default), track, help-wanted (lookingFor non-empty). Default sort newest-first (createdAt desc,
  already there); "recently shipped" is newest filtered to Shipped (do NOT add a shippedAt sort, it
  has no writer).
- NO featured rail (Branch LOW). Relabel as a growing index.
- Detail page phase 1 is typographic, NO cover image.

## Phase 1 acceptance test
A member with no engineering ability posts a project through the modal; a moderator approves it and
the creator is auto-added as Lead; a second member requests to join; the lead (or an admin fallback)
Accepts; the requester sees the resolution in "Your requests" and "You are on this team" on the
detail, with no seed-file edit.

## Constraints (do not violate)
- No em dashes or en dashes anywhere, including UI copy.
- CSS-variable tokens only (lint:tokens), no magic numbers.
- Reuse primitives (Button, FilterTabs, IconTile, the Icon registry, StageChip / LookingForTag /
  DraftChip exports, the dialog pattern). The only genuinely new primitive is the posting modal,
  composed from existing pieces.
- After any Prisma schema change, restart the dev server (HMR cannot reload .prisma/client).
- Run aisa-atlas on port 3100 (3000 is a different project); verify the title says "AISA Atlas".
