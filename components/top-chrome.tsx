"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SearchInput } from "@/components/ui/search-input";
import { Icon } from "@/components/ui/icon";
import { createClient } from "@/lib/supabase/client";
import type { ShellUser } from "@/components/main-shell";

/**
 * Sticky top chrome: search input and avatar.
 *
 * Search state syncs with the URL `?q=` param; the page below reads the same
 * param and filters accordingly. This means the page doesn't need to own the
 * search input at all.
 *
 * The search input only renders on pages that actually consume `?q=` — right
 * now that's just /browse. Everywhere else it's hidden to avoid dead UI.
 */
const SEARCHABLE_ROUTES = ["/browse"];

function isSearchable(pathname: string): boolean {
  return SEARCHABLE_ROUTES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function TopChrome({ user }: { user: ShellUser | null }) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const showSearch = isSearchable(pathname);

  // Local state mirrors URL — initialized synchronously to avoid flash
  const [query, setQuery] = useState(() => searchParams?.get("q") ?? "");

  // Sync state -> URL (replace, no scroll, preserves other params)
  const didMount = useRef(false);
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (query.trim()) params.set("q", query.trim());
    else params.delete("q");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // If URL changes externally (e.g. clicking a sidebar tier shortcut), pull it back in
  useEffect(() => {
    const urlQ = searchParams?.get("q") ?? "";
    if (urlQ !== query) setQuery(urlQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        display: "flex",
        alignItems: "center",
        gap: "var(--space-3)",
        height: 60,
        padding: "0 24px",
        backgroundColor: "var(--color-bg)",
        backdropFilter: "saturate(180%) blur(8px)",
      }}
    >
      {showSearch && <SearchInput value={query} onChange={setQuery} width={360} />}

      <div style={{ flex: 1 }} />

      {/* Avatar / sign-in */}
      {user ? <UserMenu user={user} /> : <SignInLink />}
    </header>
  );
}

function SignInLink() {
  return (
    <Link
      href="/login"
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 34,
        padding: "0 14px",
        fontSize: "var(--text-sm)",
        fontWeight: 500,
        color: "#fff",
        backgroundColor: "var(--color-accent)",
        borderRadius: "var(--radius-2)",
        textDecoration: "none",
      }}
    >
      Sign in
    </Link>
  );
}

function UserMenu({ user }: { user: ShellUser }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const initials = (() => {
    const source = (user.name ?? user.email ?? "").trim();
    if (!source) return "—";
    const parts = source.split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return source.slice(0, 2).toUpperCase();
  })();

  const signOut = async () => {
    await supabase.auth.signOut();
    setOpen(false);
    router.refresh();
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 34,
          height: 34,
          borderRadius: "50%",
          border: "none",
          padding: 0,
          cursor: "pointer",
          color: "#fff",
          fontSize: "var(--text-xs)",
          fontWeight: 600,
          fontFamily: "inherit",
          letterSpacing: "0.02em",
          // Indigo gradient — the only gradient in the system
          background: "linear-gradient(135deg, #7B83E5 0%, #5E6AD2 60%, #4953BF 100%)",
        }}
      >
        {initials}
      </button>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 40 }}
          />
          <div
            role="menu"
            style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 8px)",
              width: 220,
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-3)",
              padding: "var(--space-2)",
              zIndex: 50,
              boxShadow: "var(--shadow-popover)",
            }}
          >
            <div
              style={{
                padding: "8px 10px",
                fontSize: "var(--text-xs)",
                color: "var(--color-text-3)",
                borderBottom: "1px solid var(--color-border)",
                marginBottom: "var(--space-1)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user.email}
            </div>
            {user.role === "ADMIN" && (
              <MenuLink href="/admin" onClick={() => setOpen(false)}>
                Admin dashboard
              </MenuLink>
            )}
            <MenuButton onClick={signOut}>
              <Icon name="logout" size={14} strokeWidth={1.85} />
              Sign out
            </MenuButton>
          </div>
        </>
      )}
    </div>
  );
}

function MenuLink({ href, onClick, children }: { href: string; onClick?: () => void; children: React.ReactNode }) {
  const [hov, setHov] = useState(false);
  return (
    <Link
      href={href}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-2)",
        padding: "8px 10px",
        fontSize: "var(--text-sm)",
        fontWeight: 500,
        color: hov ? "var(--color-accent)" : "var(--color-text-2)",
        backgroundColor: hov ? "var(--color-accent-soft)" : "transparent",
        borderRadius: "var(--radius-2)",
        textDecoration: "none",
        transition: "background-color 100ms ease, color 100ms ease",
      }}
    >
      {children}
    </Link>
  );
}

function MenuButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-2)",
        width: "100%",
        padding: "8px 10px",
        fontSize: "var(--text-sm)",
        fontWeight: 500,
        fontFamily: "inherit",
        color: hov ? "var(--color-text)" : "var(--color-text-2)",
        backgroundColor: hov ? "var(--color-surface-2)" : "transparent",
        border: "none",
        borderRadius: "var(--radius-2)",
        cursor: "pointer",
        textAlign: "left",
        transition: "background-color 100ms ease, color 100ms ease",
      }}
    >
      {children}
    </button>
  );
}
