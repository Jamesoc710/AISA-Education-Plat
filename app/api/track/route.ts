import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { TRACK_COOKIE } from "@/lib/track";

export const dynamic = "force-dynamic";

/**
 * POST /api/track  { slug }
 * Sets the active-track cookie (validated against real tracks) and, for a
 * logged-in member, mirrors it to User.activeTrackId.
 */
export async function POST(req: NextRequest) {
  const { slug } = (await req.json().catch(() => ({}))) as { slug?: string };
  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const track = await prisma.track.findUnique({ where: { slug } });
  if (!track) {
    return NextResponse.json({ error: "Unknown track" }, { status: 404 });
  }

  const res = NextResponse.json({ ok: true, slug });
  res.cookies.set(TRACK_COOKIE, slug, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
  });

  // Best-effort: persist to the member's account too (non-fatal if logged out).
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { activeTrackId: track.id },
      });
    }
  } catch {
    // ignore — cookie is the source of truth for SSR scoping
  }

  return res;
}
