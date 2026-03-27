import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

// Full concept detail — everything needed for the detail page
export async function getConceptBySlug(slug: string) {
  const concept = await prisma.concept.findUnique({
    where: { slug },
    include: {
      section: { include: { tier: true } },
      resources: { orderBy: { sortOrder: "asc" } },
      relatedFrom: {
        include: { relatedConcept: { select: { name: true, slug: true } } },
      },
    },
  });
  if (!concept) notFound();
  return concept;
}

// Sidebar data — all sections with their concepts (minimal fields)
export async function getAllSectionsForSidebar() {
  const sections = await prisma.section.findMany({
    include: {
      tier: true,
      concepts: {
        select: { id: true, name: true, slug: true, sortOrder: true },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: [{ tier: { sortOrder: "asc" } }, { sortOrder: "asc" }],
  });
  return sections;
}

export type SidebarSection = Awaited<ReturnType<typeof getAllSectionsForSidebar>>[number];
export type ConceptDetail = Awaited<ReturnType<typeof getConceptBySlug>>;
