"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { TopChrome } from "@/components/top-chrome";

/**
 * Plays either the standard page-enter fade or, once per signin, the larger
 * `welcome-enter` animation. The welcome flag is set by login-client in
 * sessionStorage just before navigation and consumed here on first mount.
 */
function PageTransition({ children }: { children: ReactNode }) {
  const [isWelcome] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.sessionStorage.getItem("aisa-welcome") === "1";
  });

  useEffect(() => {
    if (isWelcome && typeof window !== "undefined") {
      window.sessionStorage.removeItem("aisa-welcome");
    }
  }, [isWelcome]);

  return (
    <div className={isWelcome ? "welcome-enter" : "page-enter"}>{children}</div>
  );
}

export type ShellUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
};

/**
 * The (main) layout shell.
 *
 * - Wraps its subtree in `data-theme="light"` so light-theme tokens apply.
 *   Pages outside (main) keep the dark default.
 * - Two-column grid: fixed sidebar + scrollable main column with sticky top chrome.
 */
export function MainShell({
  user,
  children,
}: {
  user: ShellUser | null;
  children: ReactNode;
}) {
  const pathname = usePathname() ?? "/";
  return (
    <div
      data-theme="light"
      style={{
        display: "grid",
        gridTemplateColumns: "240px 1fr",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        backgroundColor: "var(--color-bg)",
        color: "var(--color-text)",
        fontFamily: "var(--font-sans)",
      }}
    >
      <Sidebar user={user} />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <TopChrome user={user} />
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            backgroundColor: "var(--color-bg)",
          }}
        >
          {/* key={pathname} remounts on route change so the CSS animation retriggers */}
          <PageTransition key={pathname}>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
