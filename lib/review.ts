import { prisma } from "@/lib/prisma";
import {
  MAX_BOX,
  nextReviewState,
  type PracticeResult,
} from "@/lib/review-rules";

export { MAX_BOX, type PracticeResult } from "@/lib/review-rules";

export async function recordReviewResult(
  userId: string,
  conceptId: string,
  result: PracticeResult,
  now: Date = new Date(),
): Promise<void> {
  const existing = await prisma.reviewItem.findUnique({
    where: { userId_conceptId: { userId, conceptId } },
    select: { box: true, dueAt: true },
  });
  const next = nextReviewState(existing, result, now);
  await prisma.reviewItem.upsert({
    where: { userId_conceptId: { userId, conceptId } },
    create: { userId, conceptId, box: next.box, dueAt: next.dueAt, lastResult: result, lastSeenAt: now },
    update: { box: next.box, dueAt: next.dueAt, lastResult: result, lastSeenAt: now },
  });
}

/** "Add to review": due now, keeping any progress the member already has. */
export async function addToReview(userId: string, conceptId: string): Promise<{ dueAt: Date }> {
  const now = new Date();
  const item = await prisma.reviewItem.upsert({
    where: { userId_conceptId: { userId, conceptId } },
    create: { userId, conceptId, box: 1, dueAt: now },
    update: { dueAt: now },
    select: { dueAt: true },
  });
  return item;
}

export async function removeFromReview(userId: string, conceptId: string): Promise<void> {
  await prisma.reviewItem.deleteMany({ where: { userId, conceptId } });
}

export type ReviewSummary = {
  dueCount: number;
  totalCount: number;
  masteredCount: number; // box 5
  nextDueAt: string | null; // earliest upcoming due date when nothing is due
};

// The queue is personal, not per track: "due" means everything due.
export async function getReviewSummary(userId: string): Promise<ReviewSummary> {
  const now = new Date();
  const where = { userId };
  const [dueCount, totalCount, masteredCount, next] = await Promise.all([
    prisma.reviewItem.count({ where: { ...where, dueAt: { lte: now } } }),
    prisma.reviewItem.count({ where }),
    prisma.reviewItem.count({ where: { ...where, box: MAX_BOX } }),
    prisma.reviewItem.findFirst({
      where: { ...where, dueAt: { gt: now } },
      orderBy: { dueAt: "asc" },
      select: { dueAt: true },
    }),
  ]);
  return { dueCount, totalCount, masteredCount, nextDueAt: next?.dueAt.toISOString() ?? null };
}

/** Due concept ids, most overdue first. */
export async function getDueConceptIds(userId: string, limit: number): Promise<string[]> {
  const rows = await prisma.reviewItem.findMany({
    where: { userId, dueAt: { lte: new Date() } },
    orderBy: [{ box: "asc" }, { dueAt: "asc" }],
    take: limit,
    select: { conceptId: true },
  });
  return rows.map((r: { conceptId: string }) => r.conceptId);
}
