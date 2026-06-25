/**
 * Enable Row-Level Security on every table in the `public` schema, then verify.
 *
 * Closes the Supabase `rls_disabled_in_public` critical advisory. Safe because
 * Prisma connects as the table OWNER (postgres), which bypasses RLS — see
 * scripts/enable-rls.sql for the full rationale.
 *
 * Run from the aisa-atlas/ dir:  npx tsx scripts/enable-rls.ts
 * Uses DIRECT_URL (session-mode pooler, port 5432) — the correct channel for DDL.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) {
  console.error("Missing DIRECT_URL / DATABASE_URL in environment (.env).");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });

type TableState = {
  table: string;
  rls_enabled: boolean;
  rls_forced: boolean;
};

async function snapshot(): Promise<TableState[]> {
  return prisma.$queryRawUnsafe<TableState[]>(`
    SELECT c.relname AS table,
           c.relrowsecurity AS rls_enabled,
           c.relforcerowsecurity AS rls_forced
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    ORDER BY c.relname;
  `);
}

async function main() {
  const before = await snapshot();
  const unprotected = before.filter((t) => !t.rls_enabled);

  console.log(`Public tables found: ${before.length}`);
  console.log(`RLS DISABLED before run: ${unprotected.length}`);
  for (const t of unprotected) console.log(`  ✗ ${t.table}`);

  if (unprotected.length === 0) {
    console.log("\nNothing to do — every public table already has RLS enabled.");
  }

  for (const t of before) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE public."${t.table}" ENABLE ROW LEVEL SECURITY;`,
    );
  }

  const after = await snapshot();
  const stillOff = after.filter((t) => !t.rls_enabled);
  const forced = after.filter((t) => t.rls_forced);

  console.log(
    `\nRLS ENABLED after run: ${after.filter((t) => t.rls_enabled).length}/${after.length}`,
  );

  // FORCE RLS would subject the owner (Prisma) to policies and break the app.
  // We never set it; assert it stayed off everywhere.
  if (forced.length > 0) {
    console.error(
      `\n⚠ FORCE RLS is ON for: ${forced.map((t) => t.table).join(", ")} — this can break Prisma. Investigate.`,
    );
  }

  if (stillOff.length > 0) {
    console.error(
      `\n✗ FAILED — still disabled on: ${stillOff.map((t) => t.table).join(", ")}`,
    );
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log("\n✓ OK — RLS is enabled on every table in the public schema.");
  console.log(
    "  PostgREST (anon/authenticated) is now denied; Prisma (owner role) is unaffected.",
  );
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
