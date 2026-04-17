import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "fs";
import path from "path";

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error("DIRECT_URL or DATABASE_URL must be set");
const adapter = new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });

async function main() {
  const resources = await prisma.resource.findMany({
    include: { concept: { select: { slug: true } } },
  });
  const out = resources.map((r: typeof resources[number]) => ({
    conceptSlug: r.concept.slug,
    title: r.title,
    url: r.url,
    sourceDomain: r.sourceDomain,
    type: r.type,
    estimatedMinutes: r.estimatedMinutes,
    description: r.description,
    sortOrder: r.sortOrder,
  }));
  const file = path.resolve(
    __dirname,
    `../backups/resources-${new Date().toISOString().replace(/[:.]/g, "-")}.json`
  );
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(out, null, 2));
  console.log(`✓ Backed up ${out.length} resources to ${file}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
