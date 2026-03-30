import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

// ── Auth helper ─────────────────────────────────────────────────────────────

async function getAdminUser() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { id: true, role: true },
  });

  if (!user || user.role !== "ADMIN") return null;
  return user;
}

// ── GET: fetch submissions for an assignment ────────────────────────────────

export async function GET(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const assignmentId = request.nextUrl.searchParams.get("assignmentId");
  if (!assignmentId) {
    return NextResponse.json(
      { error: "assignmentId is required" },
      { status: 400 }
    );
  }

  const submissions = await prisma.homeworkSubmission.findMany({
    where: { assignmentId },
    include: {
      user: { select: { name: true, email: true } },
    },
    orderBy: { submittedAt: "desc" },
  });

  return NextResponse.json({ submissions });
}

// ── POST: create an assignment ──────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { title, description, conceptId, dueDate } = body;

  if (!title || !description) {
    return NextResponse.json(
      { error: "title and description are required" },
      { status: 400 }
    );
  }

  const assignment = await prisma.assignment.create({
    data: {
      title,
      description,
      conceptId: conceptId || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      createdById: admin.id,
    },
  });

  return NextResponse.json({ assignment }, { status: 201 });
}

// ── PATCH: grade a submission ───────────────────────────────────────────────

export async function PATCH(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { submissionId, grade, feedback } = body;

  if (!submissionId) {
    return NextResponse.json(
      { error: "submissionId is required" },
      { status: 400 }
    );
  }

  const submission = await prisma.homeworkSubmission.update({
    where: { id: submissionId },
    data: {
      grade,
      feedback: feedback || null,
      gradedAt: new Date(),
    },
  });

  return NextResponse.json({ submission });
}
