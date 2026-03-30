import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { HomeworkSubmitClient } from "@/components/homework-submit-client";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const assignment = await prisma.assignment.findUnique({
    where: { id },
    select: { title: true },
  });
  return {
    title: assignment ? `${assignment.title} — AISA Atlas` : "Homework — AISA Atlas",
  };
}

export default async function HomeworkPage({ params }: Props) {
  const { id } = await params;

  // Auth check
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  // Fetch assignment
  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: {
      concept: {
        select: { name: true, slug: true },
      },
    },
  });

  if (!assignment) {
    notFound();
  }

  // Fetch existing submission
  const submission = await prisma.homeworkSubmission.findUnique({
    where: {
      userId_assignmentId: {
        userId: authUser.id,
        assignmentId: id,
      },
    },
  });

  return (
    <HomeworkSubmitClient
      assignmentId={assignment.id}
      title={assignment.title}
      description={assignment.description}
      conceptName={assignment.concept?.name ?? null}
      conceptSlug={assignment.concept?.slug ?? null}
      dueDate={assignment.dueDate?.toISOString() ?? null}
      existingSubmission={
        submission
          ? {
              content: submission.content,
              submittedAt: submission.submittedAt.toISOString(),
              grade: submission.grade,
              feedback: submission.feedback,
            }
          : null
      }
    />
  );
}
