"use client";

import { useState } from "react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/icon";

/**
 * Single sidebar nav row.
 * Active state uses accent text + soft accent-tinted background.
 * Pass either `iconName` or `iconNode` (for tier-color dots / custom marks).
 */
export function SidebarNavItem({
  href,
  label,
  iconName,
  iconNode,
  active,
  rightSlot,
  defaultIconColor,
}: {
  href: string;
  label: string;
  iconName?: IconName;
  iconNode?: ReactNode;
  active?: boolean;
  rightSlot?: ReactNode;
  /** Overrides the icon's resting color; hover/active still use the normal text colors. */
  defaultIconColor?: string;
}) {
  const [hovered, setHovered] = useState(false);

  const bg = active
    ? "var(--color-accent-soft)"
    : hovered
    ? "var(--color-surface-2)"
    : "transparent";
  const color = active
    ? "var(--color-accent-on-soft)"
    : hovered
    ? "var(--color-text)"
    : "var(--color-text-2)";
  const iconColor = defaultIconColor && !active && !hovered ? defaultIconColor : color;

  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-3)",
        padding: "7px 10px",
        margin: "1px 0",
        borderRadius: "var(--radius-2)",
        fontSize: "var(--text-sm)",
        fontWeight: active ? 550 : 450,
        textDecoration: "none",
        backgroundColor: bg,
        color,
        transition: "background-color 100ms ease, color 100ms ease",
        lineHeight: 1.2,
      }}
    >
      <span style={{ display: "flex", flexShrink: 0, color: iconColor }}>
        {iconNode ?? (iconName && <Icon name={iconName} size={17} strokeWidth={1.85} />)}
      </span>
      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {label}
      </span>
      {rightSlot}
    </Link>
  );
}
