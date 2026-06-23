# Future work

Named but not started. Each item gets its own plan doc here (or a fleshed-out
section in `../ongoing/EXPANSION.md`) before the build begins. Listed roughly in
the order raised, not strict priority.

## 1. Build Board polish

Make the existing `/build` showcase better. The board is live with 3 real projects
(all AI track). Improvement directions are open: richer project cards, better empty
and in-progress states, clearer calls to contribute, surfacing stage progress.
Scope to be defined before building.

- Current state: shipped 2026-06-09 (schema `Project` + `ProjectInterest`, stage
  chips, join requests, approval gate). See the build-board notes in
  `../ongoing/EXPANSION.md`.

## 2. Digest catch-up (last week + this week)

The "This Week in Tech" digest pipeline is live but the unattended cron schedule is
intentionally not wired yet. Backfill the missing editions: run the digest for last
week and the current week so the archive is continuous, then decide on the cron
cadence (daily vs weekly) before enabling unattended runs.

- Pipeline: `lib/digest-sync.ts`, admin "Sync now", archive routes. Each manual run
  costs roughly $0.30 to $0.60 (Opus plus web search).
- Open decision: cron cadence + confirm `maxDuration` / Fluid Compute on the route.

## 3. Benchmarks tab  (MOVED to ../ongoing/BENCHMARKS_PLAN.md, 2026-06-23)

Now in planning/build: design locked by a design panel, plan written. See
`../ongoing/BENCHMARKS_PLAN.md` and `../../research/benchmarks-design-research.json`.
The research backing is still here for reference:

- `docs/research/benchmarks-research.json` (methodology)
- `docs/research/benchmarks-research-round2.json` (7 leader tables, records)
- `docs/research/benchmarks-codebase-survey.json` (reusable code)

13 benchmarks have verified bodies. One open research item: the LiveCodeBench leader
table is unsourced. Spec lives in `../ongoing/EXPANSION.md` section 7.3.

## 4. "Build with AI" tab

A new surface to help members actually build with AI, not just learn concepts.
Earliest stage of the four. Vision to be written: likely some mix of starter
templates, guided build paths, tool pointers, and worked examples. Define audience
and the first concrete deliverable before scoping.

---

When you start one of these, give it a real plan doc and move it (or its tracking
doc) into `../ongoing/`.
