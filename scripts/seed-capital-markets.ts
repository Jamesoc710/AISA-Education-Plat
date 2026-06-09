/**
 * Seed the Capital Markets & VC vocabulary track (TCO expansion, Phase 1).
 *
 * Surgical + idempotent: creates ONE flat "Vocabulary" tier under the
 * capital-markets track, its 4 sections, and the 42 vocab Concepts (one
 * Resource each from the cited source). Touches ONLY the capital-markets
 * track's tier/sections/concepts/resources — never users, AI content, or
 * bookmarks. Safe to re-run.
 *
 * Slugs are namespaced with `cm-` (collision-safe; Concept.slug is global).
 * Content + provenance: prisma/seed-data/capital-markets-vocab.ts
 * (deep-research output; see docs/research/capital-markets-vocab-research.json).
 *
 *   npx tsx --env-file=.env scripts/seed-capital-markets.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  CAPITAL_MARKETS_VOCAB,
  VOCAB_SECTIONS,
} from "../prisma/seed-data/capital-markets-vocab";

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error("DIRECT_URL or DATABASE_URL must be set");
const adapter = new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });

const PREFIX = "cm-";
const TIER_SLUG = "cm-vocabulary";
const TIER_COLOR = "#16A34A"; // green, echoing the calendar's CAPITAL_TEAM

function domainOf(u: string): string {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return "source";
  }
}

async function main() {
  console.log("🌱 Seeding Capital Markets vocabulary...");

  const track = await prisma.track.findUnique({
    where: { slug: "capital-markets" },
  });
  if (!track) {
    throw new Error(
      "capital-markets track not found — run scripts/seed-tracks.ts first",
    );
  }

  // 1. One flat "Vocabulary" tier under the track.
  const tier = await prisma.tier.upsert({
    where: { slug: TIER_SLUG },
    update: {
      name: "Vocabulary",
      description: "The core language of startup financing, fund economics, and markets.",
      sortOrder: 1,
      color: TIER_COLOR,
      trackId: track.id,
    },
    create: {
      slug: TIER_SLUG,
      name: "Vocabulary",
      description: "The core language of startup financing, fund economics, and markets.",
      sortOrder: 1,
      color: TIER_COLOR,
      trackId: track.id,
    },
  });
  console.log(`  ✓ tier ${tier.slug}`);

  // 2. The 4 sections.
  const sectionIdBySlug = new Map<string, string>();
  for (const s of VOCAB_SECTIONS) {
    const slug = PREFIX + s.slug;
    const row = await prisma.section.upsert({
      where: { slug },
      update: { name: s.name, description: s.description, sortOrder: s.sortOrder, tierId: tier.id },
      create: { slug, name: s.name, description: s.description, sortOrder: s.sortOrder, tierId: tier.id },
    });
    sectionIdBySlug.set(s.slug, row.id);
  }
  console.log(`  ✓ ${VOCAB_SECTIONS.length} sections`);

  // 3. The 42 concepts (+ one Resource each from the cited source).
  let n = 0;
  for (const t of CAPITAL_MARKETS_VOCAB) {
    const sectionId = sectionIdBySlug.get(t.section);
    if (!sectionId) throw new Error(`Unknown section for term ${t.slug}: ${t.section}`);
    const slug = PREFIX + t.slug;

    const data = {
      sectionId,
      name: t.name,
      subtitle: t.subtitle,
      difficulty: t.difficulty,
      whatItIs: t.whatItIs,
      whyItMatters: t.whyItMatters,
      flashcardShort: t.flashcardShort,
      flashcardDefinition: t.flashcardDefinition,
      goDeeper: t.nuance ?? null, // the "trip-up" nuance becomes the Go-deeper section
      simpleExplanation: null,
      sortOrder: t.sortOrder,
    };

    const concept = await prisma.concept.upsert({
      where: { slug },
      update: data,
      create: { slug, ...data },
    });

    // Idempotent source resource: clear + recreate the single citation.
    await prisma.resource.deleteMany({ where: { conceptId: concept.id } });
    await prisma.resource.create({
      data: {
        conceptId: concept.id,
        title: t.source.label,
        url: t.source.url,
        sourceDomain: domainOf(t.source.url),
        type: "ARTICLE",
        sortOrder: 0,
      },
    });
    n++;
  }
  console.log(`  ✓ ${n} concepts (+ ${n} source resources)`);

  const verified = CAPITAL_MARKETS_VOCAB.filter((t) => t.verified).length;
  console.log(
    `✅ Capital Markets vocab seeded. ${verified}/${CAPITAL_MARKETS_VOCAB.length} terms adversarially verified; the rest drafted from cited primary sources.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
