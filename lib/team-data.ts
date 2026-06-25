import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getActiveTrackSlug } from "@/lib/track";
import { MODERATOR_ROLES } from "@/lib/build";
import {
  type Team,
  getMemberFacingTeams,
  isLive,
} from "@/lib/teams";

/**
 * Server-side reads for the Team HQ. lib/teams.ts stays pure; everything that
 * touches Prisma, the calendar, trends, the digest, or the session lives here.
 */

// ─── Shared view shapes ──────────────────────────────────────────────────────

/** A door-clearing team for the sidebar switcher. */
export type TeamLink = { slug: string; displayName: string; accent: string };

export type MeetingView = {
  title: string;
  type: string; // for TypeTag
  dayLabel: string; // "Tuesday"
  dateLabel: string; // "Jun 30"
  timeLabel: string | null; // "5pm to 7pm"
  location: string | null;
};

export type DropView = {
  id: string; // drop id (member) or a synthetic key (radar floor)
  kind: "member" | "radar";
  title: string;
  url: string; // external link, or an internal /trends/[slug] path for a trend
  external: boolean; // open in a new tab
  sourceLabel: string; // domain, or "Radar" for system items
  note: string; // the one-line take (member) or why-it-matters (radar)
  authorName: string | null; // member name -> monogram; null for radar
  timeLabel: string; // relative "2h ago" / "Jun 24"
  reactionCount: number;
  reacted: boolean; // viewer reacted
  canRemove: boolean; // viewer is a moderator (member drops only)
};

export type RosterMember = {
  initials: string;
  name: string;
  active: boolean; // active this week (recent quiz on team concepts, or a recent drop)
};

export type TeamProjectView = {
  slug: string;
  title: string;
  blurb: string;
  lookingFor: string[];
};

export type TeamPageData = {
  memberCount: number;
  isMember: boolean; // viewer has a TeamMembership row (what Join toggles)
  isLoggedIn: boolean;
  activeLensSlug: string; // current content-lens cookie
  meeting: MeetingView | null;
  drops: DropView[]; // up to 3, member-first, then the radar floor
  hasMoreDrops: boolean; // more than 3 member drops exist
  memberDropCount: number; // member drops shown (drives the "be the first" nudge)
  projects: TeamProjectView[];
  roster: RosterMember[];
};

// ─── Small formatters (no em or en dashes anywhere) ──────────────────────────

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const WEEKDAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

/** "17:00" -> "5pm", "9:30" -> "9:30am". Derives am/pm when the source omits it. */
function simplifyTime(t: string): string {
  const m = t.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!m) return t;
  let hour = parseInt(m[1], 10);
  const minStr = m[2] && m[2] !== "00" ? `:${m[2]}` : "";
  const suffix = m[3] ? m[3].toLowerCase() : hour >= 12 ? "pm" : "am";
  if (hour >= 13) hour -= 12;
  else if (hour === 0) hour = 12;
  return `${hour}${minStr}${suffix}`;
}

function timeRange(start: string | null, end: string | null): string | null {
  if (!start) return null;
  if (!end) return simplifyTime(start);
  return `${simplifyTime(start)} to ${simplifyTime(end)}`;
}

