import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/quiz?mode=concept&id=<conceptId>
 * GET /api/quiz?mode=section&id=<sectionId>
 * GET /api/quiz?mode=tier&id=<tierId>
 * GET /api/quiz?mode=mixed
 *
 * Returns a randomized set of questions for the requested scope.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const mode = searchParams.get("mode");
  const id = searchParams.get("id");

  if (!mode || !["concept", "section", "tier", "mixed"].includes(mode)) {
    return NextResponse.json(
      { error: "Invalid mode. Use concept, section, tier, or mixed." },
      { status: 400 },
    );
  }

  if ((mode === "concept" || mode === "section" || mode === "tier") && !id) {
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
          : mode === "tier"
            ? { concept: { section: { tierId: id! } } }
            : {}; // mixed — all questions

    const questions = await prisma.question.findMany({
      where,
      include: {
        concept: {
          select: {
            name: true,
            slug: true,
            section: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Fisher-Yates shuffle
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }

    // Cap at 10 for mixed mode to keep quizzes digestible
    const capped = mode === "mixed" ? questions.slice(0, 10) : questions;

    // Parse options JSON for MC questions and shuffle option order
    const parsed = capped.map((q: typeof questions[number]) => {
      let options = q.options ? JSON.parse(q.options) : null;
      if (options && Array.isArray(options)) {
        for (let i = options.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [options[i], options[j]] = [options[j], options[i]];
        }
      }
      return {
        id: q.id,
        type: q.type,
        questionText: q.questionText,
        options,
        answerExplanation: q.answerExplanation,
        conceptName: q.concept.name,
        conceptSlug: q.concept.slug,
        sectionName: q.concept.section.name,
        sectionId: q.concept.section.id,
      };
    });

    return NextResponse.json({ questions: parsed });
  } catch (error) {
    console.error("Quiz API error:", error);
    return NextResponse.json(
      { error: "Failed to load questions." },
      { status: 500 },
    );
  }
}
