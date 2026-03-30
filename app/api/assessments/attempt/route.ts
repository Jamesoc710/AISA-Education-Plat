import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/assessments/attempt
 * Submits a formal quiz attempt for the authenticated recruit.
 *
 * Body: {
 *   quizId: string,
 *   answers: Array<{ questionId: string, selected: string | null }>
 * }
 */
export async function POST(req: NextRequest) {
  // Auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const { quizId, answers } = body as {
    quizId: string;
    answers: Array<{ questionId: string; selected: string | null }>;
  };

  if (!quizId || !answers?.length) {
    return NextResponse.json(
      { error: "Missing quizId or answers" },
      { status: 400 },
    );
  }

  // Verify quiz exists and is active
  const quiz = await prisma.formalQuiz.findUnique({ where: { id: quizId } });
  if (!quiz || quiz.status !== "active") {
    return NextResponse.json(
      { error: "Quiz not found or not active" },
      { status: 404 },
    );
  }

  // Prevent double-submit
  const existing = await prisma.formalQuizAttempt.findUnique({
    where: {
      userId_formalQuizId: { userId: user.id, formalQuizId: quizId },
    },
  });
  if (existing?.submittedAt) {
    return NextResponse.json(
      { error: "You have already submitted this assessment" },
      { status: 409 },
    );
  }

  // Create attempt record (or reuse an in-progress one)
  const attempt =
    existing ??
    (await prisma.formalQuizAttempt.create({
      data: {
        userId: user.id,
        formalQuizId: quizId,
      },
    }));

  // Grade each answer
  let mcCorrect = 0;
  let mcTotal = 0;
  let saCount = 0;

  for (const ans of answers) {
    const question = await prisma.question.findUnique({
      where: { id: ans.questionId },
    });
    if (!question) continue;

    let isCorrect: boolean | null = null;

    if (question.type === "MC" && question.options) {
      mcTotal++;
      const options: { text: string; isCorrect: boolean }[] = JSON.parse(
        question.options,
      );
      const correctOption = options.find((o) => o.isCorrect);
      if (correctOption && ans.selected === correctOption.text) {
        isCorrect = true;
        mcCorrect++;
      } else {
        isCorrect = false;
      }
    } else if (question.type === "SHORT_ANSWER") {
      // SA: leave isCorrect null for admin review
      isCorrect = null;
      saCount++;
    }

    await prisma.formalQuizAnswer.create({
      data: {
        attemptId: attempt.id,
        questionId: ans.questionId,
        selected: ans.selected,
        isCorrect,
      },
    });
  }

  // Calculate score and finalize
  const score = mcTotal > 0 ? Math.round((mcCorrect / mcTotal) * 100) : 0;

  await prisma.formalQuizAttempt.update({
    where: { id: attempt.id },
    data: {
      score,
      submittedAt: new Date(),
    },
  });

  return NextResponse.json({ score, mcCorrect, mcTotal, saCount });
}
