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
    totalQuizAttempts,
    pendingHomework,
    pendingSAAnswers,
    formalQuizzes,
    totalAssignments,
    scheduleEventCount,
    latestScheduleEvent,
    latestDigest,
    trendTotal,
    trendPublished,
    latestTrend,
    benchmarkTotal,
    benchmarkPublished,
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
    prisma.homeworkSubmission.count({ where: { grade: null } }),
    prisma.formalQuizAnswer.count({ where: { isCorrect: null } }),
    prisma.formalQuiz.count(),
    prisma.assignment.count(),
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
    prisma.trend.count(),
    prisma.trend.count({ where: { status: "published" } }),
    prisma.trend.findFirst({ orderBy: { syncedAt: "desc" }, select: { syncedAt: true } }),
    prisma.benchmark.count(),
    prisma.benchmark.count({ where: { status: "published" } }),
  ]);

  // ── Recent activity ────────────────────────────────────────────────────────
  const [recentQuizAttempts, recentHomework] = await Promise.all([
    prisma.quizAttempt.findMany({
      take: 15,
      orderBy: { attemptedAt: "desc" },
      select: {
        id: true,
        isCorrect: true,
        attemptedAt: true,
        user: { select: { name: true } },
        question: { select: { concept: { select: { name: true } } } },
      },
    }),
    prisma.homeworkSubmission.findMany({
      take: 15,
      orderBy: { submittedAt: "desc" },
      select: {
        id: true,
        submittedAt: true,
        grade: true,
        user: { select: { name: true } },
        assignment: { select: { title: true } },
      },
    }),
  ]);

  // ── Merge + sort ───────────────────────────────────────────────────────────
  type QuizRow = (typeof recentQuizAttempts)[number];
  type HwRow = (typeof recentHomework)[number];

  const quizActivity = recentQuizAttempts.map((a: QuizRow) => ({
    id: a.id,
    type: "quiz" as const,
    description: `${a.user.name} answered ${a.question.concept.name} question ${a.isCorrect ? "correctly" : "incorrectly"}`,
    timestamp: a.attemptedAt.toISOString(),
    status: (a.isCorrect ? "correct" : "incorrect") as "correct" | "incorrect",
  }));

  const hwActivity = recentHomework.map((s: HwRow) => ({
    id: s.id,
    type: "homework" as const,
    description: `${s.user.name} submitted Homework: ${s.assignment.title}`,
    timestamp: s.submittedAt.toISOString(),
    status: (s.grade ? "graded" : "submitted") as "graded" | "submitted",
  }));

  const activity = [...quizActivity, ...hwActivity]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20);

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
        pendingToGrade: pendingHomework + pendingSAAnswers,
        formalQuizzes,
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
      trends={{
        total: trendTotal,
        published: trendPublished,
        drafts: trendTotal - trendPublished,
        lastSyncedAt: latestTrend?.syncedAt.toISOString() ?? null,
      }}
      benchmarks={{
        total: benchmarkTotal,
        published: benchmarkPublished,
        drafts: benchmarkTotal - benchmarkPublished,
      }}
      buildDrafts={buildDrafts}
    />
  );
}
