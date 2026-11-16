/**
 * App-wide config constants.
 */

// Temporary closure. Flip to false to bring the calendar back; the daily
// schedule sync keeps running, so the data is current when it reopens.
// While true, the calendar page shows a closed card and links to it are hidden.
export const CALENDAR_CLOSED = true;

// The club is on the University of Oregon campus. Server code runs in UTC, so
// anything shown as "today" or "this evening" is computed in this zone.
export const CLUB_TIME_ZONE = "America/Los_Angeles";