function relativeTime(d: Date, now: Date): string {
  const min = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/** Two-letter monogram from a display name. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase();
}

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

// ─── The switcher: door-clearing member-facing teams ─────────────────────────

/**
 * Member-facing teams that clear the liveness gate, in registry order, for the
 * sidebar switcher. A team with no door is absent here (and 404s on its URL).
 */
export async function getDoorTeams(): Promise<TeamLink[]> {
  const teams = getMemberFacingTeams();

  const [meetingTypes, projectTracks, membershipCounts, assignments] = await Promise.all([
    prisma.scheduleEvent.findMany({ select: { type: true }, distinct: ["type"] }),
    prisma.project.findMany({
      where: { status: "approved", trackId: { not: null } },
      select: { track: { select: { slug: true } } },
      distinct: ["trackId"],
    }),
    prisma.teamMembership.groupBy({ by: ["teamSlug"], _count: { teamSlug: true } }),
    prisma.projectAssignment.findMany({
      select: { userId: true, project: { select: { track: { select: { slug: true } } } } },
    }),
  ]);

  const meetingTypeSet = new Set(meetingTypes.map((m) => m.type));
  const projectTrackSet = new Set(
    projectTracks.map((p) => p.track?.slug).filter((s): s is string => !!s),
  );
  const membershipBySlug = new Map(
    membershipCounts.map((m) => [m.teamSlug, m._count.teamSlug]),
  );
  const assignmentByTrack = new Map<string, Set<string>>();
  for (const a of assignments) {
    const slug = a.project.track?.slug;
    if (!slug) continue;
    if (!assignmentByTrack.has(slug)) assignmentByTrack.set(slug, new Set());
    assignmentByTrack.get(slug)!.add(a.userId);
  }

  const out: TeamLink[] = [];
  for (const t of teams) {
    const hasMeeting = t.teamType ? meetingTypeSet.has(t.teamType) : false;
    const hasProject = t.trackId ? projectTrackSet.has(t.trackId) : false;
    const rosterCount =
      (membershipBySlug.get(t.slug) ?? 0) +
      (t.trackId ? assignmentByTrack.get(t.trackId)?.size ?? 0 : 0);
    if (isLive({ hasMeeting, hasProject, rosterCount })) {
      out.push({ slug: t.slug, displayName: t.displayName, accent: t.accent });
    }
  }
  return out;
}

// ─── Viewer ──────────────────────────────────────────────────────────────────

async function resolveViewer(): Promise<{ id: string | null; isModerator: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { id: null, isModerator: false };
  const u = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, role: true },
  });
  return u
    ? { id: u.id, isModerator: MODERATOR_ROLES.includes(u.role) }
    : { id: null, isModerator: false };
}

// ─── The Drop auto-floor (system trend / news) ───────────────────────────────

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

type RawDigestItem = {
  title?: unknown;
  summary?: unknown;
  whyItMatters?: unknown;
  url?: unknown;
  category?: unknown;
};

/** Latest published digest's first item in the team's category, if any. */
function firstDigestItem(
  items: unknown,
  category: string,
): { title: string; url: string; note: string } | null {
  if (!Array.isArray(items)) return null;
  for (const it of items) {
    if (!it || typeof it !== "object") continue;
    const r = it as RawDigestItem;
    if (
      r.category === category &&
      typeof r.title === "string" &&
      r.title.trim() &&
      typeof r.url === "string" &&
      r.url.trim()
    ) {
      const note =
        typeof r.whyItMatters === "string" && r.whyItMatters.trim()
          ? r.whyItMatters
          : typeof r.summary === "string"
            ? r.summary
            : "";
      return { title: r.title, url: r.url, note };
    }
  }
  return null;
}

/**
 * Fill up to `need` Drop slots with system items: the top published trend in the
 * team's trend category, then the latest published digest's top item in the
 * team's digest category. Tagged "radar", never attributed to a member, never
 * reactable. A team with neither category gets no floor (member-only Drop).
 */
async function floorItems(team: Team, need: number, now: Date): Promise<DropView[]> {
  if (need <= 0) return [];
  const out: DropView[] = [];

  if (team.trendCategory) {
    const trend = await prisma.trend.findFirst({
      where: { status: "published", category: team.trendCategory },
      orderBy: [{ momentum: "desc" }, { name: "asc" }],
      select: { slug: true, name: true, whatsHappening: true, syncedAt: true },
    });
    if (trend) {
      out.push({
        id: `radar-trend-${trend.slug}`,
        kind: "radar",
        title: trend.name,
        url: `/trends/${trend.slug}`,
        external: false,
        sourceLabel: "Trend",
        note: trend.whatsHappening,
        authorName: null,
        timeLabel: relativeTime(trend.syncedAt, now),
        reactionCount: 0,
        reacted: false,
        canRemove: false,
      });
    }
  }

  if (out.length < need && team.digestCategory) {
    const edition = await prisma.digestEdition.findFirst({
      where: { status: "published" },
      orderBy: { weekOf: "desc" },
      select: { items: true, generatedAt: true },
    });
    const item = edition && firstDigestItem(edition.items, team.digestCategory);
    if (item && edition) {
      out.push({
        id: `radar-digest-${domainOf(item.url)}`,
        kind: "radar",
        title: item.title,
        url: item.url,
        external: true,
        sourceLabel: domainOf(item.url) || "This Week in Tech",
        note: item.note,
        authorName: null,
        timeLabel: relativeTime(edition.generatedAt, now),
        reactionCount: 0,
        reacted: false,
        canRemove: false,
      });
    }
  }

  return out.slice(0, need);
}

// ─── The full team page payload ──────────────────────────────────────────────

/**
 * Everything the team HQ renders, or null when the team fails the liveness gate
 * (the page 404s on null). Computes the gate first and returns early, so a
 * doorless team is cheap.
 */
