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
| Doc | What it covered | Shipped |
| --- | --- | --- |
| `TREND_TRACKER_PLAN.md` | `/trends` surface: schema, static list + detail, bubble field, live refresh cron | Yes (PR #1 to #3) |
| `TREND_TRACKER_REDESIGN_PLAN.md` | Pulse Index list redesign, editorial brief detail page, Themes facet | Yes |
| `PERSPECTIVES_PLAN.md` | Per-trend "Perspectives" accordion: content pipeline + seed + UI | Yes (all 22 trends) |

### ongoing/
| Doc | What it is |
| --- | --- |
| `EXPANSION.md` | The TCO expansion master plan. Source of truth for vision, architecture, every feature, and the phased roadmap. |
| `BENCHMARKS_PLAN.md` | "The Standings" build plan for the `/benchmarks` surface. Design locked by a design panel (`../../research/benchmarks-design-research.json`); ready to build in a fresh chat. |

### future/
See `future/README.md`. Current queue: build board polish and a "build with AI"
tab. (Digest catch-up shipped; the Benchmarks tab is now in `ongoing/`.)

## Conventions

- When a `future/` item starts, move its plan to `ongoing/` (or keep the spec in
  `EXPANSION.md` and track the build in a dedicated doc here).
- When a feature ships, move its plan to `complete/` and note the shipped state at
  the top of the doc.
- No em or en dashes in any doc here. Use hyphens or rewrite.
