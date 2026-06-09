// Manually run the "This Week in Tech" digest sync from the CLI.
// Usage: npx tsx --env-file=.env scripts/generate-digest.ts
import { generateDigest } from "../lib/digest-sync";
import { prisma } from "../lib/prisma";

async function main() {
  const result = await generateDigest();
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
