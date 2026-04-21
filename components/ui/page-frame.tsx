import type { ReactNode, CSSProperties } from "react";

/**
 * PageFrame — the centered, padded content shell every page wraps around.
 *
 * Default: maxWidth 1040 (token --maxw-content), padding "56px 40px 80px"
 * (token --pad-page-y / --pad-page-x / --space-8). Pass maxWidth or
 * padding to override; pass style for additional per-page tweaks.
 */
export function PageFrame({
  maxWidth,
  padding,
  className,
  children,
  style,
}: {
  maxWidth?: number | string;
  padding?: string;
  className?: string;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{
        maxWidth: maxWidth ?? "var(--maxw-content)",
        margin: "0 auto",
        padding: padding ?? "var(--pad-page-y) var(--pad-page-x) var(--space-8)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
