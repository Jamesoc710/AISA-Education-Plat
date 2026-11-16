"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { authErrorMessage } from "@/lib/auth-errors";
import { Alert } from "@/components/auth/fields";
import { useFinishSignIn } from "@/components/auth/use-finish-sign-in";

/**
 * Landing screen for emailed links (`/auth/confirm?token_hash=...&type=...`).
 *
 * The token is only spent when the person presses the button. School and
 * company mail systems open every link in a message to scan it; if opening
 * the page verified the token, the scanner would use it up and the member
 * would see "link expired". Token-hash links also work on any device, unlike
 * the `?code=` links that only work in the browser that asked for them.
 */
export function ConfirmLink({
  tokenHash,
  type,
  next,
}: {
  tokenHash: string | null;
  type: EmailOtpType | null;
  next: string;
}) {
  const router = useRouter();
  const { exiting, finish } = useFinishSignIn();
  const recovery = type === "recovery";

  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState<string | null>(
    tokenHash && type ? null : "This link is incomplete. Open it again from the email.",
  );

  const handleConfirm = async () => {
    if (!tokenHash || !type) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) {
      setLoading(false);
      setFailed(authErrorMessage(error, "confirm"));
      return;
    }

    if (recovery) {
      router.replace("/reset-password");
      return;
    }
    const ok = await finish(next);
    if (!ok) {
      setLoading(false);
      setFailed("Your email is confirmed, but we couldn't load your profile. Try signing in.");
    }
  };

  if (failed) {
    return (
      <div>
        <h1 className="auth-title">{recovery ? "Reset link problem" : "Confirmation link problem"}</h1>
        <div className="auth-stack">
          <Alert tone="error">{failed}</Alert>
          <p className="auth-sub" style={{ margin: 0 }}>
            {recovery
              ? "Request a new link and use it within the hour."
              : "If you already confirmed your email, you can sign in. Otherwise sign in and we'll offer to send a new link."}
          </p>
          <Link
            href={recovery ? "/forgot-password" : "/login"}
            className="auth-btn auth-btn-primary"
          >
            {recovery ? "Send a new link" : "Go to sign in"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={exiting ? "login-exit" : undefined}>
      <h1 className="auth-title">{recovery ? "Reset your password" : "Confirm your email"}</h1>
      <p className="auth-sub">
        {recovery
          ? "Continue to choose a new password for your AISA Atlas account."
          : "One more step: confirm your email to finish creating your AISA Atlas account."}
      </p>
      <button
        type="button"
        className="auth-btn auth-btn-primary"
        onClick={handleConfirm}
        disabled={loading}
        aria-busy={loading || undefined}
        autoFocus
      >
        {loading && <span className="auth-spinner" aria-hidden />}
        {recovery ? "Continue" : "Confirm and continue"}
      </button>
    </div>
  );
}
