import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/quiz?mode=concept&id=<conceptId>
 * GET /api/quiz?mode=section&id=<sectionId>
 * GET /api/quiz?mode=mixed
 *
 * Returns a randomized set of questions for the requested scope.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const mode = searchParams.get("mode");
  const id = searchParams.get("id");

  if (!mode || !["concept", "section", "mixed"].includes(mode)) {
    return NextResponse.json(
      { error: "Invalid mode. Use concept, section, or mixed." },
      { status: 400 },
    );
  }

  if ((mode === "concept" || mode === "section") && !id) {
    return NextResponse.json(
      { error: `Missing id parameter for mode "${mode}".` },
      { status: 400 },
    );
  }

  try {
    const where =
      mode === "concept"
        ? { conceptId: id! }
        : mode === "section"
          ? { concept: { sectionId: id! } }
          : {}; // mixed — all questions

    const questions = await prisma.question.findMany({
      where,
      include: {
        concept: { select: { name: true, slug: true } },
      },
    });

    // Fisher-Yates shuffle
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }

    // Cap at 10 for mixed mode to keep quizzes digestible
    const capped = mode === "mixed" ? questions.slice(0, 10) : questions;

    // Parse options JSON for MC questions
    const parsed = capped.map((q) => ({
      id: q.id,
      type: q.type,
      questionText: q.questionText,
      options: q.options ? JSON.parse(q.options) : null,
      answerExplanation: q.answerExplanation,
      conceptName: q.concept.name,
      conceptSlug: q.concept.slug,
    }));

    return NextResponse.json({ questions: parsed });
  } catch (error) {
    console.error("Quiz API error:", error);
    return NextResponse.json(
      { error: "Failed to load questions." },
      { status: 500 },
    );
  }
}
