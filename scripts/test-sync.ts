import "dotenv/config";
import { syncCalendar } from "../lib/schedule-sync";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("Starting sync...");
  const result = await syncCalendar({ year: 2026 });
  console.log("Result:", result);

  console.log("\n--- Sample events ---");
  const events = await prisma.scheduleEvent.findMany({
    orderBy: [{ weekNumber: "asc" }, { dayOfWeek: "asc" }],
    take: 30,
  });
  for (const e of events) {
    const time = e.startTime ? `${e.startTime}–${e.endTime ?? "?"}` : "—";
    const day = ["Mon", "Tue", "Wed", "Thu", "Fri", "HW"][e.dayOfWeek];
    console.log(`W${e.weekNumber} ${day} [${e.type}/${e.category}] ${time}: ${e.title.slice(0, 70)}`);
  }

  const total = await prisma.scheduleEvent.count();
  console.log(`\nTotal events in DB: ${total}`);
  await prisma.$disconnect();
}
main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
