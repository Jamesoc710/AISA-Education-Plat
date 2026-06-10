/**
 * Seed the Build Board projects (TCO expansion).
 *
 * Surgical + idempotent: upserts prisma/seed-data/projects.ts by slug.
 * New projects are ALWAYS created as drafts (member-invisible); updates never
 * touch status or approvedAt, so approvals done in the app survive re-runs.
 * Team assignments are replaced per seeded project to match the seed file;
 * nothing outside the seeded slugs is ever modified.
 *
 * Modes:
 *   --check            static validation of the seed file only (no DB)
 *   --verify           static validation + read-only DB cross-check
 *   --delete a,b,c     delete those project slugs (assignments + interests too)
 *   (default)          validate, cross-check, then upsert
 *
 *   npx tsx --env-file=.env scripts/seed-projects.ts [--check|--verify|--delete slugs]
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { PROJECT_SEEDS, type ProjectSeed } from "../prisma/seed-data/projects";
import { isProjectStage, PROJECT_STAGES } from "../lib/project-stages";

// Em dash, en dash, figure dash, horizontal bar: banned in member-facing text.
const BANNED_DASHES = /[‒–—―]/;
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const TRACK_SLUGS = new Set(["ai", "capital-markets", "field-guides"]);

function textFields(p: ProjectSeed): string[] {
  return [
    p.title,
    p.blurb,
    p.description ?? "",
    ...p.lookingFor,
    ...p.extraContributors.flatMap((e) => [e.name, e.role ?? ""]),
    ...p.team.map((t) => t.role),
  ];
}

function validateStatic(): string[] {
  const errors: string[] = [];
  const seenSlugs = new Set<string>();

  PROJECT_SEEDS.forEach((p, i) => {
    const label = `Project ${i + 1} (${p.slug || "no slug"})`;

    if (!SLUG_RE.test(p.slug)) errors.push(`${label}: slug must be kebab-case`);
    if (seenSlugs.has(p.slug)) errors.push(`${label}: duplicate slug`);
    seenSlugs.add(p.slug);

    if (!p.title.trim()) errors.push(`${label}: empty title`);
    if (!p.blurb.trim()) errors.push(`${label}: empty blurb`);
    if (p.blurb.length > 280) errors.push(`${label}: blurb over 280 chars`);
    if (p.trackSlug !== null && !TRACK_SLUGS.has(p.trackSlug)) {
      errors.push(`${label}: unknown trackSlug ${p.trackSlug}`);
    }
    if (!isProjectStage(p.stage)) {
      errors.push(`${label}: stage must be one of ${PROJECT_STAGES.join(" | ")}`);
    }
    for (const url of [p.repoUrl, p.demoUrl, p.walkthroughUrl]) {
      if (url && !/^https?:\/\//.test(url)) errors.push(`${label}: invalid URL ${url}`);
    }
    if (p.team.some((t) => !t.email.includes("@"))) {
      errors.push(`${label}: team entry with invalid email`);
    }
    if (p.team.some((t) => !t.role.trim())) {
      errors.push(`${label}: team entry with empty role`);
    }
    if (p.extraContributors.some((e) => !e.name.trim())) {
      errors.push(`${label}: empty extraContributors name`);
    }
    if (textFields(p).some((t) => BANNED_DASHES.test(t))) {
      errors.push(`${label}: contains a banned em/en dash`);
    }
  });

  return errors;
}

function connect(): PrismaClient {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DIRECT_URL or DATABASE_URL must be set");
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}

async function deleteSlugs(prisma: PrismaClient, slugs: string[]): Promise<void> {
  for (const slug of slugs) {
    const project = await prisma.project.findUnique({
      where: { slug },
      select: { id: true, title: true, status: true },
    });
    if (!project) {
      console.warn(`  - ${slug}: not in DB, skipped`);
      continue;
    }
    // Interests cascade via the schema; assignments need an explicit delete.
    const assignments = await prisma.projectAssignment.deleteMany({
      where: { projectId: project.id },
    });
    await prisma.project.delete({ where: { id: project.id } });
    console.log(
      `  ✓ deleted ${slug} ("${project.title}", was ${project.status}, ${assignments.count} assignments removed)`,
    );
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const deleteIdx = argv.indexOf("--delete");
  const mode = deleteIdx !== -1
    ? "delete"
    : argv.includes("--check")
      ? "check"
      : argv.includes("--verify")
        ? "verify"
        : "seed";

  console.log("🌱 Build Board projects:", mode);

  if (mode === "delete") {
    const slugs = (argv[deleteIdx + 1] ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (slugs.length === 0) {
      console.error("✗ --delete needs a comma-separated slug list");
      process.exit(1);
    }
    const prisma = connect();
    try {
      await deleteSlugs(prisma, slugs);
    } finally {
      await prisma.$disconnect();
    }
    return;
  }

  const errors = validateStatic();
  if (errors.length > 0) {
    console.error(`✗ static validation failed (${errors.length}):`);
    for (const e of errors) console.error(`    ${e}`);
    process.exit(1);
  }
  console.log(`  ${PROJECT_SEEDS.length} projects in seed file`);
  console.log("  ✓ static validation passed");
  if (mode === "check") return;

  const prisma = connect();
  try {
    // Read-only cross-checks: tracks resolvable, team emails resolvable.
    const dbErrors: string[] = [];

    const tracks = await prisma.track.findMany({ select: { id: true, slug: true } });
    const trackBySlug = new Map(tracks.map((t: { id: string; slug: string }) => [t.slug, t.id] as const));
    for (const p of PROJECT_SEEDS) {
      if (p.trackSlug && !trackBySlug.has(p.trackSlug)) {
        dbErrors.push(`${p.slug}: track ${p.trackSlug} not in DB`);
      }
    }

    const teamEmails = [...new Set(PROJECT_SEEDS.flatMap((p) => p.team.map((t) => t.email)))];
    const users = teamEmails.length
      ? await prisma.user.findMany({
          where: { email: { in: teamEmails } },
          select: { id: true, email: true, name: true },
        })
      : [];
    const userByEmail = new Map(
      users.map((u: { id: string; email: string; name: string }) => [u.email, u] as const),
    );
    for (const p of PROJECT_SEEDS) {
      for (const t of p.team) {
        if (!userByEmail.has(t.email)) {
          dbErrors.push(
            `${p.slug}: no user with email ${t.email} (move them to extraContributors or fix the email)`,
          );
        }
      }
    }

    if (dbErrors.length > 0) {
      console.error(`✗ DB cross-check failed (${dbErrors.length}):`);
      for (const e of dbErrors) console.error(`    ${e}`);
      process.exit(1);
    }
    console.log("  ✓ DB cross-check passed (tracks + team emails resolve)");

    const existing = await prisma.project.findMany({
      where: { slug: { in: PROJECT_SEEDS.map((p) => p.slug) } },
      select: { slug: true, status: true },
    });
    const existingBySlug = new Map(
      existing.map((e: { slug: string; status: string }) => [e.slug, e] as const),
    );

    if (mode === "verify") {
      for (const p of PROJECT_SEEDS) {
        const row = existingBySlug.get(p.slug);
        console.log(`  ${p.slug}: ${row ? `in DB (${row.status})` : "not in DB yet"}`);
      }
      console.log("✅ verify complete, no writes performed");
      return;
    }

    // Upsert by slug. Status is only set on create (always draft).
    let created = 0;
    let updated = 0;
    for (const p of PROJECT_SEEDS) {
      const common = {
        title: p.title,
        blurb: p.blurb,
        description: p.description ?? null,
        trackId: p.trackSlug ? trackBySlug.get(p.trackSlug)! : null,
        stage: p.stage,
        lookingFor: p.lookingFor,
        repoUrl: p.repoUrl ?? null,
        demoUrl: p.demoUrl ?? null,
        walkthroughUrl: p.walkthroughUrl ?? null,
        // Json column: strip undefined roles so the value is pure JSON
        extraContributors: p.extraContributors.map((e) =>
          e.role ? { name: e.name, role: e.role } : { name: e.name },
        ),
      };
      const row = await prisma.project.upsert({
        where: { slug: p.slug },
        create: { slug: p.slug, status: "draft", ...common },
        update: common, // never touches status/approvedAt
        select: { id: true, status: true },
      });
      if (existingBySlug.has(p.slug)) updated++;
      else created++;

      // Replace team assignments to mirror the seed file exactly.
      await prisma.projectAssignment.deleteMany({ where: { projectId: row.id } });
      for (const t of p.team) {
        const user = userByEmail.get(t.email)!;
        await prisma.projectAssignment.create({
          data: { projectId: row.id, userId: user.id, role: t.role },
        });
      }
      console.log(
        `  ✓ ${p.slug} (${row.status}, ${p.stage}, team ${p.team.length}, extras ${p.extraContributors.length})`,
      );
    }

    console.log(`✅ Build Board seeded: ${created} created, ${updated} updated.`);
    const drafts = await prisma.project.count({ where: { status: "draft" } });
    const approved = await prisma.project.count({ where: { status: "approved" } });
    console.log(`   Board now holds ${approved} approved + ${drafts} draft projects.`);
    if (created > 0) {
      console.log("   New projects are drafts: approve them from their /build page when ready.");
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
