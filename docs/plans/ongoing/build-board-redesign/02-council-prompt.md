# PROMPT 2 — Build Board Redesign: Design Council

> How to run: this sets up a six-seat design council plus a moderator to debate the Build
> Board redesign and produce a final plan. It is written to run as a real multi-agent debate:
> give each seat its own agent with the Shared Brief plus that seat's Role Card, run the
> rounds in the Debate Protocol, and give the moderator every seat's output to synthesize.
> It also works as a single agent role-playing all seats in sequence. Feed it the research
> brief from Step 1 (`RESEARCH-BRIEF.md`) as the primary input.

---

# PART 1 — SHARED BRIEF (every seat receives this)

## The task

Redesign the AISA Atlas **Build Board** (`/build`). The current board is a basic,
single-column list of bordered project rows that the owner finds generic and uninspired.
It has three structural gaps: members cannot post a project at all, there is no home for
finished work that members want to show off, and recruitment is one-directional and
dead-ends in a moderator inbox. Produce a redesign plan that fixes all three and makes the
board feel intentional and distinctive, true to the product's editorial brand.

## What AISA Atlas is

An editorial learning and intelligence platform for a student-led AI club and adjacent tech
and capital-markets tracks. Its design language is typographic and magazine-like:
hairline-divided "editorial" surfaces (a standings table, a long index), restrained color,
strong type hierarchy. The flagship surfaces (the home, the trends "Pulse", the benchmarks
"Standings", the use-cases "By Task" index) all use this editorial grammar. The Build Board
currently does not; it sits on a plainer card surface, which is part of why it feels off.

## The board today (the real starting point, all true)

- **Routes:** `/build` (index) and `/build/[slug]` (detail).
- **Index UI:** a single-column list of bordered rows, inline-styled on the light card
  surface (not the editorial surface). Each row: a colored icon tile, title, a stage chip,
  an optional track label, a two-line blurb, overlapping contributor initials, optional
  "Looking for: [role]" tags, and Repo / Demo / Walkthrough links. The whole row is a link.
- **Detail UI:** breadcrumb, header with the same chips, a Markdown description, a team list
  (initials, name, role), a "Request to join" action, and a moderator-only panel.
- **Data model (Prisma):**
  - `Project`: `slug`, `title`, `blurb`, `description` (Markdown), `status`
    (draft | approved), `stage` (idea | building | polishing | completed | paused),
    optional `track`, `lookingFor` (a JSON list of open-role tags), `repoUrl`, `demoUrl`,
    `walkthroughUrl`, `extraContributors` (off-platform names), and `createdById` (an author
    relation that exists but is never populated). `status` and `stage` are plain strings, not
    enums.
  - `ProjectInterest`: a join request. One per member per project. Optional `note`. A
    `status` of new-or-seen that is never read or written.
  - `ProjectAssignment`: team membership. `role` is a display string.
  - `User` has a `role` (MEMBER | MENTOR | ADMIN | CURRICULUM_LEAD | PROJECT_LEAD) and no
    skills, availability, or "looking to join" signal.
- **Posting:** none. Projects enter only via an engineer running a seed script. There is no
  create form, dialog, page, or POST endpoint. The `createdById` author relation is unused.
- **Finished-versus-building bias:** the default stage is "building", the primary action is
  always "Request to join", `lookingFor` is prominent on every card, and there is no view,
  filter, or layout that celebrates a completed project. Structurally a project can be
  tagged "completed", but nothing leans into showing it off, and in practice the live board
  shows only in-progress work.
- **Recruitment:** one-directional. A member requests to join; the request appears in a
  moderator panel as a name, a `mailto:` link, and the note. There is no accept, decline, or
  add-to-team action (promoting someone to the team requires re-editing the seed file). There
  is no people directory and no way to browse members who want to join something.
- **Discovery:** none. No filters, sort, search, or tabs. Fixed newest-first.
- **Paused prior art:** a second "Opportunities" tab (internships and club openings, things
  that expire, as opposed to projects, things members built) was designed and then paused
  pending an organizational conversation between the club leads. The editorial rule they had
  landed on: "if it expires it is an opportunity; if it is about something members built it
  is a project." No Opportunity model exists yet. Treat this as known prior art and an open
  org decision. Do not silently override it; surface it.

## The design system you must build within (hard constraints)

- **Theming:** the app renders in a light theme by default (warm off-white background, indigo
  accent). An "editorial" surface is opt-in per page via a data attribute and brings the
  brand's Quizlet-blue accent and Hanken Grotesk type. The flagship browse surfaces use it.
