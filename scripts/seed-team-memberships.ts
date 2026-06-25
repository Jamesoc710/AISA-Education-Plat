/**
 * Seed TeamMembership from real belonging data that exists today: the
 * ProjectAssignment users on Projects whose trackId matches a content-bearing
 * team's scope. This gives a content-bearing team an honest day-one roster
 * (real members on real projects), never invented names. Teams with no tagged
 * projects (e.g. Capital today) seed nothing and rely on the Join button plus
 * their recruiting empty state, per the plan's dissent item 5.
 *
 * Idempotent (upsert on @@id([userId, teamSlug])). Safe to re-run.
 *
 * Run from aisa-atlas/:  npx tsx scripts/seed-team-memberships.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getMemberFacingTeams } from "../lib/teams";

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) {
  console.error("Missing DIRECT_URL / DATABASE_URL in environment (.env).");
  process.exit(1);
}
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

async function main() {
  let total = 0;
  for (const team of getMemberFacingTeams()) {
    if (!team.trackId) {
      console.log(`- ${team.slug}: no track scope, skipping (Join-driven roster)`);
      continue;
    }
    const assignments = await prisma.projectAssignment.findMany({
      where: { project: { track: { slug: team.trackId } } },
      select: { userId: true },
    });
    const userIds = Array.from(new Set(assignments.map((a) => a.userId)));
    for (const userId of userIds) {
      await prisma.teamMembership.upsert({
        where: { userId_teamSlug: { userId, teamSlug: team.slug } },
        create: { userId, teamSlug: team.slug },
        update: {},
      });
    }
    total += userIds.length;
    console.log(`- ${team.slug} (track ${team.trackId}): seeded ${userIds.length} member(s) from ProjectAssignment`);
  }
  console.log(`\nDone. ${total} membership row(s) ensured.`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
