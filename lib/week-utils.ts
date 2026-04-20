/**
 * Date helpers for the Home page — pure, no I/O, safe to call from server
 * and client. All inputs are local-timezone Dates; callers that have UTC
 * dates (Prisma returns UTC for DateTime) should convert at the boundary.
 */

export type WeekWindow = {
  /** Monday 00:00:00 (local) of the current week */
  start: Date;
  /** Sunday 23:59:59 (local) of the current week */
  end: Date;
};

/**
 * Returns the Monday-Sunday window containing `now`.
 * Treats Sunday as the last day of the previous week (Mon=0 … Sun=6).
 */
export function getWeekWindow(now: Date = new Date()): WeekWindow {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const dayFromMon = (d.getDay() + 6) % 7;
  const start = new Date(d);
  start.setDate(d.getDate() - dayFromMon);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/**
 * Whole days from `now` (midnight) to `target` (midnight). Past = negative.
 * Same-day = 0. Undefined/null target → null.
 */
export function daysUntil(target: Date | string | null | undefined, now: Date = new Date()): number | null {
  if (!target) return null;
  const t = typeof target === "string" ? new Date(target) : target;
  if (Number.isNaN(t.getTime())) return null;
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const b = new Date(t.getFullYear(), t.getMonth(), t.getDate());
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function greetingForHour(hour: number): "Good morning" | "Good afternoon" | "Good evening" {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/**
 * Program week context for the hero sub-line.
 *
 * Anchored to the first Monday in `PROGRAM_START`. Weeks are 1-indexed.
 * Before program start → week 0. After week 5 → week 6 ("complete").
 */
const PROGRAM_START = new Date("2026-03-30T00:00:00"); // Week 1 Monday
const PROGRAM_WEEKS = 5;

export type ProgramWeekInfo = {
  /** 0 = before program, 1-5 = active weeks, 6 = after program */
  currentWeek: number;
  totalWeeks: number;
  /** Monday of current program week, or null if before/after */
  weekStart: Date | null;
  /** "Week 4 of 5" | "Program starts Mar 30" | "Program complete" */
  label: string;
};

export function programWeekInfo(now: Date = new Date()): ProgramWeekInfo {
  const msPerWeek = 7 * 86400000;
  const diff = now.getTime() - PROGRAM_START.getTime();
  const weekIdx = Math.floor(diff / msPerWeek); // 0-indexed

  if (weekIdx < 0) {
    return {
      currentWeek: 0,
      totalWeeks: PROGRAM_WEEKS,
      weekStart: null,
      label: `Program starts ${PROGRAM_START.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`,
    };
  }
  if (weekIdx >= PROGRAM_WEEKS) {
    return {
      currentWeek: PROGRAM_WEEKS + 1,
      totalWeeks: PROGRAM_WEEKS,
      weekStart: null,
      label: "Program complete",
    };
  }

  const weekStart = new Date(PROGRAM_START);
  weekStart.setDate(PROGRAM_START.getDate() + weekIdx * 7);
  return {
    currentWeek: weekIdx + 1,
    totalWeeks: PROGRAM_WEEKS,
    weekStart,
    label: `Week ${weekIdx + 1} of ${PROGRAM_WEEKS}`,
  };
}
