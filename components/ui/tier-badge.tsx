/**
 * Tier label — uppercase tier-colored text (no pill wrapper).
 */

const TIER_TOKENS: Record<string, { fg: string; label: string }> = {
  fundamentals: { fg: "var(--color-gold)",  label: "Fundamentals" },
  intermediate: { fg: "var(--color-blue)",  label: "Intermediate" },
  advanced:     { fg: "var(--color-slate)", label: "Advanced"     },
};

export function TierBadge({
  slug,
  label,
  size = "sm",
}: {
  slug: string;
  /** Optional override; defaults to capitalized tier name */
  label?: string;
  size?: "xs" | "sm";
}) {
  const tokens = TIER_TOKENS[slug] ?? TIER_TOKENS.fundamentals;
  const fontSize = size === "xs" ? 10.5 : 11;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: "fit-content",
        color: tokens.fg,
        fontSize: `${fontSize}px`,
        fontWeight: 600,
        lineHeight: 1.2,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {label ?? tokens.label}
    </span>
  );
}
