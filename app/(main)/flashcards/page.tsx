import { getAuthUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/prisma";
import { getActiveTrackSlug } from "@/lib/track";
import { getReviewSummary } from "@/lib/review";
import { FlashcardsPicker } from "@/components/flashcards-picker";
import { AuthGate } from "@/components/ui/auth-gate";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Flashcards | AISA Atlas",
  description: "Study AI concepts with flashcards.",
};

export default async function FlashcardsPickerPage() {
  const authUser = await getAuthUser();

  if (!authUser) {
    return (
      <AuthGate
        icon="cards-three"
        tileColor="mint"
        title="Sign in to study flashcards"
        body="Flip cards, mark what you know, and the rest comes back in your review queue."
        nextPath="/flashcards"
      />
    );
  }

  const trackSlug = await getActiveTrackSlug();
  const [totalConcepts, review] = await Promise.all([
    prisma.concept.count({
      where: { section: { tier: { track: { slug: trackSlug } } } },
    }),
    getReviewSummary(authUser.id),
  ]);

  return <FlashcardsPicker totalConcepts={totalConcepts} dueCount={review.dueCount} />;
}
