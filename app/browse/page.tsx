import { prisma } from "@/lib/prisma";
import { BrowseClient } from "@/components/browse-client";
import type { ConceptData, SectionGroup } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getConcepts(): Promise<SectionGroup[]> {
  const concepts = await prisma.concept.findMany({
    include: {
      section: {
        include: { tier: true },
      },
      resources: { select: { id: true } },
      questions: { select: { id: true } },
      relatedFrom: {
        include: { relatedConcept: { select: { name: true, slug: true } } },
      },
    },
    orderBy: [
      { section: { tier: { sortOrder: "asc" } } },
      { section: { sortOrder: "asc" } },
      { sortOrder: "asc" },
    ],
  });

  // Group by section
  const sectionMap = new Map<string, SectionGroup>();

  for (const c of concepts) {
    const tier = c.section.tier;
    const section = c.section;

    if (!sectionMap.has(section.id)) {
      sectionMap.set(section.id, {
        id: section.id,
        name: section.name,
        slug: section.slug,
        sortOrder: section.sortOrder,
        tier: {
          name: tier.name,
          slug: tier.slug,
          color: tier.color,
          sortOrder: tier.sortOrder,
        },
        concepts: [],
      });
    }

    const concept: ConceptData = {
      id: c.id,
      name: c.name,
      slug: c.slug,
      subtitle: c.subtitle,
      difficulty: c.difficulty,
      sortOrder: c.sortOrder,
      resourceCount: c.resources.length,
      questionCount: c.questions.length,
      relatedConcepts: c.relatedFrom.map((r) => ({
        slug: r.relatedConcept.slug,
        name: r.relatedConcept.name,
      })),
      section: {
        id: section.id,
        name: section.name,
        slug: section.slug,
        sortOrder: section.sortOrder,
      },
      tier: {
        name: tier.name,
        slug: tier.slug,
        color: tier.color,
        sortOrder: tier.sortOrder,
      },
    };

    sectionMap.get(section.id)!.concepts.push(concept);
  }

  return Array.from(sectionMap.values());
}

export default async function BrowsePage() {
  const sections = await getConcepts();
  return <BrowseClient sections={sections} />;
}
