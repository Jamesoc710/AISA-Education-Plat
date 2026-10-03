import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { gradeShortAnswer } from "@/lib/grading";
import { recordReviewResult } from "@/lib/review";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MAX_ANSWER = 2000;

/**
 * POST /api/quiz/answer
 * Grades one answer server-side, records the attempt, and updates the review
 * queue. Signed-out visitors can check multiple-choice answers (nothing is
 * saved); short answers need an account because they call the LLM grader.
 *
 * Body (MC):  { questionId, selectedText }
 * Body (SA):  { questionId, answer }     an empty answer reveals the model answer
 *
 * Returns (MC): { type: "MC", isCorrect, correctText, explanation }
 * Returns (SA): { type: "SHORT_ANSWER", score, reasoning, modelAnswer, gradingFailed }
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    questionId?: unknown;
    selectedText?: unknown;
    answer?: unknown;
  };
  const questionId = typeof body.questionId === "string" ? body.questionId : "";
  if (!questionId) {
    return NextResponse.json({ error: "Missing questionId" }, { status: 400 });
  }

  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: {
      type: true,
      questionText: true,
      options: true,
      answerExplanation: true,
      conceptId: true,
      concept: { select: { name: true } },
    },
  });
  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (question.type === "MC") {
    const selectedText = typeof body.selectedText === "string" ? body.selectedText : "";
    const options = JSON.parse(question.options ?? "[]") as { text: string; isCorrect: boolean }[];
    const selected = options.find((o) => o.text === selectedText);
    if (!selected) {
      return NextResponse.json({ error: "Unknown option" }, { status: 400 });
    }
    const correct = options.find((o) => o.isCorrect);

    if (user) {
      await prisma.quizAttempt.create({
        data: {
          userId: user.id,
          questionId,
          selectedAnswer: selected.text,
          isCorrect: selected.isCorrect,
        },
      });
      await recordReviewResult(user.id, question.conceptId, selected.isCorrect ? "correct" : "incorrect");
    }

    return NextResponse.json({
      type: "MC",
      isCorrect: selected.isCorrect,
      correctText: correct?.text ?? null,
      explanation: question.answerExplanation,
    });
  }

  if (!user) {
    return NextResponse.json({ error: "Sign in to answer short-answer questions." }, { status: 401 });
  }

  const answer = typeof body.answer === "string" ? body.answer.slice(0, MAX_ANSWER) : "";
  const result = await gradeShortAnswer({
    questionText: question.questionText,
    modelAnswer: question.answerExplanation,
    studentAnswer: answer,
    conceptName: question.concept.name,
  });

  // A grader outage is not the member's fault: keep the answer, skip the grade,
  // and leave the review queue alone.
  await prisma.quizAttempt.create({
    data: {
      userId: user.id,
      questionId,
      selectedAnswer: answer.trim() || null,
      isCorrect: result.failed ? null : result.score === "correct",
      llmScore: result.failed ? null : result.score,
      llmReasoning: result.failed ? null : result.reasoning,
      llmGradedAt: result.failed ? null : new Date(),
    },
  });
  if (!result.failed) {
    await recordReviewResult(user.id, question.conceptId, result.score);
  }

  return NextResponse.json({
    type: "SHORT_ANSWER",
    score: result.score,
    reasoning: result.reasoning,
    modelAnswer: question.answerExplanation,
    gradingFailed: Boolean(result.failed),
  });
}
