import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getTeam } from "@/lib/teams";

export const dynamic = "force-dynamic";

const MAX_TITLE = 200;
const MAX_NOTE = 280;
const MAX_SLUG = 200;
const URL_RE = /^https?:\/\//;

/** Bare hostname for the source line, "www." stripped. "" when unparseable. */
function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/**
 * POST /api/teams/[slug]/drops  { url, title, note, conceptSlug?, trendSlug? }
 * Creates a member drop on The Drop. Posts instantly (a known 30-person club);
 * a lead can soft-remove later. The author is the authenticated session, never
 * client input. The one-line take (note) is required: it is the whole value.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const team = getTeam(slug);
  if (!team || !team.flags.memberFacing) {
    return NextResponse.json({ error: "Unknown team" }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Sign in to post a drop" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Account not found" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    url?: unknown;
    title?: unknown;
    note?: unknown;
    conceptSlug?: unknown;
    trendSlug?: unknown;
  };

  const url = typeof body.url === "string" ? body.url.trim() : "";
  if (!URL_RE.test(url)) {
    return NextResponse.json(
      { error: "Paste a link starting with http:// or https://" },
      { status: 400 },
    );
  }
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "Add a headline" }, { status: 400 });
  }
  const note = typeof body.note === "string" ? body.note.trim() : "";
  if (!note) {
    return NextResponse.json({ error: "Add your one-line take" }, { status: 400 });
  }
  const conceptSlug =
    typeof body.conceptSlug === "string" && body.conceptSlug.trim()
      ? body.conceptSlug.trim().slice(0, MAX_SLUG)
      : null;
  const trendSlug =
    typeof body.trendSlug === "string" && body.trendSlug.trim()
      ? body.trendSlug.trim().slice(0, MAX_SLUG)
      : null;

  const drop = await prisma.teamDrop.create({
    data: {
      teamSlug: slug,
      userId: user.id, // server-side only
      url,
      title: title.slice(0, MAX_TITLE),
      sourceDomain: domainOf(url),
      note: note.slice(0, MAX_NOTE),
      conceptSlug,
      trendSlug,
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: drop.id });
}
