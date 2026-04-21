"use client";

import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/icon";

/**
 * Horizontal tab nav — underline-active pattern (replaces pill filter groups).
 *
 * Inactive: muted text, no bg. Active: accent text + 2px accent bottom border.
 * Items can be buttons (pass `onClick`) — for route-based nav with Link, use
 * `admin-shell.tsx` as the reference implementation (same visual).
 */

export type FilterTabItem<T extends string> = {
  key: T;
  label: string;
  count?: number;
  icon?: IconName;
};

export function FilterTabs<T extends string>({
  tabs,
  active,
  onChange,
  style,
}: {
  tabs: readonly FilterTabItem<T>[];
  active: T;
  onChange: (key: T) => void;
  style?: CSSProperties;
}) {
  return (
    <div
      role="tablist"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        borderBottom: "1px solid var(--color-border)",
        ...style,
      }}
    >
      {tabs.map((tab) => (
        <FilterTab
          key={tab.key}
          tab={tab}
          isActive={tab.key === active}
          onClick={() => onChange(tab.key)}
        />
      ))}
    </div>
  );
}

function FilterTab<T extends string>({
  tab,
  isActive,
  onClick,
}: {
  tab: FilterTabItem<T>;
  isActive: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const labelColor = isActive
    ? "var(--color-text)"
    : hovered
    ? "var(--color-text)"
    : "var(--color-text-2)";
  const iconColor = isActive
    ? "var(--color-accent)"
    : "var(--color-text-3)";
  const countColor = isActive
    ? "var(--color-accent)"
    : "var(--color-text-3)";

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "10px 14px",
        fontSize: 13.5,
        fontFamily: "inherit",
        fontWeight: isActive ? 600 : 500,
        color: labelColor,
        background: "none",
        border: "none",
        borderBottom: `2px solid ${
          isActive ? "var(--color-accent)" : "transparent"
        }`,
        marginBottom: -1,
        cursor: "pointer",
        transition: "color 120ms ease, border-color 120ms ease",
      }}
    >
      {tab.icon && (
        <Icon
          name={tab.icon}
          size={14}
          strokeWidth={2}
          style={{ color: iconColor }}
        />
      )}
      {tab.label}
      {typeof tab.count === "number" && (
        <CountBadge color={countColor}>{tab.count}</CountBadge>
      )}
    </button>
  );
}

function CountBadge({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        marginLeft: 2,
        padding: "0 5px",
        fontSize: 11,
        fontWeight: 600,
        lineHeight: 1.5,
        color,
        backgroundColor: "var(--color-surface-2)",
        borderRadius: 3,
      }}
    >
      {children}
    </span>
  );
}
