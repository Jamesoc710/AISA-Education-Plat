import { createClient } from "@/lib/supabase/server";
import { ensureUserRow } from "@/lib/user-profile";
import { safeNextPath } from "@/lib/safe-redirect";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /auth/callback
 * Return target for Google sign-in and for email links that still use the
 * PKCE `?code=` flow. Exchanges the code for a session, makes sure the member
 * has a profile row, then redirects to `?next=` (same-site paths only).
 *
 * The code can only be exchanged in the browser that started the flow, so a
 * confirmation link opened on another device fails here. /auth/confirm (token
 * hash) is the flow that works anywhere.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  const fail = (reason: string) => {
    const url = new URL("/login", origin);
    url.searchParams.set("error", reason);
    if (next !== safeNextPath(null)) url.searchParams.set("next", next);
    return NextResponse.redirect(url);
  };

  // The provider sends ?error= when the person cancels or consent fails.
  if (searchParams.get("error")) return fail("oauth");
  if (!code) return fail("link_failed");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return fail("link_failed");

  try {
    await ensureUserRow(data.user);
  } catch {
    return fail("profile");
  }

  return NextResponse.redirect(new URL(next, origin));
}
