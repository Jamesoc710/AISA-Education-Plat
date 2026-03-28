import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/quiz/attempts
 * Saves quiz results for the authenticated user.
 *
 * Body: {
 *   answers: [{ questionId: string, selectedAnswer: string | null, isCorrect: boolean | null }]
 * }
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const answers: {
    questionId: string;
    selectedAnswer: string | null;
    isCorrect: boolean | null;
  }[] = body.answers;

  if (!answers?.length) {
    return NextResponse.json(
      { error: "No answers provided" },
      { status: 400 },
    );
  }

  // Write all attempts
  const created = await prisma.quizAttempt.createMany({
    data: answers.map((a) => ({
      userId: user.id,
      questionId: a.questionId,
      selectedAnswer: a.selectedAnswer,
      isCorrect: a.isCorrect,
    })),
  });

  return NextResponse.json({ saved: created.count });
}
