import { createClient } from "@/lib/supabase/server";
import { getReviewSummary } from "@/lib/review";
import { PracticeHub } from "@/components/practice-hub";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Practice | TCO",
  description: "Review what's due, quiz yourself, match terms, or explain a concept in your own words.",
};

export default async function PracticePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const review = user ? await getReviewSummary(user.id) : null;

  return <PracticeHub review={review} />;
}
