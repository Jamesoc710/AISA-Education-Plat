import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { addToReview, removeFromReview } from "@/lib/review";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST   /api/review  { conceptId }   add a concept to the review queue, due now
 * DELETE /api/review  { conceptId }   take it out of the queue
 */
async function handle(req: NextRequest, action: "add" | "remove") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { conceptId?: unknown };
  const conceptId = typeof body.conceptId === "string" ? body.conceptId : "";
  const concept = conceptId
    ? await prisma.concept.findUnique({ where: { id: conceptId }, select: { id: true } })
    : null;
  if (!concept) {
    return NextResponse.json({ error: "Concept not found" }, { status: 404 });
  }

  if (action === "add") {
    const item = await addToReview(user.id, conceptId);
    return NextResponse.json({ inReview: true, dueAt: item.dueAt.toISOString() });
  }
  await removeFromReview(user.id, conceptId);
  return NextResponse.json({ inReview: false });
}

export const POST = (req: NextRequest) => handle(req, "add");
export const DELETE = (req: NextRequest) => handle(req, "remove");
