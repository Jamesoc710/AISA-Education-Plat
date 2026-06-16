"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { IconTile } from "@/components/ui/icon-tile";
import { Icon, type IconName } from "@/components/ui/icon";
import { categoryMeta, momentumLabelMeta, TREND_CATEGORIES } from "@/lib/trend-categories";
import { TrendBubbleField } from "@/components/trend-bubble-field";
import type { TrendCardData } from "@/lib/trends";

/**
 * Trend Tracker list view — the "pulse of tech". Card surface (Brilliant-style
 * bordered rows, cloned from the Build Board): IconTile colored by category,
 * 18px title, momentum chip, whatsHappening preview, category filter pills, and
 * a list/bubble toggle scaffold (bubble lands in PR #2).
 */
export function TrendsClient({
  trends,
  isAdmin,
}: {
  trends: TrendCardData[];
  isAdmin: boolean;
}) {
  const [category, setCategory] = useState<string | null>(null);
  // List is the SSR / no-JS / screen-reader default; bubble is a remembered,
  // desktop-only opt-in (progressive enhancement, see trend-bubble-field).
  const [view, setView] = useState<"list" | "bubble">("list");
  const [isMobile, setIsMobile] = useState(false);
  const [trackerStale, setTrackerStale] = useState(false);

  // Client-only (avoids a Date.now() hydration mismatch): banner when the whole
  // tracker has not refreshed in over 36h, i.e. the cron is behind.
  useEffect(() => {
    if (trends.length === 0) return;
    const newest = Math.max(...trends.map((t) => Date.parse(t.syncedAt)));
    setTrackerStale(Number.isFinite(newest) && Date.now() - newest > 36 * 60 * 60 * 1000);
  }, [trends]);

  useEffect(() => {
    const stored = localStorage.getItem("trends-view");
    if (stored === "bubble" || stored === "list") setView(stored);
    const mq = window.matchMedia("(max-width: 720px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const setViewPersist = (v: "list" | "bubble") => {
    setView(v);
    try {
      localStorage.setItem("trends-view", v);
    } catch {
      /* ignore storage failures */
    }
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: trends.length };
    for (const t of trends) c[t.category] = (c[t.category] ?? 0) + 1;
    return c;
  }, [trends]);

  const visible = category ? trends.filter((t) => t.category === category) : trends;
  const draftCount = trends.filter((t) => t.status === "draft").length;
  const effectiveView = isMobile ? "list" : view;

  return (
    <div style={{ padding: "32px 32px 80px" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>
        {/* ── Page header ─────────────────────────────────────── */}
        <div style={{ marginBottom: "var(--space-5)" }}>
          <h1
            style={{
              margin: 0,
              fontSize: "var(--text-2xl)",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "var(--color-text)",
              lineHeight: 1.15,
            }}
          >
            Trends
          </h1>
          <p
            style={{
              margin: "8px 0 0 0",
              fontSize: "var(--text-base)",
              color: "var(--color-text-2)",
              lineHeight: 1.55,
              maxWidth: 680,
            }}
          >
            The pulse of AI, broader tech, and capital markets. Each trend is a
            plain-language brief on what is moving right now and why it matters,
            with links back into the catalog to go deeper.
          </p>
          {isAdmin && draftCount > 0 && (
            <p style={{ margin: "10px 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-3)" }}>
              Admin view: {draftCount} draft{draftCount === 1 ? "" : "s"} shown below are hidden from
              members until published.
            </p>
          )}
        </div>

        {trackerStale && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
              padding: "10px 14px",
              marginBottom: "var(--space-4)",
              borderRadius: "var(--radius-2)",
              backgroundColor: "var(--color-gold-soft)",
              border: "1px solid var(--color-border)",
              fontSize: "var(--text-sm)",
              color: "var(--color-text-2)",
            }}
          >
            <span style={{ color: "var(--color-gold)", display: "flex" }}>
              <Icon name="info" size={16} />
            </span>
            These briefs may be behind the latest news. The tracker has not refreshed in over 36 hours.
          </div>
        )}

        {/* ── Toolbar: category filter + view toggle ──────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--space-4)",
            flexWrap: "wrap",
            marginBottom: "var(--space-5)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
            <FilterPill label="All" count={counts.All ?? 0} active={category === null} onClick={() => setCategory(null)} />
            {TREND_CATEGORIES.map((c) => (
              <FilterPill
                key={c}
                label={categoryMeta(c).label}
                count={counts[c] ?? 0}
                active={category === c}
                dotColor={`var(--tile-${categoryMeta(c).tileColor}-fg)`}
                onClick={() => setCategory(c)}
              />
            ))}
          </div>
          <ViewToggle view={effectiveView} onChange={setViewPersist} bubbleDisabled={isMobile} />
        </div>

        {/* ── Bubble field / cards / empty state ──────────────── */}
        {visible.length === 0 ? (
          <TrackerEmptyState isAdmin={isAdmin} />
        ) : effectiveView === "bubble" ? (
          <TrendBubbleField trends={visible} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            {visible.map((t) => (
              <TrendCard key={t.slug} trend={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Trend card ───────────────────────────────────────────────────────────────

function TrendCard({ trend }: { trend: TrendCardData }) {
  const [hovered, setHovered] = useState(false);
  const cat = categoryMeta(trend.category);
  const dir = directionMeta(trend.direction);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "flex-start",
        gap: "var(--space-4)",
        padding: "22px 24px",
        backgroundColor: hovered ? "var(--color-surface-2)" : "var(--color-surface)",
        border: `1px solid ${hovered ? "var(--color-border)" : "var(--color-border-subtle)"}`,
        borderRadius: "var(--radius-2)",
        transition: "background-color 140ms ease, border-color 140ms ease",
      }}
    >
      <Link
        href={`/trends/${trend.slug}`}
        aria-label={trend.name}
        style={{ position: "absolute", inset: 0, borderRadius: "var(--radius-2)" }}
      />

      <IconTile icon={cat.icon} color={cat.tileColor} size="md" />

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Title row */}
        <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-3)", flexWrap: "wrap" }}>
          <h2
            style={{
              margin: 0,
              fontSize: "var(--text-lg)",
              fontWeight: 600,
              color: hovered ? "var(--color-accent)" : "var(--color-text)",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              transition: "color 140ms ease",
            }}
          >
            {trend.name}
          </h2>
          <MomentumChip label={trend.momentumLabel} />
          <CategoryBadge category={trend.category} />
          {trend.status === "draft" && <DraftChip />}
        </div>

        {/* whatsHappening preview */}
        <p
          style={{
            margin: "6px 0 0 0",
            fontSize: "var(--text-sm)",
            color: "var(--color-text-2)",
            lineHeight: 1.55,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical" as const,
            overflow: "hidden",
          }}
        >
          {trend.whatsHappening}
        </p>

        {/* Meta row: momentum · direction · concept links */}
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
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontWeight: 600, color: "var(--color-text-2)" }}>Momentum</span>
            <MomentumMeter value={trend.momentum} />
            <span style={{ fontWeight: 600, color: "var(--color-text-2)" }}>{trend.momentum}</span>
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: dir.color }}>
            <Icon name={dir.icon} size={13} />
            {dir.label}
          </span>
          {trend.conceptCount > 0 && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <Icon name="graph" size={13} />
              {trend.conceptCount} linked concept{trend.conceptCount === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </div>

      <span
        aria-hidden
        style={{
          display: "flex",
          alignSelf: "center",
          color: hovered ? "var(--color-accent)" : "var(--color-text-3)",
          transition: "color 140ms ease",
          flexShrink: 0,
        }}
      >
        <Icon name="chevron-right" size={16} />
      </span>
    </div>
  );
}

