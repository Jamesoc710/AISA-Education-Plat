"use client";

import { useState } from "react";
import { BenchmarksClient, CategoryTab } from "@/components/benchmarks-client";
import { UseCaseExplorerClient } from "@/components/use-case-explorer-client";
import type { BenchmarkCardData } from "@/lib/benchmarks";
import type { UseCaseCardData } from "@/lib/use-cases";

/**
 * The /benchmarks hub. One route, two doors: a ghost-text [By task] | The
 * Standings toggle (the exported CategoryTab visual) over the same editorial
 * surface. "By task" is the default landing because the audience arrives with a
 * task, not a benchmark name; "The Standings" is the unchanged PR1 trust list one
 * click away. BenchmarksClient is rendered verbatim, so the trust spine becomes
 * one of two doors, never replaced or relocated.
 *
 * The toggle sits in a slim top bar so it stays in the same place across both
 * modes (no jump); each sub-view renders its own editorial shell and header
 * below it.
 */
export function BenchmarksHubClient({
  benchmarks,
  useCases,
  isAdmin,
}: {
  benchmarks: BenchmarkCardData[];
  useCases: UseCaseCardData[];
  isAdmin: boolean;
}) {
  // Default to "By task", but fall back to "The Standings" when no use case is
  // visible (e.g. a member before the drafts are published), so the default
  // landing is never an empty page and never regresses the PR1 member experience.
  const [mode, setMode] = useState<"task" | "standings">(
    useCases.length > 0 ? "task" : "standings",
  );

  return (
    <div data-surface="editorial" style={{ backgroundColor: "var(--color-bg)" }}>
      {/* Mode toggle: the counts are the two doors' sizes (11 tasks, 22 boards). */}
      <div style={{ maxWidth: "var(--maxw-content)", margin: "0 auto", padding: "40px 40px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
          <CategoryTab
            label="By task"
            count={useCases.length}
            active={mode === "task"}
            onClick={() => setMode("task")}
          />
          <CategoryTab
            label="The Standings"
            count={benchmarks.length}
            active={mode === "standings"}
            onClick={() => setMode("standings")}
          />
        </div>
      </div>

      {mode === "task" ? (
        <UseCaseExplorerClient useCases={useCases} onShowStandings={() => setMode("standings")} />
      ) : (
        <BenchmarksClient benchmarks={benchmarks} isAdmin={isAdmin} />
      )}
    </div>
  );
}
