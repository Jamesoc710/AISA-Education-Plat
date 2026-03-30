import { prisma } from "@/lib/prisma";
import { AdminAssessments } from "@/components/admin-assessments";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Assessments — Admin — AISA Atlas",
};

export default async function AssessmentsPage() {
  const [quizzes, questions] = await Promise.all([
    prisma.formalQuiz.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        timeLimit: true,
        availableAt: true,
        dueDate: true,
        createdAt: true,
        _count: { select: { questions: true, attempts: true } },
      },
    }),
    prisma.question.findMany({
      include: {
        concept: {
          select: {
            name: true,
            slug: true,
            section: {
              select: {
                name: true,
                tier: { select: { name: true, slug: true } },
              },
            },
          },
        },
      },
    }),
  ]);

  type QuizRow = (typeof quizzes)[number];
  type QuestionRow = (typeof questions)[number];

  const assessments = quizzes.map((q: QuizRow) => ({
    id: q.id,
    title: q.title,
    description: q.description,
    status: q.status,
    timeLimit: q.timeLimit,
    availableAt: q.availableAt ? q.availableAt.toISOString() : null,
    dueDate: q.dueDate ? q.dueDate.toISOString() : null,
    createdAt: q.createdAt.toISOString(),
    questionCount: q._count.questions,
    attemptCount: q._count.attempts,
  }));

  const questionOptions = questions.map((q: QuestionRow) => ({
    id: q.id,
    questionText: q.questionText,
    type: q.type,
    conceptName: q.concept.name,
    conceptSlug: q.concept.slug,
    sectionName: q.concept.section.name,
    tierName: q.concept.section.tier.name,
    tierSlug: q.concept.section.tier.slug,
  }));

  return (
    <AdminAssessments assessments={assessments} questions={questionOptions} />
  );
}
