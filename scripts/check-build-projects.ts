/**
 * Read-only diagnostic: list Build Board projects newest-first with their
 * status (draft|approved) and whether they were self-serve (createdById set)
 * or seed-owned. No writes.
 *
 *   npx tsx --env-file=.env scripts/check-build-projects.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DIRECT_URL or DATABASE_URL must be set");
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
  try {
    const rows = await prisma.project.findMany({
      select: {
        slug: true,
        title: true,
        status: true,
        stage: true,
        createdById: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    console.log(`Recent projects (newest first, ${rows.length} shown):\n`);
    for (const r of rows) {
      const origin = r.createdById ? `self-serve(${r.createdById.slice(0, 8)})` : "seed/none";
      console.log(
        `  [${r.status.padEnd(8)}] stage=${r.stage.padEnd(9)} origin=${origin.padEnd(22)} ${r.slug}  "${r.title}"`,
      );
    }
    const draft = await prisma.project.count({ where: { status: "draft" } });
    const approved = await prisma.project.count({ where: { status: "approved" } });
    console.log(`\nTotals: ${approved} approved, ${draft} draft`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
