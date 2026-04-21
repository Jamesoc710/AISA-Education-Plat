import type { CSSProperties, ReactNode } from "react";

/**
 * Squared status tag — the pill-killer.
 *
 * Compact rectangle (r=3) with semantic tones. Use for status/grade/role/
 * score/count labels anywhere a pill chip was used before.
 *
 * If the caller needs a color outside the preset palette (e.g. calendar event
 * types), pass `style={{ backgroundColor, color }}` to override — the tone
 * props are there so 95% of callers never need to.
 */

type Tone =
  | "neutral"
  | "accent"
  | "blue"
  | "green"
  | "red"
  | "gold"
  | "outline";

type Size = "xs" | "sm";

const TONES: Record<Tone, { bg: string; fg: string; border?: string }> = {
  neutral: {
    bg: "var(--color-surface-2)",
    fg: "var(--color-text-2)",
  },
  accent: {
    bg: "var(--color-accent-soft)",
    fg: "var(--color-accent-on-soft)",
  },
  blue: {
    bg: "var(--color-blue-soft)",
    fg: "var(--color-blue)",
  },
  green: {
    bg: "var(--color-correct-dim)",
    fg: "var(--color-correct)",
  },
  red: {
    bg: "var(--color-incorrect-dim)",
    fg: "var(--color-incorrect)",
  },
  gold: {
    bg: "var(--color-gold-soft)",
    fg: "var(--color-gold)",
  },
  outline: {
    bg: "transparent",
    fg: "var(--color-text-2)",
    border: "var(--color-border)",
  },
};

const SIZES: Record<Size, { font: number; padY: number; padX: number }> = {
  xs: { font: 10.5, padY: 2, padX: 6 },
  sm: { font: 11.5, padY: 2, padX: 8 },
};

export function StatusTag({
  tone = "neutral",
  size = "sm",
  uppercase = false,
  children,
  style,
  title,
}: {
  tone?: Tone;
  size?: Size;
  uppercase?: boolean;
  children: ReactNode;
  style?: CSSProperties;
  title?: string;
}) {
  const t = TONES[tone];
  const sz = SIZES[size];

  return (
    <span
      title={title}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: `${sz.padY}px ${sz.padX}px`,
        fontSize: sz.font,
        fontWeight: 600,
        lineHeight: 1.35,
        letterSpacing: uppercase ? "0.05em" : "0.01em",
        textTransform: uppercase ? "uppercase" : undefined,
        borderRadius: 3,
        backgroundColor: t.bg,
        color: t.fg,
        border: t.border ? `1px solid ${t.border}` : undefined,
        whiteSpace: "nowrap",
        flexShrink: 0,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export type StatusTagTone = Tone;
