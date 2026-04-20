import { prisma } from "../lib/prisma";

async function main() {
  const concept = await prisma.concept.findFirst({ select: { id: true, slug: true } });
  if (!concept) { console.log("no concepts"); return; }

  // Find or create a few questions
  const qs = await prisma.question.findMany({ where: { conceptId: concept.id }, take: 4 });
  if (qs.length < 2) { console.log("not enough questions"); return; }

  const existing = await prisma.formalQuiz.findFirst({ where: { title: "Phase 4 Smoke Test" } });
  if (existing) {
    await prisma.formalQuiz.update({ where: { id: existing.id }, data: { status: "active" } });
    console.log("activated:", existing.id);
    return;
  }

  const user = await prisma.user.findFirst({ select: { id: true } });
  if (!user) { console.log("no users"); return; }

  const fq = await prisma.formalQuiz.create({
    data: {
      title: "Phase 4 Smoke Test",
      description: "Quick smoke test to verify the assessment client renders.",
      timeLimit: 10,
      status: "active",
      createdBy: { connect: { id: user.id } },
      questions: {
        create: qs.map((q, i) => ({ questionId: q.id, sortOrder: i })),
      },
    },
  });
  console.log("created:", fq.id);
}
main().then(() => { console.log("done"); process.exit(0); }).catch((e) => { console.error(e); process.exit(1); });
