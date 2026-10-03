"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SearchInput } from "@/components/ui/search-input";
import { Icon, type IconName } from "@/components/ui/icon";
import { FeedbackDialog } from "@/components/feedback-dialog";
import { createClient } from "@/lib/supabase/client";
import type { ShellUser } from "@/components/main-shell";
import type { TeamLink } from "@/lib/teams";

/**
 * Global top navigation: wordmark on the left, the primary links and a
 * Community dropdown (teams, Build board, Calendar) centered, and search
 * (Browse only), feedback and the account menu on the right.
 *
 * Search state syncs with the URL `?q=` param, which /browse reads directly.
 */

const PRIMARY: { href: string; label: string; also?: string[] }[] = [
  { href: "/home", label: "Home" },
  { href: "/browse", label: "Browse", also: ["/concepts"] },
  { href: "/practice", label: "Practice", also: ["/quiz", "/flashcards"] },
  { href: "/dashboard", label: "Progress" },
  { href: "/digest", label: "This week" },
];

const COMMUNITY_PATHS = ["/teams", "/build", "/calendar"];
const SEARCHABLE_ROUTES = ["/browse"];

function matches(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}

export function TopNav({ user, teams }: { user: ShellUser | null; teams: TeamLink[] }) {
  const pathname = usePathname() ?? "";
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const showSearch = SEARCHABLE_ROUTES.some((p) => matches(pathname, p));

  return (
    <header
      style={{
        position: "relative",
        zIndex: 30,
        // Equal side columns keep the links truly centered; a crowded side
        // column (search on Browse at narrow widths) grows instead of overlapping.
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
        columnGap: "var(--space-4)",
        height: 60,
        flexShrink: 0,
        padding: "0 24px",
        backgroundColor: "var(--color-bg)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <Link
        href="/home"
        aria-label="TCO home"
        style={{
          justifySelf: "start",
          display: "block",
          width: 66,
          height: 24,
          overflow: "hidden",
        }}
      >
        {/* The source PNG is mostly padding; crop to the wordmark. */}
        <img
          src="/assets/tco-logo.png"
          alt="TCO"
          width={93}
          height={93}
          style={{ display: "block", maxWidth: "none", margin: "-31px 0 0 -14px" }}
        />
      </Link>

      <nav aria-label="Primary" style={{ display: "flex", alignItems: "center", gap: 2 }}>
        {PRIMARY.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            active={[item.href, ...(item.also ?? [])].some((h) => matches(pathname, h))}
          />
        ))}
        <CommunityMenu
          teams={teams}
          pathname={pathname}
          active={COMMUNITY_PATHS.some((p) => matches(pathname, p))}
        />
      </nav>

      <div
        style={{
          justifySelf: "end",
          display: "flex",
          alignItems: "center",
          gap: "var(--space-2)",
        }}
      >
        {showSearch && <BrowseSearch />}
        <FeedbackButton onClick={() => setFeedbackOpen(true)} />
        {user ? <UserMenu user={user} /> : <SignInLink />}
      </div>

      <FeedbackDialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </header>
  );
}

// ── Primary link ─────────────────────────────────────────────────────────────

const pillStyle = (active: boolean, hov: boolean) =>
  ({
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    height: 34,
    padding: "0 12px",
    borderRadius: "var(--radius-2)",
    fontFamily: "inherit",
    fontSize: "var(--text-sm)",
    fontWeight: active ? 600 : 500,
    letterSpacing: "-0.005em",
    whiteSpace: "nowrap",
    textDecoration: "none",
    border: "none",
    cursor: "pointer",
    color: active ? "var(--color-accent-on-soft)" : hov ? "var(--color-text)" : "var(--color-text-2)",
    backgroundColor: active ? "var(--color-accent-soft)" : hov ? "var(--color-surface-2)" : "transparent",
    transition: "background-color 100ms ease, color 100ms ease",
  }) as const;

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  const [hov, setHov] = useState(false);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={pillStyle(active, hov)}
    >
      {label}
    </Link>
  );
}

// ── Community dropdown ───────────────────────────────────────────────────────

