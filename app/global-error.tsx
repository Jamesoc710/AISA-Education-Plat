"use client";

// Last resort: replaces the root layout when it fails, so it brings its own
// document and cannot rely on globals.css or the theme tokens.
export default function GlobalError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          backgroundColor: "#FAF9F5",
          color: "#1F1F22",
          fontFamily: "system-ui, -apple-system, sans-serif",
          textAlign: "center",
        }}
      >
        <title>Something went wrong | AISA Atlas</title>
        <div style={{ maxWidth: 420 }}>
          <h1 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: 600 }}>Something went wrong</h1>
          <p style={{ margin: "0 0 24px", fontSize: "14px", lineHeight: 1.55, color: "#6B6B73" }}>
            The site didn&apos;t load. It&apos;s on our side, not yours. Try again in a moment.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              height: 40,
              padding: "0 18px",
              fontSize: "14px",
              fontWeight: 600,
              fontFamily: "inherit",
              color: "#fff",
              backgroundColor: "#5E6AD2",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
