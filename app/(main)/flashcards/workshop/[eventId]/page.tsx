import { redirect, notFound } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/prisma";
import { FlashcardPlayer } from "@/components/flashcard-player";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ eventId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { eventId } = await params;
  const event = await prisma.scheduleEvent.findUnique({
    where: { id: eventId },
    select: { title: true },
  });
  return {
    title: event ? `${event.title} — Prep | AISA Atlas` : "Workshop prep | AISA Atlas",
  };
}

export default async function WorkshopFlashcardsPage({ params }: Props) {
  const { eventId } = await params;

  const authUser = await getAuthUser();
  if (!authUser) redirect(`/login?redirect=/flashcards/workshop/${eventId}`);

  const event = await prisma.scheduleEvent.findUnique({
    where: { id: eventId },
    select: { id: true, title: true, relatedConceptSlugs: true },
  });
  if (!event) notFound();

  const slugs = Array.isArray(event.relatedConceptSlugs)
    ? (event.relatedConceptSlugs as string[])
    : [];

  const concepts =
    slugs.length === 0
      ? []
      : await prisma.concept.findMany({
          where: { slug: { in: slugs } },
          select: {
            id: true,
            name: true,
            slug: true,
            subtitle: true,
            simpleExplanation: true,
            flashcardShort: true,
            flashcardDefinition: true,
            difficulty: true,
            section: { select: { name: true } },
          },
        });

  type ConceptRow = (typeof concepts)[number];
  const bySlug = new Map<string, ConceptRow>(concepts.map((c: ConceptRow) => [c.slug, c]));

  // Preserve the LLM's original slug ordering so cards show in the order
  // the normalizer picked them (most-relevant first).
  const ordered = slugs
    .map((s) => bySlug.get(s))
    .filter((c): c is ConceptRow => c !== undefined);

  const cards = ordered.map((c) => {
    const longDef = c.flashcardDefinition ?? c.simpleExplanation ?? c.subtitle;
    const shortDef = c.flashcardShort ?? longDef;
    return {
      id: c.id,
      slug: c.slug,
      term: c.name,
      definition: shortDef,
      expandedDefinition: longDef,
      tier: c.difficulty.toLowerCase(),
      sectionName: c.section.name,
    };
  });

  return (
    <FlashcardPlayer deck="workshop" deckLabel={`Prep · ${event.title}`} cards={cards} />
  );
}
