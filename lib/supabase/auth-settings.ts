/**
 * Which sign-in providers are switched on in the Supabase project. Read from
 * the public settings endpoint so "Continue with Google" appears as soon as
 * the provider is enabled in the dashboard, with no env var or redeploy.
 */
export async function getAuthProviders(): Promise<{ google: boolean }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { google: false };
  try {
    const res = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: key },
      next: { revalidate: 60 },
    });
    if (!res.ok) return { google: false };
    const body = (await res.json()) as { external?: Record<string, boolean> };
    return { google: body.external?.google === true };
  } catch {
    return { google: false };
  }
}
