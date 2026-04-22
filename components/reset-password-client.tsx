"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

/**
 * Lands here from the password-reset email. Supabase's link exchanges the
 * code for a session via the detectSessionInUrl flow on the client, so by
 * the time this renders there's either:
 *   (a) a valid session — user can set a new password
 *   (b) no session (link expired/used) — we nudge them back to /forgot-password
 */
export function ResetPasswordClient() {
  const router = useRouter();
  const supabase = createClient();

  const [status, setStatus] = useState<"checking" | "ready" | "invalid">(
    "checking",
  );
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setStatus(data.session ? "ready" : "invalid");
    });
    return () => {
      alive = false;
    };
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  const inputStyle = (field: string): React.CSSProperties => {
    const isFocused = focused === field;
    return {
      width: "100%",
      padding: "11px 14px",
      fontSize: "var(--text-sm)",
      fontFamily: "inherit",
      color: "var(--color-text)",
      backgroundColor: "var(--color-surface)",
      border: `1px solid ${isFocused ? "var(--color-accent)" : "var(--color-border)"}`,
      borderRadius: "var(--radius-2)",
      outline: "none",
      boxSizing: "border-box",
      boxShadow: isFocused ? "0 0 0 3px var(--color-accent-dim)" : "none",
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
            Choose a new password
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
            You&rsquo;ll be signed in after this.
          </p>
        </div>

        {status === "checking" && (
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-3)" }}>
            Verifying your reset link…
          </p>
        )}

        {status === "invalid" && (
          <div
            style={{
              padding: "12px 14px",
              backgroundColor: "var(--color-incorrect-dim)",
              border: "1px solid var(--color-incorrect)",
              borderRadius: "var(--radius-2)",
              fontSize: "var(--text-sm)",
              color: "var(--color-incorrect)",
              lineHeight: 1.5,
            }}
          >
            This reset link is expired or has already been used.{" "}
            <Link
              href="/forgot-password"
              style={{
                color: "var(--color-incorrect)",
                fontWeight: 600,
                textDecoration: "underline",
                textUnderlineOffset: 2,
              }}
            >
              Request a new one
            </Link>
            .
          </div>
        )}

        {status === "ready" && (
          <form onSubmit={handleSubmit} noValidate>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label htmlFor="new-password" style={labelStyle}>
                  New password
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  style={inputStyle("password")}
                />
              </div>

              <div>
                <label htmlFor="confirm-password" style={labelStyle}>
                  Confirm new password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onFocus={() => setFocused("confirm")}
                  onBlur={() => setFocused(null)}
                  required
                  minLength={6}
                  placeholder="Repeat it"
                  autoComplete="new-password"
                  style={inputStyle("confirm")}
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
            >
              {loading ? "Saving…" : "Set new password"}
            </button>
          </form>
        )}
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
