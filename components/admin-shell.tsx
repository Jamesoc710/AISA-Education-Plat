"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/icon";

const NAV_ITEMS: { label: string; href: string; icon: IconName }[] = [
  { label: "Overview", href: "/admin", icon: "grid" },
  { label: "Recruits", href: "/admin/recruits", icon: "users" },
  { label: "Assessments", href: "/admin/assessments", icon: "clipboard-check" },
  { label: "Homework", href: "/admin/homework", icon: "book-open" },
  { label: "Feedback", href: "/admin/feedback", icon: "message-square" },
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
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "40px 40px 80px",
      }}
    >
      <div style={{ marginBottom: "var(--space-5)" }}>
        <div
          style={{
            fontSize: "var(--text-xs)",
            fontWeight: 600,
            color: "var(--color-accent)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: "var(--space-2)",
          }}
        >
          Admin
        </div>
        <h1
          style={{
            margin: "0 0 4px",
            fontSize: "var(--text-2xl)",
            fontWeight: 600,
            color: "var(--color-text)",
            letterSpacing: "-0.02em",
          }}
        >
          Mentor console
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: "var(--text-sm)",
            color: "var(--color-text-3)",
          }}
        >
          Signed in as {userName}
        </p>
      </div>

      <nav
        style={{
          display: "flex",
          gap: "var(--space-1)",
          borderBottom: "1px solid var(--color-border)",
          marginBottom: "var(--space-6)",
        }}
      >
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
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--space-2)",
                padding: "10px 14px",
                fontSize: "var(--text-sm)",
                fontWeight: 500,
                color: isActive
                  ? "var(--color-text)"
                  : "var(--color-text-2)",
                borderBottom: `2px solid ${isActive ? "var(--color-accent)" : "transparent"}`,
                marginBottom: -1,
                textDecoration: "none",
                transition: "color 150ms ease, border-color 150ms ease",
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.color = "var(--color-text)";
              }}
              onMouseLeave={(e) => {
                if (!isActive)
                  e.currentTarget.style.color = "var(--color-text-2)";
              }}
            >
              <Icon
                name={item.icon}
                size={14}
                strokeWidth={2}
                style={{
                  color: isActive
                    ? "var(--color-accent)"
                    : "var(--color-text-3)",
                }}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div>{children}</div>
    </div>
  );
}
