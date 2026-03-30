import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/homework/submit
 * Creates a homework submission for the authenticated user.
 *
 * Body: { assignmentId: string, content: string }
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const { assignmentId, content } = body as {
    assignmentId: string;
    content: string;
  };

  if (!assignmentId || !content) {
    return NextResponse.json(
      { error: "assignmentId and content are required" },
      { status: 400 },
    );
  }

  // Verify assignment exists
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
  });

  if (!assignment) {
    return NextResponse.json(
      { error: "Assignment not found" },
      { status: 404 },
    );
  }

  // Check for existing submission
  const existing = await prisma.homeworkSubmission.findUnique({
    where: {
      userId_assignmentId: {
        userId: user.id,
        assignmentId,
      },
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Already submitted" },
      { status: 409 },
    );
  }

  // Create submission
  const submission = await prisma.homeworkSubmission.create({
    data: {
      userId: user.id,
      assignmentId,
      content,
    },
  });

  return NextResponse.json(submission, { status: 201 });
}
