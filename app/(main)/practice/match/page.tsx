import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getActiveTrackSlug } from "@/lib/track";
import { MatchGame, type MatchConcept, type MatchPool } from "@/components/match-game";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Match | TCO",
  description: "Pair terms with their definitions against the clock.",
};

const MIN_POOL = 4;

type Row = {
  id: string;
  name: string;
  slug: string;
  flashcardShort: string | null;
  subtitle: string;
  section: { id: string; name: string; tier: { id: string; name: string } };
};

const toConcept = (c: Row): MatchConcept => ({
  id: c.id,
  name: c.name,
  slug: c.slug,
  definition: c.flashcardShort ?? c.subtitle,
});

export default async function MatchPage() {
  const trackSlug = await getActiveTrackSlug();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const select = {
    id: true,
    name: true,
    slug: true,
    flashcardShort: true,
    subtitle: true,
    section: { select: { id: true, name: true, tier: { select: { id: true, name: true } } } },
  } as const;

  const [concepts, due] = await Promise.all([
    prisma.concept.findMany({
      where: { section: { tier: { track: { slug: trackSlug } } } },
      select,
      orderBy: [{ section: { tier: { sortOrder: "asc" } } }, { section: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    }),
    user
      ? prisma.concept.findMany({
          where: { reviewItems: { some: { userId: user.id, dueAt: { lte: new Date() } } } },
          select,
        })
      : [],
  ]);

  const rows = concepts as Row[];
  const pools: MatchPool[] = [];
  if (due.length >= MIN_POOL) {
    pools.push({ key: "due", label: "Due for review", concepts: (due as Row[]).map(toConcept) });
  }
  pools.push({ key: "mix", label: "Random mix", concepts: rows.map(toConcept) });

  const tiers = new Map<string, MatchPool>();
  const sections = new Map<string, MatchPool>();
  for (const c of rows) {
    const t = c.section.tier;
    if (!tiers.has(t.id)) tiers.set(t.id, { key: `tier-${t.id}`, label: t.name, concepts: [] });
    tiers.get(t.id)!.concepts.push(toConcept(c));
    const s = c.section;
    if (!sections.has(s.id)) sections.set(s.id, { key: `section-${s.id}`, label: s.name, concepts: [] });
    sections.get(s.id)!.concepts.push(toConcept(c));
  }
  // A single-tier track (Capital Markets) would just repeat the mix.
  if (tiers.size > 1) pools.push(...tiers.values());
  pools.push(...[...sections.values()].filter((p) => p.concepts.length >= MIN_POOL));

  return <MatchGame pools={pools} signedIn={Boolean(user)} />;
}
