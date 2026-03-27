# Deploying AISA Atlas to Vercel

## Current State

The app uses **SQLite** via `better-sqlite3` for local development. This works great locally but **will not work on Vercel** — Vercel's serverless functions don't support native Node modules like `better-sqlite3`, and the filesystem is read-only (no persistent SQLite file).

## Production Deployment Steps

### 1. Set up a PostgreSQL database

**Recommended options** (both have generous free tiers):

- **Neon** (neon.tech) — serverless Postgres, recommended for Next.js
- **Supabase** (supabase.com) — Postgres + extras

Create a database and copy the connection string.

### 2. Update Prisma for PostgreSQL

In `prisma/schema.prisma`, change the provider:

```prisma
datasource db {
  provider = "postgresql"
}
```

In `prisma.config.ts`, no changes needed — it already reads `DATABASE_URL` from env.

Replace the SQLite adapter with the PostgreSQL adapter:

```bash
npm uninstall @prisma/adapter-better-sqlite3 better-sqlite3 @types/better-sqlite3
npm install @prisma/adapter-pg pg
npm install -D @types/pg
```

Update `lib/prisma.ts`:

```ts
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

Update `prisma/seed.ts` similarly.

### 3. Run migrations and seed

```bash
npx prisma migrate dev --name init
npm run seed
```

### 4. Deploy to Vercel

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Deploy
vercel

# Set the DATABASE_URL environment variable in Vercel dashboard
# or via CLI:
vercel env add DATABASE_URL
```

### 5. Set environment variables in Vercel

In the Vercel dashboard → Project Settings → Environment Variables:

| Variable | Value |
|---|---|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/dbname?sslmode=require` |

### Alternative: Keep SQLite (limited)

If you just need a quick demo deployment without persistence, you can:
1. Bundle the SQLite database in the build
2. Use Vercel's Node.js runtime (not Edge)
3. Accept that data resets on each deploy

This is not recommended for production.
