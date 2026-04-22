"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";

export function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";
  const incomingError = searchParams.get("error");

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    incomingError ? decodeURIComponent(incomingError) : null,
  );
  const [info, setInfo] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    if (mode === "signup") {
      const emailRedirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirect)}`
          : undefined;

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name }, emailRedirectTo },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      // If the project has "Confirm email" ON (Supabase default), signUp
      // returns no session — the user must click the link in their inbox,
      // which routes through /auth/callback and creates the Prisma row there.
      if (!data.session) {
        setInfo(`Check ${email} for a link to confirm your account.`);
        setLoading(false);
        return;
      }

      // Confirmation is off — we have a session, so create the Prisma row now.
      const res = await fetch("/api/auth/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        setError("Account created but failed to set up profile. Try signing in.");
        setLoading(false);
        return;
      }

      router.push(redirect);
      router.refresh();
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      await fetch("/api/auth/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      router.push(redirect);
      router.refresh();
    }
  };

  const inputStyle = (field: string): React.CSSProperties => {
    const focused = focusedField === field;
    return {
      width: "100%",
      padding: "11px 14px",
      fontSize: "var(--text-sm)",
      fontFamily: "inherit",
      color: "var(--color-text)",
      backgroundColor: "var(--color-surface)",
      border: `1px solid ${focused ? "var(--color-accent)" : "var(--color-border)"}`,
      borderRadius: "var(--radius-2)",
      outline: "none",
      boxSizing: "border-box",
      boxShadow: focused ? "0 0 0 3px var(--color-accent-dim)" : "none",
      transition: "border-color 120ms ease, box-shadow 120ms ease",
    };
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "72px 24px 48px",
        minHeight: "100vh",
      }}
    >
      <div style={{ width: "100%", maxWidth: 380 }}>
        {/* Heading */}
        <div style={{ marginBottom: 32 }}>
          <h1
            style={{
              margin: "0 0 4px",
              fontSize: 28,
              fontWeight: 700,
              color: "var(--color-text)",
              letterSpacing: "-0.025em",
              lineHeight: 1.2,
            }}
          >
            {mode === "login" ? "Welcome back." : "Let's get started."}
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 400,
              color: "var(--color-text-3)",
              letterSpacing: "-0.01em",
              lineHeight: 1.35,
            }}
          >
            {mode === "login"
              ? "Log in to your TCO account"
              : "Create your TCO account"}
          </p>
        </div>

        {/* Email / password form */}
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {mode === "signup" && (
              <div>
                <label htmlFor="auth-name" style={labelStyle}>
                  Name
                </label>
                <input
                  id="auth-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={() => setFocusedField("name")}
                  onBlur={() => setFocusedField(null)}
                  required
                  placeholder="Your name"
                  autoComplete="name"
                  style={inputStyle("name")}
                />
              </div>
            )}

            <div>
              <label htmlFor="auth-email" style={labelStyle}>
                Email
              </label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                required
                placeholder="you@example.com"
                autoComplete="email"
                style={inputStyle("email")}
              />
              <p
                style={{
                  margin: "6px 2px 0",
                  fontSize: "var(--text-xs)",
                  color: "var(--color-text-3)",
                  lineHeight: 1.45,
                }}
              >
                Use an organization email, if you have one.
              </p>
            </div>

            <div>
              <label htmlFor="auth-password" style={labelStyle}>
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                required
                minLength={6}
                placeholder="At least 6 characters"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                style={inputStyle("password")}
              />
            </div>
          </div>

          {error && (
            <div
              style={{
                marginTop: 14,
                padding: "10px 12px",
                backgroundColor: "var(--color-incorrect-dim)",
                border: "1px solid var(--color-incorrect)",
                borderRadius: "var(--radius-2)",
                fontSize: "var(--text-sm)",
                color: "var(--color-incorrect)",
                lineHeight: 1.4,
              }}
            >
              {error}
            </div>
          )}

          {info && !error && (
            <div
              style={{
                marginTop: 14,
                padding: "10px 12px",
                backgroundColor: "var(--color-accent-soft)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-2)",
                fontSize: "var(--text-sm)",
                color: "var(--color-accent-on-soft)",
                lineHeight: 1.4,
              }}
            >
              {info}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 18,
              width: "100%",
              height: 44,
              padding: "0 18px",
              fontSize: "var(--text-sm)",
              fontWeight: 600,
              fontFamily: "inherit",
              color: "#fff",
              backgroundColor: "var(--color-accent)",
              border: "none",
              borderRadius: "var(--radius-2)",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              letterSpacing: "-0.005em",
              transition: "background-color 120ms ease, opacity 120ms ease",
            }}
            onMouseEnter={(e) => {
              if (!loading)
                e.currentTarget.style.backgroundColor = "var(--color-accent-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--color-accent)";
            }}
          >
            {loading ? "Continuing…" : "Continue"}
          </button>
        </form>

        {/* Mode toggle */}
        <p
          style={{
            marginTop: 22,
            fontSize: "var(--text-sm)",
            color: "var(--color-text-3)",
            textAlign: "left",
          }}
        >
          {mode === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                  setInfo(null);
                }}
                style={toggleButtonStyle}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                  setInfo(null);
                }}
                style={toggleButtonStyle}
              >
                Log in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "var(--text-xs)",
  fontWeight: 600,
  color: "var(--color-text-2)",
  marginBottom: 6,
  letterSpacing: "-0.005em",
};

const toggleButtonStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "var(--color-accent-on-soft)",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: "var(--text-sm)",
  fontWeight: 600,
  padding: 0,
  textDecoration: "underline",
  textUnderlineOffset: 2,
};
