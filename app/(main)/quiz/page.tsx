import { prisma } from "@/lib/prisma";
import { QuizClient } from "@/components/quiz-client";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Quiz — AISA Atlas",
  description: "Test your AI knowledge across concepts and sections.",
};

export default async function QuizPage() {
  const [concepts, sections] = await Promise.all([
    prisma.concept.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        sectionId: true,
        _count: { select: { questions: true } },
      },
      orderBy: [
        { section: { tier: { sortOrder: "asc" } } },
        { section: { sortOrder: "asc" } },
        { sortOrder: "asc" },
      ],
    }),
    prisma.section.findMany({
      select: {
        id: true,
        name: true,
        tier: { select: { name: true, slug: true } },
        _count: { select: { concepts: true } },
      },
      orderBy: [{ tier: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    }),
  ]);

  // Only include concepts/sections that actually have questions
  const conceptOptions = concepts
    .filter((c) => c._count.questions > 0)
    .map((c) => ({
      id: c.id,
      name: c.name,
      questionCount: c._count.questions,
    }));

  const sectionOptions = sections.map((s) => ({
    id: s.id,
    name: s.name,
    tierName: s.tier.name,
    tierSlug: s.tier.slug,
    conceptCount: s._count.concepts,
  }));

  return <QuizClient concepts={conceptOptions} sections={sectionOptions} />;
}
