"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function UserNav() {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ? { email: data.user.email ?? "" } : null);
      setLoading(false);
      if (data.user) {
        fetch("/api/auth/me")
          .then((r) => r.json())
          .then((d) => setRole(d.role))
          .catch(() => {});
      }
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setMenuOpen(false);
    router.refresh();
  };

  if (loading) return null;

  if (!user) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <Link
          href="/dashboard"
          style={{
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--color-text-3)",
            textDecoration: "none",
            padding: "6px 12px",
            borderRadius: "6px",
            transition: "color 0.12s",
          }}
        >
          Dashboard
        </Link>
        <Link
          href="/login"
          style={{
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--color-accent)",
            textDecoration: "none",
            padding: "6px 14px",
            backgroundColor: "var(--color-accent-dim)",
            borderRadius: "6px",
          }}
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <Link
        href="/dashboard"
        style={{
          fontSize: "13px",
          fontWeight: 500,
          color: "var(--color-text-2)",
          textDecoration: "none",
          padding: "6px 12px",
          borderRadius: "6px",
          transition: "color 0.12s",
        }}
      >
        Dashboard
      </Link>
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            backgroundColor: "var(--color-accent)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            fontWeight: 600,
            color: "#fff",
            fontFamily: "inherit",
          }}
        >
          {user.email[0].toUpperCase()}
        </button>

        {menuOpen && (
          <>
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 40,
              }}
              onClick={() => setMenuOpen(false)}
            />
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 8px)",
                width: "200px",
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                padding: "4px",
                zIndex: 50,
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              }}
            >
              <div
                style={{
                  padding: "8px 12px",
                  fontSize: "12px",
                  color: "var(--color-text-3)",
                  borderBottom: "1px solid var(--color-border)",
                  marginBottom: "4px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user.email}
              </div>
              {role === "ADMIN" && (
                <Link
                  href="/admin"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "var(--color-accent)",
                    backgroundColor: "transparent",
                    borderRadius: "6px",
                    textDecoration: "none",
                    transition: "background-color 0.1s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      "var(--color-surface-2)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  Admin Dashboard
                </Link>
              )}
              <button
                onClick={handleSignOut}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: "13px",
                  fontWeight: 500,
                  fontFamily: "inherit",
                  color: "var(--color-text-2)",
                  backgroundColor: "transparent",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background-color 0.1s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    "var(--color-surface-2)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
