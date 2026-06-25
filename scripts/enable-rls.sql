-- ─────────────────────────────────────────────────────────────────────────────
-- Enable Row-Level Security (RLS) on every table in the `public` schema.
--
-- WHY: Supabase auto-exposes a PostgREST REST API over `public` tables. Without
-- RLS, the `anon` / `authenticated` roles (reachable by anyone holding the public
-- anon key, which ships in the client bundle) can read/insert/update/delete every
-- row. This is the `rls_disabled_in_public` critical advisory.
--
-- WHY THIS IS SAFE FOR THIS APP: all table I/O goes through Prisma, which connects
-- as the `postgres` role — the table OWNER. A table owner BYPASSES RLS (we do NOT
-- use FORCE ROW LEVEL SECURITY), so server-side Prisma queries are unaffected. The
-- Supabase JS client is used ONLY for auth (auth schema) and Storage (storage
-- schema) — never to query these tables — so enabling RLS with no anon policies
-- simply denies the public API while leaving the app fully functional.
--
-- Idempotent and forward-proof: looping over pg_tables covers any future table too.
-- Re-runnable safely (ENABLE on an already-enabled table is a no-op).
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.tablename);
  END LOOP;
END $$;

-- Verify: every row should show rowsecurity = true and forced = false.
SELECT c.relname AS table,
       c.relrowsecurity AS rls_enabled,
       c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
ORDER BY c.relname;
