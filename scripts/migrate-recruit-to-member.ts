/**
 * One-off data migration: rename the default member role RECRUIT -> MEMBER
 * (TCO rebrand). Idempotent — after it runs, no RECRUIT rows remain.
 *
 *   npx tsx --env-file=.env scripts/migrate-recruit-to-member.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error("DIRECT_URL or DATABASE_URL must be set");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

async function main() {
  const res = await prisma.user.updateMany({
    where: { role: "RECRUIT" },
    data: { role: "MEMBER" },
  });
  console.log(`✅ Renamed ${res.count} user(s) from RECRUIT to MEMBER.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
