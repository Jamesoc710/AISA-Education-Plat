import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { HomeClient } from "@/components/home-client";
import { getWeekWindow, greetingForHour } from "@/lib/week-utils";
import {
  getWeekEvents,
  getContinueLearning,
  getDueItems,
  getWeakestConcept,
  getUpcomingWorkshops,
} from "@/lib/home-data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Home | AISA Atlas",
};

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { id: true, name: true },
  });
  if (!dbUser) redirect("/login");

  const now = new Date();
  const week = getWeekWindow(now);

  const [weekEvents, continuePick, dueItems, weakConcept, upcomingWorkshops] =
    await Promise.all([
      getWeekEvents(week),
      getContinueLearning(dbUser.id),
      getDueItems(dbUser.id),
      getWeakestConcept(dbUser.id),
      getUpcomingWorkshops(now),
    ]);

  const greeting = greetingForHour(now.getHours());
  const firstName = (dbUser.name ?? "").split(" ")[0] || null;

  return (
    <HomeClient
      greeting={greeting}
      firstName={firstName}
      todayISO={now.toISOString()}
      weekEvents={weekEvents}
      continuePick={continuePick}
      dueItems={dueItems}
      weakConcept={weakConcept}
      upcomingWorkshops={upcomingWorkshops}
    />
  );
}
