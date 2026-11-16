import type { User as SupabaseUser } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

function displayName(user: SupabaseUser, explicit?: string | null): string {
  const meta = user.user_metadata ?? {};
  return (
    explicit?.trim() ||
    (meta.name as string | undefined)?.trim() ||
    (meta.full_name as string | undefined)?.trim() ||
    user.email?.split("@")[0] ||
    "Member"
  );
}

/**
 * Make sure the signed-in Supabase user has a row in `users`. Every sign-in
 * path calls this (password, Google, email confirmation, password reset).
 * An existing row keeps its name unless `name` is passed explicitly.
 */
export async function ensureUserRow(user: SupabaseUser, name?: string | null) {
  const email = user.email;
  if (!email) throw new Error("Supabase user has no email");
  const explicit = name?.trim() || null;
  return prisma.user.upsert({
    where: { id: user.id },
    create: { id: user.id, email, name: displayName(user, explicit), role: "MEMBER" },
    update: explicit ? { email, name: explicit } : { email },
    select: { id: true, email: true, name: true, role: true },
  });
}

/**
 * Render-path lookup that repairs a missing row instead of bouncing a
 * signed-in person to /login (the row is missing when a confirmation link
 * was finished somewhere the callback could not run).
 */
export async function getOrCreateProfile(userId: string) {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true },
  });
  if (existing) return existing;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== userId) return null;
  return ensureUserRow(user);
}
