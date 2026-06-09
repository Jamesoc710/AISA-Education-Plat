import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { HomeClient } from "@/components/home-client";
import { AuthGate } from "@/components/ui/auth-gate";
import { getWeekWindow, greetingForHour } from "@/lib/week-utils";
import {
  getWeekEvents,
  getContinueLearning,
  getDueItems,
  getWeakestConcept,
  getUpcomingWorkshops,
  getDigestTeaser,
} from "@/lib/home-data";
import { getActiveTrackSlug } from "@/lib/track";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Home | AISA Atlas",
};

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    return (
      <AuthGate
        icon="home"
        tileColor="indigo"
        title="Sign in to see your home"
        body="Your week at a glance, what's due, and where to pick up — personalized to your account."
        nextPath="/home"
      />
    );
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { id: true, name: true },
  });
  if (!dbUser) redirect("/login");

  const now = new Date();
  const week = getWeekWindow(now);
  const trackSlug = await getActiveTrackSlug();

  const [weekEvents, continuePick, dueItems, weakConcept, upcomingWorkshops, digestTeaser] =
    await Promise.all([
      getWeekEvents(week),
      getContinueLearning(dbUser.id, trackSlug),
      getDueItems(dbUser.id),
      getWeakestConcept(dbUser.id, trackSlug),
      getUpcomingWorkshops(now),
      getDigestTeaser(),
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
      digestTeaser={digestTeaser}
    />
  );
}
