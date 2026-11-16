import Link from "next/link";
import { IconTile } from "@/components/ui/icon-tile";

/** Card shown in place of a section that is temporarily switched off. */
export function ClosedNotice({ title, body }: { title: string; body: string }) {
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
          <IconTile icon="users" color="indigo" size="lg" />
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
          {title}
        </h1>
        <p
          style={{
            margin: "0 0 24px",
            fontSize: "var(--text-sm)",
            color: "var(--color-text-2)",
            lineHeight: 1.55,
          }}
        >
          {body}
        </p>
        <Link
          href="/home"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: 44,
            padding: "0 18px",
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            color: "#fff",
            backgroundColor: "var(--color-accent)",
            borderRadius: "var(--radius-2)",
            textDecoration: "none",
          }}
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
