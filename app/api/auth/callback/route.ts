import { createClient } from "@/lib/supabase/server";
import { ensureUserRow } from "@/lib/user-profile";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth/callback
 * Called by the auth forms right after a session is created in the browser
 * (password sign-in, sign-up without confirmation, email link, new password)
 * to make sure the member has a profile row. `name` is only sent on sign-up.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { name?: unknown };
  const name = typeof body.name === "string" ? body.name.slice(0, 120) : null;

  try {
    await ensureUserRow(user, name);
  } catch {
    return NextResponse.json({ error: "Could not set up profile" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
