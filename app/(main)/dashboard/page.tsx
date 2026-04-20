import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "@/components/dashboard-client";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard — AISA Atlas",
  description: "Track your AI learning progress.",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) redirect("/login?redirect=/dashboard");

  // Fetch user profile
  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { name: true },
  });

  // Fetch all tiers → sections → concepts (for the completion map)
  const tiers = await prisma.tier.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      sections: {
        select: {
          id: true,
          name: true,
          concepts: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  // Fetch all quiz attempts for this user
  const attempts = await prisma.quizAttempt.findMany({
    where: { userId: authUser.id },
    select: {
      questionId: true,
      isCorrect: true,
      attemptedAt: true,
      question: {
        select: {
          conceptId: true,
        },
      },
    },
    orderBy: { attemptedAt: "desc" },
  });

  // Fetch active formal quizzes the user hasn't completed
  const formalQuizzes = await prisma.formalQuiz.findMany({
    where: { status: "active" },
    select: {
      id: true,
      title: true,
      description: true,
      timeLimit: true,
      dueDate: true,
      _count: { select: { questions: true } },
      attempts: {
        where: { userId: authUser.id },
        select: { submittedAt: true, score: true },
      },
    },
  });

  // Fetch homework assignments with user's submission status
  const assignments = await prisma.assignment.findMany({
    select: {
      id: true,
      title: true,
      dueDate: true,
      concept: { select: { name: true } },
      submissions: {
        where: { userId: authUser.id },
        select: { submittedAt: true, grade: true, feedback: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Aggregate: per-concept best score
  const conceptStats = new Map<
    string,
    { total: number; correct: number; attempts: number; lastAttempt: string }
  >();

  for (const a of attempts as typeof attempts) {
    const cId = a.question.conceptId;
    const existing = conceptStats.get(cId);
    if (!existing) {
      conceptStats.set(cId, {
        total: 1,
        correct: a.isCorrect ? 1 : 0,
        attempts: 1,
        lastAttempt: a.attemptedAt.toISOString(),
      });
    } else {
      existing.total++;
      if (a.isCorrect) existing.correct++;
      existing.attempts++;
    }
  }

  // Build serializable stats
  const conceptScores: Record<
    string,
    { pct: number; total: number; correct: number; lastAttempt: string }
  > = {};
  conceptStats.forEach((v, k) => {
    conceptScores[k] = {
      pct: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0,
      total: v.total,
      correct: v.correct,
      lastAttempt: v.lastAttempt,
    };
  });

  // Overview stats
  const totalConceptsQuizzed = conceptStats.size;
  const totalQuestions = attempts.length;
  const totalCorrect = attempts.filter(
    (a: typeof attempts[number]) => a.isCorrect,
  ).length;
  const avgScore =
    totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  // Count unique quiz sessions (group by date — rough proxy)
  const sessionDates = new Set(
    attempts.map((a: typeof attempts[number]) =>
      a.attemptedAt.toISOString().slice(0, 10),
    ),
  );

  // 30-day activity buckets for the Activity Pulse strip
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayMs = 86400000;
  const buckets = new Map<string, { total: number; correct: number }>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today.getTime() - i * dayMs);
    buckets.set(d.toISOString().slice(0, 10), { total: 0, correct: 0 });
  }
  for (const a of attempts as typeof attempts) {
    const key = a.attemptedAt.toISOString().slice(0, 10);
    const b = buckets.get(key);
    if (b) {
      b.total++;
      if (a.isCorrect) b.correct++;
    }
  }
  const activity = Array.from(buckets.entries()).map(([date, v]) => ({
    date,
    total: v.total,
    correct: v.correct,
  }));

  const pendingAssessments = formalQuizzes.map((q: typeof formalQuizzes[number]) => ({
    id: q.id,
    title: q.title,
    description: q.description,
    timeLimit: q.timeLimit,
    dueDate: q.dueDate?.toISOString() ?? null,
    questionCount: q._count.questions,
    completed: q.attempts.length > 0 && q.attempts[0].submittedAt !== null,
    score: q.attempts[0]?.score ?? null,
  }));

  const homeworkItems = assignments.map((a: typeof assignments[number]) => ({
    id: a.id,
    title: a.title,
    dueDate: a.dueDate?.toISOString() ?? null,
    conceptName: a.concept?.name ?? null,
    submitted: a.submissions.length > 0,
    submittedAt: a.submissions[0]?.submittedAt?.toISOString() ?? null,
    grade: a.submissions[0]?.grade ?? null,
  }));

  const tierData = tiers.map((t: typeof tiers[number]) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    sections: t.sections.map(
      (s: (typeof tiers)[number]["sections"][number]) => ({
        id: s.id,
        name: s.name,
        concepts: s.concepts.map(
          (c: (typeof tiers)[number]["sections"][number]["concepts"][number]) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
          }),
        ),
      }),
    ),
  }));

  return (
    <DashboardClient
      userName={user?.name ?? "User"}
      overview={{
        totalConcepts: tiers.reduce(
          (sum: number, t: typeof tiers[number]) =>
            sum +
            t.sections.reduce(
              (s: number, sec: (typeof tiers)[number]["sections"][number]) =>
                s + sec.concepts.length,
              0,
            ),
          0,
        ),
        conceptsQuizzed: totalConceptsQuizzed,
        totalQuestions,
        avgScore,
        quizSessions: sessionDates.size,
      }}
      tiers={tierData}
      conceptScores={conceptScores}
      pendingAssessments={pendingAssessments}
      homeworkItems={homeworkItems}
      activity={activity}
    />
  );
}
