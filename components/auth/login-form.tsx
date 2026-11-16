"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { authErrorMessage, isValidEmail } from "@/lib/auth-errors";
import { Alert, Field, PasswordInput, SubmitButton, TextInput } from "@/components/auth/fields";
import { GoogleButton } from "@/components/auth/google-button";
import { CheckEmail } from "@/components/auth/check-email";
import { useFinishSignIn, withNext } from "@/components/auth/use-finish-sign-in";

export function LoginForm({
  next,
  googleEnabled,
  initialError,
}: {
  next: string;
  googleEnabled: boolean;
  initialError: string | null;
}) {
  const supabase = createClient();
  const { exiting, finish } = useFinishSignIn();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(initialError);
  const [loading, setLoading] = useState(false);
  // Set when the account exists but the email was never confirmed.
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);

  const validate = () => {
    const found: typeof errors = {};
    if (!email.trim()) found.email = "Enter your email.";
    else if (!isValidEmail(email)) found.email = "Enter a valid email, like name@example.com.";
    if (!password) found.password = "Enter your password.";
    setErrors(found);
    return Object.keys(found).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setLoading(false);
      if (error.code === "email_not_confirmed") {
        setUnconfirmedEmail(email.trim());
        return;
      }
      const message = authErrorMessage(error, "sign-in");
      setFormError(
        error.code === "invalid_credentials" && googleEnabled
          ? `${message} If you signed up with Google, use Continue with Google.`
          : message,
      );
      return;
    }

    const ok = await finish(next);
    if (!ok) {
      setLoading(false);
      setFormError("You're signed in, but we couldn't load your profile. Try again.");
    }
  };

  if (unconfirmedEmail) {
    return (
      <CheckEmail
        email={unconfirmedEmail}
        title="Confirm your email"
        resend={async () => {
          const { error } = await supabase.auth.resend({
            type: "signup",
            email: unconfirmedEmail,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
            },
          });
          return error ? authErrorMessage(error, "resend") : null;
        }}
        onBack={() => setUnconfirmedEmail(null)}
        backLabel="Back to sign in"
      >
        Your account exists, but <strong>{unconfirmedEmail}</strong> hasn&apos;t been confirmed
        yet. Open the link we emailed you when you signed up, or have us send a new one.
      </CheckEmail>
    );
  }

  return (
    <div className={exiting ? "login-exit" : undefined}>
      <h1 className="auth-title">Welcome back</h1>
      <p className="auth-sub">Sign in to your TCO account.</p>

      {googleEnabled && (
        <>
          <GoogleButton next={next} onError={setFormError} />
          <div className="auth-divider">or</div>
        </>
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {formError && <Alert tone="error">{formError}</Alert>}

        <Field label="Email" error={errors.email}>
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
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
            />
          )}
        </Field>

        <Field
          label="Password"
          error={errors.password}
          labelAction={
            <Link href="/forgot-password" className="auth-link auth-link-quiet">
              Forgot password?
            </Link>
          }
        >
          {(control) => (
            <PasswordInput
              control={control}
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              }}
            />
          )}
        </Field>

        <SubmitButton loading={loading}>{loading ? "Signing in" : "Sign in"}</SubmitButton>
      </form>

      <p className="auth-foot">
        New to TCO?{" "}
        <Link href={withNext("/signup", next)} className="auth-link">
          Create an account
        </Link>
      </p>
    </div>
  );
}
