import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { isProjectStage, PROJECT_STAGES } from "@/lib/project-stages";

export const dynamic = "force-dynamic";

const MAX_TITLE = 120;
const MAX_BLURB = 280; // mirrors the seed file's static validator
const MAX_DESCRIPTION = 20000;
const MAX_LOOKING_FOR = 8;
const MAX_LOOKING_FOR_LEN = 40;

const URL_RE = /^https?:\/\//;

type PostBody = {
  title?: unknown;
  blurb?: unknown;
  stage?: unknown;
  trackSlug?: unknown;
  description?: unknown;
  repoUrl?: unknown;
  demoUrl?: unknown;
  walkthroughUrl?: unknown;
  lookingFor?: unknown;
};

/** kebab-case slug from a title; "project" when the title has no usable chars. */
function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "project";
}

/** First free slug of the form base, base-2, base-3, ... */
async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let n = 2;
  // Tiny club, no concurrent posting race worth a transaction here.
  while (await prisma.project.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

/** Optional URL field: undefined when absent, validated when present. */
function readUrl(value: unknown): { ok: true; value: string | null } | { ok: false } {
  if (value === undefined || value === null || value === "") return { ok: true, value: null };
  if (typeof value !== "string" || !URL_RE.test(value.trim())) return { ok: false };
  return { ok: true, value: value.trim() };
}

/**
 * POST /api/build/projects
 * Self-serve project posting. Any signed-in member may post; the project enters
 * as status "draft" (member-invisible) until a moderator approves it, so the
 * draft-then-approve visibility rule is the only gate. The author is recorded
 * from the authenticated session (createdById), never from client input. Stage
 * is required with no default, so the schema default of "building" is inverted
 * at the point of posting.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Sign in to post a project" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Account not found" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as PostBody;

  // ── title (required) ──
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "Add a project title" }, { status: 400 });
  }
  if (title.length > MAX_TITLE) {
    return NextResponse.json({ error: `Keep the title under ${MAX_TITLE} characters` }, { status: 400 });
  }

  // ── blurb (required) ──
  const blurb = typeof body.blurb === "string" ? body.blurb.trim() : "";
  if (!blurb) {
    return NextResponse.json({ error: "Add a one or two sentence blurb" }, { status: 400 });
  }
  if (blurb.length > MAX_BLURB) {
    return NextResponse.json({ error: `Keep the blurb under ${MAX_BLURB} characters` }, { status: 400 });
  }

  // ── stage (required, no default) ──
  if (typeof body.stage !== "string" || !isProjectStage(body.stage)) {
    return NextResponse.json(
      { error: `Pick a stage (one of ${PROJECT_STAGES.join(", ")})` },
      { status: 400 },
    );
  }
  const stage = body.stage;

  // ── track (optional, must resolve when present) ──
  let trackId: string | null = null;
  if (typeof body.trackSlug === "string" && body.trackSlug) {
    const track = await prisma.track.findUnique({
      where: { slug: body.trackSlug },
      select: { id: true },
    });
    if (!track) {
      return NextResponse.json({ error: "Unknown track" }, { status: 400 });
    }
    trackId = track.id;
  }

  // ── description (optional Markdown) ──
  let description: string | null = null;
  if (typeof body.description === "string" && body.description.trim()) {
    description = body.description.trim().slice(0, MAX_DESCRIPTION);
  }

  // ── external links (optional, https only) ──
  const repo = readUrl(body.repoUrl);
  const demo = readUrl(body.demoUrl);
  const walkthrough = readUrl(body.walkthroughUrl);
  if (!repo.ok || !demo.ok || !walkthrough.ok) {
    return NextResponse.json({ error: "Links must start with http:// or https://" }, { status: 400 });
  }

  // ── looking-for role tags (optional) ──
  let lookingFor: string[] = [];
  if (Array.isArray(body.lookingFor)) {
    lookingFor = body.lookingFor
      .filter((v): v is string => typeof v === "string")
      .map((v) => v.trim().slice(0, MAX_LOOKING_FOR_LEN))
      .filter(Boolean)
      .slice(0, MAX_LOOKING_FOR);
  }

  const slug = await uniqueSlug(slugify(title));

  const project = await prisma.project.create({
    data: {
      slug,
      title,
      blurb,
      description,
      status: "draft",
      stage,
      trackId,
      lookingFor,
      repoUrl: repo.value,
      demoUrl: demo.value,
      walkthroughUrl: walkthrough.value,
      createdById: user.id, // server-side only
    },
    select: { slug: true },
  });

  return NextResponse.json({ ok: true, slug: project.slug });
}
