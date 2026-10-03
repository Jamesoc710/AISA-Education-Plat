# Deploying

Production is the Vercel project `aisa-atlas`. Pushing or merging to `master` deploys it.

## Environment

All variables are listed in `.env.example`. They are set in Vercel (Project Settings, Environment Variables). `CRON_SECRET` must be set or the cron routes return 401.

## Crons (`vercel.json`)

| Route | Schedule | What it does |
| --- | --- | --- |
| `/api/cron/sync-schedule` | daily 06:00 UTC | Syncs the TCO Master Calendar sheet into `schedule_events` |
| `/api/cron/sync-digest` | Mondays 13:00 UTC | Drafts the weekly digest (an admin publishes it from `/admin`) |

## Schema changes in production

Order matters, because old code must never run against dropped tables and new code must never run before its tables exist:

1. Apply additive migrations (`npx prisma migrate deploy`) before deploying code that uses them.
2. Deploy.
3. Apply destructive migrations (drops) only after the code that stopped using those tables is live.