// ── Shared chips (re-used by the detail page) ────────────────────────────────

/** Momentum-stage pill (emerging -> cooling), tile-colored like StageChip. */
export function MomentumChip({ label }: { label: string }) {
  const meta = momentumLabelMeta(label);
  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: "var(--text-xs)",
        fontWeight: 600,
        color: `var(--tile-${meta.tileColor}-fg)`,
        backgroundColor: `var(--tile-${meta.tileColor}-bg)`,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        whiteSpace: "nowrap",
      }}
    >
      {meta.label}
    </span>
  );
}

/** Category dot + label, matching the Build Board track indicator. */
export function CategoryBadge({ category }: { category: string }) {
  const cat = categoryMeta(category);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: "var(--text-xs)",
        fontWeight: 600,
        color: "var(--color-text-3)",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}
    >
      <span
        aria-hidden
        style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: `var(--tile-${cat.tileColor}-fg)` }}
      />
      {cat.label}
    </span>
  );
}

export function DraftChip() {
  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: "var(--text-xs)",
        fontWeight: 600,
        color: "var(--color-gold)",
        backgroundColor: "var(--color-gold-soft)",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}
    >
      Draft
    </span>
  );
}

export function directionMeta(direction: string): { label: string; icon: IconName; color: string } {
  return direction === "cooling"
    ? { label: "Cooling", icon: "chevron-down", color: "var(--color-blue)" }
    : { label: "Heating", icon: "trending-up", color: "var(--color-gold)" };
}

