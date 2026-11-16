import type { Metadata } from "next";
import type { EmailOtpType } from "@supabase/supabase-js";
import { ConfirmLink } from "@/components/auth/confirm-link";
import { safeNextPath } from "@/lib/safe-redirect";

export const metadata: Metadata = {
  title: "Confirm your email | TCO",
  // Links carry a one-time token; keep them out of search results and referrers.
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

const TYPES: EmailOtpType[] = ["signup", "email", "recovery", "invite", "magiclink", "email_change"];

type Params = Promise<{ [key: string]: string | string[] | undefined }>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function ConfirmPage({ searchParams }: { searchParams: Params }) {
  const params = await searchParams;
  const rawType = first(params.type);
  const type = TYPES.find((t) => t === rawType) ?? null;

  return (
    <ConfirmLink
      tokenHash={first(params.token_hash) ?? null}
      type={type}
      next={safeNextPath(first(params.next))}
    />
  );
}