export async function getTeamPageData(team: Team): Promise<TeamPageData | null> {
  const now = new Date();
  const trackSlug = team.trackId;

  const [viewer, activeLensSlug] = await Promise.all([
    resolveViewer(),
    getActiveTrackSlug(),
  ]);

  // Liveness signals + roster identity (the roster is needed for the gate).
  const [meetingCount, projectCount, membershipRows, assignmentRows] = await Promise.all([
    team.teamType
      ? prisma.scheduleEvent.count({ where: { type: team.teamType } })
      : Promise.resolve(0),
    trackSlug
      ? prisma.project.count({ where: { status: "approved", track: { slug: trackSlug } } })
      : Promise.resolve(0),
    prisma.teamMembership.findMany({
      where: { teamSlug: team.slug },
      select: { userId: true, user: { select: { name: true } } },
    }),
    trackSlug
      ? prisma.projectAssignment.findMany({
          where: { project: { track: { slug: trackSlug } } },
          select: { userId: true, user: { select: { name: true } } },
        })
      : Promise.resolve([] as { userId: string; user: { name: string } }[]),
  ]);

  // Roster = TeamMembership users UNION ProjectAssignment users (deduped).
  const memberName = new Map<string, string>();
  const membershipUserIds = new Set<string>();
  for (const r of membershipRows) {
    memberName.set(r.userId, r.user.name);
    membershipUserIds.add(r.userId);
  }
  for (const r of assignmentRows) {
    if (!memberName.has(r.userId)) memberName.set(r.userId, r.user.name);
  }
  const rosterCount = memberName.size;

  if (!isLive({ hasMeeting: meetingCount > 0, hasProject: projectCount > 0, rosterCount })) {
    return null;
  }

  // The team's concept scope (for the "active this week" quiz signal).
  const memberIds = Array.from(memberName.keys());

  const [meetingEvent, projectRows, dropRows, quizActiveRows, dropActiveRows] =
    await Promise.all([
      team.teamType
        ? prisma.scheduleEvent.findFirst({
            where: { type: team.teamType, date: { gte: now } },
            orderBy: { date: "asc" },
            select: {
              title: true,
              type: true,
              date: true,
              startTime: true,
              endTime: true,
              location: true,
            },
          })
        : Promise.resolve(null),
      trackSlug
        ? prisma.project.findMany({
            where: { status: "approved", track: { slug: trackSlug } },
            orderBy: { createdAt: "desc" },
            select: { slug: true, title: true, blurb: true, lookingFor: true },
          })
        : Promise.resolve([] as { slug: string; title: string; blurb: string; lookingFor: unknown }[]),
      prisma.teamDrop.findMany({
        where: { teamSlug: team.slug, removedAt: null },
        orderBy: { createdAt: "desc" },
        take: 4, // one extra to detect "see all"
        select: {
          id: true,
          url: true,
          title: true,
          sourceDomain: true,
          note: true,
          createdAt: true,
          user: { select: { name: true } },
          reactions: { select: { userId: true } },
        },
      }),
      // active-this-week via a quiz attempt on this team's concepts
      trackSlug && memberIds.length > 0
        ? prisma.quizAttempt.findMany({
            where: {
              userId: { in: memberIds },
              attemptedAt: { gte: new Date(now.getTime() - WEEK_MS) },
              question: {
                concept: { section: { tier: { track: { slug: trackSlug } } } },
              },
            },
            select: { userId: true },
            distinct: ["userId"],
          })
        : Promise.resolve([] as { userId: string }[]),
      // active-this-week via a recent drop in this team
      memberIds.length > 0
        ? prisma.teamDrop.findMany({
            where: {
              teamSlug: team.slug,
              removedAt: null,
              createdAt: { gte: new Date(now.getTime() - WEEK_MS) },
              userId: { in: memberIds },
            },
            select: { userId: true },
            distinct: ["userId"],
          })
        : Promise.resolve([] as { userId: string }[]),
    ]);

  // Meeting view (next upcoming only; null shows the recruiting empty state).
  const meeting: MeetingView | null = meetingEvent
    ? {
        title: meetingEvent.title,
        type: meetingEvent.type,
        dayLabel: WEEKDAYS[meetingEvent.date.getDay()],
        dateLabel: `${MONTHS[meetingEvent.date.getMonth()]} ${meetingEvent.date.getDate()}`,
        timeLabel: timeRange(meetingEvent.startTime, meetingEvent.endTime),
        location: meetingEvent.location,
      }
    : null;

  // Projects view.
  const projects: TeamProjectView[] = projectRows.map((p) => ({
    slug: p.slug,
    title: p.title,
    blurb: p.blurb,
    lookingFor: Array.isArray(p.lookingFor)
      ? (p.lookingFor as unknown[]).filter((v): v is string => typeof v === "string")
      : [],
  }));

  // Drops: member drops (first 3) then the radar floor up to 3 total.
  const hasMoreDrops = dropRows.length > 4 - 1; // took 4; >3 means more exist
  const memberDrops: DropView[] = dropRows.slice(0, 3).map((d) => ({
    id: d.id,
    kind: "member" as const,
    title: d.title,
    url: d.url,
    external: true,
    sourceLabel: d.sourceDomain || domainOf(d.url),
    note: d.note,
    authorName: d.user.name,
    timeLabel: relativeTime(d.createdAt, now),
    reactionCount: d.reactions.length,
    reacted: viewer.id ? d.reactions.some((r) => r.userId === viewer.id) : false,
    canRemove: viewer.isModerator,
  }));
  const floor = await floorItems(team, 3 - memberDrops.length, now);
  const drops = [...memberDrops, ...floor];

  // Roster with the active-this-week dot.
  const activeIds = new Set<string>([
    ...quizActiveRows.map((r) => r.userId),
    ...dropActiveRows.map((r) => r.userId),
  ]);
  const roster: RosterMember[] = memberIds
    .map((id) => {
      const name = memberName.get(id) ?? "Unknown";
      return { initials: initials(name), name, active: activeIds.has(id) };
    })
    .sort((a, b) => {
      if (a.active !== b.active) return a.active ? -1 : 1; // active first
      return a.name.localeCompare(b.name);
    });

  return {
    memberCount: rosterCount,
    isMember: viewer.id ? membershipUserIds.has(viewer.id) : false,
    isLoggedIn: viewer.id !== null,
    activeLensSlug,
    meeting,
    drops,
    hasMoreDrops,
    memberDropCount: memberDrops.length,
    projects,
    roster,
  };
}

