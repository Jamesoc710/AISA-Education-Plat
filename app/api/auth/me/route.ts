import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ role: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { role: true },
    });

    return NextResponse.json({ role: user?.role ?? null });
  } catch {
    return NextResponse.json({ role: null });
  }
}
