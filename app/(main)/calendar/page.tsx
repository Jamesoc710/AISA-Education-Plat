import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CalendarClient } from "@/components/calendar-client";
import { IconTile } from "@/components/ui/icon-tile";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Calendar | AISA Atlas",
  description: "The TCO club calendar: meetings, workshops and events.",
};

// Temporary closure. Flip to false to bring the calendar back; the daily
// schedule sync keeps running, so the data is current when it reopens.
const CALENDAR_CLOSED = true;

function CalendarClosed() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "80px 24px 48px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-3)",
          boxShadow: "var(--shadow-card)",
          padding: "32px 32px 28px",
          textAlign: "center",
        }}
      >
        <div style={{ display: "inline-flex", marginBottom: "var(--space-4)" }}>
          <IconTile icon="calendar" color="indigo" size="lg" />
        </div>
        <h1
          style={{
            margin: "0 0 8px",
            fontSize: "var(--text-lg)",
            fontWeight: 600,
            color: "var(--color-text)",
            letterSpacing: "-0.015em",
          }}
        >
          The calendar is closed for now
        </h1>
        <p
          style={{
            margin: "0 0 24px",
            fontSize: "var(--text-sm)",
            color: "var(--color-text-2)",
            lineHeight: 1.55,
          }}
        >
          We&apos;re updating the club calendar. Check back soon.
        </p>
        <Link
          href="/home"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: 44,
            padding: "0 18px",
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            color: "#fff",
            backgroundColor: "var(--color-accent)",
            borderRadius: "var(--radius-2)",
            textDecoration: "none",
            letterSpacing: "-0.005em",
          }}
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}

export default async function CalendarPage() {
  if (CALENDAR_CLOSED) return <CalendarClosed />;

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
