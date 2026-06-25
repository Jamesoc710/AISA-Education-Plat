import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireModerator } from "@/lib/build";

export const dynamic = "force-dynamic";

const MAX_ROLE_LEN = 60;

/**
 * POST /api/build/projects/[id]/accept  { interestId, role? }
 * A moderator accepts a join request. In one transaction the requester is added
 * to the team (idempotent on the @@unique([userId, projectId]), so an already
 * on-team request does not 500) and the request is stamped accepted with the
 * responding moderator and time. Role defaults to "Contributor".
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const moderator = await requireModerator();
  if (!moderator) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: projectId } = await params;
  const body = (await req.json().catch(() => ({}))) as { interestId?: unknown; role?: unknown };
  if (typeof body.interestId !== "string" || !body.interestId) {
    return NextResponse.json({ error: "Missing interestId" }, { status: 400 });
  }
  const role =
    typeof body.role === "string" && body.role.trim()
      ? body.role.trim().slice(0, MAX_ROLE_LEN)
      : "Contributor";

  const interest = await prisma.projectInterest.findUnique({
    where: { id: body.interestId },
    select: { id: true, projectId: true, userId: true },
  });
  if (!interest || interest.projectId !== projectId) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.projectAssignment.upsert({
      where: { userId_projectId: { userId: interest.userId, projectId } },
      create: { userId: interest.userId, projectId, role },
      update: {}, // already on the team: leave their existing role untouched
    }),
    prisma.projectInterest.update({
      where: { id: interest.id },
      data: { status: "accepted", respondedById: moderator.id, respondedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
