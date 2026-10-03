import { prisma } from "@/lib/prisma";
import { AdminOverview } from "@/components/admin-overview";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin | AISA Atlas",
};

export default async function AdminPage() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // ── Stats queries ──────────────────────────────────────────────────────────
  const [
    totalRecruits,
    activeThisWeek,
    totalAnswers,
    answersThisWeek,
    scheduleEventCount,
    latestScheduleEvent,
    latestDigest,
    recentQuizAttempts,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "MEMBER" } }),
    prisma.quizAttempt
      .findMany({
        where: { attemptedAt: { gte: sevenDaysAgo } },
        select: { userId: true },
        distinct: ["userId"],
      })
      .then((rows: { userId: string }[]) => rows.length),
    prisma.quizAttempt.count(),
    prisma.quizAttempt.count({ where: { attemptedAt: { gte: sevenDaysAgo } } }),
    prisma.scheduleEvent.count(),
    prisma.scheduleEvent.findFirst({
      orderBy: { syncedAt: "desc" },
      select: { syncedAt: true },
    }),
    prisma.digestEdition.findFirst({
      orderBy: { weekOf: "desc" },
      select: {
        id: true,
        weekOf: true,
        status: true,
        headline: true,
        items: true,
        generatedAt: true,
        searchesUsed: true,
        durationMs: true,
      },
    }),
    prisma.quizAttempt.findMany({
      take: 20,
      orderBy: { attemptedAt: "desc" },
      select: {
        id: true,
        isCorrect: true,
        attemptedAt: true,
        user: { select: { name: true } },
        question: { select: { concept: { select: { name: true } } } },
      },
    }),
  ]);

  // ── Recent activity ────────────────────────────────────────────────────────
  type QuizRow = (typeof recentQuizAttempts)[number];
  const activity = recentQuizAttempts.map((a: QuizRow) => ({
    id: a.id,
    type: "quiz" as const,
    description: `${a.user.name} answered ${a.question.concept.name} question ${a.isCorrect ? "correctly" : "incorrectly"}`,
    timestamp: a.attemptedAt.toISOString(),
    status: (a.isCorrect ? "correct" : "incorrect") as "correct" | "incorrect",
  }));

  // ── Build Board drafts awaiting review ───────────────────────────────────────
  const draftProjects = await prisma.project.findMany({
    where: { status: "draft" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      blurb: true,
      stage: true,
      createdAt: true,
      createdBy: { select: { name: true } },
    },
  });
  type DraftRow = (typeof draftProjects)[number];
  const buildDrafts = draftProjects.map((d: DraftRow) => ({
    id: d.id,
    slug: d.slug,
    title: d.title,
    blurb: d.blurb,
    stage: d.stage,
    author: d.createdBy?.name ?? null,
    createdAt: d.createdAt.toISOString(),
  }));

  return (
    <AdminOverview
      stats={{
        totalRecruits,
        activeThisWeek,
        totalAnswers,
        answersThisWeek,
      }}
      activity={activity}
      calendarSync={{
        eventCount: scheduleEventCount,
        lastSyncedAt: latestScheduleEvent?.syncedAt.toISOString() ?? null,
      }}
      digest={
        latestDigest
          ? {
              id: latestDigest.id,
              weekOf: latestDigest.weekOf.toISOString(),
              status: latestDigest.status,
              headline: latestDigest.headline,
              itemCount: Array.isArray(latestDigest.items)
                ? latestDigest.items.length
                : 0,
              generatedAt: latestDigest.generatedAt.toISOString(),
              searchesUsed: latestDigest.searchesUsed,
              durationMs: latestDigest.durationMs,
            }
          : null
      }
      buildDrafts={buildDrafts}
    />
  );
}
