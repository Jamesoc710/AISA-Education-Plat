import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const { content, imagePath, pageContext } = body as {
    content?: string;
    imagePath?: string | null;
    pageContext?: string | null;
  };

  const trimmed = (content ?? "").trim();
  if (!trimmed) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }
  if (trimmed.length > 5000) {
    return NextResponse.json(
      { error: "Content too long (max 5000 chars)" },
      { status: 400 },
    );
  }

  const feedback = await prisma.feedback.create({
    data: {
      userId: user.id,
      content: trimmed,
      imagePath: imagePath ?? null,
      pageContext: pageContext ?? null,
    },
    select: { id: true, createdAt: true },
  });

  return NextResponse.json(feedback, { status: 201 });
}
