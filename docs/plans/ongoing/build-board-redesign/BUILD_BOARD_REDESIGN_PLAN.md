<!-- Produced by the build-board-council workflow: 6 seats, 5 rounds, 3 adversarial critics (run wf_a695298a-d6b). Grounded in the deep-research brief and the live schema. -->

The Editorial critique is correct and decisive. The Standings header comment (lines 14-16) and the row itself prove it: the NAME is the hero at `--text-xl` weight 600 (line 284); the status chip is `fontSize: 11` (line 371), explicitly small, parked beside a four-word caveat. The file's own reasoning is that status carries weight there ONLY because "a bare number needs a date, a baseline, and a caveat to mean anything" so trust is the genuine subject of that page. My draft's claim that mirroring `TRUST_META` for a hero status word is "the identical move" is a misread. On a showcase the work is the subject, not the lifecycle tag.

I now have ground truth on every contested claim. The verdict on each critique:

- **Red Team Problem 2 / Editorial smaller note / Ship-it Problem 1**: CONFIRMED. `toCard` (build.ts 118-139) maps assignments straight to contributors with no `createdById` concept (`ProjectWithTeam` lines 102-116 has no createdById field). The approve route is a one-row update; accept-and-add-to-team needs a transaction (assignment create against the `@@unique`, status flip, audit stamp) plus a brand-new control set in the panel (currently a bare mailto, lines 543-555). The loop is the second-largest build, not "strictly smaller than nothing." And it resolves silently: the requester gets "You are on this team" only on a fresh server render (line 260), with notifications deferred.
- **Ship-it Problem 2a + 2b**: CONFIRMED and decisive. The seeder is idempotent and reads stage FROM the seed file, validated against the CURRENT five values (line 57). A re-run does NOT migrate to a new vocabulary; it writes whatever the seed file says. And line 235 `deleteMany` wipes assignments every run, so a Lead row written at approval for a seeded project gets eaten on the next seed. "The reseed IS the migration" is false.
- **Ship-it Problem 3a**: CONFIRMED. `shippedAt` has no writer in any phase; the sort would be a no-op at launch.
- **Ship-it Problem 3b + Editorial Problem 2**: CONFIRMED. `feedback-storage.ts` already implements the Supabase upload+signed-URL primitive (lines 16-45). "No upload surface exists" is factually wrong. And the phase-one detail cover has no field and no moderation path, contradicting the same plan's phase-two image-moderation deferral.
- **Editorial Problem 1**: CONFIRMED via the source the draft cited. Demote status to quiet meta; let the help-wanted line be the column-three accent.
- **Editorial Problem 3**: PARTIALLY CONFIRMED, PARTIALLY OVERRULED. The relabel-vs-backfill distinction is real and the safe relabel needs no migration (CONFIRMED). But I overrule keeping `polishing` as a live distinct value: it stays as a deferred leads-decision, not a phase-one carry, because the showcase is better served by the cover and the year than by a "Polishing" mood word. I will reconcile this precisely below.
- **Red Team Problem 1 (artifact-count branch point)**: ADOPTED. The plan ships two branches.
- **Red Team Problem 3 (cede active recruiting to Discord)**: ADOPTED into the vision.

Every load-bearing critique survived verification. I am finalizing with all of them incorporated. Here is the complete plan.

---

# AISA Atlas Build Board Redesign: Final Plan

Prepared for engineering and design. Status: resolved and buildable. Every decision below was stress-tested against the live schema and three adversarial reviews; the corrections those reviews earned are folded in, not appended.

No em dashes or en dashes appear anywhere in this document, including proposed UI copy.

---

## EXECUTIVE SUMMARY

1. The Build Board becomes ONE editorial hairline index on the shared `data-surface="editorial"` grammar, status-led, with help-wanted surfaced as a counted facet. No mode split, no second brand, no feed, no remix-as-model, no people directory in any committed phase.
2. The primary job is self-serve posting plus a first-class home for finished work. Recruiting is sequenced second because you cannot recruit onto an empty board. The board cedes live "I need someone today" recruiting to Discord on purpose and owns the durable, browsable, async-discovery job Discord cannot do.
3. ONE lifecycle field (`stage`), presented as four values: Idea, Building, Shipped, Paused. The fix for "completed work shouts Request to join" is the `lookingFor`-conditional recruit affordance, not the vocabulary change.
4. Posting is a three-step light modal cloning the established body-portal dialog, three required fields, draft-then-approve reused, author wired from `createdById` server-side.
5. The mailto dead-end becomes a real in-app accept-and-add-to-team loop. This loop is the SECOND-LARGEST build in phase one (a transactional route plus a new moderation control set), not a trailing afterthought, and it ships in phase one regardless because seeding fires real join requests in week one.
6. Imagery is one click deep. No index thumbnail in phase one. The detail-page cover moves to phase two as one coupled unit with its upload path and a moderation gate, because shipping ad-hoc covers at launch produces the exact ragged ghost-state the index thumbnail was rejected to avoid.
7. The stage vocabulary change is a real one-shot `updateMany` data migration plus coordinated edits to three files, NOT a re-run of the idempotent seeder. The seeder cannot perform this migration and will fight an approval-time team write; ownership of the assignment table is split cleanly between seeded and self-serve projects.
8. The whole plan branches on one unmeasured integer: how many real showable artifacts the club has today. Two pre-declared branches (HIGH, twelve or more; LOW, under roughly eight) are written into the plan body so the council does not reconvene. This is a gate before phase one ships, not an open question.
9. No `kind` discriminator, no Opportunity model, no leaderboard, ever in a committed phase. The Opportunities org decision is honored by building nothing that presupposes it.

