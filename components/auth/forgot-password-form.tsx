"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { authErrorMessage, isValidEmail } from "@/lib/auth-errors";
import { Alert, Field, SubmitButton, TextInput } from "@/components/auth/fields";
import { CheckEmail } from "@/components/auth/check-email";

export function ForgotPasswordForm() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  // Supabase does not say whether the address has an account, and neither do
  // we: every valid address gets the same "check your email" screen. Only
  // rate limits and network failures are reported.
  const send = async (address: string): Promise<string | null> => {
    const { error } = await supabase.auth.resetPasswordForEmail(address, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (!error) return null;
    const limited = error.status === 429 || (error.code ?? "").startsWith("over_");
    const offline = error.message.toLowerCase().includes("fetch");
    return limited || offline ? authErrorMessage(error, "forgot") : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const address = email.trim();
    if (!address) return setEmailError("Enter your email.");
    if (!isValidEmail(address)) return setEmailError("Enter a valid email, like name@example.com.");

    setLoading(true);
    const error = await send(address);
    setLoading(false);
    if (error) return setFormError(error);
    setSentTo(address);
  };

  if (sentTo) {
    return (
      <CheckEmail email={sentTo} resend={() => send(sentTo)} onBack={() => setSentTo(null)}>
        If <strong>{sentTo}</strong> has a TCO account, a link to choose a new password is on
        its way. The link works once and expires after an hour.
      </CheckEmail>
    );
  }

  return (
    <div>
      <h1 className="auth-title">Reset your password</h1>
      <p className="auth-sub">Enter your email and we&apos;ll send a link to choose a new one.</p>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {formError && <Alert tone="error">{formError}</Alert>}

        <Field label="Email" error={emailError}>
          {(control) => (
            <TextInput
              control={control}
              type="email"
              name="email"
              inputMode="email"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoFocus
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(null);
              }}
            />
          )}
        </Field>

        <SubmitButton loading={loading}>{loading ? "Sending" : "Send reset link"}</SubmitButton>
      </form>

      <p className="auth-foot">
        <Link href="/login" className="auth-link">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
