/**
 * Team registry: the single typed source of truth that reconciles the calendar
 * team spine (ScheduleEvent.type), the content track (Track.slug), the trend and
 * digest categories, and each team's identity (display name, mandate, accent).
 *
 * Pure code, no Prisma, so it is safe to import from both client and server.
 * The live reads (membership, meetings, projects, drops) and the door
 * computation live in lib/team-data.ts.
 *
 * Vocabulary: a "track" is the content scope; a "team" is the thing a member
 * belongs to and returns to. trackId is an OPTIONAL attribute of a team, not its
 * identity, so a content-less team (Media) is still a real team.
 */

export type TeamFlags = {
  /** Pre-launch. A forming team gets a door only once it clears the liveness gate. */
  forming: boolean;
  /** false for ops teams (EXEC / EVENTS): never a joinable HQ, never in the switcher. */
  memberFacing: boolean;
};

export type Team = {
  slug: string; // URL + membership key, e.g. "capital"
  displayName: string; // "Capital Markets"
  wordmark?: string; // optional masthead mark; falls back to displayName
  mandate: string; // one-line "what we do" (no em dashes)
  teamType?: string; // calendar spine: TECH_TEAM | CAPITAL_TEAM | MEDIA_TEAM | ...
  trackId?: string; // OPTIONAL content scope -> Track.slug (ai | capital-markets)
  trendCategory?: string; // Trend.category ("AI" | "Tech" | "Capital") -> The Drop floor
  digestCategory?: string; // DigestItem.category ("ai" | "tech" | "markets") -> The Drop floor
  conceptPrefix?: string; // e.g. "cm-" for sub-topic reads (informational in v1)
  accent: string; // team color; NEVER #4255FF (the editorial blue, reserved for home)
  flags: TeamFlags;
};

/** The minimal team shape the sidebar switcher needs (a door-clearing team). */
export type TeamLink = { slug: string; displayName: string; accent: string };

/**
 * The v1 mapping. Accent swatches live here because the registry IS the identity
 * layer; none is the editorial blue #4255FF. A new team is one entry here plus a
 * calendar color, with no new code: modules render declaratively off these flags.
 */
const TEAMS: Team[] = [
  {
    slug: "tech",
    displayName: "Tech",
    mandate: "Where we make sense of AI and the tools reshaping how we build.",
    teamType: "TECH_TEAM",
    trackId: "ai",
    trendCategory: "AI",
    digestCategory: "ai",
    accent: "#5E6AD2", // indigo
    flags: { forming: false, memberFacing: true },
  },
  {
    slug: "capital",
    displayName: "Capital Markets",
    mandate: "Where we read the markets and the money moving through tech.",
    teamType: "CAPITAL_TEAM",
    trackId: "capital-markets",
    trendCategory: "Capital",
    digestCategory: "markets",
    conceptPrefix: "cm-",
    accent: "#16A34A", // green, echoing the Capital track + the CAPITAL_TEAM calendar color
    flags: { forming: false, memberFacing: true },
  },
  {
    slug: "media",
    displayName: "Media",
    mandate: "Where we tell the club's story and shape how it shows up.",
    teamType: "MEDIA_TEAM",
    // no track, no trend/digest category: renders The Drop member-only, no system floor
    accent: "#8064A2", // violet, echoing the MEDIA calendar color
    flags: { forming: false, memberFacing: true },
  },
  {
    slug: "vc",
    displayName: "Venture",
    mandate: "Where we study how startups get funded and who backs them.",
    // no teamType yet: forming, doorless until a first meeting lands on the calendar
    trendCategory: "Capital",
    digestCategory: "markets",
    accent: "#B45309", // amber
    flags: { forming: true, memberFacing: true },
  },
  {
    slug: "exec",
    displayName: "Exec",
    mandate: "Club operations.",
    teamType: "EXEC",
    accent: "#C0392B", // unused: ops team, never rendered as an HQ
    flags: { forming: false, memberFacing: false },
  },
  {
    slug: "events",
    displayName: "Events",
    mandate: "Club events and logistics.",
    teamType: "EVENTS",
    accent: "#E08A3C", // unused: ops team, never rendered as an HQ
    flags: { forming: false, memberFacing: false },
  },
];

const BY_SLUG: Record<string, Team> = Object.fromEntries(
  TEAMS.map((t) => [t.slug, t]),
);

export const ALL_TEAMS: readonly Team[] = TEAMS;

/** A team by slug, or undefined for an unknown slug (the route 404s on undefined). */
export function getTeam(slug: string): Team | undefined {
  return BY_SLUG[slug];
}

/** Member-facing teams (excludes ops teams like EXEC / EVENTS), registry order. */
export function getMemberFacingTeams(): Team[] {
  return TEAMS.filter((t) => t.flags.memberFacing);
}

/**
 * The signals the liveness gate reads. Computed in lib/team-data.ts and passed
 * in so this predicate stays pure.
 *
 * Note on `hasMeeting`: the plan's gate signal is "an UPCOMING meeting". We open
 * the door for ANY meeting of the team's type (past or future) instead, so an
 * established team does not vanish between terms when nothing future is yet on
 * the calendar. This preserves every concrete outcome the plan specifies: a
 * forming VC (no teamType, so no meetings of its type) and field-guides (not a
 * team) still clear nothing and stay doorless. The "Next team meeting" module
 * still shows only upcoming meetings; this is the door gate, not the card.
 */
export type LivenessSignals = {
  hasMeeting: boolean; // the team's teamType appears on the calendar (any date)
  hasProject: boolean; // >= 1 approved project on the team's trackId
  rosterCount: number; // TeamMembership + ProjectAssignment-derived members
};

/** A team earns a door once it has a meeting, a tagged project, or a member. */
export const ROSTER_THRESHOLD = 1;

export function isLive(signals: LivenessSignals): boolean {
  return (
    signals.hasMeeting ||
    signals.hasProject ||
    signals.rosterCount >= ROSTER_THRESHOLD
  );
}

/**
 * The CSS custom properties that scope a team's accent to its page root,
 * overriding the editorial surface's blue. Soft/dim are derived with color-mix
 * so reused accent-tinted components stay in the team's color family. Spread
 * into the page-root style; never produces #4255FF.
 */
export function teamAccentVars(accent: string): Record<string, string> {
  return {
    "--color-accent": accent,
    "--color-accent-hover": accent,
    "--color-accent-soft": `color-mix(in srgb, ${accent} 12%, var(--color-bg))`,
    "--color-accent-on-soft": accent,
    "--color-accent-dim": `color-mix(in srgb, ${accent} 16%, transparent)`,
  };
}
