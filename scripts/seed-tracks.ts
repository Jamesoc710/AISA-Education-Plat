/**
 * Surgical, idempotent track seed + backfill (TCO expansion, Phase 1).
 *
 * Creates the three top-level Tracks and backfills every existing Tier to the
 * AI track. Touches ONLY the tracks + tiers tables — never users, concepts, or
 * bookmarks. Safe to re-run.
 *
 *   npx tsx --env-file=.env scripts/seed-tracks.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error("DIRECT_URL or DATABASE_URL must be set");
const adapter = new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });

const TRACKS = [
  {
    slug: "ai",
    name: "Artificial Intelligence",
    shortName: "AI",
    description: "The flagship track — how modern AI works, from fundamentals to the frontier.",
    accentColor: "#5E6AD2", // existing app accent
    isPrimary: true,
    sortOrder: 0,
  },
  {
    slug: "capital-markets",
    name: "Capital Markets & VC",
    shortName: "Capital",
    description: "Venture capital, fund mechanics, valuation, and the language of markets.",
    accentColor: "#16A34A", // green, echoing the calendar's CAPITAL_TEAM
    isPrimary: false,
    sortOrder: 1,
  },
  {
    slug: "field-guides",
    name: "Field Guides",
    shortName: "Guides",
    description: "Practical tech literacy — building with AI, dev basics, security, and careers.",
    accentColor: "#64748B", // slate
    isPrimary: false,
    sortOrder: 2,
  },
];

async function main() {
  console.log("🌱 Seeding tracks...");

  let aiTrackId = "";
  for (const t of TRACKS) {
    const row = await prisma.track.upsert({
      where: { slug: t.slug },
      update: {
        name: t.name,
        shortName: t.shortName,
        description: t.description,
        accentColor: t.accentColor,
        isPrimary: t.isPrimary,
        sortOrder: t.sortOrder,
      },
      create: t,
    });
    if (t.slug === "ai") aiTrackId = row.id;
    console.log(`  ✓ ${t.slug} (${row.id})`);
  }

  // Backfill: every tier without a track joins the AI track.
  const res = await prisma.tier.updateMany({
    where: { trackId: null },
    data: { trackId: aiTrackId },
  });
  console.log(`  ↳ backfilled ${res.count} tier(s) to the AI track`);

  const counts = await prisma.tier.groupBy({
    by: ["trackId"],
    _count: true,
  });
  console.log("  tier distribution by trackId:", JSON.stringify(counts));

  console.log("✅ Tracks seeded.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
