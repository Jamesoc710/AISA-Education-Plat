import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireModerator } from "@/lib/build";

export const dynamic = "force-dynamic";

/**
 * POST /api/teams/[slug]/drops/[dropId]/remove
 * Lead soft-remove (sets removedAt; no hard delete) so The Drop stays casual
 * without a heavy approve queue. Moderators only. Idempotent.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string; dropId: string }> },
) {
  const moderator = await requireModerator();
  if (!moderator) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { slug, dropId } = await params;
  const drop = await prisma.teamDrop.findUnique({
    where: { id: dropId },
    select: { id: true, teamSlug: true },
  });
  if (!drop || drop.teamSlug !== slug) {
    return NextResponse.json({ error: "Drop not found" }, { status: 404 });
  }

  await prisma.teamDrop.update({
    where: { id: dropId },
    data: { removedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
