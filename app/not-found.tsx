import Link from "next/link";

export default function NotFound() {
  return (
    <div
      data-theme="light"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "var(--color-bg)",
        padding: "24px",
        textAlign: "center",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/tco-logo.png"
        alt="TCO"
        style={{ width: "48px", height: "48px", marginBottom: "24px", opacity: 0.5 }}
      />

      <h1
        style={{
          margin: "0 0 8px",
          fontSize: "20px",
          fontWeight: 600,
          color: "var(--color-text)",
          letterSpacing: "-0.02em",
        }}
      >
        Page not found
      </h1>

      <p
        style={{
          margin: "0 0 32px",
          fontSize: "14px",
          color: "var(--color-text-3)",
          lineHeight: "1.6",
          maxWidth: "360px",
        }}
      >
        The concept or page you're looking for doesn't exist or may have been
        moved.
      </p>

      <div style={{ display: "flex", gap: "10px" }}>
        <Link
          href="/browse"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "10px 20px",
            fontSize: "13px",
            fontWeight: 500,
            color: "#fff",
            backgroundColor: "var(--color-accent)",
            border: "none",
            borderRadius: "6px",
            textDecoration: "none",
            transition: "opacity 0.12s",
          }}
        >
          Browse Concepts
        </Link>
        <Link
          href="/quiz"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "10px 20px",
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--color-text-2)",
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "6px",
            textDecoration: "none",
            transition: "background-color 0.12s",
          }}
        >
          Take a Quiz
        </Link>
      </div>
    </div>
  );
}
