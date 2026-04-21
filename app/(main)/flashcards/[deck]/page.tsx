import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { FlashcardPlayer } from "@/components/flashcard-player";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ deck: string }> };

const DECK_LABELS: Record<string, string> = {
  all: "All Concepts",
  bookmarked: "Bookmarked",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { deck } = await params;
  const label = DECK_LABELS[deck];
  return {
    title: label ? `${label} flashcards | AISA Atlas` : "Flashcards | AISA Atlas",
  };
}

export default async function FlashcardPlayerPage({ params }: Props) {
  const { deck } = await params;

  if (!DECK_LABELS[deck]) notFound();

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) redirect(`/login?redirect=/flashcards/${deck}`);

  // Bookmarks currently live in localStorage (not DB), so we always fetch every
  // concept and let the client filter by locally-stored IDs when deck=bookmarked.
  const concepts = await prisma.concept.findMany({
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
    orderBy: [{ section: { sortOrder: "asc" } }, { sortOrder: "asc" }],
  });

  type ConceptRow = (typeof concepts)[number];
  const cards = concepts.map((c: ConceptRow) => {
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
    <FlashcardPlayer
      deck={deck as "all" | "bookmarked"}
      deckLabel={DECK_LABELS[deck]}
      cards={cards}
    />
  );
}
