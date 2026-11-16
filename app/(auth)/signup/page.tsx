import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/auth/signup-form";
import { getAuthUser } from "@/lib/supabase/auth";
import { getAuthProviders } from "@/lib/supabase/auth-settings";
import { safeNextPath } from "@/lib/safe-redirect";

export const metadata: Metadata = {
  title: "Create your account",
  description: "Create a TCO account to save your progress and practice what you learn.",
};

type Params = Promise<{ [key: string]: string | string[] | undefined }>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function SignupPage({ searchParams }: { searchParams: Params }) {
  const params = await searchParams;
  const next = safeNextPath(first(params.next) ?? first(params.redirect));

  if (await getAuthUser()) redirect(next);

  const { google } = await getAuthProviders();
  return <SignupForm next={next} googleEnabled={google} />;
}
