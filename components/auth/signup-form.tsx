"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { authErrorMessage, isValidEmail, MIN_PASSWORD_LENGTH } from "@/lib/auth-errors";
import {
  Alert,
  Field,
  PasswordInput,
  PasswordRule,
  SubmitButton,
  TextInput,
} from "@/components/auth/fields";
import { GoogleButton } from "@/components/auth/google-button";
import { CheckEmail } from "@/components/auth/check-email";
import { useFinishSignIn, withNext } from "@/components/auth/use-finish-sign-in";

type Errors = { name?: string; email?: string; password?: string };

export function SignupForm({ next, googleEnabled }: { next: string; googleEnabled: boolean }) {
  const supabase = createClient();
  const { exiting, finish } = useFinishSignIn();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<React.ReactNode>(null);
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  const emailRedirectTo = () =>
    `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  const signInLink = (
    <Link href={withNext("/login", next)} className="auth-link">
      Sign in instead
    </Link>
  );

  const validate = () => {
    const found: Errors = {};
    if (!name.trim()) found.name = "Enter your name.";
    if (!email.trim()) found.email = "Enter your email.";
    else if (!isValidEmail(email)) found.email = "Enter a valid email, like name@example.com.";
    if (password.length < MIN_PASSWORD_LENGTH) {
      found.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    setErrors(found);
    return Object.keys(found).length === 0;
  };

  const clear = (key: keyof Errors) => {
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setLoading(true);
    const cleanEmail = email.trim();
    const cleanName = name.trim();
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: { data: { name: cleanName }, emailRedirectTo: emailRedirectTo() },
    });

    if (error) {
      setLoading(false);
      if (error.code === "user_already_exists" || error.code === "email_exists") {
        setFormError(<>An account with that email already exists. {signInLink}.</>);
      } else if (error.code === "weak_password") {
        setErrors({ password: authErrorMessage(error, "sign-up") });
      } else {
        setFormError(authErrorMessage(error, "sign-up"));
      }
      return;
    }

    // With email confirmation on, Supabase answers a sign-up for an address
    // that is already registered with a placeholder user that has no
    // identities, and sends no email. Say so instead of promising one.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setLoading(false);
      setFormError(<>An account with that email already exists. {signInLink}.</>);
      return;
    }

    // Confirmation required: no session until they open the emailed link.
    if (!data.session) {
      setLoading(false);
      setPendingEmail(cleanEmail);
      return;
    }

    const ok = await finish(next, cleanName);
    if (!ok) {
      setLoading(false);
      setFormError("Your account was created, but we couldn't finish setting it up. Try signing in.");
    }
  };

  if (pendingEmail) {
    return (
      <CheckEmail
        email={pendingEmail}
        resend={async () => {
          const { error } = await supabase.auth.resend({
            type: "signup",
            email: pendingEmail,
            options: { emailRedirectTo: emailRedirectTo() },
          });
          return error ? authErrorMessage(error, "resend") : null;
        }}
        onBack={() => setPendingEmail(null)}
      >
        We sent a confirmation link to <strong>{pendingEmail}</strong>. Open it to finish
        creating your account. You can open it on any device.
      </CheckEmail>
    );
  }

  return (
    <div className={exiting ? "login-exit" : undefined}>
      <h1 className="auth-title">Create your account</h1>
      <p className="auth-sub">Save your progress and practice what you learn.</p>

      {googleEnabled && (
        <>
          <GoogleButton next={next} onError={setFormError} />
          <div className="auth-divider">or</div>
        </>
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {formError && <Alert tone="error">{formError}</Alert>}

        <Field label="Full name" error={errors.name}>
          {(control) => (
            <TextInput
              control={control}
              type="text"
              name="name"
              autoComplete="name"
              autoFocus
              maxLength={120}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clear("name");
              }}
            />
          )}
        </Field>

        <Field label="Email" error={errors.email}>
          {(control) => (
            <TextInput
              control={control}
              type="email"
              name="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clear("email");
              }}
            />
          )}
        </Field>

        <Field label="Password" error={errors.password} hint={<PasswordRule password={password} />}>
          {(control) => (
            <PasswordInput
              control={control}
              name="new-password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clear("password");
              }}
            />
          )}
        </Field>

        <SubmitButton loading={loading}>
          {loading ? "Creating account" : "Create account"}
        </SubmitButton>
      </form>

      <p className="auth-foot">
        Already have an account?{" "}
        <Link href={withNext("/login", next)} className="auth-link">
          Sign in
        </Link>
      </p>
    </div>
  );
}
