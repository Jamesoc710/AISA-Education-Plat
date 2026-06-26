import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getTeam } from "@/lib/teams";

export const dynamic = "force-dynamic";

/**
 * POST /api/teams/[slug]/join
 * Writes a TeamMembership row for the authenticated user. Belonging is
 * intentional and decoupled from the content-lens cookie (never written on a
 * lens-switch). Idempotent on @@id([userId, teamSlug]).
 *
 * DORMANT in v1: the masthead shows an Apply popup because applications are not
 * open yet, so nothing calls this from the UI. Kept ready (with the leave route)
 * for when applications open.
 */
export async function POST(
  _req: NextRequest,
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
    return NextResponse.json({ error: "Sign in to join a team" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Account not found" }, { status: 401 });
  }

  await prisma.teamMembership.upsert({
    where: { userId_teamSlug: { userId: user.id, teamSlug: slug } },
    create: { userId: user.id, teamSlug: slug },
    update: {}, // already a member: no-op
  });

  return NextResponse.json({ ok: true, member: true });
}
