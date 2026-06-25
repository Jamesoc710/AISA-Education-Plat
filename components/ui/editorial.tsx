/**
 * Editorial-surface primitives, shared across editorial pages (home, the team
 * HQ, and anywhere else carrying data-surface="editorial").
 *
 * Extracted verbatim from home-client.tsx, which re-declared these on every
 * editorial surface. No hooks, no "use client": these render in both server and
 * client components. Values match home exactly so the extraction is visual-neutral
 * (the 11px eyebrow is intentional and below the type ramp's --text-xs of 12px).
 */

/** A 1px divider with configurable vertical breathing room. */
export function HairRule({
  top = 32,
  bottom = 32,
}: {
  top?: number;
  bottom?: number;
}) {
  return (
    <div
      aria-hidden
      style={{
        height: 1,
        backgroundColor: "var(--color-border)",
        margin: `${top}px 0 ${bottom}px`,
      }}
    />
  );
}

/** The uppercase, wide-tracked label that heads each editorial module. */
export function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11, // intentional: below the ramp's --text-xs (12px); matches home
        fontWeight: 600,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "var(--color-text-3)",
        marginBottom: "var(--space-4)",
      }}
    >
      {children}
    </div>
  );
}

/** The small arrow that trails editorial links; nudges right on link hover. */
export function ArrowRight() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

/**
 * The hover behavior for `.editorial-link`: the trailing arrow slides right and
 * an underline sweeps in. Scoped to descendants of data-surface="editorial".
 * Render once per editorial page.
 */
export function EditorialLinkStyles() {
  return (
    <style>{`
      [data-surface="editorial"] .editorial-link {
        position: relative;
      }
      [data-surface="editorial"] .editorial-link svg {
        transition: transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1);
      }
      [data-surface="editorial"] .editorial-link:hover svg {
        transform: translateX(3px);
      }
      [data-surface="editorial"] .editorial-link::after {
        content: "";
        position: absolute;
        left: 0;
        right: 18px;
        bottom: -2px;
        height: 1px;
        background-color: currentColor;
        transform: scaleX(0);
        transform-origin: left;
        transition: transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
      }
      [data-surface="editorial"] .editorial-link:hover::after {
        transform: scaleX(1);
      }
    `}</style>
  );
}
