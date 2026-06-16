import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;
  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { role: true },
  });
  if (!user || user.role !== "ADMIN") return null;
  return authUser;
}

/**
 * PATCH /api/admin/trends
 *   { action: "publish" | "unpublish", slug }  -> flip one trend's visibility
 *   { action: "publishAll" }                   -> publish every draft (bootstrap)
 *
 * The Trend Tracker publish gate: drafts are member-invisible, publishing makes
 * them live. Publishing never touches curatedAt (that flag locks a row from the
 * Phase 4 cron) or contentHash, so a published trend still gets cron refreshes.
 */
export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as { action?: string; slug?: string };

  if (body.action === "publishAll") {
    const res = await prisma.trend.updateMany({
      where: { status: "draft" },
      data: { status: "published" },
    });
    return NextResponse.json({ ok: true, action: "publishAll", published: res.count });
  }

  if (body.action === "publish" || body.action === "unpublish") {
    if (!body.slug) return NextResponse.json({ error: "slug required" }, { status: 400 });
    const existing = await prisma.trend.findUnique({
      where: { slug: body.slug },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: "Trend not found" }, { status: 404 });
    const updated = await prisma.trend.update({
      where: { slug: body.slug },
      data: { status: body.action === "publish" ? "published" : "draft" },
      select: { slug: true, status: true },
    });
    return NextResponse.json({ ok: true, ...updated });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

/** POST = sync now. Stubbed until the Phase 4 live cron pipeline ships. */
export async function POST() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(
    { ok: false, error: "Live trend sync ships in a later phase" },
    { status: 501 },
  );
}
