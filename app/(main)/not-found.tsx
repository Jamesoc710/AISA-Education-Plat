import Link from "next/link";
import { IconTile } from "@/components/ui/icon-tile";

// 404 for pages inside the app (a concept, team or digest week that does not
// exist). Renders inside the (main) shell so the nav stays available.
export default function MainNotFound() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "80px var(--pad-page-x) 48px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-3)",
          boxShadow: "var(--shadow-card)",
          padding: "32px 32px 28px",
          textAlign: "center",
        }}
      >
        <div style={{ display: "inline-flex", marginBottom: "var(--space-4)" }}>
          <IconTile icon="compass" color="indigo" size="lg" />
        </div>
        <h1
          style={{
            margin: "0 0 8px",
            fontSize: "var(--text-lg)",
            fontWeight: 600,
            color: "var(--color-text)",
            letterSpacing: "-0.015em",
          }}
        >
          Page not found
        </h1>
        <p
          style={{
            margin: "0 0 24px",
            fontSize: "var(--text-base)",
            color: "var(--color-text-2)",
            lineHeight: 1.55,
          }}
        >
          That page doesn&apos;t exist, or it was moved. The curriculum is a good place to pick
          back up.
        </p>
        <Link
          href="/browse"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            height: 40,
            padding: "0 18px",
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            color: "#fff",
            backgroundColor: "var(--color-accent)",
            borderRadius: "var(--radius-2)",
            textDecoration: "none",
          }}
        >
          Browse the curriculum
        </Link>
      </div>
    </div>
  );
}
