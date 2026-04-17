export type TierSlug = "fundamentals" | "intermediate" | "advanced";

export type RelatedConcept = {
  slug: string;
  name: string;
};

export type ConceptData = {
  id: string;
  name: string;
  slug: string;
  subtitle: string;
  difficulty: string;
  sortOrder: number;
  resourceCount: number;
  questionCount: number;
  relatedConcepts: RelatedConcept[];
  section: {
    id: string;
    name: string;
    slug: string;
    sortOrder: number;
  };
  tier: {
    name: string;
    slug: string;
    color: string;
    sortOrder: number;
  };
};

export type SectionGroup = {
  id: string;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  tier: { name: string; slug: string; color: string; sortOrder: number };
  concepts: ConceptData[];
};
