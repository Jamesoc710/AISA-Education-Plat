/**
 * Build Board project stages.
 *
 * The board celebrates finished work as much as recruiting: a project tagged
 * Completed is showing off, an Idea is looking for hands, and everything else
 * sits in between. Pure module (no server imports) so client components and
 * seed scripts can both use it.
 */

export const PROJECT_STAGES = [
  "idea",
  "building",
  "polishing",
  "completed",
  "paused",
] as const;

export type ProjectStage = (typeof PROJECT_STAGES)[number];

export const STAGE_META: Record<ProjectStage, { label: string; tileColor: string }> = {
  idea:      { label: "Idea",      tileColor: "sky"    }, // forming, recruiting a team
  building:  { label: "Building",  tileColor: "indigo" }, // active development
  polishing: { label: "Polishing", tileColor: "honey"  }, // works, refining for release
  completed: { label: "Completed", tileColor: "mint"   }, // done and on display
  paused:    { label: "Paused",    tileColor: "stone"  }, // on hold, may resume
};

export function isProjectStage(value: string): value is ProjectStage {
  return (PROJECT_STAGES as readonly string[]).includes(value);
}

export function stageMeta(stage: string): { label: string; tileColor: string } {
  return isProjectStage(stage) ? STAGE_META[stage] : STAGE_META.building;
}
