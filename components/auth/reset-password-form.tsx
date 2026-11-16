"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { authErrorMessage, MIN_PASSWORD_LENGTH } from "@/lib/auth-errors";
import { Alert, Field, PasswordInput, PasswordRule, SubmitButton } from "@/components/auth/fields";
import { useFinishSignIn } from "@/components/auth/use-finish-sign-in";

/**
 * Reached from the reset email. By the time this renders there is either a
 * session (set by /auth/confirm, or by the browser client exchanging a
 * `?code=` from an older-style link during its startup) or the link was
 * expired or already used.
 */
export function ResetPasswordForm() {
  const supabase = createClient();
  const { exiting, finish } = useFinishSignIn();

  const [status, setStatus] = useState<"checking" | "ready" | "invalid">("checking");
  const [password, setPassword] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    // getSession waits for the client to finish reading the URL.
    supabase.auth.getSession().then(({ data }) => {
      if (alive) setStatus(data.session ? "ready" : "invalid");
    });
    return () => {
      alive = false;
    };
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (password.length < MIN_PASSWORD_LENGTH) {
      return setFieldError(`Use at least ${MIN_PASSWORD_LENGTH} characters.`);
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setLoading(false);
      if (error.code === "weak_password" || error.code === "same_password") {
        return setFieldError(authErrorMessage(error, "reset"));
      }
      return setFormError(authErrorMessage(error, "reset"));
    }

    const ok = await finish("/home");
    if (!ok) {
      setLoading(false);
      setFormError("Your password was changed, but we couldn't load your profile. Try signing in.");
    }
  };

  if (status === "checking") {
    return (
      <div role="status" aria-busy="true">
        <h1 className="auth-title">Choose a new password</h1>
        <p className="auth-sub">Checking your link...</p>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div>
        <h1 className="auth-title">This link has expired</h1>
        <p className="auth-sub">
          Reset links work once and expire after an hour. Request a new one and use it right
          away.
        </p>
        <Link href="/forgot-password" className="auth-btn auth-btn-primary">
          Send a new link
        </Link>
        <p className="auth-foot">
          <Link href="/login" className="auth-link">
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className={exiting ? "login-exit" : undefined}>
      <h1 className="auth-title">Choose a new password</h1>
      <p className="auth-sub">You&apos;ll be signed in as soon as it&apos;s saved.</p>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {formError && <Alert tone="error">{formError}</Alert>}

        <Field
          label="New password"
          error={fieldError}
          hint={<PasswordRule password={password} />}
        >
          {(control) => (
            <PasswordInput
              control={control}
              name="new-password"
              autoComplete="new-password"
              autoFocus
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldError) setFieldError(null);
              }}
            />
          )}
        </Field>

        <SubmitButton loading={loading}>{loading ? "Saving" : "Save password"}</SubmitButton>
      </form>
    </div>
  );
}
