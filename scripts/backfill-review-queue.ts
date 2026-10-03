/**
 * One-time backfill: seed the review queue from members' existing quiz history.
 *
 * Replays every graded QuizAttempt per (member, concept) in time order through
 * the same Leitner rules the app uses (lib/review.ts nextReviewState), so a
 * returning member's queue reflects what they already practiced. Only creates
 * items that don't exist yet; never touches a review item the app already
 * wrote. Old history mostly lands as due now, which is the honest answer.
 *
 * Modes:
 *   (default)  dry run: print what would be created, no writes
 *   --apply    create the missing review items
 *
 *   npx tsx --env-file=.env.local scripts/backfill-review-queue.ts [--apply]
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { nextReviewState, type PracticeResult, type ReviewState } from "../lib/review-rules";

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error("DIRECT_URL or DATABASE_URL must be set");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

async function main() {
  const apply = process.argv.includes("--apply");
  console.log(`Review queue backfill: ${apply ? "APPLY" : "dry run"}`);

  const attempts = await prisma.quizAttempt.findMany({
    where: { isCorrect: { not: null } },
    orderBy: { attemptedAt: "asc" },
    select: {
      userId: true,
      isCorrect: true,
      llmScore: true,
      attemptedAt: true,
      question: { select: { conceptId: true } },
    },
  });

  type Key = string; // `${userId}:${conceptId}`
  const states = new Map<Key, ReviewState & { lastResult: PracticeResult; lastSeenAt: Date }>();
  for (const a of attempts) {
    const key = `${a.userId}:${a.question.conceptId}`;
    const result: PracticeResult =
      a.llmScore === "partial" ? "partial" : a.isCorrect ? "correct" : "incorrect";
    const prev = states.get(key) ?? null;
    const next = nextReviewState(prev, result, a.attemptedAt);
    states.set(key, { ...next, lastResult: result, lastSeenAt: a.attemptedAt });
  }

  const existing = new Set(
    (await prisma.reviewItem.findMany({ select: { userId: true, conceptId: true } })).map(
      (r) => `${r.userId}:${r.conceptId}`,
    ),
  );
  const toCreate = [...states.entries()].filter(([key]) => !existing.has(key));

  const now = Date.now();
  const due = toCreate.filter(([, s]) => s.dueAt.getTime() <= now).length;
  const members = new Set(toCreate.map(([key]) => key.split(":")[0])).size;
  console.log(
    `  ${attempts.length} graded attempts -> ${states.size} (member, concept) pairs; ` +
      `${toCreate.length} new review items for ${members} members (${due} due now), ` +
      `${states.size - toCreate.length} already exist`,
  );

  if (!apply) {
    console.log("  Dry run only. Re-run with --apply to write.");
    return;
  }

  const created = await prisma.reviewItem.createMany({
    data: toCreate.map(([key, s]) => {
      const [userId, conceptId] = key.split(":");
      return {
        userId,
        conceptId,
        box: s.box,
        dueAt: s.dueAt,
        lastResult: s.lastResult,
        lastSeenAt: s.lastSeenAt,
      };
    }),
  });
  console.log(`  Created ${created.count} review items.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
