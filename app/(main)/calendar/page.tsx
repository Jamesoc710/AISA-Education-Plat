import { prisma } from "@/lib/prisma";
import { CalendarClient } from "@/components/calendar-client";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Calendar — AISA Atlas",
  description: "Tech team weekly schedule, lectures, and homework deadlines.",
};

export default async function CalendarPage() {
  const events = await prisma.scheduleEvent.findMany({
    orderBy: [{ weekNumber: "asc" }, { dayOfWeek: "asc" }],
  });

  const lastSync = events.length > 0
    ? events.reduce((latest: Date, e: typeof events[number]) =>
        e.syncedAt > latest ? e.syncedAt : latest, events[0].syncedAt)
    : null;

  const serializable = events.map((e: typeof events[number]) => ({
    id: e.id,
    weekNumber: e.weekNumber,
    weekStart: e.weekStart.toISOString(),
    weekEnd: e.weekEnd.toISOString(),
    dayOfWeek: e.dayOfWeek,
    date: e.date.toISOString(),
    title: e.title,
    description: e.description,
    topics: Array.isArray(e.topics) ? (e.topics as string[]) : null,
    startTime: e.startTime,
    endTime: e.endTime,
    location: e.location,
    type: e.type,
    category: e.category,
  }));

  return (
    <CalendarClient
      events={serializable}
      lastSyncedAt={lastSync?.toISOString() ?? null}
    />
  );
}
