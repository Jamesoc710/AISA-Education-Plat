import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/auth";
import { getOrCreateProfile } from "@/lib/user-profile";
import { HomeClient } from "@/components/home-client";
import { Welcome } from "@/components/welcome";
import { getWeekWindow, greetingForHour } from "@/lib/week-utils";
import {
  getWeekEvents,
  getContinueLearning,
  getWeakestConcept,
  getUpcomingWorkshops,
  getDigestTeaser,
} from "@/lib/home-data";
import { getActiveTrackSlug } from "@/lib/track";
import { CLUB_TIME_ZONE } from "@/lib/config";
import { getReviewSummary } from "@/lib/review";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Home",
};

export default async function HomePage() {
  const authUser = await getAuthUser();
  if (!authUser) return <Welcome />;

  const dbUser = await getOrCreateProfile(authUser.id);
  if (!dbUser) redirect("/login?error=profile");

  const now = new Date();
  const week = getWeekWindow(now);
  const trackSlug = await getActiveTrackSlug();

  const [weekEvents, continuePick, weakConcept, upcomingWorkshops, digestTeaser, review] =
    await Promise.all([
      getWeekEvents(week),
      getContinueLearning(dbUser.id, trackSlug),
      getWeakestConcept(dbUser.id, trackSlug),
      getUpcomingWorkshops(now),
      getDigestTeaser(),
      getReviewSummary(dbUser.id),
    ]);

  // The server clock is UTC; greet by the club's local hour.
  const clubHour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: CLUB_TIME_ZONE,
      hour: "numeric",
      hourCycle: "h23",
    }).format(now),
  );
  const greeting = greetingForHour(clubHour);
  const firstName = (dbUser.name ?? "").split(" ")[0] || null;

  return (
    <HomeClient
      greeting={greeting}
      firstName={firstName}
      todayISO={now.toISOString()}
      weekEvents={weekEvents}
      continuePick={continuePick}
      weakConcept={weakConcept}
      review={review}
      upcomingWorkshops={upcomingWorkshops}
      digestTeaser={digestTeaser}
    />
  );
}
