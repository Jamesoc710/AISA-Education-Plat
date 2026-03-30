import { prisma } from "@/lib/prisma";
import { AdminHomework } from "@/components/admin-homework";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Homework — Admin — AISA Atlas",
};

export default async function AdminHomeworkPage() {
  const rawAssignments = await prisma.assignment.findMany({
    select: {
      id: true,
      title: true,
      description: true,
      dueDate: true,
      createdAt: true,
      conceptId: true,
      concept: { select: { name: true, slug: true } },
      _count: { select: { submissions: true } },
      submissions: { select: { id: true, grade: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  type RawAssignment = (typeof rawAssignments)[number];

  const assignments = rawAssignments.map((a: RawAssignment) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    conceptName: a.concept?.name ?? null,
    conceptSlug: a.concept?.slug ?? null,
    dueDate: a.dueDate ? a.dueDate.toISOString() : null,
    createdAt: a.createdAt.toISOString(),
    submissionCount: a._count.submissions,
    gradedCount: a.submissions.filter(
      (s: (typeof a.submissions)[number]) => s.grade !== null
    ).length,
  }));

  const rawConcepts = await prisma.concept.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      section: { select: { name: true } },
    },
    orderBy: { sortOrder: "asc" },
  });

  type RawConcept = (typeof rawConcepts)[number];

  const concepts = rawConcepts.map((c: RawConcept) => ({
    id: c.id,
    name: c.name,
    sectionName: c.section.name,
  }));

  return <AdminHomework assignments={assignments} concepts={concepts} />;
}