/**
 * Lightweight liveness gate for sub-routes (e.g. the drops board), so a doorless
 * team 404s on its children too. Mirrors getTeamPageData's gate without the rest.
 */
export async function isTeamLive(team: Team): Promise<boolean> {
  const trackSlug = team.trackId;
  const [meetingCount, projectCount, membershipCount, assignmentUsers] =
    await Promise.all([
      team.teamType
        ? prisma.scheduleEvent.count({ where: { type: team.teamType } })
        : Promise.resolve(0),
      trackSlug
        ? prisma.project.count({ where: { status: "approved", track: { slug: trackSlug } } })
        : Promise.resolve(0),
      prisma.teamMembership.count({ where: { teamSlug: team.slug } }),
      trackSlug
        ? prisma.projectAssignment.findMany({
            where: { project: { track: { slug: trackSlug } } },
            select: { userId: true },
            distinct: ["userId"],
          })
        : Promise.resolve([] as { userId: string }[]),
    ]);
  // membership and assignment sets may overlap; for the >=1 gate the sum is fine.
  return isLive({
    hasMeeting: meetingCount > 0,
    hasProject: projectCount > 0,
    rosterCount: membershipCount + assignmentUsers.length,
  });
}

/** The member drops for the full reverse-chron board at /teams/[slug]/drops. */
export async function getTeamDropsBoard(
  team: Team,
): Promise<{ drops: DropView[]; isLoggedIn: boolean }> {
  const now = new Date();
  const viewer = await resolveViewer();
  const rows = await prisma.teamDrop.findMany({
    where: { teamSlug: team.slug, removedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      url: true,
      title: true,
      sourceDomain: true,
      note: true,
      createdAt: true,
      user: { select: { name: true } },
      reactions: { select: { userId: true } },
    },
  });
  const drops = rows.map((d) => ({
    id: d.id,
    kind: "member" as const,
    title: d.title,
    url: d.url,
    external: true,
    sourceLabel: d.sourceDomain || domainOf(d.url),
    note: d.note,
    authorName: d.user.name,
    timeLabel: relativeTime(d.createdAt, now),
    reactionCount: d.reactions.length,
    reacted: viewer.id ? d.reactions.some((r) => r.userId === viewer.id) : false,
    canRemove: viewer.isModerator,
  }));
  return { drops, isLoggedIn: viewer.id !== null };
}
