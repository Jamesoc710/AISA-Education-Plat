/**
 * Quiz-accuracy mastery for a concept, on the scale the Progress page's
 * completion map uses: 80%+ strong, 50 to 79% getting there, under 50% weak.
 * A concept with no quiz answers has no score at all.
 *
 * Pure and client-safe. The Progress page still carries its own copy of these
 * thresholds (getMasteryColor / dotColors in dashboard-client.tsx); change
 * both together.
 */

export type ConceptScore = { pct: number; correct: number; total: number };

export type MasteryLevel = "strong" | "mid" | "weak";

export function masteryLevel(pct: number): MasteryLevel {
  if (pct >= 80) return "strong";
  if (pct >= 50) return "mid";
  return "weak";
}
