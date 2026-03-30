import { prisma } from "@/lib/prisma";
import { AdminOverview } from "@/components/admin-overview";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin — AISA Atlas",
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
  ] = await Promise.all([
    prisma.user.count({ where: { role: "RECRUIT" } }),
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

  return (
    <AdminOverview
      stats={{
        totalRecruits,
        activeThisWeek,
        pendingToGrade: pendingHomework + pendingSAAnswers,
        formalQuizzes,
      }}
      activity={activity}
    />
  );
}
