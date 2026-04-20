"use client";

import { Icon, type IconName } from "@/components/ui/icon";

/**
 * Rounded square tile with soft pastel background and matching darker icon.
 * Sizes: sm 32, md 44, lg 56.
 */

type Size = "sm" | "md" | "lg";

const SIZES: Record<Size, { box: number; icon: number; radius: number }> = {
  sm: { box: 32, icon: 16, radius: 8  },
  md: { box: 44, icon: 22, radius: 10 },
  lg: { box: 56, icon: 28, radius: 12 },
};

export function IconTile({
  icon,
  color,
  size = "md",
}: {
  icon: IconName;
  /** Suffix matching --tile-{color}-bg / --tile-{color}-fg vars */
  color: string;
  size?: Size;
}) {
  const sz = SIZES[size];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: `${sz.box}px`,
        height: `${sz.box}px`,
        borderRadius: `${sz.radius}px`,
        backgroundColor: `var(--tile-${color}-bg)`,
        color: `var(--tile-${color}-fg)`,
        flexShrink: 0,
      }}
      aria-hidden
    >
      <Icon name={icon} size={sz.icon} />
    </span>
  );
}
