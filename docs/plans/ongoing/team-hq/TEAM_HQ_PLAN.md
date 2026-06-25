# Team HQ (Tracks become Teams): Final Plan

Prepared for engineering and design. Status: resolved and buildable. Produced by an 11-agent design council (5 seats, position plus rebuttal rounds, one synthesizing chair; run wf_7cc3f70f-a54), then stress-tested against the live schema. Every council assumption that the schema could not support was corrected here, not appended. One post-council product change: the standing leaderboard was cut in favor of **The Drop**, a team bulletin (see the Layout section). See `COUNCIL.md` for the full debate transcript and `00-README.md` for how this was produced.

No em dashes or en dashes appear anywhere in this document, including proposed UI copy.

---

## EXECUTIVE SUMMARY

1. A "track" becomes a **team you belong to**, surfaced as its own destination page (the team's HQ) at `/teams/[slug]`. It is decisively not a content filter and not an identity badge. The content-filter behavior survives underneath as a silent "active lens," but the user-facing object is a team.

2. The page earns its existence on the one axis home structurally cannot own: **us, not me.** Home already personalizes the solo loop by active track (continue learning, weakest concept), so any module that is about the viewer alone is home's and gets cut or demoted to a footer link. The governing rule, from the student seat and adopted by the whole council: **if it is about me alone it is home; if it is about us it is here.**

3. The team is **not** the `tracks` table. The `tracks` row (ai, capital-markets, field-guides) is a content scope. The calendar's `ScheduleEvent.type` taxonomy (TECH_TEAM, CAPITAL_TEAM, MEDIA_TEAM, EXEC) is the real team spine and matches the club's tech / capital / VC vision. The two reconcile through ONE typed code **team registry** keyed by team slug, with `teamType` as the spine and `trackId` as an optional content-scope attribute. This registry is the single new dependency everything else needs.

4. Membership is **activated for real**, but it keys on **team slug, not track id**, because content-less teams (Media) have rosters too. The dormant `TrackMembership` table is empty, so it is redefined as `TeamMembership(userId, teamSlug)` at near-zero cost.

5. Empty teams are handled by a **liveness gate**, not a "coming soon" banner. A team gets a door (a page plus a switcher entry) only if it has an upcoming meeting OR a roster at or above a threshold OR at least one tagged project. field-guides and a pre-funding VC clear nothing, so they get no HQ. This turns the strongest objection (most teams are empty at launch) into a render condition.

6. The page is **five modules plus a footer**, in order: Team masthead, Next team meeting, The Drop, What we are building, Roster, plus demoted footer links. **The Drop** is a team bulletin where members post interesting links from the team's world with a one-line take; it absorbs the old Domain briefing as an **auto-floor**, so system trend and news items fill any empty slots and it is never blank. It **replaces the originally planned "Your standing this week" leaderboard, which is cut**: a member bulletin drives the same weekly return and the same proof-of-life without the ranking harms (the bottom half quitting, gaming, and a public callout of three friends in a small cohort), and it complements the group chat instead of competing with it.

7. The look is **distinct from home by one decisive move:** home is always Quizlet blue (`#4255FF`); a team page is **never blue**. The team accent recolors only the eyebrows, the top hairline, and active ticks. Same Hanken, same hairlines, same 1080px editorial grid, so it reads as the same craft in a different room.

8. The user-facing noun becomes **team**, not track, everywhere (switcher, sidebar, build dialog). The `Track` model and the `tco-track` cookie keep their internal names to avoid a migration; the registry bridges the vocabulary. The rename is copy-only in v1.

9. Three council assumptions were corrected against the schema and are reflected throughout: there is **no attendance or RSVP data** anywhere (so the roster cannot seed from attendance and the meeting card cannot show "who is going" in v1), and `User` has **no avatar field** (so the roster shows monograms, not photos, in v1). The honest data that does exist is used instead.

---

## WHAT A TEAM IS (and the me/us rule)

A team is the unit a member belongs to and returns to weekly. The HQ page must answer two questions on sight: "what is my team into right now?" and "what are we doing this week?" If a module answers neither, it belongs to home.

This is the complete and literal anti-duplication strategy, and it is enforced as a hard gate at design and review time:

**THE ME-VS-US TEST, applied to every module before it ships:** does this involve other people or our shared attention? If no, it is home's job, and it is cut or demoted to a quiet footer link. This is exactly why resume-learning, the personal mastery snapshot, and the curriculum map all leave the main flow. Home stays the solo daily driver. The HQ owns the meeting, the roster, the shared radar (The Drop), and the shipping.

The second half of "distinct from home" is visual and is in the Layout section: never blue.

---

## THE TEAM REGISTRY (the central plumbing)

Every feature names the same domain differently, and there is no shared key today: the content scope is `capital-markets` (track), the calendar team is `CAPITAL_TEAM`, trends say `Capital`, the digest says `markets`, and concept slugs are prefixed `cm-`. These ad-hoc mappings already exist as undocumented filters scattered across browse, quiz, trends, and digest. The registry collapses them into one typed object so they fail loud (a missing required field is a compile error) or stay quiet (a missing optional field renders nothing), never half-render.

**`lib/teams.ts` exports a typed registry keyed by team slug.** One entry per team:

```
type Team = {
  slug: string;            // URL + membership key, e.g. "capital"
  displayName: string;     // "Capital Markets"
  mandate: string;         // one-line "what we do"
  teamType: string;        // calendar spine: TECH_TEAM | CAPITAL_TEAM | MEDIA_TEAM | ...
  trackId?: string;        // OPTIONAL content scope -> Track.slug (ai | capital-markets)
  trendCategory?: string;  // "AI" | "Tech" | "Capital"  -> feeds The Drop auto-floor
  digestCategory?: string; // "ai" | "tech" | "markets"  -> feeds The Drop auto-floor
  conceptPrefix?: string;  // "cm-" etc., for sub-topic reads
  accent: string;          // team color; NEVER #4255FF (the editorial blue)
  wordmark?: string;       // optional mark for the masthead
  flags: {
    forming: boolean;      // pre-launch; door only once it clears the liveness gate
    memberFacing: boolean; // false for EXEC / EVENTS (ops teams, never a joinable HQ)
  };
};
```

**Concrete v1 mapping:**

| Team slug | displayName | teamType | trackId | trend | digest | conceptPrefix | accent | renders |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `tech` | Tech | TECH_TEAM | `ai` | Tech/AI | tech/ai | (ai slugs) | indigo | full HQ; The Drop with trend/news floor; Practice CTA |
| `capital` | Capital Markets | CAPITAL_TEAM | `capital-markets` | Capital | markets | `cm-` | green `#16A34A` | full HQ; The Drop with trend/news floor; Practice CTA |
| `media` | Media | MEDIA_TEAM | none | none | none | none | (own accent) | meeting, roster, The Drop (member-only, no floor) |
| `vc` | Venture | (none yet) | none | Capital | markets | none | (own accent) | forming: doorless until a first meeting exists |
| `exec`, `events` | (ops) | EXEC / EVENTS | none | none | none | none | n/a | `memberFacing: false`, not joinable HQs |

Modules render **declaratively off the registry**: a team with no `trackId` renders no Practice CTA and no curriculum link; a team with no `trendCategory` and no `digestCategory` renders The Drop member-only (no system floor). This is what makes the design generalize to Tech, Media, VC, and future teams instead of overfitting Capital. A new team is one registry entry plus a calendar color, with no new code.

The registry also carries the **identity tokens** (accent, wordmark, mandate). The mapping everyone needs IS the identity layer; there is no separate plumbing for the team's face.

Accent fallback: a content-bearing team may reuse its `Track.accentColor` (capital-markets is already green `#16A34A`, echoing CAPITAL_TEAM); teams without a track carry their accent in the registry directly.

---

## NAVIGATION AND THE RENAME (resolved)

**Every qualifying team gets its own URL: `/teams/[slug]`.** The core complaint ("the buttons do nothing") is unfixable without an address. A team today cannot be bookmarked, linked, or reached with the back button, so it is a setting, not a place. A link a member can paste in the group chat ("we are on Capital, look here") is the single strongest acquisition and habit hook on the platform and doubles as the team's most permanent identity.

- The route reads the team from the registry by slug. Unknown slug, a `memberFacing: false` team, or a team that fails the liveness gate returns 404 (or redirects home).
- Visiting `/teams/[slug]` may offer to set that team as the viewer's active content lens. That action reuses the existing `POST /api/track { slug: trackId }` and sets the `tco-track` cookie. **Setting the lens is not joining.** The cookie and `TeamMembership` are fully decoupled.
- The `tco-track` cookie survives only as the silent content lens for browse, quiz, and home. It stops being a navigation mechanism.

**Drop the user-facing word "track." Call it "team" everywhere:** the switcher, the sidebar, and the build dialog. The calendar already speaks TECH_TEAM and CAPITAL_TEAM, so the noun is part of the reframe. The `Track` model, the `tco-track` cookie, and `lib/track.ts` keep their internal names to avoid a migration; the registry bridges old name to new noun. In v1 the rename is copy-only.

---

## MEMBERSHIP (activated, keyed by team)

Activate the dormant membership model now, minimally but for real. Faking a roster destroys trust, and the student seat said he will clock a fake instantly. But it must key on **team slug, not track id**, because content-less teams (Media) have rosters and cannot carry a `TrackMembership.trackId`. This is the one place the council's "TrackMembership as-is is enough" was wrong: a trackId-keyed membership strands every team without a content scope.

**The dormant `TrackMembership` table is empty (never read or written anywhere), so redefine it as `TeamMembership`:**

```
model TeamMembership {
  userId   String
  teamSlug String   // validated against the registry in app code; no FK (teams live in code)
  joinedAt DateTime @default(now())
  user     User     @relation(fields: [userId], references: [id])
  @@id([userId, teamSlug])
  @@map("team_memberships")
}
```

This is a rename-plus-rekey on an empty table: near-zero migration cost. It replaces `User.trackMemberships` with `User.teamMemberships` and drops the unused `Track.memberships` relation.

**How belonging is written and seeded:**
- An intentional **Join this team** button writes a `TeamMembership` row. This models belonging honestly and supports many teams per user.
- **Seed the day-one roster from real belonging data that exists today:** the union of (existing `TeamMembership` rows) and (`ProjectAssignment` users on `Project`s whose `trackId` matches the team's content scope). Seeded project teams already carry real `ProjectAssignment` rows, so a content-bearing team is populated on day one with honest data, not invented names.
- **Correction to the council:** the council proposed seeding from meeting attendance. There is no attendance or RSVP model anywhere in the schema, and `ScheduleEvent` has no attendance field, so that seed source does not exist. ProjectAssignment is the honest substitute.
- **Reject auto-join on lens-switch.** Reading a team's content is not belonging, and writing membership on switch would flood the roster with tourists. The lens cookie stays fully decoupled from `TeamMembership`. This decoupling must be airtight; an accidental write-on-switch reintroduces the exact problem the council rejected.

Membership is the hard dependency under the Roster and the masthead Join state. Without it the HQ is "home in a jersey." No new Club or Team table is needed; the code registry plus `TeamMembership` is enough.

---

## THE LIVENESS GATE (empty teams)

An empty HQ is worse than no HQ: it quietly tells a member the team is dead. So a team earns a door only when it clears a liveness bar. The gate reconciles the two camps (hide empty teams vs show a recruiting state) by tier:

- **No door at all** (absent from the switcher, 404 on the URL): a team with no upcoming meeting AND no members AND no tagged project. `field-guides` (no `teamType`, no meeting, no roster) and a pre-funding `vc` with nothing scheduled clear nothing and get no HQ.
- **A door, with recruiting empty states:** a team that clears the gate but is thin (a forming VC the moment a first meeting hits the calendar) renders the same template, with per-module recruiting copy in the team accent ("This team is forming, next meeting Tue", "Be the first to build here"). A face on an empty room still reads as a room.
- **A full HQ:** Capital and Tech, which have meetings, projects, and content.

**Gate signals, all real today:**
- upcoming meeting: `ScheduleEvent` where `type = team.teamType` and `date >= now`.
- roster at or above threshold: `TeamMembership` count plus ProjectAssignment-derived members.
- at least one tagged project: `Project` where `trackId = team.trackId` and `status = "approved"`.

VC and other forming teams go live automatically the moment they clear the gate (a first meeting on the calendar), with no new code, because rendering is declarative off the registry.

---

## PAGE-BY-PAGE LAYOUT

**Shell.** `app/(main)/teams/[slug]/page.tsx`, a server component, `force-dynamic`. It already inherits `data-theme="light"` from `MainShell`. The page root sets `data-surface="editorial"` and overrides `--color-accent` to the team accent (scoped to the page root, never the editorial `#4255FF`). Content sits in a `maxWidth: 1080` centered container mirroring home. Modules are separated by `HairRule`, each headed by a `SectionEyebrow`, links use the `editorial-link` class plus `ArrowRight`.

**Primitive reuse note:** `HairRule`, `SectionEyebrow`, `ArrowRight`, and the `editorial-link` style block are currently local, non-exported copies inside `home-client.tsx` (re-declared on every editorial surface). This is the third-plus surface to need them, so extract them once into `components/ui/editorial.tsx` and import from there on the team page (and opportunistically from home). `TypeTag` is already shared at `components/ui/type-tag.tsx` and is reused as-is for the meeting type chip.

The list modules (The Drop, What we are building, Roster) render as **Brilliant-style bordered card rows** (the validated grouped-list aesthetic: bordered rows, ~18px titles, a preview line) for deliberate contrast against home's boxless type. That contrast is itself a signal of "not home."

### Module order and spec

| # | Module | Shows | New vs home | v1 | Cost |
| --- | --- | --- | --- | --- | --- |
| 1 | Team masthead | Wordmark, one-line mandate, real member count, Join / Active state, in the team accent. Compact frame, not a tall hero. | Yes | Yes | small |
| 2 | Next team meeting | The team's next event: day, time, place. Display only in v1. | Yes | Yes | small |
| 3 | The Drop | Team bulletin: members post a link plus a one-line take; blended with a system trend/news auto-floor so it is never blank. | Yes | Yes | small |
| 4 | What we are building | Approved Build Board projects tagged to the team, as card rows, each with a join hook. | Yes | Yes | small |
| 5 | Roster | Teammate names with a monogram and an "active this week" dot. | Yes | Yes | build |
| -- | Footer utility links | Resume learning, the full curriculum, the full calendar. The demoted home-repeats. | No | Yes | free |
| -- | Live activity feed | "Maya mastered 5 terms / new project posted." The Drop is the v1 pulse; this is deferred. | Yes | Phase 2 | build |

**1. Team masthead.** Identity frames the page before a word is read: accent plus wordmark plus mandate plus member count plus Join state. It is lean and does not push the action below the fold. Data: registry (displayName, mandate, accent, wordmark) plus `TeamMembership` count.

**2. Next team meeting.** The heartbeat and the top reason to open the page. The next upcoming `ScheduleEvent` where `type = team.teamType` (optionally filtered to `category in [MEETING, CLASS, WORKSHOP]`), soonest first. `ScheduleEvent` carries `date`, `startTime` ("17:00"), `endTime`, `location` ("Lillis 132"), and `title`, so the card is fully buildable today. Reuse `TypeTag` for the team chip. **Correction:** the council wanted "who is going" plus an RSVP tap here; there is no RSVP or attendance data, so v1 is display only. RSVP is Phase 2 (needs a new `EventRSVP` model).

**3. The Drop.** The team's shared radar and the weekly return hook. Members post interesting links from the team's world (a story, a chart, a deal, a tool) with one required one-line take. The take is the value: it turns a link dump into a recommendation from someone you know, so the post prompt is casual ("what's the take?"), not academic. The module shows the 3 most recent items as light card rows (poster monogram, the headline as the link, source domain, the take, relative time, and a single "good find" reaction), a "+ drop something" action, and a "see all" link to the team's full board at `/teams/[slug]/drops`, the durable archive a group chat cannot keep.

The Drop **absorbs the old Domain briefing as an auto-floor.** The module always fills up to 3 slots: recent member drops first, then any remaining slots are filled with system items (the top published `Trend` in `team.trendCategory` and the latest `DigestEdition` top item in `team.digestCategory`), tagged visually as RADAR rather than attributed to a member. So zero member activity shows up to 3 system items plus a "be the first to drop something this week" nudge; one member drop shows it plus two system items; three member drops show all three. It is never blank, and the trend/digest plumbing in the registry is still used, now feeding the floor instead of a separate module. A team with neither `trendCategory` nor `digestCategory` (Media) renders The Drop member-only, with a plain "be the first" empty state and no floor.

**Why The Drop and not the standing leaderboard.** A per-person leaderboard ("you are #3, 2 behind Maya") was the originally planned module in this slot and is CUT. The bulletin chases the same goal (a weekly reason to return, proof the team is alive) but the currency is taste and contribution rather than rank, so it carries none of the leaderboard harms: nobody is at the bottom, there is nothing to game, and there is no public callout of three friends in a small cohort. It is a smaller, safer build, and it complements the group chat (durable, curated, domain-scoped) instead of competing with it (fast, ephemeral, everything). Reaction guard, load-bearing: the "good find" tap is **per-drop only and is never summed into a per-person total or any top-contributor view.** That guard is what stops a leaderboard from sneaking back in through reactions.

A nice flywheel, optional: a lead (or the weekly Digest) can graduate a standout member drop into the official Digest as "a member spotted this," rewarding good taste with visibility instead of points and feeding the content pipeline from the bottom up.

Data: a new `TeamDrop` table plus a `TeamDropReaction` table (below) for member posts and reactions; `Trend` and `DigestEdition` for the floor. In v1 the poster pastes the link, title, and take (no server-side OG scrape; auto-fetching the title is a later nicety). Drops post instantly (a known 30-person club), with a lead soft-remove (`removedAt`), not a heavy approve queue that would kill the casual feel.

**4. What we are building.** The ship dimension, and a contribution path for members who do not love quizzes. Approved `Project`s where `trackId = team.trackId`, as Brilliant-style card rows, each with a "join this" hook reusing the Build Board's request-to-join flow. Home has nothing like this. (Teams with no `trackId` render a recruiting empty state here.)

**5. Roster.** Pure belonging plus quiet accountability. "No people, no page." Data: `TeamMembership` (seeded from ProjectAssignment as above) for the members; an "active this week" dot from a recent `QuizAttempt` (attemptedAt within 7 days) on the team's concepts, or a recent `TeamDrop`. **Correction:** `User` has no avatar field, so v1 shows a **monogram** (initials) plus name plus dot, not a photo. Real photos are Phase 2 (a `User.avatarUrl` field or the Supabase auth `avatar_url`).

**Footer utility links.** Everything that merely repeats home, pulled out of the main flow into one quiet row: "Resume learning" (the existing track-scoped continue-learning), "See the full curriculum", "See the full calendar". This is where the me-vs-us test sends the cut modules. `distinct_from_home: false` by design.

**Cut: Your standing this week.** A per-person leaderboard was planned for slot 3 and is removed in favor of The Drop. If a gentle progress signal is ever wanted later, prefer a collective, this-week, movers-only line ("the team mastered 14 terms this week") over any ranking, and keep it opt-in. A per-person leaderboard is explicitly out of every committed phase. The COUNCIL.md transcript preserves the original standing debate.

---

## DATA-MODEL DELTA (phase-tagged)

**Phase 1 (the shell):**
- Redefine the dormant `TrackMembership` to `TeamMembership(userId, teamSlug, joinedAt)`, keyed by team slug, `teamSlug` validated against the registry in app code (no FK). Empty table, trivial migration. Updates `User.trackMemberships` to `User.teamMemberships`; drops `Track.memberships`.
- Add `TeamDrop` and `TeamDropReaction` for The Drop:

```
model TeamDrop {
  id           String    @id @default(cuid())
  teamSlug     String    // validated against the registry
  userId       String
  url          String
  title        String    // headline; pasted in v1, OG auto-fetch is a later nicety
  sourceDomain String
  note         String    // the required one-line take
  conceptSlug  String?   // optional soft link to the curriculum
  trendSlug    String?   // optional soft link to a trend
  createdAt    DateTime  @default(now())
  removedAt    DateTime? // lead soft-remove; no hard delete
  user         User      @relation(fields: [userId], references: [id])
  reactions    TeamDropReaction[]
  @@index([teamSlug, createdAt])
  @@map("team_drops")
}

model TeamDropReaction {
  dropId String
  userId String
  drop   TeamDrop @relation(fields: [dropId], references: [id], onDelete: Cascade)
  user   User     @relation(fields: [userId], references: [id])
  @@id([dropId, userId])
  @@map("team_drop_reactions")
}
```

  The "good find" count is `reactions.length` per drop and is NEVER aggregated across a user. No other schema change: meeting (`ScheduleEvent`), projects (`Project.trackId`), trends (`Trend.category`), digest (`DigestEdition.items`), and the masthead count all read existing models.

**Phase 2:**
- `EventRSVP(userId, eventId, status)` for "who is going" plus the RSVP tap on the meeting card.
- `User.avatarUrl String?` (or read Supabase `avatar_url`) for real roster photos.
- The Live activity feed (aggregate of practice events, project posts, drops, and meeting recaps). The Drop is the v1 social pulse, so this is a deferred enrichment, not load-bearing.
- Real join and resolution notifications; OG auto-fetch for drop titles; graduate-a-drop-into-the-Digest tooling.

**Phase 3 and later (automatic, no new code):** VC and other forming teams light up the moment they clear the liveness gate. Media gains a working roster for free because `TeamMembership` is slug-keyed. Cross-team or club-wide surfaces only behind measured demand.

**Never in any committed phase:** auto-join on lens-switch; any per-person leaderboard or score (including aggregated drop reactions or a top-contributor view); a separate Club or Team database table (the code registry is the source of truth).

---

## COMPONENT AND REUSE PLAN

**Reused as-is:**
- The editorial surface mechanism: `data-surface="editorial"` (globals.css ~190-200), the `data-theme="light"` shell from `MainShell`, the Hanken font, the 1080px container, `HairRule` / `SectionEyebrow` / `editorial-link` / `ArrowRight` (extracted to `components/ui/editorial.tsx`).
- `TypeTag` (`components/ui/type-tag.tsx`) for the meeting type chip; the calendar `TYPE_TOKENS` mapping for team color.
- The Build Board project card rows and request-to-join flow (`build-client.tsx`, `build-detail-client.tsx`) for "What we are building."
- `Trend` reads (`lib/trends.ts`) and the latest `DigestEdition` read for The Drop auto-floor.
- The track-scoped quiz engine and `getActiveTrackSlug` content lens (`lib/track.ts`, `app/api/track/route.ts`) for the footer Practice link and the "set as active lens" offer.
- The Brilliant-style bordered card row aesthetic for the list modules.

**Net-new, each justified:**
- `lib/teams.ts`: the typed team registry plus resolvers (by slug, the liveness-gate predicate, the trend/digest/concept slicers). The single new dependency.
- `app/(main)/teams/[slug]/page.tsx` plus its client, and `app/(main)/teams/[slug]/drops` (the full Drop board), rendering modules declaratively off the registry flags. NOTE: read the relevant guide in `node_modules/next/dist/docs/` before writing routes (per `AGENTS.md`, this Next.js has breaking changes).
- `POST /api/teams/[slug]/join` and a leave route (write `TeamMembership`).
- `POST /api/teams/[slug]/drops` (create a drop) and a reaction toggle route (`TeamDropReaction`).
- The masthead, meeting card, The Drop, roster modules (composed from the editorial primitives and existing reads).
- The `TeamDrop` and `TeamDropReaction` tables; a seed script that backfills `TeamMembership` from `ProjectAssignment` for content-bearing teams.

No new card system and no new browse grammar. The team page is the editorial grammar in a team accent.

---

## PHASING AND SCOPE

### Phase 1 (the shell) acceptance criteria
- `lib/teams.ts` registry with the v1 mapping; modules render declaratively off its flags.
- `/teams/[slug]` route, gated by the liveness predicate, 404 for no-door or `memberFacing: false` teams, and absent from the switcher.
- `TeamMembership` redefined and migrated; Join and leave routes; the seed-from-ProjectAssignment script.
- `TeamDrop` plus `TeamDropReaction`; the post route, the reaction toggle, the in-module 3-item view with the trend/news auto-floor, and the `/teams/[slug]/drops` full board.
- Five modules in order (Team masthead, Next team meeting, The Drop, What we are building, Roster) plus the footer links.
- Per-team accent theming (never blue); the list modules as Brilliant-style rows; primitives extracted to `components/ui/editorial.tsx`.
- The user-facing rename of "track" to "team" across the switcher, sidebar, and build dialog; the switcher links to `/teams/[slug]` and lists only door-clearing, member-facing teams.
- Recruiting empty states per module, in the team accent, for thin-but-live teams.

**Phase 1 end-to-end acceptance test:** a member opens `/teams/capital`, sees the masthead in the Capital green, the next CAPITAL_TEAM meeting with time and place, The Drop showing recent member posts (or, when quiet, the top Capital trend and markets story as the auto-floor) with a working "+ drop something", the team's approved projects as rows, and a roster seeded from project assignments with their own "active" dot; they post a drop and it appears at the top; they click Join and appear in the roster on refresh; the footer links take them to resume-learning and the full calendar; visiting a doorless team (field-guides) 404s and it is absent from the switcher.

### Phase 2
`EventRSVP` plus the RSVP tap and "who is going"; `User.avatarUrl` plus real roster photos; the Live activity feed; real notifications; OG auto-fetch for drop titles; graduate-a-drop-into-the-Digest tooling.

### Not now (explicit)
Auto-join on lens-switch; any per-person leaderboard or score (including aggregated drop reactions); a Club or Team DB table; rich roster profiles; a standalone deep curriculum page on the team surface (it stays a footer link).

---

## OPEN QUESTIONS AND DISSENT (appendix)

1. **The Drop leans on a few active posters (the 90-9-1 rule).** Most members lurk, so member drops may be sparse. The auto-floor (the top system trend and news item) keeps the module from ever being blank, and leads can seed it, but if posting is near zero The Drop degrades to roughly the old auto briefing. That is an acceptable floor, not a failure. Watch posting rates in the first month; if they are near zero, lean on lead-seeded drops and the graduate-into-Digest hook to prime the pump.

2. **Standing (a per-person leaderboard) was cut in favor of The Drop.** If a gentle progress signal is ever wanted, prefer a collective, this-week, movers-only line over any ranking, and keep it opt-in. A per-person leaderboard is explicitly out of every committed phase. This is a deliberate reversal of the council's effort to make standing safe; see dissent item 7.

3. **Should field-guides be retired outright?** It is not a team (no `teamType`, no meeting, no roster), so it gets no HQ and is absent from the team switcher. Leaving it as a non-team content filter while everything else is a "team" may read as inconsistent. Decision deferred to James: retire it, or keep it as a pure content filter reachable only from browse. The plan gates it out of the team surface either way.

4. **Registry maintenance is hand-authored glue.** It is typed and fails loud, but each new team is still one registry entry plus a calendar color someone must remember, in a club whose maintainer graduates. The mitigation reduces silent breakage, not the authoring step. Keep the registry small and documented.

5. **Roster seeding leans on ProjectAssignment being populated.** Content-bearing teams with seeded project teams are fine; a team with no tagged projects starts with an empty roster and relies on the Join button plus its recruiting empty state. If day-one rosters are too thin, an admin seed list (a manual but honest roster) is the fallback.

6. **Two surfaces (home plus HQ) risk "where do I go" confusion.** The entry points from home and the sidebar, and the never-blue signal, must be unambiguous or the HQ gets orphaned. Watch this in the first week.

7. **Council debate superseded: standing.** The council spent its sharpest round on HOW to make a standing leaderboard safe (self-relative, this-week, cohort-gated). After the council, the lead chose to cut standing entirely and replace it with The Drop (a member bulletin), which delivers the same weekly-return goal without the ranking risk the council was trying to manage. The `COUNCIL.md` transcript preserves the original standing debate as a record of why a leaderboard is dangerous here.

8. **Council minority position, preserved (the skeptic): do not build the HQ, just give tracks a URL and fix the two bugs.** Overruled because the social and activity axis (meeting, roster, the Drop, shipping) is real value home structurally cannot show. The skeptic's two fixes are folded in, not discarded: the URL became `/teams/[slug]` and the empty-content problem became the liveness gate. His discipline is applied to the build (every me-axis module cut or demoted), not against it.

---

## GROUNDING (live schema and files, true as of this plan)

- `aisa-atlas/prisma/schema.prisma`: `Track` (46-61, slug ai|capital-markets|field-guides, `accentColor`, `isPrimary`); dormant `TrackMembership` (63-73, empty, `@@id([userId, trackId])`); `User` (11-40, `activeTrackId`, `trackMemberships`, no avatar field, `cohort` is `[FUTURE]`); `Tier.trackId` (75-89, the only content FK); `Concept` (105-129) scoped via Section -> Tier -> Track; `QuizAttempt` (192-207, `attemptedAt`, `isCorrect`); `Project.trackId` (266, 277) and `ProjectAssignment` (239-252, the honest roster seed); `ScheduleEvent` (392-414, `type` TECH_TEAM|CAPITAL_TEAM|MEDIA_TEAM|EXEC|..., `category`, `date`, `startTime`, `endTime`, `location`, NO attendance field); `DigestEdition.items` (449-466, JSON, item `category` undocumented and nullable, feeds The Drop floor); `Trend.category` (474-500, "AI"|"Tech"|"Capital", indexed, feeds The Drop floor).
- `aisa-atlas/lib/track.ts`: `TRACK_COOKIE = "tco-track"`, `DEFAULT_TRACK_SLUG = "ai"`, `getActiveTrackSlug`, `getTracks`, `TrackSummary`. Header comment defers `/t/[slug]` deep links (this plan supersedes that with `/teams/[slug]`).
- `aisa-atlas/app/api/track/route.ts`: `POST { slug }` sets the cookie and mirrors `User.activeTrackId`. Reused as the "set active lens" action; never writes membership.
- `aisa-atlas/lib/schedule-sync.ts`: the calendar color-to-`type` map (greens -> CAPITAL_TEAM), the team spine.
- `aisa-atlas/lib/trends.ts` and the digest read path (`lib/digest-view.ts` / `app/(main)/digest`): the trend and latest-edition reads for The Drop floor.
- `aisa-atlas/components/home-client.tsx`: home module order and the local `HairRule` / `SectionEyebrow` / `editorial-link` / `ArrowRight` to extract; `lib/home-data.ts` for the track-scoped continue-learning read (the footer link and the me-vs-us boundary).
- `aisa-atlas/components/sidebar.tsx` (TrackNavButton, switchTrack), `components/browse-client.tsx` (TrackSwitcher), `components/build-post-dialog.tsx` (TrackChip): the three switch surfaces to relabel "track" -> "team" and point at `/teams/[slug]`.
- `aisa-atlas/app/globals.css` (~190-200): `data-surface="editorial"` (Hanken plus `#4255FF`); `components/main-shell.tsx`: `data-theme="light"`, the 240px / 1fr shell.
- `aisa-atlas/components/ui/type-tag.tsx`: the shared event chip; `components/build-client.tsx` / `build-detail-client.tsx`: the project rows and request-to-join flow.

## CONSTRAINTS (do not violate)
- No em dashes or en dashes anywhere, including UI copy.
- Reactions on The Drop are per-drop only and are never aggregated into a per-person score or a top-contributor view.
- CSS-variable tokens only (lint:tokens), no magic numbers; the team accent overrides `--color-accent` scoped to the page root and is never `#4255FF`.
- Reuse primitives; the only genuinely new primitives are the registry, the team route, and The Drop.
- After any Prisma schema change, restart the dev server (HMR cannot reload `.prisma/client`); the symptom of skipping this is a 500 "Cannot read properties of undefined".
- Run aisa-atlas on port 3100 (3000 is a different project); verify the page title says "AISA Atlas".
- Read the relevant guide in `node_modules/next/dist/docs/` before writing the new routes.
- New tables need RLS: run `npx tsx scripts/enable-rls.ts` after the `TeamMembership` / `TeamDrop` migration, or they are publicly exposed.
