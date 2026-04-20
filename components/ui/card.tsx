"use client";

import { useState } from "react";
import type { ReactNode, CSSProperties } from "react";

/**
 * Base card primitive — rounded, white, subtle border, soft shadow.
 * Supports optional hover lift (use for clickable cards).
 *
 * Composes via children — pass any layout you want inside.
 */
export function Card({
  as: Tag = "div",
  interactive,
  padding = 20,
  radius = 14,
  children,
  onClick,
  ariaLabel,
  ariaExpanded,
  style,
  className,
}: {
  as?: "div" | "button" | "a" | "section";
  interactive?: boolean;
  padding?: number | string;
  radius?: number;
  children: ReactNode;
  onClick?: () => void;
  ariaLabel?: string;
  ariaExpanded?: boolean;
  style?: CSSProperties;
  className?: string;
}) {
  const [hovered, setHovered] = useState(false);

  const elementProps: Record<string, unknown> =
    Tag === "button"
      ? {
          onClick,
          type: "button",
          "aria-label": ariaLabel,
          "aria-expanded": ariaExpanded,
        }
      : { onClick, "aria-label": ariaLabel };

  return (
    <Tag
      {...(elementProps as Record<string, never>)}
      onMouseEnter={interactive ? () => setHovered(true) : undefined}
      onMouseLeave={interactive ? () => setHovered(false) : undefined}
      className={className}
      style={{
        display: "block",
        textAlign: "left",
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: `${radius}px`,
        padding: typeof padding === "number" ? `${padding}px` : padding,
        boxShadow: interactive && hovered
          ? "var(--shadow-card-hover)"
          : "var(--shadow-card)",
        transform: interactive && hovered ? "translateY(-1px)" : "translateY(0)",
        transition: "box-shadow 160ms ease, transform 160ms ease, border-color 160ms ease",
        cursor: interactive ? "pointer" : undefined,
        fontFamily: "inherit",
        color: "inherit",
        width: Tag === "button" ? "100%" : undefined,
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}
