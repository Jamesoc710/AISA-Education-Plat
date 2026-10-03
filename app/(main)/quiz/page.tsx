import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getActiveTrackSlug } from "@/lib/track";
import { QuizClient, type QuizMode } from "@/components/quiz-client";
import { getReviewSummary } from "@/lib/review";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Quiz | TCO",
  description: "Pick a mode to see where you're at.",
};

type ResumePick = {
  conceptId: string;
  conceptName: string;
  conceptSlug: string;
  attemptedAt: string;
};

const DEEP_LINK_MODES: QuizMode[] = ["concept", "section", "tier", "mixed", "review"];

export default async function QuizPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string | string[]; id?: string | string[] }>;
}) {
  const params = await searchParams;
  const mode = typeof params.mode === "string" ? (params.mode as QuizMode) : null;
  const id = typeof params.id === "string" ? params.id : null;
  const needsId = mode === "concept" || mode === "section" || mode === "tier";
  const initial =
    mode && DEEP_LINK_MODES.includes(mode) && (!needsId || id) ? { mode, id } : null;

  const trackSlug = await getActiveTrackSlug();
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const [tiers, resume, review] = await Promise.all([
    loadTiers(trackSlug),
    authUser ? loadResumePick(authUser.id, trackSlug) : null,
    authUser ? getReviewSummary(authUser.id) : null,
  ]);

  return (
    <QuizClient
      tiers={tiers}
      resume={resume}
      reviewDue={review?.dueCount ?? 0}
      initial={initial}
    />
  );
}

async function loadTiers(trackSlug: string) {
  const tiers = await prisma.tier.findMany({
    where: { track: { slug: trackSlug } },
    select: {
      id: true,
      name: true,
      slug: true,
      sections: {
        select: {
          id: true,
          name: true,
          concepts: {
            select: {
              id: true,
              name: true,
              slug: true,
              _count: { select: { questions: true } },
            },
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  return tiers.map((t: typeof tiers[number]) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    sections: t.sections.map((s: typeof tiers[number]["sections"][number]) => ({
      id: s.id,
      name: s.name,
      concepts: s.concepts
        .filter((c: typeof s.concepts[number]) => c._count.questions > 0)
        .map((c: typeof s.concepts[number]) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          questionCount: c._count.questions,
        })),
    })),
  }));
}

async function loadResumePick(userId: string, trackSlug: string): Promise<ResumePick | null> {
  const lastAttempt = await prisma.quizAttempt.findFirst({
    where: {
      userId,
      question: {
        concept: { section: { tier: { track: { slug: trackSlug } } } },
      },
    },
    orderBy: { attemptedAt: "desc" },
    select: {
      attemptedAt: true,
      question: {
        select: {
          concept: {
            select: { id: true, name: true, slug: true },
          },
        },
      },
    },
  });

  if (!lastAttempt?.question.concept) return null;

  return {
    conceptId: lastAttempt.question.concept.id,
    conceptName: lastAttempt.question.concept.name,
    conceptSlug: lastAttempt.question.concept.slug,
    attemptedAt: lastAttempt.attemptedAt.toISOString(),
  };
}