function CommunityMenu({
  teams,
  pathname,
  active,
}: {
  teams: TeamLink[];
  pathname: string;
  active: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [hov, setHov] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  // Close on navigation.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={pillStyle(active, hov || open)}
      >
        Community
        <span
          aria-hidden
          style={{
            display: "inline-flex",
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 150ms ease",
          }}
        >
          <Icon name="chevron-down" size={13} strokeWidth={2} />
        </span>
      </button>

      {open && (
        <div
          id={panelId}
          className="animate-fade-in"
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            // Centered under the trigger. A margin, not a transform: the
            // fade-in animation owns transform.
            left: "50%",
            marginLeft: -150,
            width: 300,
            padding: "var(--space-2)",
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-3)",
            boxShadow: "var(--shadow-popover)",
          }}
        >
          {teams.length > 0 && (
            <>
              <MenuLabel>Teams</MenuLabel>
              {teams.map((t) => (
                <CommunityItem
                  key={t.slug}
                  href={`/teams/${t.slug}`}
                  active={matches(pathname, `/teams/${t.slug}`)}
                  mark={
                    <span
                      aria-hidden
                      style={{ width: 9, height: 9, borderRadius: 999, backgroundColor: t.accent }}
                    />
                  }
                  title={t.displayName}
                />
              ))}
              <div style={{ height: 1, backgroundColor: "var(--color-border)", margin: "6px 4px" }} />
            </>
          )}
          <CommunityItem
            href="/build"
            active={matches(pathname, "/build")}
            mark={<Icon name="hammer" size={16} strokeWidth={1.85} />}
            title="Build board"
            description="Projects members are building"
          />
          <CommunityItem
            href="/calendar"
            active={matches(pathname, "/calendar")}
            mark={<Icon name="calendar" size={16} strokeWidth={1.85} />}
            title="Calendar"
            description="Meetings, workshops and events"
          />
        </div>
      )}
    </div>
  );
}

function MenuLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: "6px 10px 4px",
        fontSize: "var(--text-xs)",
        fontWeight: 600,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: "var(--color-text-3)",
      }}
    >
      {children}
    </div>
  );
}

function CommunityItem({
  href,
  active,
  mark,
  title,
  description,
}: {
  href: string;
  active: boolean;
  mark: React.ReactNode;
  title: string;
  description?: string;
}) {
  const [hov, setHov] = useState(false);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-3)",
        padding: description ? "8px 10px" : "7px 10px",
        borderRadius: "var(--radius-2)",
        textDecoration: "none",
        backgroundColor: active ? "var(--color-accent-soft)" : hov ? "var(--color-surface-2)" : "transparent",
        transition: "background-color 100ms ease",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 28,
          height: 28,
          flexShrink: 0,
          borderRadius: "var(--radius-2)",
          backgroundColor: description ? "var(--color-surface-2)" : "transparent",
          color: "var(--color-text-2)",
        }}
      >
        {mark}
      </span>
      <span style={{ minWidth: 0 }}>
        <span
          style={{
            display: "block",
            fontSize: "var(--text-sm)",
            fontWeight: active ? 600 : 550,
            color: active ? "var(--color-accent-on-soft)" : "var(--color-text)",
          }}
        >
          {title}
        </span>
        {description && (
          <span style={{ display: "block", marginTop: 1, fontSize: "var(--text-xs)", color: "var(--color-text-3)" }}>
            {description}
          </span>
        )}
      </span>
    </Link>
  );
}

// ── Right side ───────────────────────────────────────────────────────────────

function BrowseSearch() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  // Local state mirrors URL; initialized synchronously to avoid a flash.
  const [query, setQuery] = useState(() => searchParams?.get("q") ?? "");

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

  // If the URL changes externally (e.g. a tier filter link), pull it back in.
  useEffect(() => {
    const urlQ = searchParams?.get("q") ?? "";
    if (urlQ !== query) setQuery(urlQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="topnav-search" style={{ flexShrink: 0 }}>
      <SearchInput value={query} onChange={setQuery} width={220} placeholder="Search concepts…" />
    </div>
  );
}

function FeedbackButton({ onClick }: { onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title="Leave feedback"
      aria-label="Leave feedback"
      style={{ ...pillStyle(false, hov), gap: "var(--space-2)", flexShrink: 0 }}
    >
      <Icon name="message-square" size={15} strokeWidth={1.85} />
      <span className="topnav-collapsible-label">Feedback</span>
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
        flexShrink: 0,
        whiteSpace: "nowrap",
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
    <div style={{ position: "relative", marginLeft: "var(--space-1)", flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
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
          // Indigo gradient, the only gradient in the system
          background: "linear-gradient(135deg, #7B83E5 0%, #5E6AD2 60%, #4953BF 100%)",
        }}
      >
        {initials}
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
          <div
            role="menu"
            className="animate-fade-in"
            style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 10px)",
              width: 230,
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
                borderBottom: "1px solid var(--color-border)",
                marginBottom: "var(--space-1)",
                overflow: "hidden",
              }}
            >
              {user.name && (
                <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)" }}>{user.name}</div>
              )}
              <div
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-text-3)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user.email}
              </div>
            </div>
            {user.role === "ADMIN" && (
              <MenuLink href="/admin" icon="shield" onClick={() => setOpen(false)}>
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

function MenuLink({
  href,
  icon,
  onClick,
  children,
}: {
  href: string;
  icon: IconName;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const [hov, setHov] = useState(false);
  return (
    <Link
      href={href}
      role="menuitem"
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
        color: hov ? "var(--color-text)" : "var(--color-text-2)",
        backgroundColor: hov ? "var(--color-surface-2)" : "transparent",
        borderRadius: "var(--radius-2)",
        textDecoration: "none",
        transition: "background-color 100ms ease, color 100ms ease",
      }}
    >
      <Icon name={icon} size={14} strokeWidth={1.85} />
      {children}
    </Link>
  );
}

function MenuButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      role="menuitem"
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
