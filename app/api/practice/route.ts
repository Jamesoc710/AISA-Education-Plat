import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { recordReviewResult, type PracticeResult } from "@/lib/review";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MODES = ["flashcard", "match"] as const;
const RESULTS: PracticeResult[] = ["correct", "partial", "incorrect"];
const MAX_RESULTS = 12;

/**
 * POST /api/practice
 * Records concept-level results from the self-graded modes and updates the
 * review queue.
 *
 * Body: { mode: "flashcard" | "match", results: [{ conceptId, result }] }
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { mode?: unknown; results?: unknown };
  const mode = MODES.find((m) => m === body.mode);
  if (!mode || !Array.isArray(body.results)) {
    return NextResponse.json({ error: "Expected { mode, results }" }, { status: 400 });
  }

  const parsed = (body.results as { conceptId?: unknown; result?: unknown }[])
    .slice(0, MAX_RESULTS)
    .flatMap((r) =>
      typeof r?.conceptId === "string" && RESULTS.includes(r.result as PracticeResult)
        ? [{ conceptId: r.conceptId, result: r.result as PracticeResult }]
        : [],
    );

  // Only concepts that exist; a bad id must not fail the whole batch on a FK.
  const known = new Set(
    (
      await prisma.concept.findMany({
        where: { id: { in: parsed.map((r) => r.conceptId) } },
        select: { id: true },
      })
    ).map((c: { id: string }) => c.id),
  );
  const valid = parsed.filter((r) => known.has(r.conceptId));

  await prisma.practiceAttempt.createMany({
    data: valid.map((r) => ({ userId: user.id, conceptId: r.conceptId, mode, result: r.result })),
  });
  for (const r of valid) {
    await recordReviewResult(user.id, r.conceptId, r.result);
  }

  return NextResponse.json({ saved: valid.length });
}
