import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { MODERATOR_ROLES } from "@/lib/build";

export const dynamic = "force-dynamic";

const MAX_NOTE_LENGTH = 500;

/**
 * POST /api/build/interest  { projectId, note? }
 * Records a member's request to join a project. One per member per project;
 * a repeat request is a no-op success so the UI can stay idempotent.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Sign in to request to join" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { id: true, role: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Account not found" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    projectId?: string;
    note?: string | null;
  };
  if (!body.projectId || typeof body.projectId !== "string") {
    return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
  }

  let note: string | null = null;
  if (typeof body.note === "string") {
    note = body.note.trim().slice(0, MAX_NOTE_LENGTH) || null;
  }

  const project = await prisma.project.findUnique({
    where: { id: body.projectId },
    select: { id: true, status: true },
  });
  // Drafts are invisible to members, so requests against them 404 too
  const isModerator = MODERATOR_ROLES.includes(user.role);
  if (!project || (project.status !== "approved" && !isModerator)) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const existing = await prisma.projectInterest.findUnique({
    where: { projectId_userId: { projectId: project.id, userId: user.id } },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ ok: true, alreadyRequested: true });
  }

  await prisma.projectInterest.create({
    data: { projectId: project.id, userId: user.id, note },
  });

  return NextResponse.json({ ok: true });
}
