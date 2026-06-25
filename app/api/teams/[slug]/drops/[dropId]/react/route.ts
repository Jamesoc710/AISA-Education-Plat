import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/teams/[slug]/drops/[dropId]/react
 * Toggles the authenticated user's "good find" on a drop and returns the new
 * count plus whether the caller is now reacting.
 *
 * GUARD (load-bearing): the count is reactions-per-drop only. It is NEVER summed
 * into a per-person total or a top-contributor view. That guard is what stops a
 * leaderboard from sneaking back in through reactions.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string; dropId: string }> },
) {
  const { slug, dropId } = await params;

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Sign in to react" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Account not found" }, { status: 401 });
  }

  const drop = await prisma.teamDrop.findUnique({
    where: { id: dropId },
    select: { id: true, teamSlug: true, removedAt: true },
  });
  if (!drop || drop.teamSlug !== slug || drop.removedAt) {
    return NextResponse.json({ error: "Drop not found" }, { status: 404 });
  }

  const existing = await prisma.teamDropReaction.findUnique({
    where: { dropId_userId: { dropId, userId: user.id } },
    select: { dropId: true },
  });

  let reacted: boolean;
  if (existing) {
    await prisma.teamDropReaction.delete({
      where: { dropId_userId: { dropId, userId: user.id } },
    });
    reacted = false;
  } else {
    await prisma.teamDropReaction.create({
      data: { dropId, userId: user.id },
    });
    reacted = true;
  }

  const count = await prisma.teamDropReaction.count({ where: { dropId } });
  return NextResponse.json({ ok: true, reacted, count });
}
