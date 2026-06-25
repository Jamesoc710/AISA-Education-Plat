# Build Board Redesign — Prompt Kit

A two-step process to produce a full redesign plan for the AISA Atlas Build Board (`/build`).

## Step 1 — Research (`01-research-prompt.md`)

Run this first. It produces a grounded research brief: a catalog of how comparable
platforms handle project showcases, team formation, dual-mode boards, posting flows,
and finished-versus-building work, ending in an "ideas to bring to the council" options
menu. Best run with the deep-research skill, or a research agent with web access.

Output: a structured research brief. Save it next to these files as `RESEARCH-BRIEF.md`.

## Step 2 — Council (`02-council-prompt.md`)

Run this second, feeding it the research brief from Step 1. It sets up a six-seat design
council with genuinely opposed viewpoints, a structured debate protocol, and a synthesizer
that resolves each crux question and writes the final redesign plan. Designed to run as a
real multi-agent debate (one agent per seat plus a moderator), which Claude can orchestrate.

Output: a complete, phased redesign plan, filed in `docs/plans/ongoing/`.

## Why this order

The council debates better when it has real alternatives instead of inventing them on the
fly. Step 1 hands Step 2 a menu of proven patterns and named tradeoffs, so the debate is
about which direction fits AISA Atlas, not about brainstorming from a blank page.

## Grounding (true as of the kit being written)

The board today: `/build` index plus `/build/[slug]` detail. A single-column list of
bordered rows (the "Brilliant card" aesthetic), inline-styled on the light card surface,
not the editorial surface. Seed-script only: there is no member posting flow anywhere, and
the `Project.createdById` relation exists but is never populated. It is biased toward
unfinished work (default stage `building`, the primary action is always "Request to join",
the `lookingFor` tags are prominent, and there is no "completed" view or filter). Join
requests are one-directional and dead-end in a moderator `mailto:` inbox with no
accept, decline, or add-to-team action. No filtering, sorting, search, or tabs. A second
"Opportunities" tab was designed but paused pending an org decision.
