import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getActiveTrackSlug } from "@/lib/track";
import { AuthGate } from "@/components/ui/auth-gate";
import { ExplainPractice, type ExplainConcept } from "@/components/explain-practice";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Explain it back | TCO",
  description: "Explain a concept in your own words and get feedback on what you missed.",
};

const select = {
  id: true,
  name: true,
  slug: true,
  section: { select: { name: true } },
} as const;

type Row = { id: string; name: string; slug: string; section: { name: string } };
const toConcept = (c: Row): ExplainConcept => ({
  id: c.id,
  name: c.name,
  slug: c.slug,
  sectionName: c.section.name,
});

export default async function ExplainPage({
  searchParams,
}: {
  searchParams: Promise<{ concept?: string | string[] }>;
}) {
  const { concept: conceptParam } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const next = typeof conceptParam === "string" ? `/practice/explain?concept=${conceptParam}` : "/practice/explain";
    return (
      <AuthGate
        icon="chat-circle-text"
        tileColor="lilac"
        title="Sign in to explain it back"
        body="Write a concept in your own words and get feedback on what you nailed and what you missed. It's saved to your review queue."
        nextPath={next}
      />
    );
  }

  const trackSlug = await getActiveTrackSlug();
  const [concepts, due, preselected] = await Promise.all([
    prisma.concept.findMany({
      where: { section: { tier: { track: { slug: trackSlug } } } },
      select,
      orderBy: [{ section: { tier: { sortOrder: "asc" } } }, { section: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    }),
    prisma.concept.findMany({
      where: { reviewItems: { some: { userId: user.id, dueAt: { lte: new Date() } } } },
      select,
      take: 6,
    }),
    typeof conceptParam === "string"
      ? prisma.concept.findUnique({ where: { slug: conceptParam }, select })
      : null,
  ]);

  return (
    <ExplainPractice
      concepts={(concepts as Row[]).map(toConcept)}
      due={(due as Row[]).map(toConcept)}
      initial={preselected ? toConcept(preselected as Row) : null}
    />
  );
}
