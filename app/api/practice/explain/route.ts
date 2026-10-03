import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { gradeExplanation } from "@/lib/grading";
import { recordReviewResult } from "@/lib/review";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MIN_CHARS = 20;
const MAX_CHARS = 1200;
// Each answer is one LLM call; this keeps a runaway session bounded.
const DAILY_LIMIT = 40;

/**
 * POST /api/practice/explain  { conceptId, explanation }
 * Grades a member's own-words explanation, saves it, and updates the review
 * queue. Returns { score, gotRight, missed, modelAnswer, gradingFailed }.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { conceptId?: unknown; explanation?: unknown };
  const conceptId = typeof body.conceptId === "string" ? body.conceptId : "";
  const explanation = typeof body.explanation === "string" ? body.explanation.trim() : "";
  if (explanation.length < MIN_CHARS) {
    return NextResponse.json(
      { error: "Write at least a sentence or two before checking." },
      { status: 400 },
    );
  }
  if (explanation.length > MAX_CHARS) {
    return NextResponse.json(
      { error: `Keep it under ${MAX_CHARS} characters. Two or three sentences is the goal.` },
      { status: 400 },
    );
  }

  const concept = conceptId
    ? await prisma.concept.findUnique({
        where: { id: conceptId },
        select: { name: true, whatItIs: true, simpleExplanation: true, whyItMatters: true },
      })
    : null;
  if (!concept) {
    return NextResponse.json({ error: "Concept not found" }, { status: 404 });
  }

  const usedToday = await prisma.practiceAttempt.count({
    where: {
      userId: user.id,
      mode: "explain",
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });
  if (usedToday >= DAILY_LIMIT) {
    return NextResponse.json(
      { error: "That's the daily limit for Explain it back. Try Match or a quiz, or come back tomorrow." },
      { status: 429 },
    );
  }

  const result = await gradeExplanation({
    conceptName: concept.name,
    reference: {
      whatItIs: concept.whatItIs,
      simpleExplanation: concept.simpleExplanation,
      whyItMatters: concept.whyItMatters,
    },
    explanation,
  });

  if (!result.failed) {
    await prisma.practiceAttempt.create({
      data: {
        userId: user.id,
        conceptId,
        mode: "explain",
        result: result.score,
        response: explanation,
        feedback: { gotRight: result.gotRight, missed: result.missed, modelAnswer: result.modelAnswer },
      },
    });
    await recordReviewResult(user.id, conceptId, result.score);
  }

  return NextResponse.json({
    score: result.score,
    gotRight: result.gotRight,
    missed: result.missed,
    modelAnswer: result.modelAnswer,
    gradingFailed: Boolean(result.failed),
  });
}
