"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { hierarchy, pack } from "d3-hierarchy";
import { categoryMeta } from "@/lib/trend-categories";
import type { TrendCardData } from "@/lib/trends";

/**
 * Packed-circle "pulse of tech" field (spec 7.2). Size = momentum, fill =
 * category, ring = heating (solid) / cooling (dashed). Progressive enhancement
 * over the list, which stays the a11y + mobile path. Each circle is a keyboard-
 * focusable link to the brief. Deterministic layout (no real randomness).
 */

const MOM_MIN = 65;
const MOM_MAX = 95;

// Momentum is compressed (seed set 74-93), so a raw area = momentum mapping
// makes every bubble look the same. Normalize over the realistic band and floor
// it, so differences read while a future cooling trend (<65) still stays visible
// and never inverts larger than a hotter one.
function bubbleArea(momentum: number): number {
  const t = Math.max(0, Math.min(1, (momentum - MOM_MIN) / (MOM_MAX - MOM_MIN)));
  const rFactor = 0.4 + 0.6 * t;
  return rFactor * rFactor; // pack() consumes value as AREA
}

// d3 packEnclose shuffles candidates with Math.random, so the layout can drift
// sub-pixel between renders. Stub Math.random with a fixed-seed PRNG for the
// duration of the synchronous pack call: byte-identical layout every time, no
// real randomness in the layout path.
function withSeededRandom<T>(fn: () => T): T {
  const original = Math.random;
  let s = 0x2545f491;
  Math.random = () => {
    s = (Math.imul(s, 1103515245) + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  try {
    return fn();
  } finally {
    Math.random = original;
  }
}

type LeafDatum = { trend: TrendCardData };
type PackDatum = { children: LeafDatum[] } | LeafDatum;

type Bubble = {
  trend: TrendCardData;
  x: number;
  y: number;
  r: number;
};

export function TrendBubbleField({ trends }: { trends: TrendCardData[] }) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      setWidth(Math.round(entries[0]?.contentRect.width ?? 0));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const height = Math.max(380, Math.min(640, Math.round(width * 0.6)));

  const bubbles = useMemo<Bubble[]>(() => {
    if (width === 0 || trends.length === 0) return [];
    const root = hierarchy<PackDatum>({ children: trends.map((t) => ({ trend: t })) }).sum((d) =>
      "trend" in d ? bubbleArea(d.trend.momentum) : 0,
    );
    const packed = withSeededRandom(() =>
      pack<PackDatum>().size([width, height]).padding(6)(root),
    );
    return packed.leaves().map((leaf) => ({
      trend: (leaf.data as LeafDatum).trend,
      x: leaf.x,
      y: leaf.y,
      r: leaf.r,
    }));
  }, [trends, width, height]);

  const activeBubble = bubbles.find((b) => b.trend.slug === active) ?? null;

  function go(slug: string) {
    router.push(`/trends/${slug}`);
  }

  return (
    <div>
      <div
        ref={containerRef}
        style={{ position: "relative", width: "100%" }}
        role="group"
        aria-label="Trend bubble field. Larger circles have higher momentum."
      >
        {width > 0 && (
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            style={{ display: "block", overflow: "visible" }}
          >
            {bubbles.map((b) => {
              const cat = categoryMeta(b.trend.category);
              const isActive = b.trend.slug === active;
              const cooling = b.trend.direction === "cooling";
              const fontSize = Math.max(10, Math.min(15, b.r / 3.6));
              const lines = b.r >= 66 ? 4 : b.r >= 50 ? 3 : 2;
              return (
                <g
                  key={b.trend.slug}
                  transform={`translate(${b.x},${b.y})`}
                  role="link"
                  tabIndex={0}
                  aria-label={`${b.trend.name}. ${cat.label}, momentum ${b.trend.momentum}, ${b.trend.direction}. Open brief.`}
                  onClick={() => go(b.trend.slug)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      go(b.trend.slug);
                    }
                  }}
                  onMouseEnter={() => setActive(b.trend.slug)}
                  onMouseLeave={() => setActive((cur) => (cur === b.trend.slug ? null : cur))}
                  onFocus={() => setActive(b.trend.slug)}
                  onBlur={() => setActive((cur) => (cur === b.trend.slug ? null : cur))}
                  style={{ cursor: "pointer", outline: "none" }}
                >
                  {isActive && (
                    <circle
                      r={b.r + 4}
                      fill="none"
                      stroke="var(--color-accent)"
                      strokeWidth={2}
                      opacity={0.9}
                    />
                  )}
                  <circle
                    r={b.r}
                    fill={`var(--tile-${cat.tileColor}-bg)`}
                    stroke={`var(--tile-${cat.tileColor}-fg)`}
                    strokeWidth={cooling ? 1.5 : 2}
                    strokeDasharray={cooling ? "4 3" : undefined}
                    style={{ transition: "filter 120ms ease", filter: isActive ? "brightness(0.97)" : "none" }}
                  />
                  {b.r >= 40 && (
                    <foreignObject
                      x={-b.r * 0.82}
                      y={-b.r * 0.82}
                      width={b.r * 1.64}
                      height={b.r * 1.64}
                      style={{ pointerEvents: "none" }}
                    >
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: 3,
                          boxSizing: "border-box",
                        }}
                      >
                        <div
                          style={{
                            textAlign: "center",
                            fontSize,
                            fontWeight: 600,
                            lineHeight: 1.12,
                            color: `var(--tile-${cat.tileColor}-fg)`,
                            display: "-webkit-box",
                            WebkitLineClamp: lines,
                            WebkitBoxOrient: "vertical" as const,
                            overflow: "hidden",
                          }}
                        >
                          {b.trend.name}
                        </div>
                      </div>
                    </foreignObject>
                  )}
                </g>
              );
            })}
          </svg>
        )}

        {activeBubble && <BubbleTooltip bubble={activeBubble} />}
      </div>

      <FieldLegend />
    </div>
  );
}

