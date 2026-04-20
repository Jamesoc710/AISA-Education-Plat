"use client";

import { useState } from "react";
import type { ReactNode, CSSProperties, MouseEventHandler } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md";

const SIZES: Record<Size, { height: number; padX: number; font: number; radius: number; gap: number }> = {
  sm: { height: 28, padX: 10, font: 13, radius: 8,  gap: 6 },
  md: { height: 34, padX: 14, font: 13.5, radius: 10, gap: 7 },
};

export function Button({
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  children,
  onClick,
  type = "button",
  disabled,
  title,
  ariaLabel,
  fullWidth,
  style,
}: {
  variant?: Variant;
  size?: Size;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children?: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  type?: "button" | "submit";
  disabled?: boolean;
  title?: string;
  ariaLabel?: string;
  fullWidth?: boolean;
  style?: CSSProperties;
}) {
  const [hovered, setHovered] = useState(false);
  const sz = SIZES[size];

  const palettes = {
    primary: {
      bg: hovered ? "var(--color-accent-hover)" : "var(--color-accent)",
      color: "#fff",
      border: "1px solid transparent",
      shadow: hovered ? "0 1px 2px rgba(94,106,210,0.25)" : "none",
    },
    secondary: {
      bg: hovered ? "var(--color-surface-2)" : "var(--color-surface)",
      color: "var(--color-text)",
      border: "1px solid var(--color-border)",
      shadow: "none",
    },
    ghost: {
      bg: hovered ? "var(--color-surface-2)" : "transparent",
      color: "var(--color-text-2)",
      border: "1px solid transparent",
      shadow: "none",
    },
  } as const;

  const p = palettes[variant];

  return (
    <button
      type={type}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: `${sz.gap}px`,
        height: `${sz.height}px`,
        padding: `0 ${sz.padX}px`,
        fontSize: `${sz.font}px`,
        fontWeight: 500,
        fontFamily: "inherit",
        lineHeight: 1,
        letterSpacing: "-0.005em",
        backgroundColor: p.bg,
        color: p.color,
        border: p.border,
        borderRadius: `${sz.radius}px`,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        boxShadow: p.shadow,
        transition: "background-color 120ms ease, box-shadow 120ms ease, color 120ms ease",
        whiteSpace: "nowrap",
        width: fullWidth ? "100%" : undefined,
        ...style,
      }}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
}
