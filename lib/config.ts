/**
 * App-wide config constants.
 */

// Temporary closure. Flip to false to bring the calendar back; the daily
// schedule sync keeps running, so the data is current when it reopens.
// While true, the calendar page shows a closed card and links to it are hidden.
export const CALENDAR_CLOSED = true;

// Temporary closure of the Community area (team pages and the build board).
// While true, the Community menu is hidden and those pages show a closed card.
// Flip to false to bring it back; nothing is deleted.
export const COMMUNITY_CLOSED = true;

// The platform is only being used for tech team education right now, so the
// Capital Markets track is switched off: the track tabs on Browse are hidden
// and every track-scoped page (Browse, quiz, flashcards, Home, Progress) shows
// the AI track, whatever a member picked before. The Capital Markets content
// stays in the database and its concept pages still open from direct links
// (the weekly digest links to some). Flip to false to bring the tabs back.
export const AI_TRACK_ONLY = true;

// The club is on the University of Oregon campus. Server code runs in UTC, so
// anything shown as "today" or "this evening" is computed in this zone.
export const CLUB_TIME_ZONE = "America/Los_Angeles";
