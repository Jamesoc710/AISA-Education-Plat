"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { createClient } from "@/lib/supabase/client";
import { MENTOR_EMAILS } from "@/lib/config";
import type { ShellUser } from "@/components/main-shell";

/**
 * Sticky top chrome — search input, notifications, ask a mentor, avatar.
 *
 * Search state syncs with the URL `?q=` param; the page below reads the same
 * param and filters accordingly. This means the page doesn't need to own the
 * search input at all.
 */
export function TopChrome({ user }: { user: ShellUser | null }) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();

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

  const mentorHref = (() => {
    if (MENTOR_EMAILS.length === 0) return "#";
    const subject = encodeURIComponent("Atlas — Mentor question");
    return `mailto:${MENTOR_EMAILS.join(",")}?subject=${subject}`;
  })();

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        display: "flex",
        alignItems: "center",
        gap: 12,
        height: 60,
        padding: "0 24px",
        backgroundColor: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
        backdropFilter: "saturate(180%) blur(8px)",
      }}
    >
      <SearchInput value={query} onChange={setQuery} width={360} />

      <div style={{ flex: 1 }} />

      {/* Ask a mentor */}
      <Button
        variant="secondary"
        size="sm"
        leftIcon={<Icon name="sparkle" size={14} strokeWidth={1.85} />}
        onClick={() => {
          window.location.href = mentorHref;
        }}
      >
        Ask a mentor
      </Button>

      {/* Notifications (visual only for Phase 1) */}
      <IconButton ariaLabel="Notifications">
        <Icon name="bell" size={17} strokeWidth={1.85} />
      </IconButton>

      {/* Avatar / sign-in */}
      {user ? <UserMenu user={user} /> : <SignInLink />}
    </header>
  );
}

function IconButton({
  children,
  onClick,
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  ariaLabel: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={ariaLabel}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 34,
        height: 34,
        backgroundColor: hovered ? "var(--color-surface-2)" : "transparent",
        border: "1px solid transparent",
        borderRadius: 9,
        cursor: "pointer",
        color: hovered ? "var(--color-text)" : "var(--color-text-2)",
        transition: "background-color 120ms ease, color 120ms ease",
      }}
    >
      {children}
    </button>
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
        fontSize: 13,
        fontWeight: 500,
        color: "#fff",
        backgroundColor: "var(--color-accent)",
        borderRadius: 10,
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
    if (!source) return "?";
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
          fontSize: 12,
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
              borderRadius: 12,
              padding: 6,
              zIndex: 50,
              boxShadow: "var(--shadow-popover)",
            }}
          >
            <div
              style={{
                padding: "8px 10px",
                fontSize: 12,
                color: "var(--color-text-3)",
                borderBottom: "1px solid var(--color-border)",
                marginBottom: 4,
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
        gap: 8,
        padding: "8px 10px",
        fontSize: 13,
        fontWeight: 500,
        color: hov ? "var(--color-accent)" : "var(--color-text-2)",
        backgroundColor: hov ? "var(--color-accent-soft)" : "transparent",
        borderRadius: 8,
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
        gap: 8,
        width: "100%",
        padding: "8px 10px",
        fontSize: 13,
        fontWeight: 500,
        fontFamily: "inherit",
        color: hov ? "var(--color-text)" : "var(--color-text-2)",
        backgroundColor: hov ? "var(--color-surface-2)" : "transparent",
        border: "none",
        borderRadius: 8,
        cursor: "pointer",
        textAlign: "left",
        transition: "background-color 100ms ease, color 100ms ease",
      }}
    >
      {children}
    </button>
  );
}
