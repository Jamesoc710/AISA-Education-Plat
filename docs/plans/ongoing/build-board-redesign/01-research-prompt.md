# PROMPT 1 — Build Board Redesign: Research Brief

> How to run: hand this whole file to a product and UX research agent (or the deep-research
> skill). It should investigate live products, extract reusable patterns, and return the
> structured brief specified at the bottom. The brief becomes the input to the council in
> `02-council-prompt.md`. Save the output as `RESEARCH-BRIEF.md` in this folder.

---

## Your role

You are a senior product and UX researcher specializing in community, marketplace, and
showcase surfaces. Your job is not to summarize websites. It is to reverse-engineer the
design decisions behind comparable products, extract the reusable patterns and the
principles underneath them, name the tradeoffs, and hand a design council a sharp menu of
options grounded in real evidence. Be opinionated and specific. Cite sources.

## The product you are researching for

AISA Atlas (internally "TCO") is an editorial learning and intelligence platform for a
student-led AI club and adjacent tech and capital-markets tracks. It has a refined,
magazine-like design language: typography-led, hairline-divided "editorial" surfaces
(think a standings table or a long-form index, not a SaaS card grid). Members read trends,
study benchmarks, follow use-cases, and work in tracks.

Inside it sits the **Build Board** at `/build`: the place where members' projects live.
We are redesigning it. Your research grounds that redesign.

## What the Build Board is today (the starting point you are improving)

- **Surface:** a single-column list of bordered rows (a cloned "Brilliant card" aesthetic),
  one row per project, on the light card surface. The owner finds it visually basic and
  generic and wants it to feel intentional and distinctive.
- **Content per row:** a colored icon tile, a title, a stage chip, an optional track label,
  a two-line blurb, overlapping contributor initials, optional "Looking for: [role]" tags,
  and Repo / Demo / Walkthrough links. A detail page adds a Markdown description, a team
  list, and a "Request to join" action.
- **Data model:** a `Project` (title, blurb, Markdown description, `status` of
  draft-or-approved, `stage` of idea / building / polishing / completed / paused, an
  optional track, a `lookingFor` list of open-role tags, repo/demo/walkthrough URLs, and an
  unused `createdById` author field); a `ProjectInterest` (a one-per-member join request
  with an optional note and an unused new-or-seen status); and a `ProjectAssignment` (team
  membership with a role string).
- **Three real gaps the redesign must close:**
  1. **No posting.** Members cannot create or post a project from the UI at all. Projects
     enter only through an engineer running a seed script. The author field is never set.
  2. **No home for finished work.** Everything is framed as in-progress and recruiting:
     the default stage is "building", the only verb is "Request to join", and there is no
     view, filter, or layout that celebrates a shipped, completed project. A member who
     wants to post something they are *done with*, to show it off, has nowhere natural to do
     it.
  3. **Recruitment is one-directional and dead-ends.** A member can request to join a
     project, but the request lands in a moderator inbox as a name and an email link with no
     accept, decline, or add-to-team action. There is no way to browse *people* who are
     looking to join a team, no skills or availability on member profiles, and no
     "post your project to find collaborators" loop that actually closes.
- **Discovery:** none. No filtering, sorting, search, or tabs. Fixed newest-first.
- **A paused decision:** a second "Opportunities" tab (internships and club openings, things
  that *expire*, as distinct from projects, things members *built*) was designed and then
  paused pending an organizational conversation. Treat it as known prior art and an open
  question, not as settled scope.

## The redesign hypothesis to pressure-test (the owner's framing)

The board should serve two related but distinct jobs, possibly through a selector or
two-sided layout:

- **Side A, Showcase:** browse and post what members have *built*, including finished work
  you are proud of and want to show off, not only active projects begging for help.
- **Side B, Collaborate:** post a project to find collaborators, browse open projects, and
  request to join, and possibly browse *people* who are looking to join a team.

Your research should test whether this two-sided framing is right, what the best shape for
it is, and how the two sides should relate. Do not assume it is correct. Some of the best
products deliberately keep one surface; some split into two; some use a third axis (people,
or opportunities). Bring evidence.

## What to investigate

Prioritize live products you can actually inspect. For each, study the real interface,
flows, empty states, and how the pieces relate, not just the marketing page. Group your
study around these lenses.

### Lens A — Showcase and "what people built" galleries
How finished and in-progress work is displayed, made discoverable, and given social proof.
Study, at minimum: Product Hunt (launches, upvotes, makers, collections), Devpost
(hackathon project galleries, "Built with" tech tags, winners), GitHub (Explore, Trending,
topic pages, the repo About sidebar, "Made with" showcases), Behance and Dribbble (creative
portfolios, appreciations, availability-for-hire), itch.io (game showcase plus jams and
devlogs), the AI-builder galleries (Replit, Bolt, Lovable, v0) including remix and fork
counts, Figma Community (publish plus duplicate counts), Peerlist (Project Spotlight and
Scrolls), Kaggle (notebooks, competitions, medals), and Hackster.io or Devfolio for project
detail structure.

### Lens B — Collaboration, team formation, and "find members / join a project"
How people are matched to projects and projects to people. Study, at minimum: Y Combinator
Co-Founder Matching (profiles, the request-and-accept flow, the gold standard for join
mechanics), Wellfound (startup profiles, roles, the "interested" flow), IndieHackers
(building in public, milestones, "looking for cofounder"), Reddit team-up surfaces
(r/SideProject, r/INeedTeam, gamedev "looking for group" threads), MLH and Hack Club and
Devpost team formation, Polywork and Showwcase (collaboration signals), and a talent
marketplace or two (Contra, Toptal) for the two-sided mechanics.