---

## VISION AND PRIMARY JOB

The Build Board exists to do the one job Discord structurally cannot: hold a durable, browsable, editorial home for what club members have built, and resolve a request-to-join into a permanent team-of-record ledger. Everything else follows from that and from one honest concession.

**The concession, stated up front so the board is judged against the right benchmark:** in a club of roughly thirty people who are all already in the same Discord, the board does not win live recruiting and must not try to. When a member needs a designer today, the warmest, fastest move is to post in a channel where all thirty people already are. The board owns the *asynchronous discovery* layer instead: a member who was not in the right conversation at the right moment can later browse "this shipped project still wants a backend person," and the durable `ProjectAssignment` ledger gives leads a record Discord cannot keep. If the leads ship the help-wanted facet expecting it to out-convert Discord's live channels, they will judge it a failure against a job it was never doing. Set the expectation now: the board is the trophy case plus the async noticeboard plus the team ledger, not the live recruiting floor.

**Primary job, in order:**
1. A club member can self-serve POST a project. Today this path does not exist at all; `createdById` is unused and there is no POST route. This is the genuinely zero-today gap.
2. Finished work finally has a distinctive, durable home that reads as intentional even at low volume.
3. Recruiting works through browse plus a help-wanted facet plus an accept loop that resolves to a real team membership. Sequenced second because supply must exist before anyone can request to join it, and because Discord already owns the live half.

Recruiting is downstream of supply and downstream of Discord. That is not a demotion; it is the correct scoping of a small private club's actual behavior.

---

## MODE AND IA (resolved)