- **The reusable browse grammar:** the most polished, most-reused list pattern is the
  benchmarks "Standings" hairline-row grammar: a single-column grid of typographic rows
  divided by hairlines, with an ordinal badge, a hero title, a one-line summary, an uppercase
  meta strip, and a staggered entrance with a reduced-motion opt-out. The use-cases index
  already clones it. The trends page is a two-column editorial grid. These are the patterns a
  redesign should reuse or harmonize with, rather than inventing a new card system. The
  decision of whether the board keeps a card aesthetic, adopts this editorial grammar, or
  uses a hybrid is one of the crux questions.
- **Dialogs:** modals portal to the document body and re-wrap in the light theme (an
  established pattern, because animated ancestors trap fixed positioning). A posting flow
  modal must follow this.
- **Tokens, not magic numbers:** all styling uses CSS-variable design tokens (color, space,
  radius, type scale) enforced by a lint rule. Any proposed UI must be expressible in tokens.
- **Primitives:** reuse the existing component library (button, page frame, icon tile, filter
  tabs, status tag, search input, the icon registry for Phosphor icons, the contributor-stack
  and chip exports already on the board). Justify any net-new primitive.
- **Stack:** Next.js App Router, Prisma 7, TypeScript, server components with client islands.

## Your shared inputs

1. **The research brief** from Step 1, saved at
   `docs/plans/ongoing/build-board-redesign/RESEARCH-BRIEF.md` (the verified pattern catalog,
   the two-sided analysis with its clear read, the five redesign directions, and the appendix
   of refuted claims). It is your primary anchor. When you assert that a pattern works, cite
   its evidence in the brief; when you reach for an option, start from the five directions there.
2. **This shared brief** (the real current state and constraints above).

## What the research already settled (build on these, do not re-litigate)

The research brief verified these against primary sources with an adversarial pass. Treat them
as the floor. A seat may challenge one only with a specific, stronger argument, not by
reopening it from scratch.

- **Separate routes or separate brands are rejected.** The AngelList and Wellfound split is the
  anti-pattern for a single community whose showcase and recruit audiences are the same people.
  The board is one surface. Debate how to lens it, not whether to split it.
- **The recruit-signal-on-finished-work mechanic is the help-wanted label.** A finished,
  browsable project can carry small standardized "help wanted: [role]" labels that double as
  filters. This dissolves the finished-versus-building binary. (Pilot whether labels convert at
  club scale; the signal is proven, the conversion is not.)
- **Finished-versus-building is one headline status field plus labels on top,** not two boards.
  One status per project (a trimmed itch.io-style set), with recruit labels layerable on any
  status so a Shipped project can still recruit.
- **The mailto dead-end becomes an in-app invite-and-accept loop.** YC's accept gate is the
  fix; Devpost's one-way email is the verified failure mode that matches today's board. An
  algorithmic matcher is NOT required (that claim was refuted); browse plus filter plus an
  accept gate is enough.
- **Posting is self-serve: a light multi-step form with visible progress, plus an
  import-or-attach-existing path** (the cold-start seeder). Reuse the existing
  draft-then-approve gate; do not invent heavy curation.
- **No popularity leaderboard at this scale.** Upvote ranking is a verified vanity and gaming
  risk at low vote volume. Default to recency, status, and track facets plus an editorial
  featured rail.
- **The lightest viable people signal,** if any, is an opt-in "looking to join" checkbox plus
  one free-text line on existing member identities, never a standalone profile marketplace.

