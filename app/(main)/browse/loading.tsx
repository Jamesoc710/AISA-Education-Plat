import { LoadingShell, Skeleton } from "@/components/ui/skeleton";

/** Mirrors BrowseClient: eyebrow, headline, tier tabs, then one tier of the index. */
export default function BrowseLoading() {
  return (
    <LoadingShell>
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "var(--pad-page-y) var(--pad-wide-x) 96px" }}>
        <Skeleton width={170} height={12} style={{ marginBottom: "var(--space-4)" }} />
        <Skeleton width={210} height="clamp(40px, 5vw, 56px)" radius="var(--radius-2)" />

        <div
          style={{
            display: "flex",
            gap: "var(--space-5)",
            marginTop: "var(--space-6)",
            paddingBottom: "var(--space-3)",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          {[52, 132, 124, 104].map((w, i) => (
            <Skeleton key={i} width={w} height={18} />
          ))}
        </div>

        <div
          style={{
            marginTop: "40px",
            paddingBottom: "var(--space-4)",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <Skeleton width={220} height={34} />
        </div>

        {[3, 2, 2, 4].map((rows, i) => (
          <div key={i} className="browse-section">
            <div style={{ display: "flex", gap: "var(--space-4)" }}>
              <Skeleton width={44} height={44} radius="var(--radius-2)" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Skeleton width="70%" height={22} style={{ marginBottom: "var(--space-2)" }} />
                <Skeleton width="92%" height={14} />
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "var(--space-5) var(--space-6)",
              }}
            >
              {Array.from({ length: rows * 2 }, (_, j) => (
                <div key={j}>
                  <Skeleton width="55%" height={18} style={{ marginBottom: "var(--space-2)" }} />
                  <Skeleton width="88%" height={14} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </LoadingShell>
  );
}
