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
    select: { id: true, approvedAt: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const updated = await prisma.project.update({
    where: { id },
    data: {
      status: body.status,
      // First approval stamps the time; moving back to draft keeps history
      approvedAt:
        body.status === "approved" ? existing.approvedAt ?? new Date() : existing.approvedAt,
    },
    select: { id: true, status: true, approvedAt: true },
  });

  return NextResponse.json(updated);
}
