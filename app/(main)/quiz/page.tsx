import { prisma } from "@/lib/prisma";
import { QuizClient } from "@/components/quiz-client";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Quiz | AISA Atlas",
  description: "Test your AI knowledge across concepts and sections.",
};

export default async function QuizPage() {
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

  const tierData = tiers.map((t: typeof tiers[number]) => ({
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

  return <QuizClient tiers={tierData} />;
}
