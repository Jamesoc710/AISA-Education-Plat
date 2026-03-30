import { prisma } from "@/lib/prisma";
import { AdminRecruits } from "@/components/admin-recruits";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Recruits — Admin — AISA Atlas",
};

export default async function AdminRecruitsPage() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      cohort: true,
      createdAt: true,
      _count: {
        select: {
          quizAttempts: true,
          homeworkSubmissions: true,
        },
      },
      quizAttempts: {
        select: {
          isCorrect: true,
          attemptedAt: true,
        },
      },
      homeworkSubmissions: {
        select: {
          submittedAt: true,
        },
        orderBy: { submittedAt: "desc" },
        take: 1,
      },
    },
  });

  const recruits = users.map((u: typeof users[number]) => {
    const totalAttempts = u.quizAttempts.length;
    const correctAttempts = u.quizAttempts.filter(
      (a: (typeof u.quizAttempts)[number]) => a.isCorrect,
    ).length;
    const quizScore =
      totalAttempts > 0
        ? Math.round((correctAttempts / totalAttempts) * 100)
        : null;

    // Last active: most recent quiz attempt or homework submission
    const lastQuizAt =
      totalAttempts > 0
        ? u.quizAttempts.reduce(
            (latest: Date, a: (typeof u.quizAttempts)[number]) =>
              a.attemptedAt > latest ? a.attemptedAt : latest,
            u.quizAttempts[0].attemptedAt,
          )
        : null;
    const lastHomeworkAt =
      u.homeworkSubmissions.length > 0
        ? u.homeworkSubmissions[0].submittedAt
        : null;

    let lastActive: string | null = null;
    if (lastQuizAt && lastHomeworkAt) {
      lastActive = (
        lastQuizAt > lastHomeworkAt ? lastQuizAt : lastHomeworkAt
      ).toISOString();
    } else if (lastQuizAt) {
      lastActive = lastQuizAt.toISOString();
    } else if (lastHomeworkAt) {
      lastActive = lastHomeworkAt.toISOString();
    }

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      cohort: u.cohort,
      createdAt: u.createdAt.toISOString(),
      quizScore,
      questionsAnswered: u._count.quizAttempts,
      homeworkSubmitted: u._count.homeworkSubmissions,
      lastActive,
    };
  });

  return <AdminRecruits recruits={recruits} />;
}
