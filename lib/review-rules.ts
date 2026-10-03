/**
 * Spaced review queue (Leitner boxes). Every practice mode reports results
 * here so one queue knows what each member is shaky on.
 *
 * - incorrect: back to box 1, due tomorrow
 * - partial: same box, due again after that box's interval
 * - correct: up one box, but only when the item was due (or brand new).
 *   Answering early never promotes, so a quiz with three questions on one
 *   concept can't jump it straight to box 4.
 */

export type PracticeResult = "correct" | "partial" | "incorrect";

export const MAX_BOX = 5;
const INTERVAL_DAYS = [0, 1, 3, 7, 14, 30]; // index = box
const DAY_MS = 24 * 60 * 60 * 1000;

export function intervalForBox(box: number): number {
  return INTERVAL_DAYS[Math.min(Math.max(box, 1), MAX_BOX)];
}

export type ReviewState = { box: number; dueAt: Date };

/** Pure transition, shared by the live writes and the history backfill. */
export function nextReviewState(
  prev: ReviewState | null,
  result: PracticeResult,
  now: Date,
): ReviewState {
  let box: number;
  if (!prev) {
    box = result === "correct" ? 2 : 1;
  } else if (result === "incorrect") {
    box = 1;
  } else if (result === "partial") {
    box = prev.box;
  } else {
    const wasDue = prev.dueAt.getTime() <= now.getTime();
    if (!wasDue) return prev;
    box = Math.min(prev.box + 1, MAX_BOX);
  }
  return { box, dueAt: new Date(now.getTime() + intervalForBox(box) * DAY_MS) };
}
