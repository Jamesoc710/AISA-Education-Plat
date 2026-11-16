"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

/** `/login` or `/signup` with the destination carried along. */
export function withNext(path: string, next: string, fallback = "/home"): string {
  return next && next !== fallback ? `${path}?next=${encodeURIComponent(next)}` : path;
}

/**
 * Shared hand-off once the browser holds a session: make sure the profile row
 * exists, flag the welcome entrance for the next page, play the form's exit
 * animation (260ms, matches `.login-exit`), then navigate.
 *
 * Returns false when the profile could not be set up, so the form can say so
 * instead of landing the member on a page that treats them as signed out.
 */
export function useFinishSignIn() {
  const router = useRouter();
  const [exiting, setExiting] = useState(false);

  const finish = useCallback(
    async (next: string, name?: string): Promise<boolean> => {
      try {
        const res = await fetch("/api/auth/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(name ? { name } : {}),
        });
        if (!res.ok) return false;
      } catch {
        return false;
      }
      try {
        window.sessionStorage.setItem("aisa-welcome", "1");
      } catch {
        // Private mode can block storage; the welcome animation is optional.
      }
      setExiting(true);
      await new Promise((resolve) => setTimeout(resolve, 260));
      router.replace(next);
      router.refresh();
      return true;
    },
    [router],
  );

  return { exiting, finish };
}
