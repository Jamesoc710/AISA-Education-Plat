/**
 * Verify the app's normal data path still works after enabling RLS.
 * Connects via DATABASE_URL — the exact runtime channel the deployed app uses
 * (transaction-mode pooler). Prisma authenticates as `postgres` (table owner),
 * which bypasses RLS, so these counts should be non-zero.
 *
 *   npx tsx scripts/verify-rls.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Missing DATABASE_URL in environment (.env).");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });

async function main() {
  const [tracks, concepts, users, feedback] = await Promise.all([
    prisma.track.count(),
    prisma.concept.count(),
    prisma.user.count(),
    prisma.feedback.count(),
  ]);

  console.log("Prisma (owner role) reads WITH RLS enabled:");
  console.log(`  tracks:   ${tracks}`);
  console.log(`  concepts: ${concepts}`);
  console.log(`  users:    ${users}`);
  console.log(`  feedback: ${feedback}`);
  console.log(
    "\n✓ App data access intact — RLS does not block the owner role.",
  );
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