function BubbleTooltip({ bubble }: { bubble: Bubble }) {
  const cat = categoryMeta(bubble.trend.category);
  // Position above the bubble, clamped to stay inside the container horizontally.
  const top = Math.max(0, bubble.y - bubble.r - 12);
  return (
    <div
      style={{
        position: "absolute",
        left: bubble.x,
        top,
        transform: "translate(-50%, -100%)",
        pointerEvents: "none",
        zIndex: 5,
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-2)",
        boxShadow: "var(--shadow-popover)",
        padding: "8px 12px",
        maxWidth: 240,
        whiteSpace: "normal",
      }}
    >
      <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)", lineHeight: 1.25 }}>
        {bubble.trend.name}
      </div>
      <div style={{ marginTop: 3, fontSize: "var(--text-xs)", color: "var(--color-text-3)" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <span
            aria-hidden
            style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: `var(--tile-${cat.tileColor}-fg)` }}
          />
          {cat.label}
        </span>
        {"  ·  "}
        Momentum {bubble.trend.momentum} · {bubble.trend.direction === "cooling" ? "Cooling" : "Heating"}
      </div>
    </div>
  );
}

function FieldLegend() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-4)",
        flexWrap: "wrap",
        marginTop: "var(--space-4)",
        fontSize: "var(--text-xs)",
        color: "var(--color-text-3)",
      }}
    >
      <span>Size = momentum</span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <svg width="16" height="16" aria-hidden>
          <circle cx="8" cy="8" r="6" fill="none" stroke="var(--color-text-3)" strokeWidth="1.6" />
        </svg>
        Solid ring = heating
      </span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <svg width="16" height="16" aria-hidden>
          <circle cx="8" cy="8" r="6" fill="none" stroke="var(--color-text-3)" strokeWidth="1.6" strokeDasharray="3 2" />
        </svg>
        Dashed ring = cooling
      </span>
    </div>
  );
}