### Lens C — Dual-mode information architecture
How a single product holds "browse what exists" and "find or join" without fragmenting.
Study how Wellfound, Devpost, Behance, Dribbble, GitHub, and Product Hunt segment their top
level (tabs vs separate routes vs a filter vs a segmented control), and what each choice
costs. This lens directly informs the owner's selector hypothesis.

### Lens D — Posting and submission flows
How an item gets created and how quality is controlled. Study the spectrum from
low-friction self-post (Show HN, a Reddit submit form) to curated submission (Product Hunt
scheduling and maker verification, Devpost's required fields and media, Figma and Replit
publish flows, GitHub's structured About metadata). Capture the field sets, the required
versus optional split, media handling, and any draft-review-publish moderation.

### Lens E — Finished versus building representation
How products signal lifecycle and let the same surface hold a shipped thing and a thing
that needs hands. Study IndieHackers milestones, Product Hunt upcoming versus launched,
itch.io "in development" versus "released", and especially GitHub's "good first issue" and
"help wanted" labels, the canonical pattern for attaching a recruit signal to finished or
ongoing work without reframing the whole project as unfinished.

## Extraction discipline

For every meaningful pattern you find, capture these fields. Patterns, not page tours.

1. **Pattern name** (a short, reusable handle).
2. **The user job** it serves.
3. **The concrete mechanic** (the actual UI and interaction, specific enough to redraw).
4. **Why it works** (the underlying principle).
5. **The failure mode** (when and why it breaks, or who it annoys).
6. **Which crux question it informs** (see the council's agenda below: mode and IA;
   finished-versus-building; posting flow; join lifecycle; discovery; visual grammar;
   social signals; cold-start and moderation).
7. **Source** (link, and a note of what specifically you looked at).

## The crux questions your research must illuminate

The council will have to decide these. Your brief should arm them with evidence and options
for each, not answers you invented:

1. **Mode and IA.** One unified board, a two-mode selector, or separate routes? If a
   selector, what are the two or three modes and what lives in each?
2. **Finished versus building.** How should a shipped project and a help-wanted project
   coexist? Separate views, a lifecycle field, a recruit-signal-on-top-of-anything model?
3. **People axis.** Is a browseable directory of members "looking to join" worth it for a
   community of this size, or does it become a ghost town? What is the lightest version that
   works?
4. **Posting flow.** Self-serve create: modal or page, which fields, how much friction, and
   what moderation (open post, draft-then-approve, or curated)?
5. **Visual grammar.** A finished-work showcase often wants imagery and a gallery feel, yet
   the AISA Atlas brand is typographic and anti-card. How do the best showcases balance
   visual richness with restraint? Where is the line?
6. **Discovery.** Which facets actually matter (stage, track, tech stack, looking-for,
   recency, popularity) and what filter and sort patterns serve them?
7. **Social signals and contribution.** What signals (upvotes, reactions, views, remix
   counts, "shipped" badges) drive people to post and to engage, and which create noise or
   vanity dynamics in a small private community?
8. **Cold-start and moderation.** How do the best boards avoid reading as dead when empty,
   avoid a flood of low-quality posts, and keep moderation sustainable?

## Output: the research brief

Produce a single well-structured document with these sections. Be concrete and cite
sources throughout.

1. **Executive summary.** The five to eight highest-leverage takeaways for this redesign.
2. **Archetype taxonomy.** The distinct shapes a build board can take (for example
   showcase-only, collaboration-only, two-sided, marketplace, community feed), each with
   real examples and their tradeoffs.
3. **The two-sided question, analyzed.** When the best products keep one surface versus split
   it, how they relate showcase and recruitment, the flywheel between showing-off and
   attracting collaborators, and the cold-start risk of any second mode. End with a clear
   read on whether AISA Atlas should be one surface, a selector, or separate routes, and why.
4. **Pattern catalog.** The core of the brief. Patterns grouped by crux question, each with
   the seven extraction fields. This is what the council mines.
5. **Posting and moderation flows.** Comparative analysis plus a recommended shape (entry
   point, field set, required-versus-optional, media, and the draft-review-publish question).
6. **Finished-versus-building representation.** Comparative analysis plus a recommended model
   for how a shipped project and a help-wanted project share one board.
7. **Discovery.** The facets that matter for this domain and the filter, sort, and search
   patterns that serve them.
8. **Visual grammar beyond cards.** Gallery versus list versus feed versus hybrid; how
   showcases get visual richness without clutter; and two or three concrete directions that
   could satisfy a finished-work showcase while staying compatible with a typographic,
   editorial brand.
9. **Social signals and quality.** What drives contribution and engagement, and what to
   avoid in a small private community.
10. **Anti-patterns and cautionary tales.** Ghost-town boards, low-quality floods, the
    "two tabs nobody uses" trap, moderation burnout, vanity metrics. Name them and name what
    causes each.
11. **Ideas to bring to the council.** The bridge to Step 2. Three to five distinct,
    coherent redesign directions, each described as a complete concept (its core loop, its
    IA, how it handles posting and finished-versus-building, and its main risk), and each
    explicitly mapped to the crux questions. These are the real alternatives the council will
    debate, so make them genuinely different from each other, not variations of one idea.
12. **Open questions.** What the research could not settle, and what evidence would settle it.
13. **Sources.** Every product and reference, with links and what you inspected.

## Ground rules

- Prefer primary inspection of live products over secondary write-ups. When you cite a
  pattern, say what you actually looked at.
- Be specific enough that a designer could redraw any pattern you name from your description
  alone.
- Separate observation ("Devpost requires a Built-with tech list") from recommendation
  ("AISA should adopt structured tech tags because ...").
- Do not use em dashes or en dashes anywhere in the output. Use commas, colons, parentheses,
  or restructure the sentence.
- Length serves usefulness, not the reverse. A tight, high-signal brief beats a long one.
