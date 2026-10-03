// Manually run the "This Week in Tech" digest sync from the CLI.
//
// Usage:
//   npx tsx --env-file=.env scripts/generate-digest.ts                 (last completed week)
//   npx tsx --env-file=.env scripts/generate-digest.ts --week=2026-06-15
//
// With no flag the pipeline labels the edition with the last fully completed
// Mon-Sun week, which is the window its search actually covers.
//
// The --week flag overrides that LABEL (snapped to that week's Monday). It does
// NOT change what gets searched: the pipeline always researches the real
// trailing 7 days. So --week is only meaningful for the week just ended (a true
// historical backfill of an older window is not possible, because web search
// returns current results; use scripts/backfill-digest.ts for that). The script
// warns if you target a week whose content the live search cannot cover.
import { generateDigest, getDigestWeekOf, getDigestContentWeekOf } from "../lib/digest-sync";
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
  const weekArg = parseWeekArg();
  // The week the live search can actually cover, which is what an unflagged run labels.
  const coveredWeek = getDigestContentWeekOf();
  const targetWeek = weekArg ? getDigestWeekOf(weekArg) : coveredWeek;

  if (weekArg) {
    console.log(`Targeting week of ${targetWeek.toISOString().slice(0, 10)} (label only).`);
    // Content is always the live trailing 7 days, so any label other than the
    // covered week is a mismatch between what the edition says and what it holds.
    const daysOff = Math.round((coveredWeek.getTime() - targetWeek.getTime()) / 86400000);
    if (daysOff !== 0) {
      console.log(
        `WARNING: the live search covers the week of ${coveredWeek.toISOString().slice(0, 10)}, ` +
          `${Math.abs(daysOff)} days ${daysOff > 0 ? "after" : "before"} the label you asked for. ` +
          `The content will not match the label. Use scripts/backfill-digest.ts to fill an older week faithfully.`,
      );
    }
  }

  const result = await generateDigest(weekArg ? { weekOf: weekArg } : undefined);
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
