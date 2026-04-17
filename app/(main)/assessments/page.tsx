import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { AssessmentsListClient } from "@/components/assessments-list-client";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Assessments — AISA Atlas",
  description: "Your formal assessments.",
};

export default async function AssessmentsListPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) redirect("/login?redirect=/assessments");

  const formalQuizzes = await prisma.formalQuiz.findMany({
    where: { status: "active" },
    select: {
      id: true,
      title: true,
      description: true,
      timeLimit: true,
      dueDate: true,
      createdAt: true,
      _count: { select: { questions: true } },
      attempts: {
        where: { userId: authUser.id },
        select: { submittedAt: true, score: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const items = formalQuizzes.map((q: typeof formalQuizzes[number]) => ({
    id: q.id,
    title: q.title,
    description: q.description,
    timeLimit: q.timeLimit,
    dueDate: q.dueDate?.toISOString() ?? null,
    questionCount: q._count.questions,
    completed: q.attempts.length > 0 && q.attempts[0].submittedAt !== null,
    score: q.attempts[0]?.score ?? null,
  }));

  return <AssessmentsListClient items={items} />;
}
