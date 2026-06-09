import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { generateDigest } from "@/lib/digest-sync";

// "Generate now" runs the same minutes-long search loop as the cron
export const maxDuration = 300;

// API-route admin guard (the lib/admin.ts requireAdmin redirects — page-only)
async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return null;
  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { id: true, role: true },
  });
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

/** "Generate now" — runs the digest pipeline; always writes a draft. */
export async function POST() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const result = await generateDigest();
    return NextResponse.json(result, { status: result.ok ? 200 : 500 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

/** Publish / unpublish an edition after human review. */
export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { id?: string; action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { id, action } = body;
  if (!id || (action !== "publish" && action !== "unpublish")) {
    return NextResponse.json(
      { error: 'Expected { id, action: "publish" | "unpublish" }' },
      { status: 400 },
    );
  }

  const edition = await prisma.digestEdition.findUnique({ where: { id } });
  if (!edition) return NextResponse.json({ error: "Edition not found" }, { status: 404 });

  const updated = await prisma.digestEdition.update({
    where: { id },
    data:
      action === "publish"
        ? { status: "published", publishedAt: new Date() }
        : { status: "draft", publishedAt: null },
  });

  return NextResponse.json({
    ok: true,
    id: updated.id,
    weekOf: updated.weekOf.toISOString(),
    status: updated.status,
    publishedAt: updated.publishedAt?.toISOString() ?? null,
  });
}
