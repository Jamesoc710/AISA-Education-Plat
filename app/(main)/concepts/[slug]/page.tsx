import { getConceptBySlug, getAllSectionsForSidebar } from "@/lib/concepts";
import { ConceptDetailClient } from "@/components/concept-detail-client";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const concept = await getConceptBySlug(slug);
  return {
    title: `${concept.name} — AISA Atlas`,
    description: concept.subtitle,
  };
}

export default async function ConceptPage({ params }: Props) {
  const { slug } = await params;
  const [concept, sections] = await Promise.all([
    getConceptBySlug(slug),
    getAllSectionsForSidebar(),
  ]);

  return <ConceptDetailClient concept={concept} sections={sections} />;
}
