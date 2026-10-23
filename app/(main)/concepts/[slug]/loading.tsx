import { LoadingShell, Skeleton } from "@/components/ui/skeleton";

/**
 * Mirrors ConceptDetailClient: reuses its concept-shell classes so the grid,
 * padding breakpoints and the aside hiding below 1280px all match.
 */
export default function ConceptLoading() {
  return (
    <LoadingShell>
      <div className="concept-shell concept-shell-padding" style={{ maxWidth: 1320, margin: "0 auto" }}>
        <div style={{ minWidth: 0 }}>
          <div className="concept-body-padding">
            <Skeleton width={260} height={13} style={{ marginBottom: "var(--space-6)" }} />
            <Skeleton width={140} height={13} style={{ marginBottom: "var(--space-5)" }} />
            <Skeleton width="58%" height={38} radius="var(--radius-2)" />
            <Skeleton width="80%" height={16} style={{ marginTop: "var(--space-3)" }} />
            <Skeleton width="52%" height={16} style={{ marginTop: "var(--space-2)" }} />
            <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-5)" }}>
              <Skeleton width={128} height={36} radius="var(--radius-2)" />
              <Skeleton width={128} height={36} radius="var(--radius-2)" />
            </div>

            <div
              style={{
                height: 1,
                backgroundColor: "var(--color-border-subtle)",
                margin: "var(--space-6) 0",
              }}
            />

            <Skeleton width={110} height={12} style={{ marginBottom: "var(--space-4)" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              {["96%", "100%", "92%", "98%", "64%"].map((w, i) => (
                <Skeleton key={i} width={w} height={16} />
              ))}
            </div>
          </div>
        </div>

        <aside
          style={{
            alignSelf: "start",
            width: 260,
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-3)",
            padding: "16px 14px 12px",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", padding: "0 4px 12px" }}>
            <Skeleton width={32} height={32} radius="var(--radius-2)" />
            <div style={{ flex: 1 }}>
              <Skeleton width="50%" height={10} style={{ marginBottom: "var(--space-2)" }} />
              <Skeleton width="80%" height={14} />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", padding: "4px 4px 0" }}>
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} height={22} />
            ))}
          </div>
        </aside>
      </div>
    </LoadingShell>
  );
}
