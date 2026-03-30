import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// ── Auth helper ──────────────────────────────────────────────────────────────

async function requireAdmin() {
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

// ── GET — fetch results for a quiz ───────────────────────────────────────────

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const quizId = request.nextUrl.searchParams.get("quizId");
  if (!quizId)
    return NextResponse.json({ error: "quizId required" }, { status: 400 });

  const attempts = await prisma.formalQuizAttempt.findMany({
    where: { formalQuizId: quizId },
    select: {
      score: true,
      submittedAt: true,
      user: { select: { name: true } },
    },
    orderBy: { startedAt: "desc" },
  });

  type AttemptRow = (typeof attempts)[number];

  const mapped = attempts.map((a: AttemptRow) => ({
    name: a.user.name,
    score: a.score ?? 0,
    submittedAt: a.submittedAt ? a.submittedAt.toISOString() : null,
  }));

  const scores = mapped.filter((a) => a.score > 0).map((a) => a.score);
  const average =
    scores.length > 0
      ? scores.reduce((sum, s) => sum + s, 0) / scores.length
      : 0;

  return NextResponse.json({ average, attempts: mapped });
}

// ── POST — create assessment ─────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { title, description, timeLimit, availableAt, dueDate, questionIds } =
    body as {
      title: string;
      description: string | null;
      timeLimit: number | null;
      availableAt: string | null;
      dueDate: string | null;
      questionIds: string[];
    };

  if (!title || !questionIds || questionIds.length === 0) {
    return NextResponse.json(
      { error: "title and questionIds are required" },
      { status: 400 }
    );
  }

  const quiz = await prisma.formalQuiz.create({
    data: {
      title,
      description: description || null,
      timeLimit: timeLimit || null,
      availableAt: availableAt ? new Date(availableAt) : null,
      dueDate: dueDate ? new Date(dueDate) : null,
      createdById: admin.id,
      questions: {
        create: questionIds.map((qId: string, index: number) => ({
          questionId: qId,
          sortOrder: index,
        })),
      },
    },
  });

  return NextResponse.json({
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    status: quiz.status,
    timeLimit: quiz.timeLimit,
    availableAt: quiz.availableAt ? quiz.availableAt.toISOString() : null,
    dueDate: quiz.dueDate ? quiz.dueDate.toISOString() : null,
    createdAt: quiz.createdAt.toISOString(),
  });
}

// ── PATCH — update status ────────────────────────────────────────────────────

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { quizId, status } = body as { quizId: string; status: string };

  if (!quizId || !["draft", "active", "closed"].includes(status)) {
    return NextResponse.json(
      { error: "quizId and valid status (draft|active|closed) required" },
      { status: 400 }
    );
  }

  const updated = await prisma.formalQuiz.update({
    where: { id: quizId },
    data: { status },
  });

  return NextResponse.json({
    id: updated.id,
    status: updated.status,
  });
}
