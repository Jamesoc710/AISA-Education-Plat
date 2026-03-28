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
    />
  );
}
