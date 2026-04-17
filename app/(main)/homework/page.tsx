import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { HomeworkListClient } from "@/components/homework-list-client";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Homework — AISA Atlas",
  description: "Your homework assignments.",
};

export default async function HomeworkListPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) redirect("/login?redirect=/homework");

  const assignments = await prisma.assignment.findMany({
    select: {
      id: true,
      title: true,
      dueDate: true,
      concept: { select: { name: true } },
      submissions: {
        where: { userId: authUser.id },
        select: { submittedAt: true, grade: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const items = assignments.map((a: typeof assignments[number]) => ({
    id: a.id,
    title: a.title,
    dueDate: a.dueDate?.toISOString() ?? null,
    conceptName: a.concept?.name ?? null,
    submitted: a.submissions.length > 0,
    submittedAt: a.submissions[0]?.submittedAt?.toISOString() ?? null,
    grade: a.submissions[0]?.grade ?? null,
  }));

  return <HomeworkListClient items={items} />;
}
