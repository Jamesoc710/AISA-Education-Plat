"use client";

import type { ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";
import { TopChrome } from "@/components/top-chrome";

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
        fontFamily: "var(--font-inter), system-ui, sans-serif",
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
          {children}
        </main>
      </div>
    </div>
  );
}
