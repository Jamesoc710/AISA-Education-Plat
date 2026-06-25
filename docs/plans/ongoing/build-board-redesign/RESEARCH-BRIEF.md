# Build Board Redesign — Research Brief

> Input to the design council (Step 2). Produced by a deep-research harness (6 search
> angles, 28 sources fetched, 123 claims extracted, 25 adversarially verified at 3 votes
> each: 20 confirmed, 5 killed), then synthesized against the AISA Atlas codebase and brand.
> Confidence is high on the mechanics. The one structural caveat to hold throughout: every
> exemplar is a large public marketplace, not a small private club, so the scale-dependent
> risks (cold-start, ghost town, vanity metrics) are reasoned by analogy and inversion, not
> directly evidenced. Treat verified mechanics as solid and scale judgments as hypotheses.

---

## 1. Executive summary

1. **Do not split into separate routes.** AngelList deliberately separated its talent product
   (Wellfound) from its investing product into distinct brands and codebases, and said the
   point was to "ship faster without the overhead of sharing a brand and codebase." That paid
   off only because the two audiences (founders raising money, candidates finding jobs) truly
   diverged and the org could carry the overhead. A club's showcase audience and recruit
   audience are the same people, so separate routes is over-engineering. (verified)
2. **Refine the dual-mode into a segmented control over shared data, not true tabs and not
   routes.** Nielsen Norman supports a selector when users do not need to see both modes at
   once, which fits showing-off versus recruiting. The precise primitive is a segmented
   control that toggles two lenses on the same project objects. The assumption that the two
   sides must be rigidly parallel and mutually exclusive was refuted, so overlap is fine.
   (verified)
3. **You may not need a second mode at all.** GitHub's "good first issue" and "help wanted"
   labels let a finished, browsable project carry small standardized labels that both signal
   where newcomers can contribute and act as filterable facets. This dissolves the
   finished-versus-building binary and lets one index serve both jobs. This is the single
   highest-leverage pattern in the brief. (verified; see caveat in section 6)
