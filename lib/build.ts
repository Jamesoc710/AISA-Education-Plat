import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

/**
 * Build Board data layer.
 *
 * Visibility rule: members (and logged-out visitors) only ever see approved
 * projects. ADMIN and PROJECT_LEAD also see drafts, which carry a Draft chip
 * and an inline approve control on the detail page.
 */

export const MODERATOR_ROLES = ["ADMIN", "PROJECT_LEAD"];

export type BuildViewer = {
  id: string;
  name: string;
  email: string;
  role: string;
  isModerator: boolean;
};

export type ProjectContributor = {
  name: string;
  role: string; // "Lead" | "Contributor" | free string; extras default to "Contributor"
};

export type ProjectCardData = {
  id: string;
  slug: string;
  title: string;
  blurb: string;
  status: string; // draft | approved
  stage: string; // idea | building | shipped | paused
  createdAt: string; // ISO; the index uses its year on Shipped rows
  track: {
    slug: string;
    shortName: string;
    accentColor: string;
  } | null;
  lookingFor: string[];
  repoUrl: string | null;
  demoUrl: string | null;
  walkthroughUrl: string | null;
  contributors: ProjectContributor[];
};

export type ProjectInterestRow = {
  id: string;
  note: string | null;
  createdAt: string;
  status: string; // pending | accepted | declined
  respondedAt: string | null;
  user: { name: string; email: string };
};

export type ProjectDetailData = ProjectCardData & {
  description: string | null;
  approvedAt: string | null;
  /** Only populated for moderators */
  interests: ProjectInterestRow[];
};

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

/** extraContributors Json: [{ name, role? }] objects, tolerating legacy plain strings. */
function asExtraContributors(value: unknown): ProjectContributor[] {
  if (!Array.isArray(value)) return [];
  const out: ProjectContributor[] = [];
  for (const v of value) {
    if (typeof v === "string" && v.trim()) {
      out.push({ name: v, role: "Contributor" });
    } else if (v && typeof v === "object") {
      const rec = v as { name?: unknown; role?: unknown };
      if (typeof rec.name === "string" && rec.name.trim()) {
        out.push({
          name: rec.name,
          role: typeof rec.role === "string" && rec.role.trim() ? rec.role : "Contributor",
        });
      }
    }
  }
  return out;
}

/** Resolve the signed-in member (null when logged out). */
export async function getBuildViewer(): Promise<BuildViewer | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!user) return null;

  return { ...user, isModerator: MODERATOR_ROLES.includes(user.role) };
}

type ProjectWithTeam = {
  id: string;
  slug: string;
  title: string;
  blurb: string;
  status: string;
  stage: string;
  createdAt: Date;
  lookingFor: unknown;
  repoUrl: string | null;
  demoUrl: string | null;
  walkthroughUrl: string | null;
  extraContributors: unknown;
  track: { slug: string; shortName: string; accentColor: string } | null;
  createdBy: { id: string; name: string } | null;
  assignments: { role: string; user: { id: string; name: string } }[];
};

function toCard(p: ProjectWithTeam): ProjectCardData {
  // Team comes from assignments; the creator (createdById) leads a self-serve
  // project. Surface the creator even before the approval-time Lead assignment
  // exists, and dedupe by user id so a creator who already has an assignment is
  // not rendered twice. Seeded projects have no createdBy, so they are unchanged.
  const team: { id: string; name: string; role: string }[] = p.assignments.map((a) => ({
    id: a.user.id,
    name: a.user.name,
    role: a.role,
  }));
  const creator = p.createdBy;
  if (creator && !team.some((t) => t.id === creator.id)) {
    team.unshift({ id: creator.id, name: creator.name, role: "Lead" });
  }
  const contributors: ProjectContributor[] = team.map(({ name, role }) => ({ name, role }));
  const extras = asExtraContributors(p.extraContributors);
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    blurb: p.blurb,
    status: p.status,
    stage: p.stage,
    createdAt: p.createdAt.toISOString(),
    track: p.track,
    lookingFor: asStringArray(p.lookingFor),
    repoUrl: p.repoUrl,
    demoUrl: p.demoUrl,
    walkthroughUrl: p.walkthroughUrl,
    contributors: [...contributors, ...extras],
  };
}

const PROJECT_INCLUDE = {
  track: { select: { slug: true, shortName: true, accentColor: true } },
  createdBy: { select: { id: true, name: true } },
  assignments: {
    orderBy: { assignedAt: "asc" as const },
    select: { role: true, user: { select: { id: true, name: true } } },
  },
};

