import { prisma } from "./prisma";
import type { DigestEdition } from "@prisma/client";
import type { DigestItem, DigestQuizQuestion } from "./digest-sync";

// Server-side serialization for the /digest pages: ISO dates + concept names
// resolved at render time (a concept rename never goes stale in old editions).

export interface RelatedConceptRef {
  slug: string;
  name: string;
}

export interface DigestItemView extends DigestItem {
  relatedConcepts: RelatedConceptRef[];
}

export interface DigestEditionView {
  headline: string;
  weekOf: string; // ISO — Monday 00:00 UTC
  generatedAt: string; // ISO
  status: string;
  items: DigestItemView[];
  bigPicture: string | null;
  watchFor: string | null;
  quiz: DigestQuizQuestion[] | null;
}

export async function editionToView(edition: DigestEdition): Promise<DigestEditionView> {
  const items = (Array.isArray(edition.items) ? edition.items : []) as unknown as DigestItem[];
  const slugs = Array.from(
    new Set(
      items.flatMap((i) =>
        Array.isArray(i.relatedConceptSlugs) ? i.relatedConceptSlugs : [],
      ),
    ),
  );
  const concepts =
    slugs.length > 0
      ? await prisma.concept.findMany({
          where: { slug: { in: slugs } },
          select: { slug: true, name: true },
        })
      : [];
  const nameBySlug = new Map(
    concepts.map((c: { slug: string; name: string }) => [c.slug, c.name]),
  );

  return {
    headline: edition.headline,
    weekOf: edition.weekOf.toISOString(),
    generatedAt: edition.generatedAt.toISOString(),
    status: edition.status,
    bigPicture: edition.bigPicture,
    watchFor: edition.watchFor,
    quiz: Array.isArray(edition.quiz)
      ? (edition.quiz as unknown as DigestQuizQuestion[])
      : null,
    items: items.map((i) => ({
      ...i,
      relatedConcepts: (Array.isArray(i.relatedConceptSlugs) ? i.relatedConceptSlugs : []).flatMap(
        (slug) => {
          const name = nameBySlug.get(slug);
          return name ? [{ slug, name }] : []; // deleted concepts silently drop
        },
      ),
    })),
  };
}
