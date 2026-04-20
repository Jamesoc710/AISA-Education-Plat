/**
 * Pill badge for the three curriculum tiers — soft tint bg + darker text.
 * Stays sentence case per design direction.
 */

const TIER_TOKENS: Record<string, { bg: string; fg: string; label: string }> = {
  fundamentals: { bg: "var(--color-gold-soft)",  fg: "var(--color-gold)",  label: "Fundamentals" },
  intermediate: { bg: "var(--color-blue-soft)",  fg: "var(--color-blue)",  label: "Intermediate" },
  advanced:     { bg: "var(--color-slate-soft)", fg: "var(--color-slate)", label: "Advanced"     },
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
  const dims =
    size === "xs"
      ? { font: 11, padY: 2, padX: 7, radius: 999 }
      : { font: 12, padY: 3, padX: 9, radius: 999 };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: "fit-content",
        padding: `${dims.padY}px ${dims.padX}px`,
        backgroundColor: tokens.bg,
        color: tokens.fg,
        fontSize: `${dims.font}px`,
        fontWeight: 500,
        lineHeight: 1.2,
        letterSpacing: "-0.005em",
        borderRadius: `${dims.radius}px`,
        whiteSpace: "nowrap",
      }}
    >
      {label ?? tokens.label}
    </span>
  );
}
