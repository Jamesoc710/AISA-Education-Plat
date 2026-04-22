import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { FlashcardsPicker } from "@/components/flashcards-picker";
import { AuthGate } from "@/components/ui/auth-gate";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Flashcards | AISA Atlas",
  description: "Study AI concepts with flashcards.",
};

export default async function FlashcardsPickerPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return (
      <AuthGate
        icon="cards-three"
        tileColor="mint"
        title="Sign in to study flashcards"
        body="Flip cards, shuffle decks, and track what's sticking — your progress is saved per account."
        nextPath="/flashcards"
      />
    );
  }

  const totalConcepts = await prisma.concept.count();

  return <FlashcardsPicker totalConcepts={totalConcepts} />;
}
