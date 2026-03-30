"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    label: "Overview",
    href: "/admin",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    label: "Recruits",
    href: "/admin/recruits",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "Assessments",
    href: "/admin/assessments",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    label: "Homework",
    href: "/admin/homework",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
];

export function AdminShell({
  userName,
  children,
}: {
  userName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "var(--color-bg)" }}>
      {/* ── Sidebar ───────────────────────────────────── */}
      <aside
        style={{
          width: "220px",
          flexShrink: 0,
          borderRight: "1px solid var(--color-border)",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "var(--color-bg)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 16px 12px",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <Link
            href="/browse"
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--color-text)",
              textDecoration: "none",
              letterSpacing: "-0.01em",
            }}
          >
            AISA Atlas
          </Link>
          <div
            style={{
              fontSize: "11px",
              color: "var(--color-accent)",
              fontWeight: 500,
              marginTop: "4px",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Admin
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ padding: "8px", flex: 1 }}>
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 10px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: isActive ? "var(--color-text)" : "var(--color-text-2)",
                  backgroundColor: isActive ? "var(--color-surface)" : "transparent",
                  textDecoration: "none",
                  transition: "background-color 0.1s, color 0.1s",
                  marginBottom: "2px",
                }}
              >
                <span style={{ color: isActive ? "var(--color-accent)" : "var(--color-text-3)", display: "flex" }}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div
          style={{
            padding: "12px 16px",
            borderTop: "1px solid var(--color-border)",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <Link
            href="/browse"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              color: "var(--color-text-3)",
              textDecoration: "none",
              transition: "color 0.1s",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
            Back to Browse
          </Link>
          <div style={{ fontSize: "12px", color: "var(--color-text-3)" }}>
            {userName}
          </div>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────── */}
      <main style={{ flex: 1, overflowY: "auto" }}>
        {children}
      </main>
    </div>
  );
}
