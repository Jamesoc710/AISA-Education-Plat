// Manually run the "This Week in Tech" digest sync from the CLI.
//
// Usage:
//   npx tsx --env-file=.env scripts/generate-digest.ts                 (current week)
//   npx tsx --env-file=.env scripts/generate-digest.ts --week=2026-06-15
//
// The --week flag sets the edition LABEL (weekOf, snapped to that week's Monday).
// It does NOT change what gets searched: the pipeline always researches the real
// trailing 7 days. So --week is only meaningful for the current week or the one
// just ended (a true historical backfill of an older window is not possible,
// because web search returns current results). The script warns if you target a
// week whose content the live search cannot actually cover.
import { generateDigest, getDigestWeekOf } from "../lib/digest-sync";
import { prisma } from "../lib/prisma";

function parseWeekArg(): Date | undefined {
  const arg = process.argv.find((a) => a.startsWith("--week="));
  if (!arg) return undefined;
  const raw = arg.slice("--week=".length).trim();
  // Force UTC midnight so the Monday math matches the pipeline's UTC weeks.
  const d = new Date(`${raw}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid --week value "${raw}" (expected YYYY-MM-DD)`);
  }
  return d;
}

async function main() {
  const now = parseWeekArg();
  const targetWeek = getDigestWeekOf(now);
  const currentWeek = getDigestWeekOf();

  if (now) {
    console.log(`Targeting week of ${targetWeek.toISOString().slice(0, 10)} (label only).`);
    // Content is always the live trailing 7 days. If the target week ended more
    // than ~2 days ago, that research will not match the label, so flag it.
    const daysStale = Math.round((currentWeek.getTime() - targetWeek.getTime()) / 86400000);
    if (daysStale > 7) {
      console.log(
        `WARNING: ${targetWeek.toISOString().slice(0, 10)} is ${daysStale} days before the current week. ` +
          `The search only covers the last 7 days, so the content will be THIS week's news under an old label. ` +
          `Backfilling an older week faithfully is not supported.`,
      );
    }
  }

  const result = await generateDigest(now ? { now } : undefined);
  console.log(JSON.stringify(result, null, 2));

  const edition = await prisma.digestEdition.findUnique({
    where: { weekOf: new Date(result.weekOf) },
  });
  if (edition) {
    console.log(`\nDB row: status=${edition.status} generatedAt=${edition.generatedAt.toISOString()}`);
    console.log(`Headline: ${edition.headline}`);
    if (edition.bigPicture) {
      console.log(`\nThe big picture:\n${edition.bigPicture}`);
      if (edition.watchFor) console.log(`What to watch: ${edition.watchFor}`);
      console.log("");
    }
    for (const item of edition.items as {
      title: string;
      url: string;
      sourceDomain: string;
      resources?: { title: string; type: string }[];
    }[]) {
      const extras = item.resources?.map((r) => `[${r.type}] ${r.title}`).join(" · ") ?? "";
      console.log(`  - ${item.title} (${item.sourceDomain})\n    ${item.url}${extras ? `\n    go deeper: ${extras}` : ""}`);
    }
  } else {
    console.log("\nNo DB row for this week (run failed or was skipped).");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
