import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Local, non-redirecting ADMIN guard (lib/admin.ts redirects and is page-only).
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
 * PATCH /api/admin/benchmarks
 *   { action: "publish" | "unpublish", slug }  -> flip one benchmark's visibility
 *   { action: "publishAll" }                   -> publish every draft (bootstrap)
 *
 * The publish gate, mirroring the Trend Tracker: drafts are member-invisible,
 * publishing makes them live. Publishing never touches curatedAt (which locks a
 * row from the PR2 cron) or contentHash, so a published benchmark still gets
 * future cron refreshes.
 */
export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as { action?: string; slug?: string };

  if (body.action === "publishAll") {
    const res = await prisma.benchmark.updateMany({
      where: { status: "draft" },
      data: { status: "published" },
    });
    return NextResponse.json({ ok: true, action: "publishAll", published: res.count });
  }

  if (body.action === "publish" || body.action === "unpublish") {
    if (!body.slug) return NextResponse.json({ error: "slug required" }, { status: 400 });
    const existing = await prisma.benchmark.findUnique({
      where: { slug: body.slug },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: "Benchmark not found" }, { status: 404 });
    const updated = await prisma.benchmark.update({
      where: { slug: body.slug },
      data: { status: body.action === "publish" ? "published" : "draft" },
      select: { slug: true, status: true },
    });
    return NextResponse.json({ ok: true, ...updated });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

/**
 * POST = Sync now: refresh leaders from the web. Stubbed until PR2 ships the
 * weekly leader cron (the additive sync pipeline). Returns 501 so a caller knows
 * the endpoint exists but is not implemented yet.
 */
export async function POST() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(
    { ok: false, error: "Benchmark sync arrives in PR2 (the weekly leader cron)." },
    { status: 501 },
  );
}
