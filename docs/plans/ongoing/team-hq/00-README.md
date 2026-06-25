# Team HQ (Tracks become Teams)

Turning the inert "track" buttons into a real destination: a per-team HQ page at `/teams/[slug]` that owns the team, social, and activity dimension home cannot. Produced audit-first, then debated by a multi-agent council, then hardened against the live schema.

## How this was produced

1. **Codebase audit.** Three parallel read-only sweeps mapped the tracks feature as it exists, the home layout the page would mirror, and the four feeder features (calendar, practice, trends, digest) plus whether each is filterable by team.
2. **Council.** A 5-seat design council (Learning and Engagement, Information Architect, Editorial Designer, Red-team Skeptic, and a 17-year-old TCO member) debated look, feel, and work across a position round and a rebuttal round, with a synthesizing chair (workflow run wf_7cc3f70f-a54). Full transcript in `COUNCIL.md`.
3. **Hardening.** The synthesis was checked against `prisma/schema.prisma`. Three council assumptions referenced data that does not exist and were corrected in the plan: roster seeding from meeting attendance (no attendance model), "who is going" on the meeting card (no RSVP model), and roster photos (no `User` avatar field).

## The four decisions, at a glance

- **A track is a team you belong to,** surfaced at `/teams/[slug]`. The user-facing noun becomes "team."
- **The team is the calendar `teamType` spine, not the tracks table,** reconciled through one typed code registry (`lib/teams.ts`) where `trackId` is an optional content scope. Tracks stay a content split; teams are the superset.
- **Membership is activated for real, keyed by team slug** (the empty `TrackMembership` table is redefined as `TeamMembership`). Join is intentional; the content-lens cookie stays decoupled.
- **Empty teams are gated, not faked.** A liveness gate gives a door only to teams with a meeting, members, or a project. field-guides and a pre-funding VC get no HQ.

The anti-duplication rule that keeps this from being a second home, from the student seat and adopted by all: **if it is about me alone it is home; if it is about us it is here.**

## The page

Five modules plus a footer: Team masthead, Next team meeting, **The Drop**, What we are building, Roster, plus demoted footer links. The Drop is a team bulletin where members post interesting links from the team's world with a one-line take, blended with a system trend/news auto-floor so it is never blank. It replaces the originally planned "Your standing this week" leaderboard, which was cut: a bulletin drives the same weekly return and proof-of-life without the ranking harms (the bottom half quitting, gaming, a callout of three friends), and it complements the group chat instead of competing with it. The whole shell ships in Phase 1; there is no Phase 1b.

## Docs in this folder

| Doc | What it is |
| --- | --- |
| `TEAM_HQ_PLAN.md` | The full resolved plan: registry, navigation, membership, liveness gate, page-by-page modules, phase-tagged data model, reuse plan, dissent, grounding. |
| `PHASE_1_BUILD.md` | The sequenced build order for the v1 shell plus the Phase 1b standing fast-follow, with the acceptance test and constraints. |
| `COUNCIL.md` | The preserved council transcript: the five positions, the five rebuttals, and the chair's resolved debates. |

## Status
Resolved and buildable. Not started. When the build begins, this folder stays in `ongoing/`; when it ships, move to `complete/` with the shipped state noted at the top.
