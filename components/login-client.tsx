"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type Mode = "login" | "signup";

export function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (mode === "signup") {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

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

  function inputStyle(field: string): React.CSSProperties {
    const focused = focusedField === field;
    return {
      width: "100%",
      padding: "10px 14px",
      fontSize: 13.5,
      fontFamily: "inherit",
      color: "var(--color-text)",
      backgroundColor: "var(--color-surface)",
      border: `1px solid ${focused ? "var(--color-accent)" : "var(--color-border)"}`,
      borderRadius: 8,
      outline: "none",
      boxSizing: "border-box",
      boxShadow: focused ? "0 0 0 3px var(--color-accent-dim)" : "none",
      transition: "border-color 150ms ease, box-shadow 150ms ease",
    };
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "80px 24px 40px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: 28,
            gap: 14,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <h1
              style={{
                margin: "0 0 6px",
                fontSize: 26,
                fontWeight: 600,
                color: "var(--color-text)",
                letterSpacing: "-0.02em",
              }}
            >
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                color: "var(--color-text-2)",
                lineHeight: 1.55,
              }}
            >
              {mode === "login"
                ? "Sign in to track your progress and continue learning."
                : "Start your AI learning journey with AISA Atlas."}
            </p>
          </div>
        </div>

        <div
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 12,
            padding: 24,
            boxShadow: "var(--shadow-card)",
          }}
        >
          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {mode === "signup" && (
                <div>
                  <label htmlFor="auth-name" style={labelStyle}>Name</label>
                  <input
                    id="auth-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => setFocusedField("name")}
                    onBlur={() => setFocusedField(null)}
                    required
                    placeholder="Your name"
                    style={inputStyle("name")}
                  />
                </div>
              )}

              <div>
                <label htmlFor="auth-email" style={labelStyle}>Email</label>
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  required
                  placeholder="you@example.com"
                  style={inputStyle("email")}
                />
              </div>

              <div>
                <label htmlFor="auth-password" style={labelStyle}>Password</label>
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
                  style={inputStyle("password")}
                />
              </div>
            </div>

            {error && (
              <div
                style={{
                  marginTop: 16,
                  padding: "10px 14px",
                  backgroundColor: "var(--color-incorrect-dim)",
                  border: "1px solid var(--color-incorrect)",
                  borderRadius: 8,
                  fontSize: 13,
                  color: "var(--color-incorrect)",
                }}
              >
                {error}
              </div>
            )}

            <div style={{ marginTop: 22 }}>
              <Button
                variant="primary"
                type="submit"
                disabled={loading}
                fullWidth
              >
                {loading
                  ? "Loading..."
                  : mode === "login"
                    ? "Sign in"
                    : "Create account"}
              </Button>
            </div>
          </form>
        </div>

        <p
          style={{
            marginTop: 20,
            fontSize: 13,
            color: "var(--color-text-2)",
            textAlign: "center",
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
                }}
                style={toggleButtonStyle}
              >
                Sign in
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
  fontSize: 12,
  fontWeight: 600,
  color: "var(--color-text-2)",
  marginBottom: 6,
};

const toggleButtonStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "var(--color-accent)",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 13,
  fontWeight: 600,
  padding: 0,
  textDecoration: "underline",
  textUnderlineOffset: 2,
};
