# Team HQ Council: Transcript and Resolved Debates

The design council that produced this plan. Five seats with genuinely opposed viewpoints, a position round and a rebuttal round, and a synthesizing chair. Workflow run `wf_7cc3f70f-a54` (11 agents, claude-opus-4-8). The verbatim per-seat output was captured in the session workflow transcript; this doc preserves the decisions and each seat's stance, normalized to the repo no-dash convention.

## The five seats

- **Learning and Engagement Lead** -> the weekly loop and what makes a member return.
- **Information Architect / Systems** -> coherence, cost, the mapping layer, membership, navigation, not duplicating home.
- **Editorial / Visual Designer** -> how the page looks and feels the instant you land.
- **Red-team Skeptic** -> the strongest case against building it at all.
- **17-year-old TCO member (Capital Markets)** -> the actual customer.

## The six resolved debates

**1. Build a Team HQ at all, or just give tracks a URL and fix the two bugs?**
The Skeptic argued the page solves neither real bug: the invisible switch is a feedback bug fixable with a URL plus a toast, and empty tracks are a content bug no layout dissolves. Everyone else argued the social and activity axis (meeting, roster, standing, shipping) is real value home structurally cannot show.
Resolution: build it, but gated. The Skeptic's two fixes are folded in, not discarded: the URL becomes `/teams/[slug]`, and the empty-content problem becomes a hard liveness gate. Every me-axis module is cut or demoted, which is the Skeptic's discipline applied to the build rather than against it.

**2. Individual rank versus collective standing.**
Engagement and the member insisted rank against teammates ("#3 of 9, 2 behind Maya") is the addictive return hook and that a collective fraction is a gross report card. The Skeptic warned a public ranking of about nine in-person friends on 42 terms is a footgun: trivially gamed, and the bottom half quits the page. The IA wanted it gated by cohort size; Editorial wanted one line, not a panel.
Resolution: rank-forward but self-relative, not a public gradebook. Show the viewer their own position and the chase to the person just ahead, plus a movers celebration, as one bold line. Window it to this week to blunt gaming and reset the bottom half, and gate the ranked framing behind a cohort-size threshold with a collective fallback below it.

**3. What is the team, the tracks table or the calendar taxonomy?**
The tracks row (ai, capital-markets, field-guides) is a content split; the calendar types (TECH_TEAM, CAPITAL_TEAM, MEDIA_TEAM, EXEC) are a team split that matches the vision better. The Skeptic called the IA's mapping layer hand-maintained glue that silently breaks.
Resolution: a typed code registry keyed by team slug, with the calendar `teamType` as the spine and `trackId` as one optional content-scope attribute. The glue already exists as undocumented scattered filters; collapsing it into one typed object makes it fail loud (compile error) or stay quiet (render nothing), never half-render. Adopted unanimously in round two. The tracks table is not the team unit.

**4. Activate membership now, and how to seed the roster?**
Options: auto-join on lens-switch (cheap but fills the roster with tourists), an intentional Join (honest but empty at launch), or derive from meeting attendance (real but partial). Faking it was universally rejected as trust-killing.
Resolution: activate now. Intentional Join writes the row, and seed the initial roster from real belonging data so it is populated day one. Reject auto-join on switch: reading content is not belonging. (Plan correction: attendance has no data source in the schema, so the honest seed is `ProjectAssignment`, not attendance.)

**5. Empty teams: hide them or show a recruiting state?**
The Skeptic wanted empty teams to render nothing and have no door. The IA, Editorial, and the member wanted the same template with a recruiting empty state in the team accent.
Resolution: a liveness gate reconciles both. No meeting and no members and no projects means no door and absence from the switcher. A team that clears the gate but is thin renders the same template with recruiting empty states in its accent. field-guides clears nothing, so it never becomes an HQ.

**6. Lead with the masthead (feel) or with meeting plus standing (function)?**
Editorial argued the feel is the function: facelessness is fixed in the first half-second by color and a wordmark, so the masthead is the hero. Engagement argued identity frames but does not hook, so lead with the action loop.
Resolution: both, ordered deliberately. A compact masthead sits at the top as the visual frame, lean enough that it does not push the action below the fold. Directly beneath, the meeting and standing are the boldest action modules. Identity frames; the loop hooks.

## Each seat, in brief

**Learning and Engagement.** A team is a weekly-action cockpit, not a second magazine; a page earns its place only if a member leaves having practiced, researched, or shipped. Lead with the meeting and standing loop. Conceded in rebuttal: the IA's registry beats keying off the tracks table, and the student's framing of standing (lead with the chase, never the fraction) is right. Held the line that standing on a real roster is the load-bearing return hook.

**Information Architect / Systems.** The team is the calendar taxonomy, not the tracks table; one typed registry is the team definition, with content scope as one optional attribute. Give it a real URL. Conceded: an empty HQ is worse than none (adopted the gate), and auto-join on switch was his own bad idea, retracted (it conflates reading with belonging). Died on: drop the word "track"; the noun is the reframe.

**Editorial / Visual Designer.** A track is a place with a face; the decisive move is visual, not data: home is always blue, a team page is never blue, with the accent on eyebrows, hairline, and wordmark. Conceded: standing is a stronger hook than credited and moves up, but as one bold social line, never a mastery panel. Held: you cannot fix facelessness with more modules; the masthead is the hero.

**Red-team Skeptic.** Do not build it; give tracks a URL and fix the two bugs, because "track equals team" only works for the one example (Capital) and most teams are empty at launch. Conceded three things: the calendar is the right spine (which sharpens the critique that the tracks row is the wrong unit), auto-join makes membership near-free, and a roster of real faces is something home cannot show (withdrew "roster is theater"). Died on: the liveness gate (earn the door) and killing individual ranking in favor of collective standing.

**17-year-old member.** It is my team, not a filter; call it that, give it a URL I can text a friend, and put people on it or it is home in a jersey. Conceded: do not hide empty teams, recruit on them (the IA's empty state), but only when a real next meeting is on the calendar; and do not fully fake the roster (seed from who is real). Died on: standing must be a rank against my actual teammates, and give my team its own color. The rule he set that the whole council adopted: if it is about me, it is home; if it is about us, it is here.

## Postscript: standing was cut

Debate 2 above was the council's sharpest fight, and it produced a careful compromise: a self-relative, this-week, cohort-gated leaderboard. After the council, the lead made a cleaner call and **cut standing entirely**, replacing the slot with **The Drop**, a team bulletin where members post interesting links from the team's world with a one-line take (with a system trend/news auto-floor so it is never empty). The Drop delivers the same goal the leaderboard was chasing (a weekly reason to return, proof the team is alive) without any of the risks debate 2 was trying to manage: the currency is taste and contribution rather than rank, so there is no bottom half to quit, nothing to game, and no public callout of three friends. It also complements the group chat (durable, curated, domain-scoped) rather than rebuilding a worse chat. This transcript is preserved as the record of why a leaderboard is dangerous in a small in-person club. See `TEAM_HQ_PLAN.md` for The Drop spec.
