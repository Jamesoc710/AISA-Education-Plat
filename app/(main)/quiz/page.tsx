import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { QuizClient } from "@/components/quiz-client";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Quiz | TCO",
  description: "Pressure-test what you've read. Pick a mode and go.",
};

type ResumePick = {
  conceptId: string;
  conceptName: string;
  conceptSlug: string;
  attemptedAt: string;
};

export default async function QuizPage() {
  const [tiers, resume] = await Promise.all([loadTiers(), loadResumePick()]);

  return <QuizClient tiers={tiers} resume={resume} />;
}

async function loadTiers() {
  const tiers = await prisma.tier.findMany({
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

async function loadResumePick(): Promise<ResumePick | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const lastAttempt = await prisma.quizAttempt.findFirst({
    where: { userId: authUser.id },
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
