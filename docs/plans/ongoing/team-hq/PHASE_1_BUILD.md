# Team HQ Phase 1, Build Order

Companion to `TEAM_HQ_PLAN.md`. Read that first for the full rationale; this sequences the work. The registry comes first because every other step reads from it.

## Scope decision (resolved)

Phase 1 is the whole **social shell**: masthead, meeting, **The Drop**, building, roster, footer. The originally planned "Your standing this week" leaderboard is **cut**, replaced by The Drop (a member bulletin with a system trend/news auto-floor). The Drop chases the same goal (a weekly reason to return, proof the team is alive) without the leaderboard's harms (the bottom half quitting, gaming, a callout of three friends), it is a smaller and safer build, and it complements the group chat rather than competing with it. There is no Phase 1b.

## Build order

### 1. Team registry (`lib/teams.ts`) -- unblocks everything
- The typed `Team` type and the registry keyed by team slug: `tech`, `capital`, `media`, `vc`, `exec`, `events` (see the mapping table in the plan).
- Resolvers: `getTeam(slug)`, `getDoorTeams()` (member-facing AND clears the liveness gate), `isLive(team)` predicate (upcoming meeting OR roster at threshold OR at least one approved tagged project), and the slicers (`trendCategory`, `digestCategory`, concept scope from `trackId`).
- Accent tokens per team; never `#4255FF` (the editorial blue). Content-bearing teams may reuse `Track.accentColor`.
- This is pure code, no schema. Everything downstream reads it.

### 2. Schema: `TeamMembership` and The Drop tables
- Redefine the dormant `TrackMembership` to `TeamMembership(userId, teamSlug, joinedAt)`, `@@id([userId, teamSlug])`, `@@map("team_memberships")`, `teamSlug` validated against the registry in app code (no FK). Update `User.trackMemberships` to `User.teamMemberships`; drop `Track.memberships`.
- Add `TeamDrop(id, teamSlug, userId, url, title, sourceDomain, note, conceptSlug?, trendSlug?, createdAt, removedAt?)` indexed `[teamSlug, createdAt]`, and `TeamDropReaction(dropId, userId, @@id([dropId, userId]))`. The "good find" count is the reaction count per drop and is NEVER aggregated per person.
- The membership table is empty today; the drop tables are new. After the schema change: restart the dev server (HMR cannot reload `.prisma/client`), then run `npx tsx scripts/enable-rls.ts` (new public tables are exposed without it).
- `POST /api/teams/[slug]/join` writes a `TeamMembership` row for the auth user; a sibling leave route deletes it. Validate the slug against the registry; never write membership from a lens-switch.
- Seed script: backfill `TeamMembership` from `ProjectAssignment` for content-bearing teams (users assigned to `Project`s whose `trackId` matches the team scope), so a content-bearing team has an honest day-one roster.

### 3. Extract the editorial primitives
- Move `HairRule`, `SectionEyebrow`, `ArrowRight`, and the `editorial-link` style block out of `home-client.tsx` into `components/ui/editorial.tsx`. Re-import them in home (no visual change) and use them on the team page. `TypeTag` is already shared; reuse as-is.

### 4. The route plus the shell modules
- Read the relevant guide in `node_modules/next/dist/docs/` before writing the routes (this Next.js has breaking changes per `AGENTS.md`).
- `app/(main)/teams/[slug]/page.tsx`, server component, `force-dynamic`. Resolve the team from the registry; 404 (or redirect home) for an unknown slug, a `memberFacing: false` team, or a team that fails `isLive`. Set `data-surface="editorial"` and override `--color-accent` to the team accent, scoped to the page root. Center a `maxWidth: 1080` container. Separate modules with `HairRule`, head each with `SectionEyebrow`.
- Modules, rendered declaratively off the registry flags, in order:
  - **Masthead:** wordmark, mandate, member count, Join / Active state, team accent. Compact.
  - **Next team meeting:** soonest `ScheduleEvent` where `type = team.teamType` (optionally `category in [MEETING, CLASS, WORKSHOP]`), `date >= now`. Show day, `startTime` to `endTime`, `location`, title, `TypeTag`. Display only (no RSVP in v1).
  - **The Drop:** the 3 most recent items as light Brilliant-style rows (poster monogram, headline link, source domain, the one-line take, relative time, a single "good find" reaction). A "+ drop something" composer (paste url, title, take; instant post; lead soft-remove). A "see all" link to `/teams/[slug]/drops` (the full reverse-chron board). Auto-floor: fill any of the 3 slots not taken by member drops with system items (top published `Trend` in `team.trendCategory`, latest `DigestEdition` top item in `team.digestCategory`), tagged RADAR. Zero drops shows up to 3 system items plus "be the first to drop something this week". A team with no trend/digest category renders member-only with a plain "be the first" empty state.
  - **What we are building:** approved `Project`s where `trackId = team.trackId`, as Brilliant-style bordered card rows, each with the existing request-to-join hook. Recruiting empty state when none.
  - **Roster:** `TeamMembership` members as monogram (initials) plus name plus an "active this week" dot (a `QuizAttempt` within 7 days on the team's concepts, or a recent `TeamDrop`). No photos in v1 (no `User` avatar field). Brilliant-style rows.
  - **Footer utility links:** resume learning, full curriculum, full calendar. The demoted home-repeats.
- Per-module recruiting empty states, in the team accent, for thin-but-live teams.

### 5. Rename plus switcher rewire
- Relabel "track" to "team" in the copy of `sidebar.tsx` (TrackNavButton), `browse-client.tsx` (TrackSwitcher), and `build-post-dialog.tsx` (TrackChip). Keep the `Track` model, the `tco-track` cookie, and `lib/track.ts` internal names.
- The switcher lists only door-clearing, member-facing teams and links each to `/teams/[slug]`.
- On a team page, offer "set as your active lens", which calls the existing `POST /api/track { slug: trackId }`. Setting the lens is not joining.

## Phase 1 acceptance test
A member opens `/teams/capital`: the masthead is in the Capital green, the next CAPITAL_TEAM meeting shows time and place, The Drop shows recent member posts (or, when quiet, the top Capital trend and markets story as the auto-floor) with a working "+ drop something", the team's approved projects render as rows with a join hook, and the roster is seeded from project assignments with an "active" dot. They post a drop and it appears at the top; they tap "good find" on another and the count rises by one with no per-person score anywhere. They click Join and appear in the roster on refresh. The footer links reach resume-learning and the full calendar. A doorless team (field-guides) 404s and is absent from the switcher.

## Constraints (do not violate)
- No em dashes or en dashes anywhere, including UI copy.
- Reactions on The Drop are per-drop only and never aggregated into a per-person score or a top-contributor view.
- CSS-variable tokens only (lint:tokens), no magic numbers; the team accent is scoped to the page root and is never `#4255FF`.
- Reuse primitives; the only genuinely new primitives are the registry, the team route, and The Drop.
- After any Prisma schema change: restart the dev server, then run `npx tsx scripts/enable-rls.ts` for the new tables.
- Run aisa-atlas on port 3100 (3000 is a different project); verify the title says "AISA Atlas".
- Read `node_modules/next/dist/docs/` before writing the new routes.
