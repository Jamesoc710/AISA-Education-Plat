import { getConceptBySlug, getAllSectionsForSidebar } from "@/lib/concepts";
import { getAuthUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/prisma";
import { ConceptDetailClient } from "@/components/concept-detail-client";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const concept = await getConceptBySlug(slug);
  return {
    title: `${concept.name} | AISA Atlas`,
    description: concept.subtitle,
  };
}

export default async function ConceptPage({ params }: Props) {
  const { slug } = await params;
  const [concept, sections, authUser] = await Promise.all([
    getConceptBySlug(slug),
    getAllSectionsForSidebar(),
    getAuthUser(),
  ]);
  const userId = authUser?.id ?? null;

  const [questionCount, reviewItem] = await Promise.all([
    prisma.question.count({ where: { conceptId: concept.id } }),
    userId
      ? prisma.reviewItem.findUnique({
          where: { userId_conceptId: { userId, conceptId: concept.id } },
          select: { dueAt: true },
        })
      : null,
  ]);

  return (
    <ConceptDetailClient
      concept={concept}
      sections={sections}
      practice={{
        signedIn: Boolean(userId),
        hasQuestions: questionCount > 0,
        review: { inReview: Boolean(reviewItem), dueAt: reviewItem?.dueAt.toISOString() ?? null },
      }}
    />
  );
}
