import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth/callback
 * Called after Supabase sign-in/sign-up to ensure a User record exists in Prisma.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const name =
    body.name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "User";

  // Upsert: create if new, update name/email if existing
  await prisma.user.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      email: user.email!,
      name,
      role: "RECRUIT",
    },
    update: {
      email: user.email!,
      name,
    },
  });

  return NextResponse.json({ ok: true });
}
