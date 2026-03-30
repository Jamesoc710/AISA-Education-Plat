import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

/**
 * Verify the current user is an ADMIN. Redirects to /browse if not.
 * Returns the user record if authorized.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) redirect("/login?redirect=/admin");

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { id: true, email: true, name: true, role: true },
  });

  if (!user || user.role !== "ADMIN") redirect("/browse");

  return user;
}
