import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type AuthUser = { id: string };

/**
 * The signed-in user for page renders, or null. getClaims() verifies the
 * session JWT locally against Supabase's published signing keys (cached), so
 * there is no Auth round trip; cache() shares one result between the layout
 * and the page within a request.
 *
 * Render paths only. API routes and the admin gate keep getUser(), which also
 * rejects sessions revoked server-side; here a revoked session keeps rendering
 * until its access token expires (1h by default).
 */
export const getAuthUser = cache(async (): Promise<AuthUser | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data) return null;
  return { id: data.claims.sub };
});
