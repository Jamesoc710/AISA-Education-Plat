import Link from "next/link";
import { APP_NAME } from "@/lib/brand";

/**
 * The logo and wordmark, linking home. `onDark` is for the auth brand panel;
 * the logo is line art on transparent, so only the wordmark color changes.
 */
export function BrandMark({
  href = "/",
  size = 28,
  onDark = false,
}: {
  href?: string;
  size?: number;
  onDark?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={`${APP_NAME} home`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-2)",
        color: onDark ? "#fff" : "var(--color-text)",
        textDecoration: "none",
        borderRadius: "var(--radius-1)",
      }}
    >
      <img src="/assets/aisa-logo.png" alt="" width={size} height={size} style={{ flexShrink: 0 }} />
      <span
        style={{
          fontSize: "var(--text-md)",
          fontWeight: 600,
          letterSpacing: "-0.015em",
          whiteSpace: "nowrap",
        }}
      >
        {APP_NAME}
      </span>
    </Link>
  );
}
