/**
 * One-shot ProjectInterest.status normalization (legacy default to the 3-state set).
 *
 *   new  -> pending
 *   seen -> pending
 *
 * status used to default to "new" (with an unused "seen"). PR3 redefines it as
 * pending | accepted | declined and changes the schema default to "pending", but
 * a default only governs FUTURE inserts. Any existing row still holding the old
 * spelling must be moved here, or it would render as an unknown status.
 *
 * Run once, against the live DB, alongside the `prisma db push`. Re-running is a
 * no-op (no legacy rows remain).
 *
 * Modes:
 *   --check   read-only: status distribution + how many rows --apply would move.
 *   --apply   updateMany new/seen -> pending; prints before and after.
 *
 *   npx tsx --env-file=.env scripts/migrate-interest-status.ts --check
 *   npx tsx --env-file=.env scripts/migrate-interest-status.ts --apply
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const LEGACY_STATUSES = ["new", "seen"];
const VALID_STATUSES = new Set(["pending", "accepted", "declined"]);

function connect(): PrismaClient {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DIRECT_URL or DATABASE_URL must be set");
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}

async function distribution(prisma: PrismaClient): Promise<Map<string, number>> {
  const groups = await prisma.projectInterest.groupBy({
    by: ["status"],
    _count: { status: true },
  });
  return new Map(groups.map((g) => [g.status, g._count.status] as const));
}

function printDistribution(label: string, dist: Map<string, number>): void {
  console.log(`  ${label}:`);
  if (dist.size === 0) {
    console.log("    (no requests in the DB)");
    return;
  }
  for (const [status, count] of [...dist].sort()) {
    const flag = VALID_STATUSES.has(status) ? "" : "  <- legacy, moves to pending";
    console.log(`    ${status}: ${count}${flag}`);
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const apply = argv.includes("--apply");
  console.log(`ProjectInterest status migration: ${apply ? "apply" : "check"}`);

  const prisma = connect();
  try {
    const before = await distribution(prisma);
    console.log("");
    printDistribution("Current status distribution", before);

    const toMove = LEGACY_STATUSES.reduce((n, s) => n + (before.get(s) ?? 0), 0);
    console.log(`\n  Rows to move (new/seen -> pending): ${toMove}`);

    if (!apply) {
      console.log("\n  Read-only. No writes performed. Run --apply to migrate.");
      return;
    }
    if (toMove === 0) {
      console.log("\n  Nothing to migrate. No-op.");
      return;
    }

    const moved = await prisma.projectInterest.updateMany({
      where: { status: { in: LEGACY_STATUSES } },
      data: { status: "pending" },
    });
    console.log(`\n  Moved ${moved.count} row(s) to pending.`);
    printDistribution("Status distribution after", await distribution(prisma));
    console.log("\n  Done.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
