# AISA Atlas (TCO)

Study platform for TCO members: learn concepts, practice them, track progress, and keep up with the club calendar and the weekly tech digest.

## Stack

- Next.js 16 (App Router), React 19, Tailwind 4. Read `node_modules/next/dist/docs/` before writing Next code; this version differs from older training data (see `AGENTS.md`).
- Prisma 7 with the `pg` adapter, on Supabase Postgres. Supabase also handles auth and storage.
- Claude (Anthropic SDK) for short-answer grading, the weekly digest, and calendar topic tagging.
- Deployed on Vercel. Crons live in `vercel.json`.

## Local development

```bash
npm install
npx vercel env pull --environment=production .env.local   # needs `npx vercel login`
npx next dev -p 3100
```

Port 3100, because 3000 is used by another project on this machine. The local server talks to the production database, so test with the QA admin account.

After any `prisma generate`, restart `next dev`; hot reload can't pick up a new Prisma client.

## Database changes

Schema changes go through Prisma Migrate. Write the migration, commit it, then apply it to production deliberately:

```bash
npx prisma migrate dev --create-only --name <change>   # writes prisma/migrations/<ts>_<change>/
npx prisma migrate deploy                              # applies pending migrations to DIRECT_URL
```

`0_init` is a baseline of the schema as of October 2026. Every new table must enable row-level security in its migration (see `scripts/enable-rls.sql` for why).

## Content

Curriculum, questions and flashcard text live in `prisma/seed-data/`. Load or update them with the idempotent scripts in `scripts/` (for example `scripts/seed-capital-questions.ts`), which upsert and never wipe user data.

## Checks

```bash
npx tsc --noEmit
npm run lint:tokens
npm run build
```
