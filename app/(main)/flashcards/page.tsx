import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { FlashcardsPicker } from "@/components/flashcards-picker";
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

  if (!authUser) redirect("/login?redirect=/flashcards");

  const totalConcepts = await prisma.concept.count();

  return <FlashcardsPicker totalConcepts={totalConcepts} />;
}
