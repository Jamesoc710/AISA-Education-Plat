"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordClient() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [focused, setFocused] = useState(false);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/reset-password`
        : undefined;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo },
    );

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
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
            Reset your password
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
            We&rsquo;ll email you a link to set a new one.
          </p>
        </div>

        {sent ? (
          <div
            style={{
              padding: "14px 16px",
              backgroundColor: "var(--color-accent-soft)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-2)",
              fontSize: "var(--text-sm)",
              color: "var(--color-accent-on-soft)",
              lineHeight: 1.5,
            }}
          >
            If an account exists for <strong>{email}</strong>, a reset link is
            on its way. Check your inbox — and your spam folder.
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <label htmlFor="reset-email" style={labelStyle}>
              Email
            </label>
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              required
              placeholder="you@example.com"
              autoComplete="email"
              style={{
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
                boxShadow: focused
                  ? "0 0 0 3px var(--color-accent-dim)"
                  : "none",
                transition: "border-color 120ms ease, box-shadow 120ms ease",
              }}
            />

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

            <button
              type="submit"
              disabled={loading || !email}
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
                cursor: loading || !email ? "not-allowed" : "pointer",
                opacity: loading || !email ? 0.7 : 1,
                letterSpacing: "-0.005em",
                transition: "background-color 120ms ease, opacity 120ms ease",
              }}
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <p
          style={{
            marginTop: 22,
            fontSize: "var(--text-sm)",
            color: "var(--color-text-3)",
            textAlign: "left",
          }}
        >
          Remembered it?{" "}
          <Link href="/login" style={linkStyle}>
            Back to log in
          </Link>
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

const linkStyle: React.CSSProperties = {
  color: "var(--color-accent-on-soft)",
  fontWeight: 600,
  textDecoration: "underline",
  textUnderlineOffset: 2,
};
