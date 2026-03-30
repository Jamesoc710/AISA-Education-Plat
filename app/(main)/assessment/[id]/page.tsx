import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AssessmentClient } from "@/components/assessment-client";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const quiz = await prisma.formalQuiz.findUnique({
    where: { id },
    select: { title: true },
  });
  return {
    title: quiz ? `${quiz.title} — AISA Atlas` : "Assessment — AISA Atlas",
  };
}

// ── Fisher-Yates shuffle ─────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function AssessmentPage({ params }: Props) {
  const { id } = await params;

  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch quiz with questions
  const quiz = await prisma.formalQuiz.findUnique({
    where: { id },
    include: {
      questions: {
        include: { question: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!quiz || quiz.status !== "active") redirect("/dashboard");

  // Check existing attempt
  const attempt = await prisma.formalQuizAttempt.findUnique({
    where: { userId_formalQuizId: { userId: user.id, formalQuizId: id } },
    include: { answers: true },
  });

  // If already submitted, compute completed view data
  let existingScore: number | null = null;
  let existingMCTotal: number | null = null;
  let existingMCCorrect: number | null = null;
  let existingSACount: number | null = null;

  if (attempt?.submittedAt) {
    existingScore = attempt.score ?? null;
    const mcAnswers = attempt.answers.filter(
      (a: typeof attempt.answers[number]) => a.isCorrect !== null,
    );
    existingMCTotal = mcAnswers.length;
    existingMCCorrect = mcAnswers.filter(
      (a: typeof mcAnswers[number]) => a.isCorrect === true,
    ).length;
    existingSACount = attempt.answers.filter(
      (a: typeof attempt.answers[number]) => a.isCorrect === null,
    ).length;
  }

  // Parse MC options and shuffle them
  const questions = quiz.questions.map(
    (fqq: typeof quiz.questions[number]) => {
      let options: { text: string; isCorrect: boolean }[] | null = null;
      if (fqq.question.options) {
        const parsed = JSON.parse(fqq.question.options);
        if (Array.isArray(parsed)) {
          options = shuffle(parsed);
        }
      }
      return {
        id: fqq.question.id,
        type: fqq.question.type as "MC" | "SHORT_ANSWER",
        questionText: fqq.question.questionText,
        options,
        answerExplanation: fqq.question.answerExplanation,
      };
    },
  );

  return (
    <AssessmentClient
      quizId={id}
      title={quiz.title}
      description={quiz.description}
      timeLimit={quiz.timeLimit}
      questions={questions}
      existingScore={existingScore}
      existingMCTotal={existingMCTotal}
      existingMCCorrect={existingMCCorrect}
      existingSACount={existingSACount}
    />
  );
}
