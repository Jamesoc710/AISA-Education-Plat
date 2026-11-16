import type { Metadata } from "next";
import { getAuthUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/prisma";
import { AuthGate } from "@/components/ui/auth-gate";
import { TestPrep, type AreaView } from "@/components/test-prep";
import { TEST_PREP_AREAS } from "@/lib/test-prep";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Test prep",
  description: "What the AISA tech team test covers, what to study first, and last year's test.",
};

export default async function TestPrepPage() {
  const authUser = await getAuthUser();
  if (!authUser) {
    return (
      <AuthGate
        icon="list-checks"
        tileColor="indigo"
        title="Sign in to see test prep"
        body="What the test covers, what to study first, and last year's test. For AISA members."
        nextPath="/test-prep"
      />
    );
  }

  const slugs = [...new Set(TEST_PREP_AREAS.flatMap((a) => a.conceptSlugs))];
  const [concepts, reviewItems] = await Promise.all([
    prisma.concept.findMany({
      where: { slug: { in: slugs } },
      select: { slug: true, name: true, _count: { select: { questions: true } } },
    }),
    prisma.reviewItem.findMany({
      where: { userId: authUser.id, concept: { slug: { in: slugs } } },
      select: { concept: { select: { slug: true } } },
    }),
  ]);

  type ConceptRow = (typeof concepts)[number];
  const bySlug = new Map<string, ConceptRow>(concepts.map((c: ConceptRow) => [c.slug, c]));
  const practiced = new Set<string>(
    reviewItems.map((r: (typeof reviewItems)[number]) => r.concept.slug),
  );

  // Slugs that are not in the database yet (content still being written) drop out.
  const areas: AreaView[] = TEST_PREP_AREAS.map((area) => {
    const found = area.conceptSlugs
      .map((slug) => bySlug.get(slug))
      .filter((c): c is ConceptRow => Boolean(c));
    return {
      slug: area.slug,
      title: area.title,
      priority: area.priority,
      summary: area.summary,
      outcomes: area.outcomes,
      concepts: found.map((c) => ({ slug: c.slug, name: c.name })),
      hasQuestions: found.some((c) => c._count.questions > 0),
      practicedCount: found.filter((c) => practiced.has(c.slug)).length,
    };
  });

  return <TestPrep areas={areas} />;
}
