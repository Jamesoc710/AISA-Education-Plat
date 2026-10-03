import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getActiveTrackSlug } from "@/lib/track";
import { getDueConceptIds } from "@/lib/review";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MODES = ["concept", "section", "tier", "mixed", "review"] as const;
type Mode = (typeof MODES)[number];
const REVIEW_SIZE = 10;
const MIXED_SIZE = 10;

/**
 * GET /api/quiz?mode=concept&id=<conceptId>
 * GET /api/quiz?mode=section&id=<sectionId>
 * GET /api/quiz?mode=tier&id=<tierId>
 * GET /api/quiz?mode=mixed
 * GET /api/quiz?mode=review          (signed in: one question per due concept)
 *
 * Returns a randomized set of questions for the requested scope. Answer keys
 * and explanations are NOT sent; POST /api/quiz/answer grades each answer.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const mode = searchParams.get("mode") as Mode | null;
  const id = searchParams.get("id");

  if (!mode || !MODES.includes(mode)) {
    return NextResponse.json(
      { error: "Invalid mode. Use concept, section, tier, mixed, or review." },
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
    // Browse-style scopes follow the member's active track. A single concept
    // and the review queue are explicit, so they work from any track.
    const trackSlug = await getActiveTrackSlug();
    const trackWhere =
      mode === "concept" || mode === "review"
        ? {}
        : { concept: { section: { tier: { track: { slug: trackSlug } } } } };

    let scopeWhere: object = {};
    let reviewUserId: string | null = null;
    if (mode === "concept") scopeWhere = { conceptId: id! };
    else if (mode === "section") scopeWhere = { concept: { sectionId: id! } };
    else if (mode === "tier") scopeWhere = { concept: { section: { tierId: id! } } };
    else if (mode === "review") {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Sign in to review." }, { status: 401 });
      }
      reviewUserId = user.id;
      const dueIds = await getDueConceptIds(user.id, REVIEW_SIZE);
      if (dueIds.length === 0) return NextResponse.json({ questions: [] });
      scopeWhere = { conceptId: { in: dueIds } };
    }

    const questions = await prisma.question.findMany({
      where: { AND: [scopeWhere, trackWhere] },
      select: {
        id: true,
        type: true,
        questionText: true,
        options: true,
        conceptId: true,
        concept: {
          select: {
            name: true,
            slug: true,
            section: { select: { id: true, name: true } },
          },
        },
      },
    });

    shuffle(questions);

    let picked = questions;
    if (mode === "mixed") {
      picked = questions.slice(0, MIXED_SIZE);
    } else if (mode === "review" && reviewUserId) {
      picked = await onePerConcept(questions, reviewUserId);
    }

    const parsed = picked.map((q: (typeof questions)[number]) => {
      const options = q.options
        ? shuffle((JSON.parse(q.options) as { text: string }[]).map((o) => ({ text: o.text })))
        : null;
      return {
        id: q.id,
        type: q.type,
        questionText: q.questionText,
        options,
        conceptId: q.conceptId,
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

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Review serves one question per due concept, preferring the one the member
 * saw least recently (never-seen first) so repeats rotate through the bank.
 */
async function onePerConcept<T extends { id: string; conceptId: string }>(
  questions: T[],
  userId: string,
): Promise<T[]> {
  const lastSeen = await prisma.quizAttempt.groupBy({
    by: ["questionId"],
    where: { userId, questionId: { in: questions.map((q) => q.id) } },
    _max: { attemptedAt: true },
  });
  const seenAt = new Map<string, number>(
    lastSeen.map((r: { questionId: string; _max: { attemptedAt: Date | null } }) => [
      r.questionId,
      r._max.attemptedAt?.getTime() ?? 0,
    ]),
  );
  const best = new Map<string, T>();
  for (const q of questions) {
    const current = best.get(q.conceptId);
    if (!current || (seenAt.get(q.id) ?? 0) < (seenAt.get(current.id) ?? 0)) {
      best.set(q.conceptId, q);
    }
  }
  return [...best.values()];
}