4. **Kill the mailto dead-end with an in-app invite-and-accept loop.** YC Co-Founder Matching
   forms a match only when the recipient accepts an invite. Devpost's one-way "team-up" email
   (one message per person, no accept button, reply over email) is precisely the current AISA
   failure mode, and real users report being confused by it ("I reply that email. How can I
   see if we are a team?"). The load-bearing part to borrow is the accept gate, not an
   algorithmic matcher (the claim that a recommender drives discovery was refuted). (verified)
5. **Seed the cold-start with an import-existing path plus a light multi-step post form.**
   Devpost offers "Import from Portfolio" (drop in a pre-existing project as a draft) next to
   "Start Project," and structures submission as a navigable multi-step form with green-check
   progress markers (progress, not hard gates). This is the lowest-friction way to populate a
   finished-work showcase from day one. (verified)
6. **A "looking to join" directory is viable only in its cheapest form:** an opt-in "looking
   for teammates" checkbox plus one free-text intro line attached to existing member
   identities (Devpost's participants pattern), not standalone rich profiles. Kept this way,
   the directory is never emptier than your existing roster. Pair it with Wellfound's
   bidirectional principle (let project leads reach out, not just applicants apply). (verified)
7. **Avoid a popularity leaderboard in a small private club.** Product Hunt ranks by upvotes,
   comments, time, and undisclosed factors, kept opaque to resist gaming, which works at its
   scale. At club scale, upvote counts are low-signal and status-distorting. Default to
   recency, track, and status facets plus editorial curation. (verified, with scale caveat)
8. **The big unknown is scale.** All evidence is from large public platforms. Cold-start and
   ghost-town risk is the live danger and should bias the council toward lighter directions
   and an explicit seeding strategy, not toward maximal feature surface.

---

## 2. Archetype taxonomy

| Archetype | Examples | What it is great at | Risk for a club |
|---|---|---|---|
| Showcase-only | Behance, Dribbble, Figma Community | Celebrating finished work, social proof | Vanity, nothing to recruit into |
| Collaboration-only | YC matching, cofounder boards | Matching people to projects | Ghost town with no supply to show |
| Two-sided | Wellfound, Devpost | Showcase and recruit together | One side starves; IA complexity |
| Marketplace | Contra, Toptal, Wellfound jobs | Transactional, two real audiences | Overkill; AngelList-split overhead |
| Community feed | itch.io devlogs, IndieHackers milestones | Feeling alive through visible motion | Needs volume (participation inequality) |

Read for AISA: the club wants two-sided value at a scale that can only afford the
unified-index or community-feed cost of building it, not the marketplace cost. The taxonomy
argues for getting two-sided value out of one surface.

---

## 3. The two-sided question, analyzed (clear read)

The owner's instinct that the board serves two activities is correct. The evidence pushes
hard on the implementation, and partly challenges the "two parallel sides" framing:

- **Separate routes: rejected.** The AngelList split is the anti-pattern anchor. Full
  bifurcation is justified only when audiences and products genuinely diverge and you can
  absorb the overhead. Neither holds here.
- **True tabs of unrelated content: weak.** NN/G warns that tabs tax short-term memory when
  users must compare across them. Showcase and collaborate are rarely viewed at the same
  instant, so a selector is defensible, but true tabs imply two unrelated panels, which is
  not what this is.
- **Segmented control over shared data: the precise primitive.** The same project objects can
  be shown two ways (a "showing finished work" lens and a "needs collaborators" lens). Since
  overlap between the two is acceptable (the rigid-separation claim was refuted), a segmented
  control toggling lenses beats two separate inventories.
- **Or no second mode at all: the lightest reading.** Because GitHub-style "help wanted"
  labels turn any project (finished or not) into a recruitment entry, a single index with a
  status field, recruit labels, and filters can deliver both jobs. The "Collaborate" lens
  becomes, at minimum, a saved filter ("show projects with open roles").

**The read:** lean toward one unified board where a status field plus help-wanted labels plus
filtering do the work. Add a segmented-control "Collaborate" lens only if recruiting needs
more visibility than a filter gives it. Explicitly avoid separate routes and avoid a
popularity leaderboard. This keeps the flywheel intact (you show finished work, that work
carries the asks that pull in collaborators) and minimizes the cold-start surface, because
there is one board to fill, not two.

---

## 4. Pattern catalog (the core)

Each verified pattern with: job, mechanic, why it works, failure mode, crux it informs,
source.

### Help-wanted labels on browsable projects (GitHub)
- **Job:** let a finished, browsable project also say "here is where you can help."
- **Mechanic:** small standardized default labels ("good first issue," "help wanted") on
  items; they populate a contribute view and are exposed as search facets
  (`good-first-issues:>n`, `help-wanted-issues:>n`).
- **Why it works:** one object serves discovery and recruiting at once; the label is both a
  human signal and a machine filter. Dissolves the finished-versus-building binary.
- **Failure mode:** the label is a signal, not a guarantee of conversion. Academic studies
  (FSE 2020, CHASE 2021) show mixed newcomer outcomes from scoping mismatch. Borrow the
  signal, do not promise it produces collaborators.
- **Crux:** 1 (mode and IA), 2 (finished vs building), 6 (discovery facets).
- **Source:** GitHub Docs, finding ways to contribute; searching for repositories.

### Segmented control over shared content (NN/G plus segmented-control practice)
- **Job:** offer two views of the same set without fragmenting it.
- **Mechanic:** a toggle that re-lenses one underlying collection, not two separate panels.
- **Why it works:** appropriate when users do not need both at once; keeps one inventory to
  maintain and fill.
- **Failure mode:** if the two lenses show genuinely unrelated content, it should be tabs or
  routes instead; misusing it adds a hidden filter users forget is set.
- **Crux:** 1.
- **Source:** NN/G "Tabs, Used Right"; segmented-control references.

### Anti-pattern: separate brands and routes (AngelList and Wellfound)
- **Job (mis-served):** scaling two products by fully separating them.
- **Mechanic:** distinct brands, codebases, even AWS accounts.
- **Why it can work:** only when audiences and products truly diverge and the org can carry
  the overhead.
- **Failure mode for a club:** the audiences are the same people; separation is pure cost.
- **Crux:** 1 (the "separate routes" option's anchor).
- **Source:** AngelList "Reintroducing AngelList"; Wellfound rename post.

### Invite-and-accept match (YC Co-Founder Matching)
- **Job:** connect a person to a project without one-directional dead-ends.
- **Mechanic:** initiator invites or messages a profile; a match forms only if the recipient
  accepts; profiles are self-described (interests, skills, what you want to build); a weekly
  invite cap curbs spam.
- **Why it works:** the accept gate makes the connection mutual and visible to both sides.
- **Failure mode:** match quality complaints exist; a one-at-a-time swipe feed with no
  search frustrates (YC itself was building search). Provide browse and filter, not a
  dating-style single-card feed.
- **Crux:** join lifecycle, 3 (people axis).
- **Source:** YC cofounder-matching page and blog; HN discussion.

### Anti-pattern: one-way team-up email (Devpost)
- **Job (mis-served):** initiating a team.
- **Mechanic:** a one-way "team-up request" email from a participants page, one message per
  recipient, no in-app accept or decline; team formation is two-stage (email, then the leader
  manually adds the member).
- **Failure mode:** users cannot tell whether they are on a team; the reply happens in an
  inbox with no state. This is exactly today's AISA mailto dead-end.
- **Crux:** join lifecycle (the gap to design away from).
- **Source:** Devpost help article 75; user forum threads.

### Lightweight looking-to-join directory (Devpost participants, Wellfound bidirectional)
- **Job:** let members signal availability without a heavyweight profile system.
- **Mechanic:** on the existing member list, an opt-in "looking for teammates" checkbox plus
  a single free-text intro line; start a conversation when a profile interests you. Wellfound
  adds that leads can pitch members directly, not only members applying out.
- **Why it works:** attached to existing identities, so it is never emptier than the roster;
  near-zero new surface to maintain.
- **Failure mode:** at small scale even this can sit idle; keep it one opt-in flag plus one
  line, never a standalone marketplace.
- **Crux:** 3 (people axis, the lightest viable version).
- **Source:** Devpost articles 75 and 65; Wellfound candidates overview.

### Multi-step post form with progress and import-existing (Devpost)
- **Job:** capture structured project metadata without scaring off posters, and let people
  reuse work they already made.
- **Mechanic:** a navigable multi-step form (Devpost uses six: team, overview, details,
  additional, submit, proofread) with green-check progress markers that are progress, not
  gates; plus an "Import from Portfolio" path that drops a pre-existing project in as a draft.
  "Built with" tech tags double as the tech-stack facet.
- **Why it works:** chunking lowers abandonment while still collecting good metadata; import
  is the cheapest way to seed a showcase.
- **Failure mode:** too many steps or too many required fields raises abandonment; keep
  required fields minimal.
- **Crux:** 4 (posting flow), cold-start, 6 (tech-stack facet).
- **Source:** Devpost articles 122 and 126.

### Devlog update stream plus a single release-status field (itch.io)
- **Job:** show ongoing progress without burying the project's headline state.
- **Mechanic:** each update publishes to three surfaces at once (followers' feeds, a global
  cross-project devlog feed, and the project page); a dedicated devlogs section with post-type
  filters (Major Update, Postmortem, Launch, Tech Discussion). Separately, every project has
  one Release Status field with five values: Released, In development, On hold, Prototype,
  Canceled.
- **Why it works:** treats "building" as an update stream and "finished" as a headline state,
  so both coexist; the stream makes the surface feel alive.
- **Failure mode:** devlogs include finished-state posts too (Launch, Postmortem), so do not
  over-read this as erasing the finished-versus-building line; the project still has a headline
  status. Feeds also need volume to feel alive.
- **Crux:** 2 (finished vs building), cold-start.
- **Source:** itch.io devlogs announcement and live /devlogs; release-status field.

### Remix-and-fork contribution loop (Replit)
- **Job:** turn a showcase into a contribution engine without a team-formation system.
- **Mechanic:** any community app can be remixed (forked) into your own fully editable copy;
  the documented next step is to publish your enhanced version for others to remix.
- **Why it works:** asynchronous, low-moderation collaboration; works well when artifacts are
  runnable code or prototypes. Combine with help-wanted labels for an async collaboration path
  that needs no scheduling.
- **Failure mode:** only works if the work is actually forkable (code, prototypes), so it does
  not serve writing or research projects.
- **Crux:** 1 (showcase-to-recruit flywheel), an alternative to person-to-person recruiting.
- **Source:** Replit docs, remix an app.

### Opaque engagement ranking, handle with care (Product Hunt)
- **Job:** surface the most resonant work.
- **Mechanic:** a leaderboard ranked by upvotes, comments, time since posting, and undisclosed
  factors, kept opaque to resist gaming.
- **Why it works at scale:** high vote volume makes the ranking meaningful.
- **Failure mode at club scale:** low vote volume makes it noisy, gameable, and
  status-distorting. Note also that PH posting is not the low-friction open model some assume
  (that claim was refuted); treat PH as a ranking exemplar only, not a posting-flow exemplar.
- **Crux:** 7 (social signals and noise).
- **Source:** Product Hunt "how it works" and help center.

---

## 5. Posting and moderation flows (comparative plus recommended)

Friction spectrum: Show HN (a title and a link, minimal) to Reddit submit (title, body, flair)
to Devpost (rich, multi-step, structured) to Product Hunt (curated, scheduled, gated).

**Recommended for AISA:** a light multi-step form, three to four steps rather than six, with a
visible progress indicator (green checks), navigable rather than gated. Keep required fields
minimal: title, one-line blurb, and headline status. Make everything else optional (track,
tech tags, links, cover image, description, help-wanted labels). Offer an import-or-attach
path so finished work can be posted with near-zero friction (the cold-start seeder). Media
optional. For moderation, reuse the existing draft-then-approve gate rather than heavy
curation, and wire the currently-unused author field at post time so projects have an owner.

---

## 6. Finished-versus-building representation (comparative plus recommended)

itch.io's single Release Status field is the clean lifecycle model. GitHub labels are the
recruit-signal layered on top. Product Hunt's upcoming-versus-launched and IndieHackers
milestones are the "moment of shipping" celebration.

**Recommended model:** one headline status field per project, trimmed to roughly three or four
values (for example Idea, Building, Shipped, and optionally Paused). Invert today's default
away from "building" so a posted project is not assumed to be unfinished. Then layer optional
"help wanted: [role]" labels on any project regardless of status, so a Shipped project can
still recruit and a Building project can simply show progress. This is the direct fix for the
owner's "no home for finished work": finished work gets a first-class Shipped state and a
celebration surface, and recruiting becomes a label rather than the only available verb.

**Caveat to carry:** the GitHub label evidence shows the signal, not guaranteed conversion. The
council should treat labels as the right mechanic and plan a small pilot to learn whether they
convert at club scale.

---

## 7. Discovery (facets plus filter, sort, search)

- **Facets that earn their place:** status (Idea / Building / Shipped), track, "help wanted"
  (the label as a facet), and tech stack (from the "built with" tags).
- **Sort:** recency by default, with "recently shipped" as the showcase default. Avoid a
  popularity leaderboard at this scale.
- **Search:** defer in version one; the board is small and facets cover discovery. Revisit when
  the catalog grows.
- The segmented control, if used, is itself a coarse filter and should compose with the facets
  rather than fight them.

---

## 8. Visual grammar beyond cards (synthesized, not researched)

The research did not verify visual grammar (it is design judgment). Synthesized from the brand
(the editorial hairline "Standings" grammar, anti-card) and the showcase evidence (finished
work benefits from imagery; Behance is multi-image case studies, Dribbble is single hero
shots), three concrete directions:

1. **Hairline index plus one optional thumbnail.** Keep the Standings row grammar (typographic,
   hairline-divided), and allow a single small optional cover thumbnail per row, right-aligned.
   Finished work gets a visual without becoming a card grid. Most brand-safe.
2. **Editorial gallery reserved for Shipped.** A two-up or three-up image-led grid (like the
   trends page) used only for the Shipped or showcase lens, with the building and collaborate
   lens staying a hairline list. Visual richness where it is earned, restraint elsewhere.
3. **Pure-typographic index, imagery one click deep.** Keep the index entirely typographic (no
   thumbnails) and push all imagery to a Behance-style case-study detail page. The index stays
   brand-pure; richness lives on the project page.

Recommended framing for the council: weigh option 1 versus option 3 as the brand-safe poles,
with option 2 as the "let finished work shine" splurge for the Shipped lens only.

---

## 9. Social signals and quality (small private community)

- **Signals that drive contribution:** visible progress (devlog-style updates), a request loop
  that actually resolves (your "request to join" gets an accept or decline), import-existing
  (low friction to post), and clear asks (help-wanted labels). These reward contributing and
  resolving.
- **Signals that create noise:** upvote leaderboards (gaming, low-vote distortion, status
  games) and vanity counts. At a small private roster these are low-signal and distorting.
- **Recommendation:** prefer signals that reward contribution and resolution over popularity.
  Use editorial curation (a leads-chosen "featured" or "recently shipped" rail) instead of
  algorithmic ranking, which also fits the editorial brand.

---

## 10. Anti-patterns and cautionary tales

- **Ghost town.** You cannot post your way out of a dead community; emptiness is solved by
  seeded supply and real activity, not more empty rows. Cause: launching an empty catalog with
  no seeded content and no activity surface.
- **Two tabs nobody uses.** A second mode that starves because there is not enough supply for
  both sides. Cause: splitting before there is supply. Fix: one surface with a filter or label
  first, a second lens only when recruiting demand is proven.
- **Mailto dead-end.** Requests with no in-app resolution (today's board, and Devpost's email).
  Cause: no accept or decline UI and no visible state.
- **Vanity leaderboard.** Popularity ranking at low vote volume produces status games. Cause:
  engagement sorting without the scale to make it meaningful.
- **Moderation burnout.** Heavy per-post curation does not survive a volunteer team. Cause:
  gating everything. Fix: light draft-then-approve, trust members, curate by exception.
- **Participation inequality (the 90-9-1 pattern).** Most members lurk, a few contribute. Cause:
  structural and universal. Implication: design so that a small active core makes the board
  feel alive (a featured rail, a visible update stream), and do not assume broad posting.

---

## 11. Ideas to bring to the council

Five genuinely distinct directions. Each is a complete concept, mapped to the crux questions.
They are deliberately different, not variations of one idea.

### Direction A — Unified editorial index, status-led, labels for recruiting
- **Core loop:** post or import a project, set a headline status, optionally add "help wanted"
  labels; everyone browses and filters one editorial index; request to join via an in-app
  accept loop.
- **IA:** one surface, no mode split. The "help wanted" filter is the collaborate view.
- **Posting:** light multi-step form plus import-existing.
- **Finished vs building:** one status field (Idea / Building / Shipped), recruit labels on top
  of any status.
- **People axis:** none in v1 (labels carry the asks).
- **Main risk:** recruiting stays invisible if members never apply the help-wanted filter.
- **Crux fit:** 1 (one surface), 2, 4, 6, strongest brand fit (8).

### Direction B — Two-view segmented toggle (the refined dual-mode)
- **Core loop:** same projects, two lenses via a segmented control. "Showcase" sorts by recently
  shipped and leans visual; "Collaborate" filters to projects with open roles and sorts by need.
- **IA:** one surface, a segmented control over shared data (not tabs, not routes). This is the
  owner's hypothesis made precise and evidence-grounded.
- **Posting:** one form; at post time you set status and whether you are looking for
  collaborators (which surfaces it in the Collaborate lens).
- **Finished vs building:** status field plus a "looking for collaborators" flag that drives the
  Collaborate lens.
- **People axis:** optional thin "members looking to join" strip inside the Collaborate lens
  (opt-in checkbox plus one line).
- **Main risk:** the Collaborate lens can ghost-town if few projects recruit at once; the toggle
  adds slight cognitive cost.
- **Crux fit:** 1 (selector), 2, 3 (light people strip), 7.

### Direction C — Showcase-first, recruit as a signal (narrow and phased)
- **Core loop:** solve the two urgent gaps first. Build the showcase and posting; treat
  recruiting as a help-wanted label plus an in-app request that actually resolves. No people
  directory, no second mode in v1.
- **IA:** one surface, finished-work-forward.
- **Posting:** light form plus import-existing (the seeder).
- **Finished vs building:** status field; Shipped is a celebrated default, inverting today's
  "building" assumption.
- **People axis:** none in v1.
- **Main risk:** under-serves recruiting ambition; may feel like half the vision.
- **Crux fit:** the pragmatic and phasing anchor (11), lowest cold-start surface.

### Direction D — Build-in-public feed (devlog and activity-led)
- **Core loop:** the board is an activity stream. Members post updates (Started, Milestone,
  Shipped, Looking-for-help) that flow into a feed and attach to a persistent project page. The
  board feels alive through visible motion.
- **IA:** a feed (reverse-chronological updates) backed by project pages. The "two sides" become
  post types.
- **Posting:** post an update (low friction) that optionally creates or attaches to a project.
- **Finished vs building:** building is the update stream; finished is a "Shipped" milestone post
  plus the project's headline status.
- **People axis:** implicit (who is active shows in the feed).
- **Main risk:** feeds need volume to feel alive (90-9-1); a small club may not generate enough
  updates, so the feed reads as dead, the very cold-start risk. Least "editorial index" in feel.
- **Crux fit:** 2 (devlog model), 7 and 8 (alive through activity, but also at risk from it).

### Direction E — Remix gallery (contribution by forking)
- **Core loop:** showcase finished work that others can remix or fork into their own copy, plus
  help-wanted labels. Collaboration is asynchronous (fork and improve) rather than join-the-team.
- **IA:** a gallery of remixable artifacts; "collaborate" means remix or pick up a help-wanted
  label, not a people-matching system.
- **Posting:** post a runnable or forkable artifact.
- **Finished vs building:** finished and forkable is the celebrated state; building is a
  work-in-progress others can still fork.
- **People axis:** none; contribution flows through forks.
- **Main risk:** only works if the club's work is genuinely forkable (code, prototypes); does not
  serve writing or research projects.
- **Crux fit:** 1 (flywheel), an alternative collaboration model for a code-heavy club.

---

## 12. Open questions (and how to settle them)

1. **Do help-wanted labels convert newcomers at small private scale, or only signal?** Pilot
   labels on five to ten finished projects for one term and measure pick-ups. The academic
   literature shows the signal does not guarantee conversion even at public scale.
2. **Does a "looking to join" directory ghost-town at club scale, and what is the minimum active
   threshold for it to feel alive?** No source addresses private scale. Run the lightest version
   (opt-in checkbox plus one-line intro on the existing member list) for one term; measure how
   many set the flag and how many connections result.
3. **Is popularity sorting net-positive or net-toxic in a small private club?** A/B a
   recency-or-editorial default sort against an upvote leaderboard; watch for status-gaming,
   low-vote distortion, and whether contribution rises or only vanity posting does.
4. **Which two-sided IA wins for this product: a segmented control, true tabs, or separate
   routes?** Prototype the segmented-control and separate-route versions and usability-test two
   tasks (post a finished project; find a collaborator) with five to eight real members.
5. **Person-to-person team formation (YC invite-accept) or asynchronous remix-and-fork plus
   help-wanted labels (Replit plus GitHub), or both?** Map the actual artifact types members
   produce (code, writing, research) and their forkability, then pick the lighter-moderation
   path.

---

## 13. Sources (verified primary unless noted)

- GitHub Docs: finding ways to contribute; searching for repositories; labels for new
  contributors. (good first issue / help wanted)
- Nielsen Norman Group: "Tabs, Used Right." (selector IA)
- AngelList: "Reintroducing AngelList"; Wellfound: "AngelList Talent is now Wellfound." (the
  separation anti-pattern)
- Y Combinator: cofounder-matching page and blog; HN discussion 34883106. (invite-and-accept)
- Devpost Help Center: articles 75 and 65 (team formation, participants), 122 and 126
  (submission flow and steps). (posting, import, the mailto anti-pattern, the light directory)
- Wellfound: candidates overview. (bidirectional recruiting)
- itch.io: devlogs announcement and live /devlogs; release-status field. (devlog stream, status)
- Replit Docs: remix an app. (fork-and-publish loop)
- Product Hunt: "how it works" and help center. (engagement ranking, handle with care)
- Supporting on cold-start and participation: Community Manager Live "Ghost Town Myth"; NN/G
  "Participation Inequality." (blogs and primary, used for the anti-patterns section)

---

## Appendix — Claims the evidence refuted (do not argue from these)

The adversarial pass killed these five claims at 0-3 or 1-2. The council should not build on
them:

1. **Product Hunt posting is open and low-friction.** Not confirmed. Treat PH as a ranking
   exemplar only, not a posting-flow exemplar.
2. **itch.io erases the finished-versus-building binary into a continuum.** No. Projects keep a
   headline released-versus-in-development state; devlogs are progress plus milestones on top.
3. **YC discovery is driven by a matching engine rather than browse and search.** No. Borrow the
   accept gate, not an algorithmic recommender.
4. **Devpost team formation runs primarily through discussion-board threads.** No. It is the
   request-and-email flow described above.
5. **The two sides of a selector must be rigidly parallel and mutually exclusive.** No. Overlap
   is acceptable, which is what favors a segmented control over hard tabs.
