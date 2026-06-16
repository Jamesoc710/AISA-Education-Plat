/**
 * Trend Tracker categories + momentum vocabulary.
 *
 * Pure module (no server imports) so client components, the data layer, and
 * seed/sync scripts can all share it. Category drives the bubble fill + card
 * rail color (spec 7.2: AI blue / Tech slate / Capital green).
 */

import type { IconName } from "@/components/ui/icon";

export const TREND_CATEGORIES = ["AI", "Tech", "Capital"] as const;
export type TrendCategory = (typeof TREND_CATEGORIES)[number];

export const CATEGORY_META: Record<
  TrendCategory,
  { label: string; tileColor: string; icon: IconName }
> = {
  AI:      { label: "AI",      tileColor: "blue",  icon: "sparkle" },
  Tech:    { label: "Tech",    tileColor: "steel", icon: "cpu" },
  Capital: { label: "Capital", tileColor: "sage",  icon: "currency-dollar" },
};

export const MOMENTUM_LABELS = ["emerging", "accelerating", "mainstreaming", "cooling"] as const;
export type MomentumLabel = (typeof MOMENTUM_LABELS)[number];

export const MOMENTUM_LABEL_META: Record<MomentumLabel, { label: string; tileColor: string }> = {
  emerging:      { label: "Emerging",      tileColor: "sky" },
  accelerating:  { label: "Accelerating",  tileColor: "indigo" },
  mainstreaming: { label: "Mainstreaming", tileColor: "mint" },
  cooling:       { label: "Cooling",       tileColor: "stone" },
};

export function isTrendCategory(value: string): value is TrendCategory {
  return (TREND_CATEGORIES as readonly string[]).includes(value);
}

export function categoryMeta(category: string): { label: string; tileColor: string; icon: IconName } {
  return isTrendCategory(category) ? CATEGORY_META[category] : CATEGORY_META.Tech;
}

export function momentumLabelMeta(label: string): { label: string; tileColor: string } {
  return (MOMENTUM_LABELS as readonly string[]).includes(label)
    ? MOMENTUM_LABEL_META[label as MomentumLabel]
    : MOMENTUM_LABEL_META.accelerating;
}
