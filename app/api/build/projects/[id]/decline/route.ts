import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireModerator } from "@/lib/build";

export const dynamic = "force-dynamic";

/**
 * POST /api/build/projects/[id]/decline  { interestId }
 * A moderator turns a join request down with an audit stamp. No assignment is
 * written. The requester sees the resolution in their "Your requests" view.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const moderator = await requireModerator();
  if (!moderator) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: projectId } = await params;
  const body = (await req.json().catch(() => ({}))) as { interestId?: unknown };
  if (typeof body.interestId !== "string" || !body.interestId) {
    return NextResponse.json({ error: "Missing interestId" }, { status: 400 });
  }

  const interest = await prisma.projectInterest.findUnique({
    where: { id: body.interestId },
    select: { id: true, projectId: true },
  });
  if (!interest || interest.projectId !== projectId) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  await prisma.projectInterest.update({
    where: { id: interest.id },
    data: { status: "declined", respondedById: moderator.id, respondedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
