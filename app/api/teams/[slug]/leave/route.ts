import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getTeam } from "@/lib/teams";

export const dynamic = "force-dynamic";

/**
 * POST /api/teams/[slug]/leave
 * Deletes the authenticated user's TeamMembership. Sibling of join; leaving is
 * also intentional. A no-op delete (not a member) still returns ok.
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
    return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  }

  await prisma.teamMembership.deleteMany({
    where: { userId: authUser.id, teamSlug: slug },
  });

  return NextResponse.json({ ok: true, member: false });
}
