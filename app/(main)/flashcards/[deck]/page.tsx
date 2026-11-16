import { redirect, notFound } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/prisma";
import { getActiveTrackSlug } from "@/lib/track";
import { FlashcardPlayer } from "@/components/flashcard-player";
import { getTestPrepArea, TEST_PREP_DECK_PREFIX } from "@/lib/test-prep";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ deck: string }> };

const DECK_LABELS: Record<string, string> = {
  all: "All Concepts",
  due: "Due for review",
};

/** A Test prep study area's deck: /flashcards/prep-<area slug>. */
function prepArea(deck: string) {
  return deck.startsWith(TEST_PREP_DECK_PREFIX)
    ? getTestPrepArea(deck.slice(TEST_PREP_DECK_PREFIX.length))
    : undefined;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { deck } = await params;
  const label = DECK_LABELS[deck] ?? prepArea(deck)?.title;
  return {
    title: label ? `${label} flashcards` : "Flashcards",
  };
}

export default async function FlashcardPlayerPage({ params }: Props) {
  const { deck } = await params;

  const area = prepArea(deck);
  if (!DECK_LABELS[deck] && !area) notFound();

  const authUser = await getAuthUser();

  if (!authUser) redirect(`/login?redirect=/flashcards/${deck}`);

  const trackSlug = await getActiveTrackSlug();

  // The due deck spans tracks, like the review queue it comes from.
  const concepts = await prisma.concept.findMany({
    where: area
      ? { slug: { in: area.conceptSlugs } }
      : deck === "due"
        ? { reviewItems: { some: { userId: authUser.id, dueAt: { lte: new Date() } } } }
        : { section: { tier: { track: { slug: trackSlug } } } },
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
      deck={area ? "all" : (deck as "all" | "due")}
      deckLabel={area ? area.title : DECK_LABELS[deck]}
      cards={cards}
    />
  );
}
