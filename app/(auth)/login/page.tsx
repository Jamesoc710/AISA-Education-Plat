import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getAuthUser } from "@/lib/supabase/auth";
import { getAuthProviders } from "@/lib/supabase/auth-settings";
import { landingErrorMessage } from "@/lib/auth-errors";
import { safeNextPath } from "@/lib/safe-redirect";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your AISA Atlas account.",
};

type Params = Promise<{ [key: string]: string | string[] | undefined }>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function LoginPage({ searchParams }: { searchParams: Params }) {
  const params = await searchParams;
  // Older links send ?redirect=; accept both.
  const next = safeNextPath(first(params.next) ?? first(params.redirect));
  const errorCode = first(params.error);

  // Already signed in: go where they were headed. The profile error is the
  // exception, since it is raised for a signed-in person and must be shown.
  const user = await getAuthUser();
  if (user && errorCode !== "profile") redirect(next);

  const { google } = await getAuthProviders();

  return (
    <LoginForm next={next} googleEnabled={google} initialError={landingErrorMessage(errorCode)} />
  );
}
