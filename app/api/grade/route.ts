import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { gradeShortAnswer } from "@/lib/grading";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/grade
 * Grade a single short-answer question via LLM.
 *
 * Body: {
 *   questionId: string,
 *   studentAnswer: string,
 *   attemptId?: string  // If provided, updates the QuizAttempt record
 * }
 *
 * Returns: { score, reasoning }
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { questionId, studentAnswer, attemptId } = (await req.json()) as {
    questionId: string;
    studentAnswer: string;
    attemptId?: string;
  };

  if (!questionId || studentAnswer === undefined) {
    return NextResponse.json(
      { error: "Missing questionId or studentAnswer" },
      { status: 400 },
    );
  }

  // Fetch question with concept info
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: {
      questionText: true,
      answerExplanation: true,
      concept: { select: { name: true } },
    },
  });

  if (!question) {
    return NextResponse.json(
      { error: "Question not found" },
      { status: 404 },
    );
  }

  const result = await gradeShortAnswer({
    questionText: question.questionText,
    modelAnswer: question.answerExplanation,
    studentAnswer,
    conceptName: question.concept.name,
  });

  // If attemptId provided, update the QuizAttempt record
  if (attemptId) {
    await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        isCorrect: result.score === "correct",
        llmScore: result.score,
        llmReasoning: result.reasoning,
        llmGradedAt: new Date(),
      },
    });
  }

  return NextResponse.json(result);
}