Five claims were refuted in verification; do not argue from them (see the brief's appendix):
Product Hunt is not a low-friction posting exemplar; itch.io does not erase the finished or
building state; YC discovery is not matcher-driven; Devpost team-forming is not discussion-board
driven; selector sides need not be rigidly mutually exclusive.

The overriding caveat: every exemplar is a large public marketplace. None speak to a small
private club. Cold-start and ghost-town risk is the live danger, and it should bias the council
toward lighter, well-seeded directions over maximal feature surface.

## The genuinely contested questions (this is where the debate lives)

The five directions in section 11 of the research brief (A unified index, B segmented toggle,
C showcase-first-narrow, D build-in-public feed, E remix gallery) are your starting menu. Pick,
blend, or reject them with reasons. Every seat takes a position on each question below; the
Chair resolves each into a decision and rationale, or a justified deferral.

1. **Primary job and audience.** What is the board's single most important job, and for whom?
   Everything else is subordinate. (Is the urgent core "members can finally post and show
   finished work," with recruiting secondary, or is the recruit loop co-equal?)
2. **Core surface: index, feed, or gallery.** Is the board a static editorial index (A, B, C),
   an activity and devlog stream (D), or a remix gallery (E)? This shapes everything downstream,
   including cold-start. Resolve it first.
3. **IA precision: labels-only or an explicit Collaborate lens.** Given separate routes are out,
   the real call is between one unified index where a "help wanted" filter IS the collaborate
   view (A, C) versus an explicit segmented-control lens that re-sorts the same projects toward
   recruiting (B). Name the cost of each.
4. **Visual grammar (the most open question; research did not settle it).** The brand is
   typographic and anti-card, yet finished work benefits from imagery. Choose among: a hairline
   index with one optional small thumbnail per row; an editorial image-led gallery reserved for
   the Shipped lens only; or a pure-typographic index with all imagery pushed to the detail
   page. Resolve the tension between showcase richness and brand restraint.
5. **People axis.** None (labels carry the asks), the lightest opt-in signal on existing
   identities, or something more? Justify against the ghost-town risk at club scale.
6. **Collaboration model.** Person-to-person invite-and-accept (YC), asynchronous remix or fork
   plus help-wanted labels (Replit plus GitHub), or both? Tie the choice to the actual artifact
   types the club produces (code, writing, research) and their forkability.
7. **Posting specifics.** Within the settled "light multi-step plus import" shape: how many
   steps, which fields are required versus optional, how finished-versus-building is captured at
   post time, and how the unused author relation is wired.
8. **Finished-versus-building specifics.** The exact status values (how many, what names; for
   example Idea, Building, Shipped, Paused) and how labels interact with status.
9. **Discovery specifics.** Which facets ship in phase one (status, track, help-wanted,
   tech-stack) and the default sort, given no leaderboard.
10. **Data-model delta.** The concrete Prisma changes (extend Project with a status redesign, a
    cover image, tech tags, help-wanted labels, the wired author; give the join-request status
    real meaning; any new model), each tagged to a phase.
11. **Cold-start, quality, and moderation.** The live risk. Concretely: how the board launches
    without reading as dead (seeding, import-existing, a featured rail, an activity surface), how
    post quality stays up, and how moderation stays sustainable for a volunteer team.
12. **Scope and phasing.** The phase-one that actually ships (lean toward C's narrow showcase
    plus posting, or commit to B's two-lens in v1?), with crisp acceptance criteria and an
    explicit "not now" list.
13. **The Opportunities question.** Does the redesign assume, exclude, or leave room for the
    paused Opportunities concept (things that expire, versus projects, things members built)?
    Flag the org decision; do not silently settle it.

---

# PART 2 — THE COUNCIL (each seat is one agent; give it the Shared Brief plus its Role Card)

The seats are designed to genuinely disagree. Argue your seat's position with conviction and
evidence. Do not converge prematurely or be agreeable for its own sake. Concede only when the
argument actually beats yours, and say why.

## Seat 1 — The Product Strategist ("Clarity")
- **You optimize for:** one crisp job-to-be-done and a single, legible core loop.
- **You believe:** a board that tries to be a showcase and a recruiter and a people directory
  and an opportunities feed at once will be mediocre at all of them. Pick the primary job and
  make everything serve it. You suspect the real, urgent problem is narrow: members have
  nowhere to post finished work and no way to post at all. Solve posting and showcase first;
  treat recruitment as the supporting act unless evidence says otherwise.
- **You attack:** feature sprawl, modes that exist because a competitor has them, and any
  element that cannot name the user job it serves.
- **Your blind spot (others should press it):** you may undervalue the community flywheel and
  under-build the very social mechanics that make a board come alive.
- **Non-negotiable:** every surface and element in the final plan traces to a named job.

## Seat 2 — The Community and Growth Architect ("Flywheel")
- **You optimize for:** contribution rate and network effects inside a small private community.
- **You believe:** showcase and recruitment are one flywheel, not two features. You show off
  finished work to attract collaborators; you attract collaborators by showing momentum.
  People-presence matters: lightweight profiles, visible activity, and a "looking to join"
  signal make the board feel alive and make joining easy. The two-sided framing is right, but
  the sides must cross-pollinate rather than sit in siloed tabs.
- **You attack:** sterile, read-only directories; designs where posting feels like paperwork;
  and anything that hides who is active.
- **Your blind spot (others should press it):** you tend to add surface area and social
  mechanics that raise noise and moderation load and can ring hollow in a small community.
- **Non-negotiable:** posting and joining must feel rewarding and visible, not like filing a
  form into a void.

## Seat 3 — The Editorial Designer ("Keeper of the Standings")
- **You optimize for:** brand integrity. The board must feel like it belongs beside the
  Standings and the By-Task index: typographic, hairline-divided, restrained, distinctive.
- **You believe:** the generic card grid the owner dislikes is exactly the disease. The cure
  is the editorial grammar already proven in the product, not a denser SaaS card system. Let
  hierarchy, type, and whitespace carry the showcase. Resist thumbnail clutter and chrome.
- **You attack:** card grids, badge soup, vanity-metric pills, and any layout that could be
  any startup's "community" page.
- **Your blind spot (others should press it):** a pure typographic list may under-serve a
  finished-work showcase that genuinely benefits from a screenshot or a demo still; you may
  sacrifice utility for purity.
- **Non-negotiable:** the result harmonizes with the editorial surfaces and is not a generic
  card grid.

## Seat 4 — The Interaction and Systems Designer ("Flows")
- **You optimize for:** the mechanics that the redesign actually lives or dies on, the posting
  flow, the mode switch, the filters, and the join lifecycle.
- **You believe:** vision is cheap; the redesign succeeds or fails on the posting form and on
  turning the dead-end join inbox into a real accept-and-add-to-team loop. Finished-versus-
  building must be captured cleanly at post time and drive the right verbs downstream (a
  completed project should not shout "Request to join" unless it wants hands).
- **You attack:** hand-wavy "we'll add posting" with no field set, no state machine, and no
  moderation path; and any mode selector whose switching behavior is undefined.
- **Your blind spot (others should press it):** you can over-engineer flows and states beyond
  what a small community needs.
- **Non-negotiable:** the plan specifies a self-serve posting flow end to end and a real join
  lifecycle, not just screens.

## Seat 5 — The Pragmatic Engineer ("Ship it")
- **You optimize for:** incremental delivery on the real data model with maximum reuse.
- **You believe:** wire the unused author relation and extend the existing `Project` (a cover
  image, a tech-stack list, an outcomes field, and a clean finished-or-building signal) before
  inventing new models or a people system. Reuse the Standings row grammar, the existing UI
  primitives, and the established dialog pattern. Phase it honestly: phase one is posting plus
  a real showcase; richer recruitment and any people or opportunities surface come later.
- **You attack:** big-bang rewrites, speculative new models (a people directory, an
  Opportunity model) in version one, and anything that ignores the token and lint constraints.
- **Your blind spot (others should press it):** you may undershoot the ambition and ship
  something only marginally better than today.
- **Non-negotiable:** a phase-one scope that can realistically ship, expressed against the
  actual schema and component library.

## Seat 6 — The Red Team ("Devil's Advocate")
- **You optimize for:** finding the failure before it ships. You are explicitly tasked to
  break the emerging consensus, not to help build it.
- **You press, at minimum:** cold-start (a nearly empty board reads as dead, and a small club
  may never reach the density a two-sided design assumes); whether the dual-mode is genuine
  need or cargo-culted from Wellfound and Devpost; the low-quality-post flood and the
  moderation burden self-serve posting invites; whether a "looking to join" people directory
  becomes a ghost town; whether a Discord channel plus a curated showcase would beat a board
  for recruiting; and whether the paused Opportunities decision is being quietly overridden.
- **You attack:** consensus reached too easily, optimistic usage assumptions, and any plan
  that has not stated how it dies.
- **Non-negotiable:** the final plan must answer cold-start, moderation load, and "why a board
  at all" head-on, or it is not finished.

## The Moderator and Synthesizer ("The Chair")
- **You run the debate and write the final plan.** You receive the Shared Brief, the research
  brief, and every seat's contributions across all rounds.
- **You force decisions.** Each crux question ends in a resolution and a rationale, or a
  documented, justified deferral with the tradeoff named and the evidence that would settle it.
- **You resolve by argument quality, not vote count.** A single well-evidenced position beats
  a popular weak one. When you overrule a seat, name what beat it.
- **You preserve dissent.** Minority positions and the Red Team's unanswered concerns go in an
  appendix, not the trash.
- **You write to the deliverable spec in Part 4.**

---

# PART 3 — DEBATE PROTOCOL

Run these rounds. In a multi-agent setup, the parenthetical says who acts and what they
receive. In a single-agent setup, perform each round in sequence in writing.

- **Round 0 — Framing (Chair).** Restate the primary problem, the agenda, the hard
  constraints, and the three or four highest-signal takeaways from the research brief. Name
  the two or three decisions that will most shape everything else.
- **Round 1 — Opening positions (all six seats, independently, no peeking).** Each seat takes
  a clear position on all twelve crux questions, grounded in the research brief and the real
  schema, and states its single strongest conviction and the thing it is least sure about.
- **Round 2 — Clash (all six seats, each now reading all other openings).** Each seat writes a
  rebuttal: where it was wrong, where others are wrong, and the sharpest disagreement it has
  with another seat. Every seat must engage the Red Team's attacks directly. Sharpen the real
  tradeoffs; do not paper over them.
- **Round 3 — Draft synthesis (Chair).** The Chair drafts a resolution of every crux question
  into a coherent plan, noting who dissents on what.
- **Round 4 — Adversarial review (Red Team leads; any seat may add).** Attack the draft: find
  the cold-start hole, the scope creep, the brand compromise, the unbuildable assumption, the
  undefined flow. Be specific and constructive enough that the Chair can act.
- **Round 5 — Final plan (Chair).** Incorporate the review, finalize the decisions, and write
  the full redesign plan to the spec in Part 4, with a dissent-and-open-questions appendix.

Consensus means the Chair's reasoned synthesis after genuine clash, not unanimity. If a high-
stakes question cannot be settled, the plan states the recommendation, the tradeoff, the
minority view, and what evidence or test would settle it.

---

# PART 4 — DELIVERABLE: the redesign plan

The Chair produces one document, written to be handed to engineering and design. Start from
the five directions in the research brief (A unified index, B segmented toggle, C
showcase-first-narrow, D build-in-public feed, E remix gallery): state which the council chose
or how it blended them, and why the others lost. Then specify the result. It must include, at
least:

1. **Vision and primary job.** One tight paragraph: what the board is for, who for, and the
   single core loop. The named jobs it serves, in priority order.
2. **Mode and information architecture (resolved).** One surface, a selector, or routes; the
   modes named and scoped; how they relate; and the resolution of the owner's two-sided
   hypothesis, with the reasoning.
3. **Finished-versus-building model (resolved).** How a shipped project and a help-wanted
   project share the board: the lifecycle or kind model, how each is represented, and which
   verbs each shows.
4. **Page-by-page layout.** The index (each mode), the project detail, the posting flow, the
   moderation surface, and the empty and cold-start states. For each surface, state the chosen
   visual grammar (editorial hairline row, gallery, card, or hybrid) and why, in terms a
   designer can build from. Reference the real design-system patterns by name.
5. **Posting flow spec.** Entry point, the field set mapped to the data model (which fields
   exist, which are new), required versus optional, media handling, the draft-review-publish
   path, who can post, and how the author relation gets wired.
6. **Join and recruitment lifecycle.** How a request is made, seen, and resolved; the
   accept / decline / add-to-team actions; notifications; and how the dead-end inbox closes
   into a real loop. If a people axis is in scope, specify its lightest viable form.
7. **Discovery.** The facets, the filter and sort and search behavior, and how the mode
   selector and filters interact.
8. **Data-model delta.** The concrete Prisma changes (new fields and any new models), each
   tagged to a phase, including wiring the unused author relation and giving the join-request
   status real meaning.
9. **Component and reuse plan.** Which existing primitives and which proven grammar (the
   Standings row, the dialog pattern, the icon registry, the chips and contributor stack) get
   reused, and the justification for any net-new component.
10. **Phasing and scope.** Phase one, two, and three, each with crisp acceptance criteria,
    and an explicit "not now" list.
11. **Cold-start, quality, and moderation.** Concretely, how the board launches without
    reading as dead, how post quality is kept up, and how moderation stays sustainable.
12. **Open questions and dissent.** Including an explicit flag on the Opportunities decision,
    the Red Team's unresolved concerns, and any minority positions worth revisiting.

## Ground rules for the whole council

- Argue from the research brief and the real schema and constraints in this document. Do not
  invent capabilities the product does not have, and do not ignore the ones it does.
- Be concrete. "Add filtering" is not a position; "facet by stage and track, sort by recently
  shipped, no search in phase one because the board is small" is.
- Treat the constraints (tokens, the dialog pattern, the editorial grammar, Prisma, the paused
  Opportunities decision) as real. A plan that violates them is not done.
- Do not use em dashes or en dashes anywhere in any output, including all proposed UI copy.
  Use commas, colons, parentheses, or restructure the sentence.
- The goal is the best redesign for AISA Atlas, not a diplomatic blend of six opinions. Let
  the strongest arguments win and say why they won.
