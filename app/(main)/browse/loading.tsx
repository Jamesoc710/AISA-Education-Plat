import { LoadingShell, Skeleton } from "@/components/ui/skeleton";

/** Mirrors BrowseClient: track pills, header, tier pills, then railed section rows. */
export default function BrowseLoading() {
  return (
    <LoadingShell>
      <div style={{ padding: "32px 32px 80px" }}>
        <div style={{ maxWidth: 1040, margin: "0 auto" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", marginBottom: "var(--space-5)" }}>
            <Skeleton width={150} height={34} radius="999px" />
            <Skeleton width={156} height={34} radius="999px" />
          </div>

          <Skeleton width={260} height={32} style={{ marginBottom: "var(--space-2)" }} />
          <Skeleton width="58%" height={16} style={{ marginBottom: "var(--space-6)" }} />

          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", marginBottom: "var(--space-5)" }}>
            {[46, 113, 105, 89].map((w, i) => (
              <Skeleton key={i} width={w} height={34} radius="999px" />
            ))}
          </div>

          <div style={{ height: 28, marginBottom: "var(--space-2)" }} />

          <div className="browse-sections">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} style={{ display: "flex", alignItems: "stretch", gap: "var(--space-4)" }}>
                <Skeleton width={3} height="auto" />
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                    gap: "var(--space-4)",
                    padding: "8px 4px 8px 0",
                  }}
                >
                  <Skeleton width={44} height={44} radius="var(--radius-2)" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Skeleton width="28%" height={24} style={{ marginBottom: "var(--space-2)" }} />
                    <Skeleton width="60%" height={16} style={{ marginBottom: "var(--space-3)" }} />
                    <Skeleton width="44%" height={16} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </LoadingShell>
  );
}