**Chosen: one unified editorial index (Direction A's mechanic) executed as a hardened, narrow showcase-first scope (Direction C).** Help-wanted is a default-visible counted facet in the index filter row, not a segmented Collaborate lens.

Why the others lost, stated so the loss is legible:

- **Direction B (segmented Showcase/Collaborate toggle) lost the phase-one slot on the denominator argument, not on build cost.** The Showcase lens can never be emptier than the whole board; every project appears in it. The Collaborate lens shows only the `lookingFor`-non-empty subset, and the better the accept loop works, the faster that subset empties as roles fill. A promoted top-level mode that can land a member on "no projects are looking for collaborators right now" is a first-class confession that half the board is dead. A facet chip reading "Open roles (3)" that a user simply does not click has no empty-mode failure state. Build cost was never the constraint; the credibility cost of a mode the supply cannot keep full is. B is promoted to a phase-two config flip behind a measured demand trigger, so deferring it costs zero engineering debt. If B is ever built it uses the hub's `CategoryTab` segmented control, not the `FilterTabs` underline nav.
- **Direction D (build-in-public feed) lost outright.** A feed inverts the live-ghost-town risk into the core mechanic. With 90-9-1 dynamics a thirty-person feed reads dead by Tuesday, the schema has no update model so it is also the largest build, and it is the least editorial surface possible. A feed competes with Discord on Discord's turf (liveness) and loses.
- **Direction E (remix gallery) lost outright on ground truth.** `Track.slug` values are "ai", "capital-markets", "field-guides" (confirmed in the seeder's `TRACK_SLUGS`, line 27, and the schema). The club produces capital-markets analysis and field-guide writing, not uniformly forkable code. A fork-only spine strands every non-code artifact. Fork survives only as an optional per-project link on projects exposing a `repoUrl`, never as the model.
- **Direction A in its pure form is the skeleton, not the answer.** Its risk (recruiting invisible if nobody applies the filter) is real; the hardened scope mitigates it by making help-wanted a default-visible counted facet plus closing the accept loop, so recruiting ships as facet-plus-loop, not as a buried filter.

**The Opportunities question is excluded from build scope and honored by building nothing that presupposes it.** No `kind` discriminator, no opportunity-semantic status value, no second tab. The editorial-index grammar is the correct hedge precisely because it presupposes nothing: if the leads later decide opportunities are real, it becomes a second hairline index behind the same `CategoryTab` one-route-two-door pattern the hub already runs, at zero schema commitment today. Leaving layout room is not building; the data delta adds no discriminator, so the deferral is intact.

---

## FINISHED-VS-BUILDING MODEL

**ONE headline lifecycle field, presented as four values.** The headline field stays `stage` (because `status` is already taken by draft/approved). The presented vocabulary is **Idea, Building, Shipped, Paused.**

Three resolved sub-decisions:

1. **One field, not two.** No `kind` discriminator. Two fields is the two-boards trap and the Opportunities back door. Help-wanted labels (`lookingFor`) are orthogonal and layer on any status. The recruit affordance shows if and only if `lookingFor` is non-empty, regardless of stage. **This conditional, not any vocabulary change, is the complete and literal fix for "completed projects shout Request to join."** Verified: in the current code the join prominence comes from `lookingFor` rendering plus an unconditional join action, not from the stage value. A Shipped project with empty `lookingFor` stops shouting the moment that conditional ships.

2. **Four values, not five, not three.** Drop "polishing" from the presented set: it changes no verb a browser can act on and is a private maker mood, not a showcase or recruit state. Keep "Paused": deleting it does not delete abandoned projects, it forces them to lie about being "Building," which corrupts the exact recruiting read everyone wants clean. Paused is the honest archive verb; it sorts last and drops out of the default showcase view rather than rendering as a tombstone. The mitigation for "Paused looks dead" is the default sort, not deleting the value.

3. **This is a real one-shot data migration, not a seeder re-run.** Here the draft was wrong and the Ship-it review was right, verified against `scripts/seed-projects.ts`. The seeder is idempotent and reads `stage` FROM the seed file, validated against the CURRENT five-value `PROJECT_STAGES` (line 57). Re-running it does not rewrite anything to a new vocabulary; it rewrites rows to whatever the seed file already says, and self-serve-posted projects are not in the seed file at all. The migration is therefore four coordinated changes:
   - A one-shot script: `prisma.project.updateMany({ where: { stage: "completed" }, data: { stage: "shipped" } })`, and the same `polishing -> building`. Run once against the live DB, separate from the seeder.
   - Edit `lib/project-stages.ts`: `PROJECT_STAGES` drops `polishing` and renames `completed -> shipped`; `STAGE_META` updates labels and tiles accordingly.
   - Edit the seed file (`prisma/seed-data/projects.ts`) so every entry's stage string is in the new four-value set, or the next `seed-projects.ts --check` fails static validation at line 57.
   - Gate the posting modal's stage options to the new four values in the SAME deploy as the migration, so no new draft is written with an old spelling during the window.

   The row count is genuinely tiny (admin-seeded, single-to-low-double digits), so the migration is cheap. It is just not free and not the seeder. One provenance check is mandatory before running it: confirm the seed file is the sole source of `stage` truth for live rows. Because the seeder only ever writes stages from the seed file and the only other writer (the posting modal) does not exist yet, this holds today; record the check so a future hand-edit does not silently get overwritten.

`stageMeta`'s tolerant fallback to `building` for unknown strings (line 33) is the reason the relabel-only path for a KNOWN value is safe and deterministic, AND the reason an unknown new spelling is dangerous. We never introduce an unknown spelling: every consumer routes through `stageMeta`, so renaming the key plus migrating the stored value plus gating the modal in one deploy means no reader ever sees a string it cannot map.

**On Editorial's defense of `polishing`:** the Editorial seat is right that relabeling a known value needs no migration and right that "Polishing" is a more flattering showcase word than "Building." It is overruled on keeping it live in phase one for one reason: a four-value headline is the load-bearing simplification the entire finished-vs-building fix rests on, and a showcase that wants pride signaled should signal it with the Shipped year and (in phase two) a cover, not with a fifth lifecycle mood the browser cannot act on. Reinstating "Polishing" is filed as a deliberate leads-owned vocabulary decision for later, made with a guarded migration, not carried into phase one by default. This is a genuine minority position and it is in the dissent appendix.

---

## PAGE-BY-PAGE LAYOUT

### Index (one surface, per facet, not per lens)

**Grammar:** the benchmarks Standings hairline-row pattern on `data-surface="editorial"`. Reuse `.bench-row`'s three-column grid (`gridTemplateColumns: "36px minmax(0, 1fr) 172px"`, confirmed), the staggered entrance with `usePrefersReducedMotion` opt-out, `HairRule`, and `SectionEyebrow`. This is the app's flagship browse grammar and the use-cases index already clones it; the Build Board harmonizes rather than inventing.

**Row anatomy, corrected per the Editorial review (which was right against the draft, verified in benchmarks-client.tsx):**
- **Column 1:** a `00`-padded ordinal badge. Position, never rank, never a vanity number.
- **Column 2 (the hero):** the project title as the hero word at `--text-xl` weight 600 with the `editorial-link` lift-to-accent on row hover. This is where the weight goes, because on the Standings the NAME is the hero (line 284), not the status. Beneath: a single-line blurb (ellipsis), then an uppercase meta strip `TRACK Â· STAGE`.
- **Column 3 (quiet meta, NOT a hero status word):** the draft's plan to mirror `TRUST_META` for a large tinted status hero is rejected. The Standings status chip is deliberately small (`fontSize: 11`, line 371) because trust is genuinely the page's contested subject there; on a showcase the WORK is the subject and the lifecycle tag is one bit. So column three carries a single quiet lifecycle line in the same 11px uppercase register as the Standings caveat: `SHIPPED Â· 2026` for Shipped rows (the year is the editorial payload, the verb secondary), `BUILDING` alone otherwise. The ONE element in column three that earns weight is the help-wanted line when `lookingFor` is non-empty: `Help wanted: design, backend`. That line is a live editorial claim that changes what the reader does, which is exactly what the trust chip is on the Standings, so it gets the accent. Net effect: recruiting becomes visually present on the row instead of buried under an enlarged status word nobody needed.

**Killed from the index row:** the IconTile, the trailing chevron (the row is the link), the `ContributorStack` (it returns null when empty, so at launch most seeded rows would show one lonely initial; move team initials to the detail where they mean something), per-row external chips (Repo/Demo/Walkthrough belong on detail), and any thumbnail (see below).

**No index thumbnail in phase one.** There is zero raster-image precedent in the product. A thumbnail column is a genuine net-new primitive (hosting, moderation, a ragged ghost state) and at launch the common case is no image, so the column renders as a wall of grey placeholders that reads deader than clean type. The Standings carries authority with zero imagery; the Build Board gets the identical restraint. A single optional thumbnail on Shipped rows only is the phase-two enhancement, gated on the cover field and upload path existing.

### Project detail

Phase one is typographic, no cover image. Title, blurb, the Markdown `description` (which already exists and renders via ReactMarkdown), the team list (initials with roles, sourced as described in the recruitment section), the external links, the stage, and the help-wanted line. The detail-page cover is moved OUT of phase one (the draft put it in; both Editorial and Ship-it caught the contradiction). Reason: there is no `coverImageUrl` field and no moderation path in phase one, and the same plan defers image moderation to phase two, so a phase-one cover would be unscoped unmoderated remote-image embedding. Equally important, ad-hoc covers at launch (some code projects with a screenshot, capital-markets and field-guide work with nothing) produce a half-covered, half-bare set, which is the same ragged ghost-state that killed the index thumbnail. The argument that killed the thumbnail kills the phase-one detail cover too. Moderator-only on a draft detail: the existing inline approve control and Draft chip stay.

### Posting flow (modal)

A three-step modal cloning the established `createPortal(document.body)` plus `data-theme="light"` dialog pattern (the request-to-join dialog in build-detail-client.tsx is the live template, lines 585 onward). A green-check progress strip, navigable not gated, with the one exception below. Full field spec in the next section.

### Moderation surface

This is where the dead-end dies. The current panel (build-detail-client.tsx lines 506-579) renders each join request as a name plus a bare `mailto:` link (line 547) with NO action control. Phase one replaces that with an accept/decline/add-to-team control set:
- Each request row gains an Accept control and a Decline control.
- Accept defaults the assignment role to "Contributor" with an inline role field (the assignment's `role` string is required, so Accept cannot be a bare button).
- A club-wide "Stale requests" view surfaces requests pending past N days to any moderator, so an inactive project lead does not recreate the dead-end on an unreliable volunteer.

The approve-the-draft control already exists and stays.

### Empty and cold-start states

- Replace the passive index empty state ("projects will show up here soon") with an active editorial "Post the first project" panel wired to the modal.
- The detail moderation panel's "No requests yet" copy stays but now sits above real action controls.
- A leads-chosen typographic "Recently shipped" rail at the top of the index (a `SectionEyebrow` over hairline rows pulled to the top, NOT image tiles, NOT algorithmic). This rail is CONDITIONAL on the artifact-count branch (see Cold-Start plan): it ships in Branch HIGH and is cut in Branch LOW, because featuring three of five rows reads as showing the whole board twice.

---

## POSTING FLOW SPEC

**Entry point:** a primary "Post a project" button on the index, in the page frame's action slot. Visible to any signed-in member.

**Who can post:** any authenticated `User`. Posts enter as `status: "draft"` and are member-invisible until a moderator approves, so there is no gate on who may post, only on what becomes public. This reuses the existing draft-then-approve visibility rule (build.ts lines 6-10, 153, 185).

**Steps and fields, mapped to the model:**

- **Step 1, Basics (required):**
  - `title` (required)
  - `blurb` (required, the static validator caps it at 280 chars; mirror that in the form)
  - `stage` (required). Rendered as a radio with NO pre-selection. To genuinely invert the schema default of `building` (line 265 in schema), Step 1 blocks advancement until the poster picks a stage. This is the ONE place the otherwise-navigable progress strip gates, and it is deliberate: this is how "force an explicit choice at post" is real rather than cosmetic. The draft asserted both "navigable not gated" and "force a choice"; those conflict, and the resolution is that Step 1 stage selection is the single gate. Every other step is freely navigable.

- **Step 2, Details (all optional):**
  - `track` (select from the three tracks)
  - `description` (Markdown textarea)
  - `repoUrl`, `demoUrl`, `walkthroughUrl` (plain URL fields, validated `^https?://`)
  - In phase one, "import existing" is the TRIVIAL version only: paste a repo or demo URL into the links field. No server-side scrape or OG/README prefill in phase one (that is a real sub-system with private-repo, rate-limit, and no-OG failure modes, and the actual cold-start mechanism is a human seeder using the seed file, so the scrape is not on the launch critical path). URL-import-with-prefill is a phase-two convenience.

- **Step 3, Review and submit:**
  - Optional help-wanted role labels (reuse `lookingFor`).
  - Proofread view, then submit.

**Media:** none in phase one. No cover upload (the cover and its upload path and its moderation gate are one coupled phase-two unit). Note for implementers: the upload primitive itself already exists (`lib/feedback-storage.ts` does Supabase bucket upload plus signed URL); the phase-two cover reuses that pattern. The phase-one deferral stands on the ghost-state and moderation arguments alone, NOT on "no upload surface exists," which is factually wrong.

**Draft, review, publish:** on submit, a new `POST /api/build/projects` writes `status: "draft"` and sets `createdById = authUser.id` server-side (never from client input). A moderator approves from the detail page (existing control).

**Wiring the author relation:**
- The `createdById` / `ProjectCreator` relation already exists in the schema; wiring it at POST is zero schema change.
- The author is rendered from `createdById`, NOT from an auto-written assignment. The read path needs a real change here, caught by the Red Team and Ship-it and verified: `toCard` (build.ts 118-139) currently maps only `assignments` to `contributors` and has no concept of `createdById` (it is not in `ProjectWithTeam`, lines 102-116). Reconciling author-from-`createdById` with team-from-`assignments` so a solo creator does not double-render is net-new read-path code and is in phase one as correctness, not polish.
- The "team is never empty" guarantee: a Lead `ProjectAssignment` is written at APPROVAL (not at submit, so an unapproved junk draft never pollutes a real user's team table), and ONLY for self-serve projects (those whose `createdById` was set by the API). Seeded projects' teams stay owned entirely by the seed file's `team` array. This split is mandatory because the seeder does `deleteMany` on assignments every run (line 235): if approval wrote a Lead row for a seeded project whose creator is not in that project's seed `team`, the next seed run would silently delete it. Ownership is therefore: seeded project teams come from the seed file; self-serve project teams come from the approval-time Lead write plus subsequent accepts.

---

## JOIN AND RECRUITMENT LIFECYCLE

This closes the mailto dead-end. The loop is the SECOND-LARGEST phase-one build (the draft mis-sized it as "strictly smaller than nothing"; verified false), and it ships in phase one anyway because seeding real past projects makes the first join request fire in week one, and a week-one request that dead-ends in a mailto is launch-day proof the recruiting half is broken.

**The loop has three parts, not one. All three are correctness and ship in phase one:**

1. **The accept route (small but real, not a one-liner).** A new transactional `POST /api/build/projects/[id]/accept`. In one transaction it: creates a `ProjectAssignment` (handling the `@@unique([userId, projectId])` so a duplicate or already-on-team request does not 500), flips `ProjectInterest.status` to `accepted`, and stamps `respondedById` and `respondedAt`. A sibling `.../decline` route flips status to `declined` with the same audit stamp.

2. **The read-path reconciliation (net-new in `toCard`).** Author-from-`createdById` and team-from-`assignments` must be reconciled so a solo creator shows one name, not two via two code paths. This is the change to `toCard` and `ProjectWithTeam` described above.

3. **The requester learns it resolved.** Verified gap: the requester's "You are on this team" state (line 260) only renders on a FRESH server render of the detail page, and there is no notification to bring them back. The draft cannot claim a closed loop while deferring the only mechanism that tells the requester it closed. Resolution: phase one ships a persistent "Your requests" surface on the requester side (a small list of the member's own pending/accepted/declined requests, readable any time), so resolution is observable without a push notification. A real notification (email or in-app) is phase two. This is the honest version of "closed loop": resolution is durable and checkable in-app, not silently buried, even before notifications exist.

**Invite, accept, decline, add-to-team:**
- A member clicks Request to join on a project detail; this writes a `ProjectInterest` (`status: pending`), the existing front-half already does this.
- A moderator (the project lead OR any ADMIN/PROJECT_LEAD as fallback, already enabled by `MODERATOR_ROLES`, build.ts line 12) Accepts, which runs the transaction above and adds the requester to the team.
- Decline turns the request down with the audit stamp. If anything slips for scope, it is Decline and notifications, never Accept-and-add-to-team.

**Notifications:** the "Your requests" surface (phase one) makes resolution observable. Push/email notification is phase two.

**The people axis:** OUT of every committed phase. No directory, no `lookingToJoin` columns in v1, v2, or v3-by-default. Rationale and the two-gate test that could ever change it are in Discovery and Phasing below.

---

## DISCOVERY

**Facets (phase one), rendered via `FilterTabs` with `count` badges, client-side over the already-fetched `getProjects` array:**
- **stage:** Idea / Building / Shipped, with Paused deselected by default.
- **track:** the three tracks.
- **help-wanted:** the `lookingFor`-non-empty predicate as a counted facet (the recruiting surface that is NOT a lens).

`FilterTabs` is the correct primitive here: it is the app's underline filter nav and supports `count`. It is NOT the segmented control; the hub's `CategoryTab` is the segmented precedent, reserved for the phase-two Collaborate lens if that is ever built.

**Default sort:** newest first (`createdAt desc`, which `getProjects` already does at build.ts line 155), with the Shipped facet carrying the showcase read. The draft's `shippedAt`-based "recently shipped first" sort is CUT from phase one: verified that `shippedAt` would have no writer in any phase (the modal does not stamp it, the status change does not stamp it, there is no edit flow), so the column would be null for every row at launch and the marquee sort would be a silent no-op. "Recently shipped" is achieved as "newest, filtered to Shipped" with zero new column. If a true ship date is wanted later, it comes with an explicit writer (stamp on the stage-to-Shipped transition, backfilled from `approvedAt`) in the same migration, not as a dead column now.

**No tech-stack facet in phase one** (tech tags do not exist yet and at launch would filter a handful of rows into ones and twos). **No search in phase one** (the board is small, facets cover it, the use-cases index ships zero search). **No leaderboard, ever** in a committed phase (verified vanity and gaming risk at this scale).

---

## DATA-MODEL DELTA (concrete Prisma changes, phase-tagged)

**Phase 1:**
- Wire `createdById` at POST. The relation already exists; zero schema change. Net-new is the read-path reconciliation in `toCard` / `ProjectWithTeam` so author and team do not double-render.
- `ProjectInterest.status`: define as a clean three-state `pending | accepted | declined` (plain string, matching the house convention of string status fields; it is never written today so there is zero migration cost to defining it correctly the first time). Drop the dead `new | seen` pair: `seen` is a read-receipt with no verb attached, gates no action, and a dead middle state is debt someone must later decide how to render. The requester's three meaningful resolutions are waiting, on the team, or turned down.
- `ProjectInterest.respondedById String?` and `respondedAt DateTime?` for the audit trail and the stale-requests view. (Ship-it flagged these as slightly over-spec; they are kept in phase one because the stale-requests fallback-owner view is the documented fix for an inactive lead recreating the dead-end, and that view needs `respondedAt` to compute staleness. The capability of any moderator resolving any request is free via `MODERATOR_ROLES`; the columns pay for the stale view specifically.)
- Stage vocabulary migration: the one-shot `updateMany` plus the `project-stages.ts` and seed-file edits described above. No new column; a data migration on an existing one.

No structural migration in phase one beyond the two `ProjectInterest` audit columns and the `status` value definition.

**Phase 2:**
- `coverImageUrl String?` on `Project`, shipped as ONE coupled unit with the upload surface (reusing the `feedback-storage.ts` Supabase pattern), an image-moderation gate, and the optional Shipped-row thumbnail. These cannot ship apart.
- `techTags Json?` (mirroring `lookingFor`'s shape) plus its facet.
- `shippedAt DateTime?` only if a true ship date is wanted, and only with its writer (stamp on stage-to-Shipped, backfill from `approvedAt`).
- The Collaborate segmented lens (on `CategoryTab`) IF the phase-one demand trigger fires.
- Decline-with-reason; real notifications.

**Phase 3 (only behind the two-gate people test):**
- `lookingToJoin Boolean @default(false)` and `joinBlurb String?` on `User`, rendered as a hairline name list, never an avatar card grid.

**Never in any committed phase:** a `Project.kind` discriminator, an Opportunity model, a people/profile model.

---

## COMPONENT AND REUSE PLAN

**Reused as-is:**
- `.bench-row` three-column grid, staggered entrance, `usePrefersReducedMotion`, `HairRule`, `SectionEyebrow`, `editorial-link` (benchmarks-client.tsx, the editorial-surface convention).
- `FilterTabs` with `count` badges for facets.
- The body-portal `data-theme="light"` dialog pattern (build-detail-client.tsx request-to-join dialog) for the posting modal.
- `Button`, the page frame, the Phosphor `Icon` registry, `StageChip` / `LookingForTag` / `DraftChip` (build-client.tsx exports), `getTrackTileColor`.
- The draft-then-approve visibility rule and `MODERATOR_ROLES` gating (build.ts).
- `lib/feedback-storage.ts` Supabase upload pattern (phase two, for the cover).

**Net-new, each justified:**
- A `STATUS_META`-style map for stage, but used ONLY for the quiet 11px lifecycle line and tile color, NOT mirrored onto a hero status word (the Editorial correction). This is a small copy-and-color map in `project-stages.ts`, not a new component.
- The three-step posting modal (composed from existing dialog and form primitives).
- The accept/decline control set inside the existing `ModerationPanel` (net-new client controls; the panel shell exists).
- The transactional accept/decline routes.
- The "Your requests" requester-side surface (a small list view).
- The read-path reconciliation in `toCard` (author vs team).

No new card system. No new browse grammar. The one genuinely new primitive (the posting modal) is composed from existing dialog and form pieces.

---

## PHASING AND SCOPE

### Phase 1 (ships) â€” acceptance criteria

- Editorial hairline index on `data-surface="editorial"` reusing `.bench-row` grammar, `HairRule` / `SectionEyebrow` / `usePrefersReducedMotion`; title as the hero, status as a QUIET 11px meta line, help-wanted as the column-three accent line.
- Three-step posting modal, three required fields, stage as a gated unselected radio in Step 1, trivial paste-URL import only, `createdById` wired at POST, entering as `draft`.
- Stage vocabulary migrated to four values via the one-shot `updateMany` plus the three coordinated file edits; modal stage options gated to the four values in the same deploy.
- Help-wanted as a counted FACET (not a lens); stage and track facets; default sort newest-first with the Shipped facet as the showcase read.
- The full join loop replacing the `mailto:` at line 547: accept route (transactional assignment create plus status flip plus audit stamp), decline route, the new accept/decline control set in `ModerationPanel`, the read-path `createdById`-vs-`assignments` reconciliation, and the requester-side "Your requests" surface so resolution is observable without notifications. Self-serve projects get a Lead assignment at approval; seeded projects' teams stay seed-file-owned.
- Active "Post the first project" empty state.
- A leads-chosen typographic featured rail IF Branch HIGH (cut in Branch LOW).
- Board dogfood-seeded with real projects before go-live (target per branch below).

**Phase-1 end-to-end acceptance test:** a member with no engineering ability posts a project through the modal; a moderator approves it and it appears with the creator auto-added as Lead; a second member requests to join; the project lead (or an admin fallback) Accepts; the requester sees the resolution in "Your requests" and "You are on this team" on the detail, with no seed-file edit.

### Phase 2

`coverImageUrl` plus upload surface plus image-moderation gate plus optional Shipped-row thumbnail (one coupled unit); `techTags` plus its facet; the Collaborate `CategoryTab` lens IF the demand trigger fired; real notifications; decline-with-reason; URL-import-with-prefill; `shippedAt` plus its writer if a true ship date is wanted.

### Phase 3 (only behind the two-gate people test)

The opt-in `lookingToJoin` plus `joinBlurb` people signal, rendered as a hairline name list.

### Not now (explicit)

People directory as a browse surface; Opportunity model or `kind` discriminator; build-in-public feed; remix/fork as a model; search; leaderboard; cover-image gallery; the Collaborate lens; URL-scrape import; `shippedAt` without a writer.

**Triggers that move deferred items forward:**
- **Collaborate lens (phase two):** promote the help-wanted facet to a `CategoryTab` lens when the facet shows SUSTAINED recruit demand (real join requests against help-wanted projects across a term), not a one-time launch seed count. Filled roles empty a lens, so the only honest gate is ongoing demand.
- **People signal (phase three), two gates, both required:** (a) the phase-one accept loop shows real recruiting demand, AND (b) a project-side help-wanted facet proves insufficient to carry it. The v1 accept loop is the cheaper experiment that answers the directory's question for free: if members never use the help-wanted facet and never file join requests, recruiting demand is provably absent and the directory is answered NO with no migration written.

---

## COLD-START, QUALITY, AND MODERATION PLAN

**The artifact count is a branch point before phase one ships, not an open question.** Every weak decision in this plan resolves one way only if the club has enough real showable artifacts today, and nobody in the room knows that integer. So the plan ships TWO pre-declared branches and a lead must answer the count before the index ships:

- **Branch HIGH (twelve or more real showable artifacts exist today):** the plan as written holds. A lead dogfoods the posting modal (trivial paste-URL import) to stand up real past club work as drafts, attributing each to its real author via `createdById` even when that author never touches the form. Self-serve posting is the maintenance strategy; the human seeder is the cold-start mechanism. The typographic featured rail ships. Target eight to twelve seeded, at least a few Shipped.
- **Branch LOW (under roughly eight):** showcase-first framing is wrong for launch. Posting (the genuinely zero-today gap) becomes the hero and the only acceptance-critical surface. The index is honestly relabeled as a growing index, not a celebration wall. The featured rail is CUT (featuring three of five rows reads as showing the whole board twice). Success metric becomes "members posted N new projects in the first month," not "the showcase reads alive on day one." A five-row hairline index is genuinely fine and intentional; a five-row index with a "Recently shipped" rail pulling three of those same five to the top is a confession.

**Quality and moderation reuse the existing draft-then-approve gate exactly.** Members and logged-out visitors only ever see approved rows (build.ts visibility rule). Self-serve posting writes `draft`; a moderator approves; junk is invisible to everyone except the approver.

**The moderation-load concentration is a named people-availability risk, not a queue-size risk.** With the accept loop, the auto-Lead-at-approval write, and the fallback-owner rule, a small set of moderators is the bottleneck for approving every draft, writing the right Lead assignment, and resolving every join request club-wide. At a thirty-person club with two active leads, the board is at risk the week both are in finals. Mitigations: ANY ADMIN/PROJECT_LEAD can resolve ANY request (already free via `MODERATOR_ROLES`), and the club-wide "Stale requests" view surfaces anything pending past N days so no single inactive lead silently recreates the dead-end. This is a watch-item to staff (keep more than two people in a moderator role), not a feature to build further.

**The empty state is active, not passive:** "Post the first project" wired to the modal, replacing "projects will show up here soon."

---

## OPEN QUESTIONS AND DISSENT (appendix)

1. **THE BLOCKER, escalated, not buried: the real artifact count.** The entire showcase premise rests on one unmeasured integer. The plan ships two branches (above) so the council need not reconvene, but a lead MUST answer "how many real showable artifacts does the club have right now" before the index ships, because that answer selects the branch. This is a fact about this club that no schema or design decision can substitute for.

2. **The Opportunities org decision (flagged loudly).** The leads PAUSED the project-vs-opportunity question. This plan builds NOTHING that presupposes a resolution: no `kind`, no opportunity status, no second tab. The editorial-index grammar leaves layout room (a second hairline index behind the same `CategoryTab` the hub runs) at zero schema commitment. Surface this to the leads for an org conversation; do not let any future ticket smuggle a `kind` field in as "harmless extensibility," because that pre-decides the paused question.

3. **Weakest design call, flagged for prototype: the pure-typographic index with no Shipped thumbnail.** Won on the ghost-state argument, which is strongest at launch and weakest at term three. Settle with one prototype: a Shipped row beside a By-Task row. If the showcase reads flat in words alone, the fallback is a single optional thumbnail on Shipped rows only (the phase-two enhancement pulled forward), NOT a gallery rail. This loops back to the artifact count: if seeding produces mostly Shipped work with screenshots ready, the editorial purity may cost more than it saves.

4. **Editorial minority position, preserved: reinstating "Polishing."** The Editorial seat holds that "Polishing" is a more flattering showcase word than "Building" and that relabeling needs no migration. Overruled for phase one (four values is the load-bearing simplification, and pride is better signaled by the Shipped year and a phase-two cover than a fifth mood word). Filed as a deliberate leads-owned vocabulary decision for later, made with a guarded migration. Revisit if the four-value vocabulary feels too coarse once real Shipped work accrues.

5. **Red Team minority position, preserved: drop "Paused" to three values.** The "tombstone" instinct is not wrong, only outweighed by the honesty-of-the-field argument and the default-sort mitigation (Paused sorts last and drops from the default showcase view). If the default sort does not reliably bury Paused rows in practice, this flips to three values.

6. **Flywheel minority position, preserved: the Collaborate lens in v1.** Flywheel maintains the lens belongs in phase one gated on five seeded help-wanted projects. Deferred to phase two behind SUSTAINED demand rather than a launch seed count, because filled roles empty the lens and a seeded count is a one-time prop on a transient supply. If phase-one recruiting traffic is strong, revisit early; the build is a config flip on `CategoryTab`.

7. **Provenance check before the stage migration.** Confirm the seed file is the sole source of `stage` truth for live rows before running the one-shot `updateMany`. It holds today (the only writers are the seeder and the not-yet-existing modal), but record the check so a future hand-edit is not silently overwritten.

8. **Cover-image moderation (deferred with the feature).** When imagery enters in phase two, it brings an image-moderation surface the draft-then-approve gate does not currently cover. It ships as part of the coupled cover unit, never ahead of it.

9. **The "why a board vs Discord" positioning is the spine, not a footnote.** The board wins exactly the durable, browsable, async-discovery plus team-of-record job Discord cannot do; it cedes live recruiting to Discord on purpose. If the leads ship the help-wanted facet and judge it against Discord's live channels, they will wrongly conclude the redesign failed. This expectation is set in the vision and must travel with the launch.

---

The spine is firm and now buildable against the real schema: one editorial index, status-led, help-wanted as a counted facet with the recruit line as the column-three accent (not a hero status word), the join loop closed in v1 as a properly-sized transactional route plus a new control set plus a requester-side resolution surface, posting self-serve with a human seed, four clean stage values via a real one-shot migration (not a seeder re-run), imagery entirely one click deep and deferred to a coupled phase-two unit, no people directory and no Opportunity model in any committed phase, and the whole thing branching on one escalated unknown: the real count of showable artifacts the club has today.

Key files grounding this plan (all absolute):
- `C:/Users/Etown/Ai Education/aisa-atlas/lib/build.ts` (toCard 118-140 maps only assignments to contributors with no createdById; ProjectWithTeam 102-116 has no createdById; getProjects sort 155 is createdAt desc; isOnTeam/hasRequestedJoin 204-219 server-computed once; MODERATOR_ROLES 12)
- `C:/Users/Etown/Ai Education/aisa-atlas/scripts/seed-projects.ts` (idempotent, reads stage from seed file validated against current PROJECT_STAGES at 57; deleteMany on assignments at 235; update omits status at 228)
- `C:/Users/Etown/Ai Education/aisa-atlas/lib/project-stages.ts` (five values 10-16; tolerant stageMeta fallback to building 33)
- `C:/Users/Etown/Ai Education/aisa-atlas/lib/feedback-storage.ts` (Supabase upload 16-36 plus signed URL 38-45, the existing upload primitive that disproves "no upload surface exists")
- `C:/Users/Etown/Ai Education/aisa-atlas/components/build-detail-client.tsx` (mailto dead-end with no action control 543-555; "You are on this team" 260 renders only on fresh server render; request-to-join body-portal dialog 585+ is the modal template)
- `C:/Users/Etown/Ai Education/aisa-atlas/components/benchmarks-client.tsx` (header comment 14-22; NAME is the hero at --text-xl 278-292; status chip deliberately small at fontSize 11, 369-371; three-column grid the index reuses)