/** Thin 0-100 momentum bar, category-neutral accent fill. */
function MomentumMeter({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <span
      aria-hidden
      style={{
        display: "inline-block",
        width: 48,
        height: 4,
        borderRadius: 999,
        backgroundColor: "var(--color-surface-3)",
        overflow: "hidden",
      }}
    >
      <span
        style={{
          display: "block",
          width: `${pct}%`,
          height: "100%",
          backgroundColor: "var(--color-accent)",
        }}
      />
    </span>
  );
}

// ── Toolbar pieces ───────────────────────────────────────────────────────────

function FilterPill({
  label,
  count,
  active,
  dotColor,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  dotColor?: string;
  onClick: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "5px 12px",
        borderRadius: 999,
        fontSize: "var(--text-sm)",
        fontWeight: 600,
        cursor: "pointer",
        color: active ? "var(--color-accent-on-soft)" : "var(--color-text-2)",
        backgroundColor: active
          ? "var(--color-accent-soft)"
          : hov
            ? "var(--color-surface-2)"
            : "transparent",
        border: `1px solid ${active ? "transparent" : "var(--color-border)"}`,
        transition: "background-color 120ms ease, color 120ms ease",
      }}
    >
      {dotColor && (
        <span aria-hidden style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: dotColor }} />
      )}
      {label}
      <span style={{ color: active ? "var(--color-accent-on-soft)" : "var(--color-text-3)", fontWeight: 500 }}>
        {count}
      </span>
    </button>
  );
}

/** List/bubble segmented control. Bubble is desktop-only (needs a real viewport). */
function ViewToggle({
  view,
  onChange,
  bubbleDisabled,
}: {
  view: "list" | "bubble";
  onChange: (v: "list" | "bubble") => void;
  bubbleDisabled: boolean;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        padding: 3,
        gap: 2,
        borderRadius: "var(--radius-2)",
        backgroundColor: "var(--color-surface-2)",
        border: "1px solid var(--color-border)",
      }}
    >
      <ToggleButton active={view === "list"} disabled={false} icon="list-checks" label="List" onClick={() => onChange("list")} />
      <ToggleButton
        active={view === "bubble"}
        disabled={bubbleDisabled}
        icon="circles-three-plus"
        label="Bubble"
        title={bubbleDisabled ? "Bubble view needs a larger screen" : undefined}
        onClick={() => onChange("bubble")}
      />
    </div>
  );
}

function ToggleButton({
  active,
  disabled,
  icon,
  label,
  title,
  onClick,
}: {
  active: boolean;
  disabled: boolean;
  icon: IconName;
  label: string;
  title?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={title}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 12px",
        borderRadius: "var(--radius-1)",
        fontSize: "var(--text-sm)",
        fontWeight: 600,
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        color: active ? "var(--color-text)" : "var(--color-text-2)",
        backgroundColor: active ? "var(--color-surface)" : "transparent",
        boxShadow: active ? "var(--shadow-card)" : "none",
      }}
    >
      <Icon name={icon} size={14} />
      {label}
    </button>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────────

function TrackerEmptyState({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px",
        gap: "var(--space-4)",
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-1)",
        textAlign: "center",
      }}
    >
      <span style={{ color: "var(--color-text-3)" }}>
        <Icon name="pulse" size={28} />
      </span>
      <p style={{ fontSize: "var(--text-base)", margin: 0, fontWeight: 600, color: "var(--color-text)" }}>
        No trends to show yet
      </p>
      <p style={{ fontSize: "var(--text-sm)", margin: 0, color: "var(--color-text-2)", maxWidth: 400, lineHeight: 1.55 }}>
        {isAdmin
          ? "Seed trends with scripts/seed-trends.ts, then publish them from the admin Trends card to make them visible to members."
          : "The trend tracker is being prepared. Check back shortly."}
      </p>
    </div>
  );
}
