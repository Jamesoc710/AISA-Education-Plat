# Plans

Feature and roadmap docs, filed by status. The goal: nothing gets lost, and at a
glance you can see what is done, what is live work, and what is queued.

## Structure

- **`complete/`** — plans for features that have shipped to production. Kept as a
  record of intent and the decisions made. Read these to understand why something
  is built the way it is.
- **`ongoing/`** — the active master roadmap. Edit this as direction changes.
- **`future/`** — work that is named but not started. See `future/README.md` for
  the current queue.

## What lives here

### complete/
Empty. Trends, Benchmarks, Homework and formal assessments were removed on
2026-10-02 to focus the platform on Learn, Practice and Progress; their plans
and research live in git history (before the `feat/focus-cuts` branch).

### ongoing/
| Doc | What it is |
| --- | --- |
| `EXPANSION.md` | The TCO expansion master plan. Historical vision doc; parts of it (Trends, Benchmarks) are superseded by the 2026-10-02 focus cuts. |
| `team-hq/` | Tracks become Teams: a per-team HQ page at `/teams/[slug]`. Shipped. |
| `build-board-redesign/` | Build board redesign plan and phase 1 build order. |

### future/
See `future/README.md`.

## Conventions

- When a `future/` item starts, move its plan to `ongoing/` (or keep the spec in
  `EXPANSION.md` and track the build in a dedicated doc here).
- When a feature ships, move its plan to `complete/` and note the shipped state at
  the top of the doc.
- No em or en dashes in any doc here. Use hyphens or rewrite.
