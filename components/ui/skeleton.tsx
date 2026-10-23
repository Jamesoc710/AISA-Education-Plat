import type { CSSProperties, ReactNode } from "react";
import { PageFrame } from "@/components/ui/page-frame";
import { HairRule } from "@/components/ui/editorial";

/**
 * Skeletons for route-level loading.tsx files. Server components with no
 * client JS: the pulse is the `.skeleton` class in globals.css, which stops
 * under prefers-reduced-motion. Each skeleton mirrors its page's real frame
 * (max width + padding) so the swap to real content doesn't shift sideways.
 */

/** One pulsing placeholder bar or block. Decorative, so hidden from AT. */
export function Skeleton({
  width = "100%",
  height,
  radius = "var(--radius-1)",
  style,
}: {
  width?: number | string;
  height: number | string;
  radius?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      aria-hidden
      className="skeleton"
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}

const visuallyHidden: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
};

/** Busy wrapper: screen readers hear one "Loading" instead of empty divs. */
export function LoadingShell({ children }: { children: ReactNode }) {
  return (
    <div aria-busy="true">
      <span role="status" style={visuallyHidden}>
        Loading
      </span>
      {children}
    </div>
  );
}

/** Title, subtitle, then a stack of card rows inside a PageFrame. */
export function PageSkeleton({
  maxWidth,
  padding,
  rows = 3,
}: {
  maxWidth?: number;
  padding?: string;
  rows?: number;
}) {
  return (
    <LoadingShell>
      <PageFrame maxWidth={maxWidth} padding={padding}>
        <Skeleton width="34%" height={32} style={{ marginBottom: "var(--space-3)" }} />
        <Skeleton width="62%" height={16} style={{ marginBottom: "var(--space-6)" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {Array.from({ length: rows }, (_, i) => (
            <Skeleton key={i} height={76} radius="var(--radius-3)" />
          ))}
        </div>
      </PageFrame>
    </LoadingShell>
  );
}

/** The editorial frame shared by home, progress and the digest: oversized headline, ruled sections. */
export function EditorialSkeleton() {
  return (
    <LoadingShell>
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "56px 48px 96px" }}>
        <Skeleton width={200} height={12} style={{ marginBottom: "var(--space-4)" }} />
        <Skeleton width="62%" height="clamp(44px, 6.4vw, 68px)" radius="var(--radius-2)" />

        <HairRule top={44} bottom={40} />

        <Skeleton width={150} height={11} style={{ marginBottom: "var(--space-4)" }} />
        <Skeleton width="48%" height={28} style={{ marginBottom: "var(--space-3)" }} />
        <Skeleton width="30%" height={16} />

        <HairRule top={40} bottom={40} />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.35fr) minmax(0, 1fr)",
            columnGap: "var(--space-7)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <Skeleton width={110} height={11} style={{ marginBottom: "var(--space-1)" }} />
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} height={44} />
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <Skeleton width={90} height={11} style={{ marginBottom: "var(--space-1)" }} />
            <Skeleton height={132} radius="var(--radius-3)" />
          </div>
        </div>
      </div>
    </LoadingShell>
  );
}
