/**
 * Build Board project stages.
 *
 * Four values across one lifecycle field: an Idea is looking for hands, Building
 * is active development, Shipped is finished work on display, and Paused is the
 * honest archive verb. Pure module (no server imports) so client components and
 * seed scripts can both use it.
 */

export const PROJECT_STAGES = [
  "idea",
  "building",
  "shipped",
  "paused",
] as const;

export type ProjectStage = (typeof PROJECT_STAGES)[number];

export const STAGE_META: Record<ProjectStage, { label: string; tileColor: string }> = {
  idea:     { label: "Idea",     tileColor: "sky"    }, // forming, recruiting a team
  building: { label: "Building", tileColor: "indigo" }, // active development
  shipped:  { label: "Shipped",  tileColor: "mint"   }, // done and on display
  paused:   { label: "Paused",   tileColor: "stone"  }, // on hold, may resume
};

export function isProjectStage(value: string): value is ProjectStage {
  return (PROJECT_STAGES as readonly string[]).includes(value);
}

export function stageMeta(stage: string): { label: string; tileColor: string } {
  return isProjectStage(stage) ? STAGE_META[stage] : STAGE_META.building;
}
