import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { MODERATOR_ROLES } from "@/lib/build";

export const dynamic = "force-dynamic";

async function requireModerator() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;
  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { role: true },
  });
  if (!user || !MODERATOR_ROLES.includes(user.role)) return null;
  return authUser;
}

/**
 * PATCH /api/admin/projects/[id]  { status: "draft" | "approved" }
 * The Build Board publish gate: ADMIN or PROJECT_LEAD flips a project between
 * draft (member-invisible) and approved (live on the board).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const moderator = await requireModerator();
  if (!moderator) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { status?: string };
  if (body.status !== "draft" && body.status !== "approved") {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const existing = await prisma.project.findUnique({
    where: { id },
    select: { id: true, approvedAt: true, createdById: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const approving = body.status === "approved";

  // One transaction: flip status, and for a self-serve project (createdById set
  // at POST) write the creator's Lead assignment at approval so the team is
  // never empty. Seeded projects have no createdById, so their teams stay owned
  // by the seed file (the seeder deleteMany-wipes assignments each run, which
  // would otherwise eat a Lead row written here).
  const updated = await prisma.$transaction(async (tx) => {
    const project = await tx.project.update({
      where: { id },
      data: {
        status: body.status,
        // First approval stamps the time; moving back to draft keeps history
        approvedAt: approving ? existing.approvedAt ?? new Date() : existing.approvedAt,
      },
      select: { id: true, status: true, approvedAt: true },
    });
    if (approving && existing.createdById) {
      await tx.projectAssignment.upsert({
        where: { userId_projectId: { userId: existing.createdById, projectId: id } },
        create: { userId: existing.createdById, projectId: id, role: "Lead" },
        update: {}, // already on the team: keep their existing role
      });
    }
    return project;
  });

  return NextResponse.json(updated);
}

/**
 * DELETE /api/admin/projects/[id]
 * Deny a pending post: deletes a DRAFT project (its assignments are removed
 * explicitly; interests cascade via the schema). Restricted to drafts, so this
 * can never delete a live, member-visible project by mistake.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const moderator = await requireModerator();
  if (!moderator) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.project.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  if (existing.status !== "draft") {
    return NextResponse.json(
      { error: "Only draft posts can be denied. Move it back to draft first." },
      { status: 400 },
    );
  }

  await prisma.$transaction([
    prisma.projectAssignment.deleteMany({ where: { projectId: id } }),
    prisma.project.delete({ where: { id } }),
  ]);

  return NextResponse.json({ ok: true });
}
