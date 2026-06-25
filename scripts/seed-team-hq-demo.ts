/**
 * Dev demo data for the Team HQ acceptance test.
 *
 * WHY THIS EXISTS: as of build time the dev DB had no FUTURE calendar events at
 * all (the term ended 2026-06-05), so the "Next team meeting" module could not
 * be demonstrated for any team. This upserts ONE near-future CAPITAL_TEAM meeting
 * so /teams/capital shows a real time and place. It is intentionally the
 * least-invasive demo seed: a single calendar entry, no fabricated projects or
 * memberships (fabricating belonging would undermine roster trust, which the
 * plan treats as load-bearing). Capital's projects and roster stay honest:
 * recruiting empty states until real projects/joins arrive.
 *
 * Idempotent (stable sourceRowKey that will not collide with synced rows).
 * To remove:  delete the schedule_events row with sourceRowKey 'teamhq-demo-capital'.
 *
 * Run from aisa-atlas/:  npx tsx scripts/seed-team-hq-demo.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) {
  console.error("Missing DIRECT_URL / DATABASE_URL in environment (.env).");
  process.exit(1);
}
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

/** The next Tuesday strictly after today, at the given local hour. */
function nextTuesday(hour: number): Date {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  // JS getDay(): 0=Sun..6=Sat. Tuesday = 2.
  do {
    d.setDate(d.getDate() + 1);
  } while (d.getDay() !== 2);
  return d;
}

/** Monday 00:00 of the week containing `d`. */
function mondayOf(d: Date): Date {
  const m = new Date(d);
  const dow = (m.getDay() + 6) % 7; // 0=Mon
  m.setDate(m.getDate() - dow);
  m.setHours(0, 0, 0, 0);
  return m;
}

async function main() {
  const date = nextTuesday(17);
  const weekStart = mondayOf(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 0, 0);

  const row = await prisma.scheduleEvent.upsert({
    where: { sourceRowKey: "teamhq-demo-capital" },
    update: { date, weekStart, weekEnd },
    create: {
      sourceRowKey: "teamhq-demo-capital",
      weekNumber: 99,
      weekStart,
      weekEnd,
      dayOfWeek: 1, // 0=Mon, 1=Tue
      date,
      title: "Capital Markets weekly",
      description: "Markets read plus deal of the week.",
      startTime: "17:00",
      endTime: "19:00",
      location: "Lillis 132",
      type: "CAPITAL_TEAM",
      category: "MEETING",
    },
  });

  console.log(`Upserted demo CAPITAL_TEAM meeting on ${row.date.toDateString()} at ${row.location}.`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