/** All projects the viewer may see, drafts first for moderators. */
export async function getProjects(viewer: BuildViewer | null): Promise<ProjectCardData[]> {
  const projects = await prisma.project.findMany({
    where: viewer?.isModerator ? {} : { status: "approved" },
    include: PROJECT_INCLUDE,
    orderBy: [{ createdAt: "desc" }],
  });
  return projects.map((p: ProjectWithTeam) => toCard(p));
}

/**
 * One project by slug, or null when it doesn't exist or the viewer isn't
 * allowed to see it (drafts are moderator-only). Interests are only loaded
 * for moderators.
 */
export async function getProjectDetail(
  slug: string,
  viewer: BuildViewer | null,
): Promise<ProjectDetailData | null> {
  const project = await prisma.project.findUnique({
    where: { slug },
    include: {
      ...PROJECT_INCLUDE,
      interests: {
        orderBy: { createdAt: "desc" as const },
        select: {
          id: true,
          note: true,
          createdAt: true,
          status: true,
          respondedAt: true,
          user: { select: { name: true, email: true } },
        },
      },
    },
  });
  if (!project) return null;
  if (project.status !== "approved" && !viewer?.isModerator) return null;

  type InterestRow = (typeof project.interests)[number];
  return {
    ...toCard(project),
    description: project.description,
    approvedAt: project.approvedAt?.toISOString() ?? null,
    interests: viewer?.isModerator
      ? project.interests.map((i: InterestRow) => ({
          id: i.id,
          note: i.note,
          createdAt: i.createdAt.toISOString(),
          status: i.status,
          respondedAt: i.respondedAt?.toISOString() ?? null,
          user: i.user,
        }))
      : [],
  };
}

/** Whether the viewer already sits on the project's team. */
export async function isOnTeam(projectId: string, userId: string): Promise<boolean> {
  const row = await prisma.projectAssignment.findUnique({
    where: { userId_projectId: { userId, projectId } },
    select: { id: true },
  });
  return row !== null;
}

/** Whether the viewer already requested to join. */
export async function hasRequestedJoin(projectId: string, userId: string): Promise<boolean> {
  const row = await prisma.projectInterest.findUnique({
    where: { projectId_userId: { projectId, userId } },
    select: { id: true },
  });
  return row !== null;
}

export type BuildTrack = {
  slug: string;
  shortName: string;
  accentColor: string;
};

/** Tracks for the posting modal's track select, in display order. */
export async function getTracks(): Promise<BuildTrack[]> {
  return prisma.track.findMany({
    select: { slug: true, shortName: true, accentColor: true },
    orderBy: { sortOrder: "asc" },
  });
}

/**
 * The signed-in moderator (ADMIN or PROJECT_LEAD), or null. For the accept and
 * decline API routes; mirrors the inline guard in the admin projects route.
 */
export async function requireModerator(): Promise<{
  id: string;
  name: string;
  role: string;
} | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;
  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { id: true, name: true, role: true },
  });
  if (!user || !MODERATOR_ROLES.includes(user.role)) return null;
  return user;
}

/** A join request pending longer than this many days is surfaced as stale. */
export const STALE_REQUEST_DAYS = 7;

export type MyRequestRow = {
  id: string;
  status: string; // pending | accepted | declined
  note: string | null;
  createdAt: string;
  respondedAt: string | null;
  project: { slug: string; title: string };
};

/** The viewer's own join requests, newest first. The requester-side resolution surface. */
export async function getMyRequests(viewer: BuildViewer): Promise<MyRequestRow[]> {
  const rows = await prisma.projectInterest.findMany({
    where: { userId: viewer.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      note: true,
      createdAt: true,
      respondedAt: true,
      project: { select: { slug: true, title: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    status: r.status,
    note: r.note,
    createdAt: r.createdAt.toISOString(),
    respondedAt: r.respondedAt?.toISOString() ?? null,
    project: r.project,
  }));
}

export type PendingRequestRow = {
  id: string;
  note: string | null;
  createdAt: string;
  projectId: string;
  project: { slug: string; title: string };
  user: { name: string; email: string };
};

/**
 * Every pending request across the board, oldest first, for the moderator
 * stale-requests view. Returns [] for non-moderators. Staleness is computed in
 * the view from createdAt against STALE_REQUEST_DAYS.
 */
export async function getPendingRequests(viewer: BuildViewer): Promise<PendingRequestRow[]> {
  if (!viewer.isModerator) return [];
  const rows = await prisma.projectInterest.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      note: true,
      createdAt: true,
      projectId: true,
      project: { select: { slug: true, title: true } },
      user: { select: { name: true, email: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    note: r.note,
    createdAt: r.createdAt.toISOString(),
    projectId: r.projectId,
    project: r.project,
    user: r.user,
  }));
}
